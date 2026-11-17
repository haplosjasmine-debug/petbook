import { promises as dns } from "node:dns";

export class EmailValidationError extends Error {
  status: number;

  constructor(message: string, status = 422) {
    super(message);
    this.name = "EmailValidationError";
    this.status = status;
  }
}

const DISPOSABLE_DOMAINS = new Set([
  "10minutemail.com",
  "10minutemail.net",
  "burnermail.io",
  "dispostable.com",
  "emailondeck.com",
  "fakeinbox.com",
  "getnada.com",
  "guerrillamail.com",
  "guerrillamail.net",
  "maildrop.cc",
  "mailinator.com",
  "mailnesia.com",
  "mintemail.com",
  "sharklasers.com",
  "temp-mail.org",
  "tempmail.com",
  "tempmail.net",
  "throwawaymail.com",
  "trashmail.com",
  "yopmail.com",
]);

const blockedSuffixes = [".invalid", ".localhost", ".test", ".local"];

const domainCache =
  globalThis as typeof globalThis & {
    __petbookEmailDomainCache?: Map<string, { valid: boolean; expiresAt: number }>;
  };

if (!domainCache.__petbookEmailDomainCache) {
  domainCache.__petbookEmailDomainCache = new Map();
}

function isDisposable(domain: string) {
  return [...DISPOSABLE_DOMAINS].some(
    (blocked) => domain === blocked || domain.endsWith(`.${blocked}`)
  );
}

export async function assertDeliverableEmail(rawEmail: string) {
  const email = rawEmail.trim().toLowerCase();
  const domain = email.split("@")[1] ?? "";

  if (!domain) {
    throw new EmailValidationError("Enter a valid email address.");
  }
  if (blockedSuffixes.some((suffix) => domain.endsWith(suffix))) {
    throw new EmailValidationError("Use an email address that can receive messages.");
  }
  if (isDisposable(domain)) {
    throw new EmailValidationError("Temporary email addresses are not supported.");
  }
  if (process.env.EMAIL_REQUIRE_MX === "false") return;

  const cache = domainCache.__petbookEmailDomainCache!;
  const cached = cache.get(domain);
  if (cached && cached.expiresAt > Date.now()) {
    if (!cached.valid) {
      throw new EmailValidationError("This email domain cannot receive messages.");
    }
    return;
  }

  let valid = false;
  try {
    const records = await dns.resolveMx(domain);
    valid = records.some((record) => Boolean(record.exchange));
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== "ENODATA" && code !== "ENOTFOUND") {
      console.warn(
        `Email domain lookup failed for ${domain}; falling back to email verification.`,
        code ?? (error instanceof Error ? error.message : error)
      );
      return;
    }

    try {
      const addresses = await dns.resolve4(domain);
      valid = addresses.length > 0;
    } catch {
      valid = false;
    }
  }

  cache.set(domain, { valid, expiresAt: Date.now() + 10 * 60_000 });
  if (!valid) {
    throw new EmailValidationError("This email domain cannot receive messages.");
  }
}
