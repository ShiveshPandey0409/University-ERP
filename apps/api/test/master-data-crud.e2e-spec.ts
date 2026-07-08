import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import { PrismaClient } from "@erp/db";
import { createTestApp } from "./helpers/test-app.factory.js";
import { SUPERADMIN } from "./helpers/constants.js";

describe("master-data CRUD + filtering", () => {
  let app: NestFastifyApplication;
  let prisma: PrismaClient;
  let superToken: string;
  let facultyId: string;
  let programId: string;
  const agent = () => request(app.getHttpServer());
  const auth = (t: string) => ({ Authorization: `Bearer ${t}` });

  beforeAll(async () => {
    app = await createTestApp();
    superToken = (
      await agent().post("/api/auth/login").send({ loginType: "admin", ...SUPERADMIN })
    ).body.accessToken;
    prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });
    facultyId = (await prisma.faculty.findFirstOrThrow()).id;
    programId = (await prisma.program.findFirstOrThrow()).id;
  });

  afterAll(async () => {
    await prisma?.$disconnect();
    await app?.close();
  });

  it("performs full CRUD on colleges", async () => {
    // CREATE
    const created = await agent()
      .post("/api/admin/master/colleges")
      .set(auth(superToken))
      .send({ name: "Test College", code: "COL-TEST", facultyId, isActive: true });
    expect(created.status).toBe(201);
    const id = created.body.id as string;

    // READ (search filter)
    const search = await agent()
      .get("/api/admin/master/colleges?search=COL-TEST")
      .set(auth(superToken));
    expect(search.status).toBe(200);
    expect(search.body.data.some((c: { code: string }) => c.code === "COL-TEST")).toBe(true);

    // READ one
    const one = await agent().get(`/api/admin/master/colleges/${id}`).set(auth(superToken));
    expect(one.status).toBe(200);
    expect(one.body.code).toBe("COL-TEST");
    expect(one.body.faculty).toBeTruthy(); // include relation

    // UPDATE
    const updated = await agent()
      .patch(`/api/admin/master/colleges/${id}`)
      .set(auth(superToken))
      .send({ name: "Renamed College", isActive: false });
    expect(updated.status).toBe(200);
    expect(updated.body.name).toBe("Renamed College");

    // FILTER by isActive=false includes our now-inactive college
    const inactive = await agent()
      .get("/api/admin/master/colleges?isActive=false")
      .set(auth(superToken));
    expect(inactive.body.data.some((c: { id: string }) => c.id === id)).toBe(true);

    // DELETE
    const del = await agent().delete(`/api/admin/master/colleges/${id}`).set(auth(superToken));
    expect(del.status).toBe(200);
    expect(del.body.deleted).toBe(true);

    // GONE
    const gone = await agent().get(`/api/admin/master/colleges/${id}`).set(auth(superToken));
    expect(gone.status).toBe(404);
  });

  it("filters colleges by faculty", async () => {
    const res = await agent()
      .get(`/api/admin/master/colleges?facultyId=${facultyId}`)
      .set(auth(superToken));
    expect(res.status).toBe(200);
    expect(res.body.total).toBeGreaterThanOrEqual(2);
    for (const c of res.body.data) expect(c.faculty).toBeTruthy();
  });

  it("filters courses by program", async () => {
    const res = await agent()
      .get(`/api/admin/master/courses?programId=${programId}`)
      .set(auth(superToken));
    expect(res.status).toBe(200);
    expect(res.body.data.some((c: { code: string }) => c.code === "BSC-CS")).toBe(true);
  });

  it("lists faculties, programs, subjects and sessions", async () => {
    for (const path of [
      "/api/admin/master/faculties",
      "/api/admin/master/programs",
      "/api/admin/master/subjects",
      "/api/admin/master/academic-sessions",
      "/api/admin/master/exam-sessions",
    ]) {
      const res = await agent().get(path).set(auth(superToken));
      expect(res.status, path).toBe(200);
      expect(Array.isArray(res.body.data), path).toBe(true);
    }
  });

  it("enforces permission on master-data writes", async () => {
    // A notice_admin lacks masterdata.college.manage.
    await agent()
      .post("/api/admin/system/users")
      .set(auth(superToken))
      .send({
        userType: "admin",
        username: "mduser",
        displayName: "MD User",
        password: "Test!2026",
        roleKeys: ["notice_admin"],
      });
    const token = (
      await agent()
        .post("/api/auth/login")
        .send({ loginType: "admin", username: "mduser", password: "Test!2026" })
    ).body.accessToken;

    const denied = await agent()
      .post("/api/admin/master/colleges")
      .set(auth(token))
      .send({ name: "X", code: "COL-X", facultyId });
    expect(denied.status).toBe(403);
  });

  it("returns 401 on master-data routes without auth", async () => {
    expect((await agent().get("/api/admin/master/colleges")).status).toBe(401);
    expect((await agent().post("/api/admin/master/faculties").send({})).status).toBe(401);
  });
});
