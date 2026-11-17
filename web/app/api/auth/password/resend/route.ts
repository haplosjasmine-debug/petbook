import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { DirectusError } from "@/lib/directus";
import { EmailDeliveryError, sendOtpEmail } from "@/lib/email";
import {
  createOtpChallenge,
  openOtpToken,
  otpCookieOptions,
  PASSWORD_OTP_COOKIE,
} from "@/lib/email-verification";
import { checkOtpRateLimit, recordOtpSend } from "@/lib/rate-limit";
import { otpResendSchema } from "@/lib/validators";

function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
}

function clearOtpCookie(jar: Awaited<ReturnType<typeof cookies>>) {
  jar.set(PASSWORD_OTP_COOKIE, "", { ...otpCookieOptions(Date.now()), maxAge: 0 });
}

export async function POST(request: Request) {
  try {
    const input = otpResendSchema.parse(await request.json());
    const jar = await cookies();
    const challenge = openOtpToken(jar.get(PASSWORD_OTP_COOKIE)?.value);

    if (!challenge || challenge.purpose !== "password_reset") {
      return NextResponse.json(
        { message: "Your reset request expired. Start again to get a new code." },
        { status: 400 }
      );
    }
    if (challenge.email !== input.email) {
      return NextResponse.json(
        { message: "This reset code was sent to a different email address." },
        { status: 422 }
      );
    }
    if (challenge.expiresAt <= Date.now()) {
      clearOtpCookie(jar);
      return NextResponse.json(
        { message: "This reset code expired. Start again to get a new one." },
        { status: 410 }
      );
    }

    const rateKey = `password_reset:${clientIp(request)}:${input.email}`;
    const limit = checkOtpRateLimit(rateKey);
    if (!limit.allowed) {
      return NextResponse.json(
        { message: `Please wait ${limit.retryAfter} seconds before requesting another code.` },
        { status: 429 }
      );
    }

    const next = createOtpChallenge({
      purpose: "password_reset",
      email: input.email,
      data: challenge.data,
    });
    await sendOtpEmail({
      to: input.email,
      code: next.code,
      purpose: "password_reset",
    });

    jar.set(PASSWORD_OTP_COOKIE, next.token, otpCookieOptions(next.expiresAt));
    recordOtpSend(rateKey);

    return NextResponse.json({
      message: "A new password reset code was sent.",
      email: input.email,
      expiresAt: next.expiresAt,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: error.errors[0]?.message ?? "Enter a valid email address." },
        { status: 422 }
      );
    }
    if (error instanceof EmailDeliveryError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    if (error instanceof DirectusError) {
      return NextResponse.json(
        { message: "Cannot reach the account service. Please try again shortly." },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { message: "Unable to resend the password reset code." },
      { status: 500 }
    );
  }
}
