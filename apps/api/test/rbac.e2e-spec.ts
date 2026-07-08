import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import { createTestApp } from "./helpers/test-app.factory.js";
import { SUPERADMIN, COLLEGE_USER } from "./helpers/constants.js";

describe("rbac enforcement", () => {
  let app: NestFastifyApplication;
  let superToken: string;
  const agent = () => request(app.getHttpServer());

  beforeAll(async () => {
    app = await createTestApp();
    const login = await agent().post("/api/auth/login").send({ loginType: "admin", ...SUPERADMIN });
    superToken = login.body.accessToken;
  });
  afterAll(async () => {
    await app?.close();
  });

  it("allows super_admin to list users", async () => {
    const res = await agent()
      .get("/api/admin/system/users")
      .set("Authorization", `Bearer ${superToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("denies a college_admin who lacks system.user.manage", async () => {
    const login = await agent()
      .post("/api/auth/login")
      .send({ loginType: "college", ...COLLEGE_USER });
    expect(login.status).toBe(200);
    const res = await agent()
      .get("/api/admin/system/users")
      .set("Authorization", `Bearer ${login.body.accessToken}`);
    expect(res.status).toBe(403);
  });

  it("reflects role changes on the next request (live de-/re-authorization)", async () => {
    const created = await agent()
      .post("/api/admin/system/users")
      .set("Authorization", `Bearer ${superToken}`)
      .send({
        userType: "admin",
        username: "rbacuser",
        displayName: "RBAC User",
        password: "Test!2026",
        roleKeys: ["notice_admin"],
      });
    expect(created.status).toBe(201);
    const userId = created.body.id as string;

    const login = await agent()
      .post("/api/auth/login")
      .send({ loginType: "admin", username: "rbacuser", password: "Test!2026" });
    const token = login.body.accessToken as string;

    // notice_admin lacks system.user.manage → 403
    const before = await agent()
      .get("/api/admin/system/users")
      .set("Authorization", `Bearer ${token}`);
    expect(before.status).toBe(403);

    // Grant super_admin — same session/token, no re-login.
    const assign = await agent()
      .post(`/api/admin/system/users/${userId}/roles`)
      .set("Authorization", `Bearer ${superToken}`)
      .send({ roleKeys: ["super_admin"] });
    expect(assign.status).toBe(201);

    // The still-valid token now resolves the new permissions → 200.
    const after = await agent()
      .get("/api/admin/system/users")
      .set("Authorization", `Bearer ${token}`);
    expect(after.status).toBe(200);
  });
});
