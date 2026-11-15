import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOtpEmail(email: string, otp: string) {
  const { data, error } = await resend.emails.send({
    from: "PetBook <onboarding@resend.dev>",
    to: email,
    subject: "Your PetBook Verification Code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto;">
        <h2>Verify Your PetBook Account</h2>
        <p>Use this code to verify your email address:</p>
        <h1 style="letter-spacing: 8px;">${otp}</h1>
        <p>This code expires in 5 minutes.</p>
        <p>If you did not request this code, please ignore this email.</p>
      </div>
    `,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
