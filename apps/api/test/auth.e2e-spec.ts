import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import { createTestApp } from "./helpers/test-app.factory.js";
import { extractRefreshCookie } from "./helpers/cookies.js";
import { SUPERADMIN } from "./helpers/constants.js";

describe("auth flows", () => {
  let app: NestFastifyApplication;
  const agent = () => request(app.getHttpServer());
  const loginSuper = () =>
    agent().post("/api/auth/login").send({ loginType: "admin", ...SUPERADMIN });

  beforeAll(async () => {
    app = await createTestApp();
  });
  afterAll(async () => {
    await app?.close();
  });

  it("logs in and returns an access token + refresh cookie", async () => {
    const res = await loginSuper();
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.user.roles).toContain("super_admin");
    expect(extractRefreshCookie(res)).toBeTruthy();
  });

  it("rejects a wrong password with 401", async () => {
    const res = await agent()
      .post("/api/auth/login")
      .send({ loginType: "admin", username: SUPERADMIN.username, password: "nope" });
    expect(res.status).toBe(401);
  });

  it("rotates refresh tokens and detects reuse (burns the family)", async () => {
    const login = await loginSuper();
    const rt1 = extractRefreshCookie(login);

    const refresh1 = await agent().post("/api/auth/refresh").set("Cookie", `rt=${rt1}`);
    expect(refresh1.status).toBe(200);
    const rt2 = extractRefreshCookie(refresh1);
    expect(rt2).not.toBe(rt1);

    // Reusing the already-rotated token is detected → 401.
    const reuse = await agent().post("/api/auth/refresh").set("Cookie", `rt=${rt1}`);
    expect(reuse.status).toBe(401);

    // The whole family is now revoked, so the successor token is dead too.
    const afterReuse = await agent().post("/api/auth/refresh").set("Cookie", `rt=${rt2}`);
    expect(afterReuse.status).toBe(401);
  });

  it("/auth/me requires a valid access token", async () => {
    const login = await loginSuper();
    const token = login.body.accessToken as string;

    const anon = await agent().get("/api/auth/me");
    expect(anon.status).toBe(401);

    const authed = await agent().get("/api/auth/me").set("Authorization", `Bearer ${token}`);
    expect(authed.status).toBe(200);
    expect(authed.body.user.displayName).toBeTruthy();
  });

  it("logout revokes the session so the access token stops working", async () => {
    const login = await loginSuper();
    const token = login.body.accessToken as string;
    const rt = extractRefreshCookie(login);

    const out = await agent().post("/api/auth/logout").set("Cookie", `rt=${rt}`);
    expect(out.status).toBe(200);

    const me = await agent().get("/api/auth/me").set("Authorization", `Bearer ${token}`);
    expect(me.status).toBe(401);
  });

  it("/auth/session resolves the user from the refresh cookie (for SSR)", async () => {
    const login = await loginSuper();
    const rt = extractRefreshCookie(login);
    const res = await agent().get("/api/auth/session").set("Cookie", `rt=${rt}`);
    expect(res.status).toBe(200);
    expect(res.body.user.roles).toContain("super_admin");
  });
});
