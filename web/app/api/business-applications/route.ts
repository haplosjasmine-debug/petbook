import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { listItems } from "@/lib/directus";
import { EmailDeliveryError, sendOtpEmail } from "@/lib/email";
import { assertDeliverableEmail, EmailValidationError } from "@/lib/email-validation";
import {
  BUSINESS_OTP_COOKIE,
  createOtpChallenge,
  otpCookieOptions,
} from "@/lib/email-verification";
import { checkOtpRateLimit, recordOtpSend } from "@/lib/rate-limit";
import type { BusinessApplication } from "@/lib/types";
import { businessApplicationSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const input = businessApplicationSchema.parse(await request.json());
    const rateKey = `business_application:${input.email}`;
    const limit = checkOtpRateLimit(rateKey);
    if (!limit.allowed) {
      return NextResponse.json(
        { message: `Please wait ${limit.retryAfter} seconds before requesting another code.` },
        { status: 429 }
      );
    }

    await assertDeliverableEmail(input.email);

    const pending = await listItems<BusinessApplication>(
      "business_applications",
      `filter[email][_eq]=${encodeURIComponent(input.email)}&filter[status][_eq]=pending&limit=1`
    );

    if (pending.length) {
      return NextResponse.json(
        { message: "An application with this email is already waiting for review." },
        { status: 409 }
      );
    }

    const challenge = createOtpChallenge({
      purpose: "business_application",
      email: input.email,
      data: { ...input },
    });
    await sendOtpEmail({
      to: input.email,
      code: challenge.code,
      purpose: "business_application",
    });

    const jar = await cookies();
    jar.set(BUSINESS_OTP_COOKIE, challenge.token, otpCookieOptions(challenge.expiresAt));
    recordOtpSend(rateKey);

    return NextResponse.json({
      message: "Verification code sent.",
      requiresVerification: true,
      email: input.email,
      expiresAt: challenge.expiresAt,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: error.errors[0]?.message ?? "Check your business details." },
        { status: 422 }
      );
    }
    if (error instanceof EmailValidationError || error instanceof EmailDeliveryError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: "Unable to send the verification code." }, { status: 500 });
  }
}
