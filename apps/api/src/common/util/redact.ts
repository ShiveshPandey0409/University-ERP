const SECRET_KEYS = new Set(
  [
    "password",
    "passwordhash",
    "newpassword",
    "mfasecret",
    "token",
    "tokenhash",
    "refreshtoken",
    "accesstoken",
    "otp",
    "otpcode",
    "captchatoken",
    "secret",
  ].map((k) => k.toLowerCase()),
);

const REDACTED = "[redacted]";

/** Deep-clone a value, replacing any secret-looking keys with a placeholder.
 * Used before persisting audit before/after snapshots. */
export function redact(value: unknown, depth = 0): unknown {
  if (depth > 8 || value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
  if (value instanceof Date) return value.toISOString();

  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    out[key] = SECRET_KEYS.has(key.toLowerCase()) ? REDACTED : redact(val, depth + 1);
  }
  return out;
}
