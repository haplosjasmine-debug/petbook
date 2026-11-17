import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { createItem, listItems } from "@/lib/directus";
import {
  BUSINESS_OTP_COOKIE,
  OTP_MAX_ATTEMPTS,
  openOtpToken,
  otpCodeMatches,
  otpCookieOptions,
  withFailedOtpAttempt,
} from "@/lib/email-verification";
import type { BusinessApplication } from "@/lib/types";
import { businessApplicationSchema, otpVerifySchema } from "@/lib/validators";

function clearOtpCookie(jar: Awaited<ReturnType<typeof cookies>>) {
  jar.set(BUSINESS_OTP_COOKIE, "", { ...otpCookieOptions(Date.now()), maxAge: 0 });
}

export async function POST(request: Request) {
  try {
    const input = otpVerifySchema.parse(await request.json());
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
        { message: "This code was sent to a different email address." },
        { status: 422 }
      );
    }
    if (challenge.expiresAt <= Date.now()) {
      clearOtpCookie(jar);
      return NextResponse.json(
        { message: "This verification code expired. Request a new one." },
        { status: 410 }
      );
    }
    if (challenge.attempts >= OTP_MAX_ATTEMPTS) {
      clearOtpCookie(jar);
      return NextResponse.json(
        { message: "Too many incorrect codes. Submit the application again." },
        { status: 429 }
      );
    }
    if (!otpCodeMatches(challenge, input.code)) {
      jar.set(
        BUSINESS_OTP_COOKIE,
        withFailedOtpAttempt(challenge),
        otpCookieOptions(challenge.expiresAt)
      );
      const remaining = OTP_MAX_ATTEMPTS - (challenge.attempts + 1);
      return NextResponse.json(
        {
          message:
            remaining > 0
              ? `Incorrect verification code. ${remaining} attempt${remaining === 1 ? "" : "s"} left.`
              : "Incorrect verification code. Request a new code.",
        },
        { status: 422 }
      );
    }

    const applicationInput = businessApplicationSchema.parse(challenge.data);
    const pending = await listItems<BusinessApplication>(
      "business_applications",
      `filter[email][_eq]=${encodeURIComponent(applicationInput.email)}&filter[status][_eq]=pending&limit=1`
    );
    if (pending.length) {
      clearOtpCookie(jar);
      return NextResponse.json(
        { message: "An application with this email is already waiting for review." },
        { status: 409 }
      );
    }

    const application = await createItem<BusinessApplication>("business_applications", {
      business_name: applicationInput.business_name,
      contact_name: applicationInput.contact_name,
      email: applicationInput.email,
      phone: applicationInput.phone || null,
      city: applicationInput.city || null,
      address: applicationInput.address || null,
      message: applicationInput.message || null,
      status: "pending",
    });

    clearOtpCookie(jar);
    return NextResponse.json(
      { message: "Email verified. Application submitted.", applicationId: application.id },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: error.errors[0]?.message ?? "Enter the 6-digit verification code." },
        { status: 422 }
      );
    }
    return NextResponse.json({ message: "Unable to submit the application." }, { status: 500 });
  }
}
