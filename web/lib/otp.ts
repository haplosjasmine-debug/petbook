import { randomInt, createHash } from "crypto";

export function generateOtp() {
  return randomInt(100000, 1000000).toString();
}

export function hashOtp(otp: string) {
  return createHash("sha256").update(otp).digest("hex");
}
