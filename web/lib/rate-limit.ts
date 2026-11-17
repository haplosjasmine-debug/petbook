type RateLimitBucket = {
  count: number;
  resetAt: number;
  lastSentAt: number;
};

type RateLimitOptions = {
  windowMs?: number;
  max?: number;
  cooldownMs?: number;
};

const OTP_WINDOW_MS = 60 * 60_000;
const OTP_MAX_SENDS = 5;

const cache =
  globalThis as typeof globalThis & {
    __petbookOtpRateLimit?: Map<string, RateLimitBucket>;
  };

if (!cache.__petbookOtpRateLimit) {
  cache.__petbookOtpRateLimit = new Map();
}

const buckets = cache.__petbookOtpRateLimit!;

export function checkRateLimit(key: string, options: RateLimitOptions = {}) {
  const windowMs = options.windowMs ?? OTP_WINDOW_MS;
  const max = options.max ?? OTP_MAX_SENDS;
  const cooldownMs = options.cooldownMs ?? 60_000;
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    return { allowed: true as const, retryAfter: 0 };
  }

  const cooldownRemaining = cooldownMs - (now - bucket.lastSentAt);
  if (cooldownRemaining > 0) {
    return {
      allowed: false as const,
      retryAfter: Math.max(Math.ceil(cooldownRemaining / 1000), 1),
    };
  }

  if (bucket.count >= max) {
    return {
      allowed: false as const,
      retryAfter: Math.max(Math.ceil((bucket.resetAt - now) / 1000), 1),
    };
  }

  return { allowed: true as const, retryAfter: 0 };
}

export function recordRateLimit(key: string, options: RateLimitOptions = {}) {
  const windowMs = options.windowMs ?? OTP_WINDOW_MS;
  const now = Date.now();
  let bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs, lastSentAt: now };
    buckets.set(key, bucket);
  }

  bucket.count += 1;
  bucket.lastSentAt = now;

  if (buckets.size > 5_000) {
    for (const [storedKey, stored] of buckets) {
      if (stored.resetAt <= now) buckets.delete(storedKey);
    }
  }
}

export function checkOtpRateLimit(key: string, cooldownMs = 60_000) {
  return checkRateLimit(key, {
    windowMs: OTP_WINDOW_MS,
    max: OTP_MAX_SENDS,
    cooldownMs,
  });
}

export function recordOtpSend(key: string) {
  recordRateLimit(key, { windowMs: OTP_WINDOW_MS });
}
