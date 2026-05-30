import { randomBytes } from "node:crypto";

const Constants = {
  TokenByteLength: 32,
  EmailVerificationTtlMs: 24 * 60 * 60 * 1000,
  PasswordResetTtlMs: 60 * 60 * 1000
} as const;

export function generateAuthToken() {
  return randomBytes(Constants.TokenByteLength).toString("hex");
}

export function emailVerificationExpiry() {
  return new Date(Date.now() + Constants.EmailVerificationTtlMs);
}

export function passwordResetExpiry() {
  return new Date(Date.now() + Constants.PasswordResetTtlMs);
}
