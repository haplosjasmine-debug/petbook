import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { findUserByEmail, setAccountPassword } from "@/lib/accounts";
import { DirectusError } from "@/lib/directus";
import {
  OTP_MAX_ATTEMPTS,
  PASSWORD_OTP_COOKIE,
  openOtpToken,
  otpCodeMatches,
  otpCookieOptions,
  withFailedOtpAttempt,
} from "@/lib/email-verification";
import { passwordResetSchema } from "@/lib/validators";

function clearOtpCookie(jar: Awaited<ReturnType<typeof cookies>>) {
  jar.set(PASSWORD_OTP_COOKIE, "", { ...otpCookieOptions(Date.now()), maxAge: 0 });
}

const INVALID_CODE = "This password reset code is invalid or has expired.";

export async function POST(request: Request) {
  try {
    const input = passwordResetSchema.parse(await request.json());
    const jar = await cookies();
    const challenge = openOtpToken(jar.get(PASSWORD_OTP_COOKIE)?.value);

    if (!challenge || challenge.purpose !== "password_reset") {
      return NextResponse.json(
        { message: "Your reset request expired. Request a new code." },
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
        { message: "This reset code expired. Request a new one." },
        { status: 410 }
      );
    }
    if (challenge.attempts >= OTP_MAX_ATTEMPTS) {
      clearOtpCookie(jar);
      return NextResponse.json(
        { message: "Too many incorrect codes. Request a new one." },
        { status: 429 }
      );
    }
    if (!otpCodeMatches(challenge, input.code)) {
      jar.set(
        PASSWORD_OTP_COOKIE,
        withFailedOtpAttempt(challenge),
        otpCookieOptions(challenge.expiresAt)
      );
      const remaining = OTP_MAX_ATTEMPTS - (challenge.attempts + 1);
      return NextResponse.json(
        {
          message:
            remaining > 0
              ? `Incorrect reset code. ${remaining} attempt${remaining === 1 ? "" : "s"} left.`
              : "Incorrect reset code. Request a new one.",
        },
        { status: 422 }
      );
    }

    const user = await findUserByEmail(input.email);
    if (!user || user.status !== "active") {
      clearOtpCookie(jar);
      return NextResponse.json({ message: INVALID_CODE }, { status: 422 });
    }

    await setAccountPassword(user.id, input.password);
    clearOtpCookie(jar);

    return NextResponse.json({
      message: "Password updated. Sign in with your new password.",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: error.errors[0]?.message ?? "Check your new password." },
        { status: 422 }
      );
    }
    if (error instanceof DirectusError) {
      if ([400, 401, 403, 404].includes(error.status)) {
        return NextResponse.json(
          { message: "This password reset code is invalid or has expired." },
          { status: 422 }
        );
      }
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { message: "Unable to reset your password right now." },
      { status: 500 }
    );
  }
}
