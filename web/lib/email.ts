import { appConfig } from "@/lib/config";

export class EmailDeliveryError extends Error {
  status: number;

  constructor(message: string, status = 502) {
    super(message);
    this.name = "EmailDeliveryError";
    this.status = status;
  }
}

type EmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

type OtpEmailPurpose = "customer_registration" | "business_application" | "password_reset";

function providerName() {
  return (process.env.EMAIL_PROVIDER ?? appConfig.emailProvider ?? "mock").trim().toLowerCase();
}

function fromAddress() {
  return process.env.EMAIL_FROM?.trim() || "PetBook <onboarding@resend.dev>";
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function renderEmailHtml(title: string, body: string) {
  return `<!doctype html>
<html>
  <body style="margin:0;background:#f7f7f5;font-family:Inter,Segoe UI,Arial,sans-serif;color:#171717">
    <div style="max-width:560px;margin:0 auto;padding:32px 16px">
      <div style="background:#ffffff;border:1px solid #e8e8e4;border-radius:20px;padding:28px">
        <p style="margin:0 0 20px;font-size:13px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#2f7d5b">PetBook</p>
        <h1 style="margin:0 0 16px;font-size:24px;line-height:1.25">${escapeHtml(title)}</h1>
        <div style="font-size:15px;line-height:1.7;color:#525252;white-space:pre-line">${escapeHtml(body)}</div>
      </div>
      <p style="margin:18px 0 0;text-align:center;font-size:12px;color:#8a8a84">
        Sent by PetBook. If this was not you, you can safely ignore this email.
      </p>
    </div>
  </body>
</html>`;
}

export async function deliverEmail(input: EmailInput) {
  const provider = providerName();

  if (provider === "mock") {
    throw new EmailDeliveryError(
      "Email delivery is not configured. Set EMAIL_PROVIDER=resend and add RESEND_API_KEY so codes are sent to the user's inbox.",
      503
    );
  }

  if (provider === "resend") {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    if (!apiKey) {
      throw new EmailDeliveryError(
        "RESEND_API_KEY is not configured. Add a Resend API key to enable email delivery.",
        503
      );
    }

    let response: Response;
    try {
      response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromAddress(),
          to: [input.to],
          subject: input.subject,
          text: input.text,
          html: input.html ?? renderEmailHtml(input.subject, input.text),
        }),
        signal: AbortSignal.timeout(10_000),
      });
    } catch (error) {
      throw new EmailDeliveryError(
        error instanceof Error ? `Email delivery failed: ${error.message}` : "Email delivery failed.",
        502
      );
    }

    if (!response.ok) {
      throw new EmailDeliveryError(`Resend rejected the email (${response.status}).`, 502);
    }

    return "resend";
  }

  throw new EmailDeliveryError(
    `EMAIL_PROVIDER "${provider}" is not supported. Use "mock" or "resend".`,
    500
  );
}

export async function sendOtpEmail(options: {
  to: string;
  code: string;
  purpose: OtpEmailPurpose;
}) {
  const isBusiness = options.purpose === "business_application";
  const isPasswordReset = options.purpose === "password_reset";
  const title = isBusiness
    ? "Verify your business email"
    : isPasswordReset
      ? "Reset your PetBook password"
      : "Verify your PetBook email";
  const action = isBusiness
    ? "verify your business email and submit your application"
    : isPasswordReset
      ? "reset your PetBook password"
      : "finish creating your PetBook account";
  const text = `Use this code to ${action}: ${options.code}\n\nThe code expires in 10 minutes. If you did not request this, you can ignore this email.`;

  return deliverEmail({
    to: options.to,
    subject: isBusiness
      ? "Your PetBook business verification code"
      : isPasswordReset
        ? "Your PetBook password reset code"
        : "Your PetBook verification code",
    text,
    html: renderEmailHtml(
      title,
      `Use this code to ${action}:\n\n${options.code}\n\nThe code expires in 10 minutes. If you did not request this, you can ignore this email.`
    ),
  });
}

export async function sendBusinessApprovalEmail(options: {
  to: string;
  contactName: string;
  businessName: string;
  temporaryPassword: string;
}) {
  const loginUrl = `${appConfig.appUrl.replace(/\/$/, "")}/login`;
  const text = `Hi ${options.contactName},\n\nYour business ${options.businessName} has been approved on PetBook.\n\nEmail: ${options.to}\nTemporary password: ${options.temporaryPassword}\nSign in: ${loginUrl}\n\nPlease sign in and change your password after your first login.`;

  return deliverEmail({
    to: options.to,
    subject: "Your PetBook business account is ready",
    text,
    html: renderEmailHtml(
      "Your PetBook business account is ready",
      `Hi ${options.contactName},\n\nYour business ${options.businessName} has been approved on PetBook.\n\nEmail: ${options.to}\nTemporary password: ${options.temporaryPassword}\nSign in: ${loginUrl}\n\nPlease sign in and change your password after your first login.`
    ),
  });
}
