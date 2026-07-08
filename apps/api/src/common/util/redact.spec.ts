import { describe, expect, it } from "vitest";
import { redact } from "./redact.js";

describe("redact", () => {
  it("masks secret-looking keys at any depth", () => {
    const out = redact({
      username: "alice",
      password: "p",
      nested: { passwordHash: "h", token: "t", keep: 1 },
    }) as Record<string, unknown>;

    expect(out.username).toBe("alice");
    expect(out.password).toBe("[redacted]");
    const nested = out.nested as Record<string, unknown>;
    expect(nested.passwordHash).toBe("[redacted]");
    expect(nested.token).toBe("[redacted]");
    expect(nested.keep).toBe(1);
  });

  it("handles arrays and dates", () => {
    const out = redact([{ secret: "x" }, { ok: 2 }]) as Record<string, unknown>[];
    expect(out[0]!.secret).toBe("[redacted]");
    expect(out[1]!.ok).toBe(2);

    const d = new Date("2020-01-01T00:00:00.000Z");
    expect(redact(d)).toBe(d.toISOString());
  });
});
