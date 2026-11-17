const PH_MOBILE_PATTERN = /^(?:\+63|0)9\d{9}$/;

/**
 * Accepts Philippine mobile numbers in +639XXXXXXXXX or 09XXXXXXXXX form
 * (spaces, dashes, dots and parentheses are ignored) and returns the
 * canonical E.164 +639XXXXXXXXX form. Returns null when the number is invalid.
 */
export function normalizePhilippineMobile(value: string): string | null {
  const cleaned = value.replace(/[\s\-().]/g, "");
  if (!PH_MOBILE_PATTERN.test(cleaned)) return null;

  const subscriber = cleaned.slice(-10);
  return `+63${subscriber}`;
}

