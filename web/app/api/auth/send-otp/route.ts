import { NextResponse } from "next/server";
import { createItem, listItems, updateItem } from "@/lib/directus";
import { generateOtp, hashOtp } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/email";
import { z } from "zod";

const schema = z.object({
  email: z.string().email().max(150),
});

type OtpRecord = {
  id: string;
};

export async function POST(request: Request) {
  let newRecordId: string | undefined;

  try {
    const { email } = schema.parse(await request.json());
    const normalizedEmail = email.trim().toLowerCase();

    const existing = await listItems<OtpRecord>(
      "email_otps",
      `filter[email][_eq]=${encodeURIComponent(normalizedEmail)}&filter[used][_eq]=false&limit=100`
    );

    for (const record of existing) {
      await updateItem("email_otps", record.id, {
        used: true,
      });
    }

    const otp = generateOtp();

    const expiresAt = new Date(
      Date.now() + 5 * 60 * 1000
    ).toISOString();

    const newRecord = await createItem<OtpRecord>("email_otps", {
      email: normalizedEmail,
      otp_hash: hashOtp(otp),
      expires_at: expiresAt,
      attempts: 0,
      used: false,
      verification_token_hash: null,
      token_used: false,
    });

    newRecordId = newRecord.id;

    await sendOtpEmail(normalizedEmail, otp);

    return NextResponse.json({
      message: "Verification code sent to your email.",
    });
  } catch (error) {
    if (newRecordId) {
      try {
        await updateItem("email_otps", newRecordId, {
          used: true,
        });
      } catch (cleanupError) {
        console.error("OTP cleanup error:", cleanupError);
      }
    }

    console.error("Send OTP error:", error);

    const message =
      error instanceof Error ? error.message : "Unable to send OTP.";

    return NextResponse.json({ message }, { status: 400 });
  }
}
