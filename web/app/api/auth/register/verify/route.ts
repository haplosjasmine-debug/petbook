import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  createAccount,
  ensureCustomerProfile,
  findRole,
  findUserByEmail,
  updateAccount,
} from "@/lib/accounts";
import { DirectusError, loginDirectus } from "@/lib/directus";
import {
  OTP_MAX_ATTEMPTS,
  SIGNUP_OTP_COOKIE,
  openOtpToken,
  otpCodeMatches,
  otpCookieOptions,
  withFailedOtpAttempt,
} from "@/lib/email-verification";
import { setSessionCookies } from "@/lib/session";
import { otpVerifySchema, registerSchema } from "@/lib/validators";

function clearOtpCookie(jar: Awaited<ReturnType<typeof cookies>>) {
  jar.set(SIGNUP_OTP_COOKIE, "", { ...otpCookieOptions(Date.now()), maxAge: 0 });
}

function phoneFromData(data: Record<string, unknown>) {
  return typeof data.phone === "string" ? data.phone : null;
}

export async function POST(request: Request) {
  try {
    const input = otpVerifySchema.parse(await request.json());
    const jar = await cookies();
    const challenge = openOtpToken(jar.get(SIGNUP_OTP_COOKIE)?.value);

    if (!challenge || challenge.purpose !== "customer_registration") {
      return NextResponse.json(
        { message: "Your registration expired. Submit the form again to get a new code." },
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
        { message: "Too many incorrect codes. Submit the form again for a new code." },
        { status: 429 }
      );
    }
    if (!otpCodeMatches(challenge, input.code)) {
      jar.set(
        SIGNUP_OTP_COOKIE,
        withFailedOtpAttempt(challenge),
        otpCookieOptions(challenge.expiresAt)
      );
      const remaining = OTP_MAX_ATTEMPTS - (challenge.attempts + 1);
      return NextResponse.json(
        {
          message:
            remaining > 0
              ? `Incorrect verification code. ${remaining} attempt${remaining === 1 ? "" : "s"} left.`
              : "Incorrect verification code. Request a new one.",
        },
        { status: 422 }
      );
    }

    const registration = registerSchema.parse(challenge.data);
    const existing = await findUserByEmail(registration.email);
    let user = existing;
    let completed = false;

    if (existing && existing.status !== "unverified" && existing.status !== "active") {
      clearOtpCookie(jar);
      return NextResponse.json(
        { message: "This account cannot be activated. Contact PetBook support." },
        { status: 409 }
      );
    }

    if (existing?.status === "unverified") {
      const role = await findRole("pet_owner");
      user = await updateAccount(existing.id, {
        password: registration.password,
        first_name: registration.first_name,
        last_name: registration.last_name,
        role: role.id,
        status: "active",
      });
      completed = true;
    } else if (!existing) {
      user = await createAccount({
        email: registration.email,
        password: registration.password,
        name: `${registration.first_name} ${registration.last_name}`,
        role: "pet_owner",
      });
      completed = true;
    }

    if (!user) {
      clearOtpCookie(jar);
      return NextResponse.json(
        { message: "Unable to activate this account. Please try again." },
        { status: 500 }
      );
    }

    await ensureCustomerProfile(user, phoneFromData(challenge.data));
    clearOtpCookie(jar);

    if (completed) {
      try {
        const tokens = await loginDirectus(registration.email, registration.password);
        await setSessionCookies(tokens);
        return NextResponse.json({
          message: "Email verified. Welcome to PetBook.",
          email: registration.email,
          home: "/",
        });
      } catch {
        return NextResponse.json({
          message: "Email verified. Sign in to continue.",
          email: registration.email,
          home: "/login?verified=1",
        });
      }
    }

    return NextResponse.json({
      message: "Email already verified. Sign in to continue.",
      email: registration.email,
      home: "/login?verified=1",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: error.errors[0]?.message ?? "Enter the 6-digit verification code." },
        { status: 422 }
      );
    }
    if (error instanceof DirectusError) {
      if (error.status === 409) {
        return NextResponse.json(
          { message: "An account with this email already exists. Sign in instead." },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { message: "Unable to finish registration right now. Please try again." },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { message: "Unable to verify your email right now. Please try again." },
      { status: 500 }
    );
  }
}
