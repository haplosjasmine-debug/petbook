import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { findUserByEmail } from "@/lib/accounts";
import { DirectusError } from "@/lib/directus";
import { EmailDeliveryError, sendOtpEmail } from "@/lib/email";
import {
  createOtpChallenge,
  otpCookieOptions,
  PASSWORD_OTP_COOKIE,
} from "@/lib/email-verification";
import { checkRateLimit, recordRateLimit } from "@/lib/rate-limit";
import { passwordRequestSchema } from "@/lib/validators";

const RESPONSE_MESSAGE =
  "If an account exists for this email, we sent a 6-digit password reset code. Check your inbox and spam folder.";

function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
}

export async function POST(request: Request) {
  try {
    const input = passwordRequestSchema.parse(await request.json());
    const rateKey = `password_reset:${clientIp(request)}:${input.email}`;
    const limit = checkRateLimit(rateKey, {
      windowMs: 60 * 60_000,
      max: 5,
      cooldownMs: 60_000,
    });
    if (!limit.allowed) {
      return NextResponse.json(
        { message: `Please wait ${limit.retryAfter} seconds before requesting another code.` },
        { status: 429 }
      );
    }
    recordRateLimit(rateKey, { windowMs: 60 * 60_000 });

    const user = await findUserByEmail(input.email);
    if (!user || user.status !== "active") {
      // Do not reveal whether the address belongs to an account.
      return NextResponse.json({
        message: RESPONSE_MESSAGE,
        requiresVerification: true,
        email: input.email,
      });
    }

    const challenge = createOtpChallenge({
      purpose: "password_reset",
      email: input.email,
      data: {},
    });
    await sendOtpEmail({
      to: input.email,
      code: challenge.code,
      purpose: "password_reset",
    });

    const jar = await cookies();
    jar.set(PASSWORD_OTP_COOKIE, challenge.token, otpCookieOptions(challenge.expiresAt));

    return NextResponse.json({
      message: RESPONSE_MESSAGE,
      requiresVerification: true,
      email: input.email,
      expiresAt: challenge.expiresAt,
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

    return NextResponse.json({ message: "Unable to send the password reset code." }, { status: 500 });
  }
}
