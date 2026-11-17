import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { findUserByEmail } from "@/lib/accounts";
import { DirectusError } from "@/lib/directus";
import { EmailDeliveryError, sendOtpEmail } from "@/lib/email";
import { assertDeliverableEmail, EmailValidationError } from "@/lib/email-validation";
import {
  createOtpChallenge,
  otpCookieOptions,
  SIGNUP_OTP_COOKIE,
} from "@/lib/email-verification";
import { checkOtpRateLimit, recordOtpSend } from "@/lib/rate-limit";
import { registerSchema } from "@/lib/validators";

function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
}

export async function POST(request: Request) {
  try {
    const input = registerSchema.parse(await request.json());
    const rateKey = `customer_registration:${clientIp(request)}:${input.email}`;
    const limit = checkOtpRateLimit(rateKey);
    if (!limit.allowed) {
      return NextResponse.json(
        { message: `Please wait ${limit.retryAfter} seconds before requesting another code.` },
        { status: 429 }
      );
    }

    await assertDeliverableEmail(input.email);

    const existing = await findUserByEmail(input.email);
    if (existing && existing.status !== "unverified") {
      return NextResponse.json(
        {
          message:
            "An account with this email already exists. Sign in or reset your password instead.",
        },
        { status: 409 }
      );
    }

    const challenge = createOtpChallenge({
      purpose: "customer_registration",
      email: input.email,
      data: { ...input },
    });
    await sendOtpEmail({
      to: input.email,
      code: challenge.code,
      purpose: "customer_registration",
    });

    const jar = await cookies();
    jar.set(SIGNUP_OTP_COOKIE, challenge.token, otpCookieOptions(challenge.expiresAt));
    recordOtpSend(rateKey);

    return NextResponse.json({
      message: "Verification code sent. Enter the code to finish creating your account.",
      requiresVerification: true,
      email: input.email,
      expiresAt: challenge.expiresAt,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: error.errors[0]?.message ?? "Check your account details." },
        { status: 422 }
      );
    }
    if (error instanceof EmailValidationError || error instanceof EmailDeliveryError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    if (error instanceof DirectusError) {
      return NextResponse.json(
        { message: "Cannot reach the account service. Please try again shortly." },
        { status: 503 }
      );
    }
    return NextResponse.json({ message: "Unable to send the verification code." }, { status: 500 });
  }
}
