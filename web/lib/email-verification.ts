import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  randomInt,
  timingSafeEqual,
} from "node:crypto";

export const OTP_TTL_MS = 10 * 60_000;
export const OTP_MAX_ATTEMPTS = 5;
export const SIGNUP_OTP_COOKIE = "pb_signup_otp";
export const BUSINESS_OTP_COOKIE = "pb_business_otp";
export const PASSWORD_OTP_COOKIE = "pb_password_otp";

export type OtpPurpose =
  | "customer_registration"
  | "business_application"
  | "password_reset";

export type OtpChallenge = {
  version: 1;
  purpose: OtpPurpose;
  email: string;
  codeHash: string;
  expiresAt: number;
  attempts: number;
  data: Record<string, unknown>;
};

function authSecret() {
  const secret = process.env.AUTH_SECRET ?? process.env.DIRECTUS_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET is not configured.");
  }
  return "petbook-local-auth-secret-change-me";
}

function encryptionKey() {
  return createHash("sha256").update(authSecret()).digest();
}

function hashCode(purpose: OtpPurpose, email: string, code: string) {
  return createHmac("sha256", authSecret())
    .update(`${purpose}:${email}:${code}`)
    .digest("hex");
}

function isPurpose(value: unknown): value is OtpPurpose {
  return (
    value === "customer_registration" ||
    value === "business_application" ||
    value === "password_reset"
  );
}

function sealChallenge(challenge: OtpChallenge) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(challenge), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [iv, tag, encrypted].map((part) => part.toString("base64url")).join(".");
}

export function createOtpChallenge(options: {
  purpose: OtpPurpose;
  email: string;
  data: Record<string, unknown>;
}) {
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const challenge: OtpChallenge = {
    version: 1,
    purpose: options.purpose,
    email: options.email.trim().toLowerCase(),
    codeHash: hashCode(options.purpose, options.email.trim().toLowerCase(), code),
    expiresAt: Date.now() + OTP_TTL_MS,
    attempts: 0,
    data: options.data,
  };

  return {
    code,
    expiresAt: challenge.expiresAt,
    token: sealChallenge(challenge),
  };
}

export function openOtpToken(token: string | null | undefined): OtpChallenge | null {
  if (!token) return null;

  try {
    const [ivPart, tagPart, encryptedPart] = token.split(".");
    if (!ivPart || !tagPart || !encryptedPart) return null;

    const decipher = createDecipheriv(
      "aes-256-gcm",
      encryptionKey(),
      Buffer.from(ivPart, "base64url")
    );
    decipher.setAuthTag(Buffer.from(tagPart, "base64url"));
    const json = Buffer.concat([
      decipher.update(Buffer.from(encryptedPart, "base64url")),
      decipher.final(),
    ]).toString("utf8");
    const parsed = JSON.parse(json) as Partial<OtpChallenge>;

    if (
      parsed.version !== 1 ||
      !isPurpose(parsed.purpose) ||
      typeof parsed.email !== "string" ||
      typeof parsed.codeHash !== "string" ||
      typeof parsed.expiresAt !== "number" ||
      typeof parsed.attempts !== "number" ||
      !parsed.data ||
      typeof parsed.data !== "object"
    ) {
      return null;
    }

    return parsed as OtpChallenge;
  } catch {
    return null;
  }
}

export function otpCodeMatches(challenge: OtpChallenge, code: string) {
  const expected = Buffer.from(challenge.codeHash, "hex");
  const actual = Buffer.from(
    hashCode(challenge.purpose, challenge.email, code.trim()),
    "hex"
  );
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function withFailedOtpAttempt(challenge: OtpChallenge) {
  return sealChallenge({
    ...challenge,
    attempts: challenge.attempts + 1,
  });
}

export function otpCookieOptions(expiresAt: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.max(Math.ceil((expiresAt - Date.now()) / 1000), 1),
  };
}
