import { NextResponse } from "next/server";
import { createHmac, createHash, timingSafeEqual } from "crypto";
import { listItems, updateItem } from "@/lib/directus";
import { hashOtp } from "@/lib/otp";
import { z } from "zod";

const schema = z.object({
  email: z.string().email().max(150),
  otp: z.string().regex(/^\d{6}$/),
});

type OtpRecord = {
  id: string;
  otp_hash: string;
  expires_at: string;
  attempts: number;
  used: boolean;
};

function parseUtcDate(value: string) {
  const normalized = value.trim();

  const utcValue =
    /(?:Z|[+-]\d{2}:\d{2})$/i.test(normalized)
      ? normalized
      : `${normalized}Z`;

  return Date.parse(utcValue);
}

function createVerificationToken(email: string) {
  const secret = process.env.OTP_VERIFICATION_SECRET;

  if (!secret) {
    throw new Error("OTP verification secret is not configured.");
  }

  const payload = Buffer.from(
    JSON.stringify({
      email,
      expires: Date.now() + 10 * 60 * 1000,
    })
  ).toString("base64url");

  const signature = createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");

  return `${payload}.${signature}`;
}

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const email = input.email.trim().toLowerCase();

    const records = await listItems<OtpRecord>(
      "email_otps",
      `filter[email][_eq]=${encodeURIComponent(email)}&filter[used][_eq]=false&limit=20`
    );

    if (!records.length) {
      return NextResponse.json(
        { message: "No active OTP found. Please request a new code." },
        { status: 400 }
      );
    }

    const sortedRecords = [...records].sort(
      (a, b) => parseUtcDate(b.expires_at) - parseUtcDate(a.expires_at)
    );

    const record = sortedRecords[0];
    const expirationTime = parseUtcDate(record.expires_at);

    if (!Number.isFinite(expirationTime)) {
      return NextResponse.json(
        { message: "Invalid OTP expiration date. Please request a new code." },
        { status: 400 }
      );
    }

    if (expirationTime <= Date.now()) {
      await updateItem("email_otps", record.id, { used: true });

      return NextResponse.json(
        { message: "OTP expired. Please request a new code." },
        { status: 400 }
      );
    }

    if (record.attempts >= 5) {
      await updateItem("email_otps", record.id, { used: true });

      return NextResponse.json(
        { message: "Too many attempts. Please request a new code." },
        { status: 429 }
      );
    }

    const submittedHash = Buffer.from(hashOtp(input.otp), "hex");
    const storedHash = Buffer.from(record.otp_hash, "hex");

    const isValid =
      submittedHash.length === storedHash.length &&
      timingSafeEqual(submittedHash, storedHash);

    if (!isValid) {
      const attempts = record.attempts + 1;

      await updateItem("email_otps", record.id, {
        attempts,
        used: attempts >= 5,
      });

      return NextResponse.json(
        { message: "Incorrect verification code." },
        { status: 400 }
      );
    }

    const verificationToken = createVerificationToken(email);

    const verificationTokenHash = createHash("sha256")
      .update(verificationToken)
      .digest("hex");

    await updateItem("email_otps", record.id, {
      used: true,
      verification_token_hash: verificationTokenHash,
      token_used: false,
    });

    return NextResponse.json({
      message: "Email verified successfully.",
      verification_token: verificationToken,
    });
  } catch (error) {
    console.error("OTP verification error:", error);

    const message =
      error instanceof Error ? error.message : "Unable to verify OTP.";

    return NextResponse.json({ message }, { status: 400 });
  }
}
