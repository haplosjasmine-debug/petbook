import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { EmailDeliveryError, sendOtpEmail } from "@/lib/email";
import {
  BUSINESS_OTP_COOKIE,
  createOtpChallenge,
  openOtpToken,
  otpCookieOptions,
} from "@/lib/email-verification";
import { checkOtpRateLimit, recordOtpSend } from "@/lib/rate-limit";
import { otpResendSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const input = otpResendSchema.parse(await request.json());
    const jar = await cookies();
    const challenge = openOtpToken(jar.get(BUSINESS_OTP_COOKIE)?.value);

    if (!challenge || challenge.purpose !== "business_application") {
      return NextResponse.json(
        { message: "Your verification session expired. Submit the application again." },
        { status: 400 }
      );
    }
    if (challenge.email !== input.email) {
      return NextResponse.json(
        { message: "This verification session belongs to a different email address." },
        { status: 422 }
      );
    }
    if (challenge.expiresAt <= Date.now()) {
      jar.set(BUSINESS_OTP_COOKIE, "", { ...otpCookieOptions(Date.now()), maxAge: 0 });
      return NextResponse.json(
        { message: "This verification session expired. Submit the application again." },
        { status: 410 }
      );
    }

    const rateKey = `business_application:${input.email}`;
    const limit = checkOtpRateLimit(rateKey);
    if (!limit.allowed) {
      return NextResponse.json(
        { message: `Please wait ${limit.retryAfter} seconds before requesting another code.` },
        { status: 429 }
      );
    }

    const next = createOtpChallenge({
      purpose: "business_application",
      email: input.email,
      data: challenge.data,
    });
    await sendOtpEmail({
      to: input.email,
      code: next.code,
      purpose: "business_application",
    });

    jar.set(BUSINESS_OTP_COOKIE, next.token, otpCookieOptions(next.expiresAt));
    recordOtpSend(rateKey);

    return NextResponse.json({
      message: "A new verification code was sent.",
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
    return NextResponse.json({ message: "Unable to resend the verification code." }, { status: 500 });
  }
}
