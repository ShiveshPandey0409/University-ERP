import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import { PrismaClient } from "@erp/db";
import { createTestApp } from "./helpers/test-app.factory.js";
import { SUPERADMIN } from "./helpers/constants.js";

describe("milestone 2 verticals (grievance, notices, admission, enrollment, fees, degree)", () => {
  let app: NestFastifyApplication;
  let prisma: PrismaClient;
  let token: string;
  const agent = () => request(app.getHttpServer());
  const auth = (t: string) => `Bearer ${t}`;

  beforeAll(async () => {
    app = await createTestApp();
    token = (
      await agent()
        .post("/api/auth/login")
        .send({ loginType: "admin", username: SUPERADMIN.username, password: SUPERADMIN.password })
    ).body.accessToken;
    prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });
  });

  afterAll(async () => {
    await prisma?.$disconnect();
    await app?.close();
  });

  // --- Grievance: public register → track → admin assign/reply/close ---
  it("runs the full grievance lifecycle", async () => {
    const reg = await agent().post("/api/public/grievance/register").send({
      category: "result",
      name: "Test Student",
      mobile: "9999900000",
      body: "My result is not showing.",
    });
    expect(reg.status).toBe(200);
    const ticketNo = reg.body.ticketNo as string;
    expect(ticketNo).toMatch(/^GRV-/);

    // public tracking works, private replies hidden
    const track = await agent().post("/api/public/grievance/search").send({ ticketNo });
    expect(track.body.found).toBe(true);
    expect(track.body.status).toBe("open");

    // admin lists it
    const list = await agent().get("/api/admin/grievance?search=" + ticketNo).set("Authorization", auth(token));
    expect(list.status).toBe(200);
    const id = list.body.data[0].id as string;

    // reply (public) → status replied
    const reply = await agent()
      .post(`/api/admin/grievance/${id}/reply`)
      .set("Authorization", auth(token))
      .send({ message: "We are looking into it.", isPublic: true });
    expect(reply.status).toBe(200);
    expect(reply.body.status).toBe("replied");

    // public tracker now shows the public reply
    const track2 = await agent().post("/api/public/grievance/search").send({ ticketNo });
    expect(track2.body.replies.length).toBe(1);

    // close
    const close = await agent().post(`/api/admin/grievance/${id}/close`).set("Authorization", auth(token));
    expect(close.body.status).toBe("closed");
  });

  // --- Notices: admin create → publish → public list ---
  it("publishes a notice to the public board", async () => {
    const created = await agent()
      .post("/api/admin/notices")
      .set("Authorization", auth(token))
      .send({ title: "Exam Form Deadline", body: "Apply by 20 July.", pinned: true });
    expect(created.status).toBe(201);
    const id = created.body.id as string;

    // not visible until published
    const before = await agent().get("/api/public/notices");
    expect(before.body.find((n: { id: string }) => n.id === id)).toBeUndefined();

    await agent().post(`/api/admin/notices/${id}/publish`).set("Authorization", auth(token)).expect(200);

    const after = await agent().get("/api/public/notices");
    expect(after.body.find((n: { id: string }) => n.id === id)).toBeTruthy();
  });

  // --- Admission: public register → verify → merit rank ---
  it("registers, verifies, and merit-ranks an admission application", async () => {
    const reg = await agent().post("/api/public/admission/register").send({
      admissionType: "regular",
      name: "Merit Candidate",
      mobile: "9888800000",
    });
    expect(reg.status).toBe(200);
    const applicationNo = reg.body.applicationNo as string;

    const app1 = await prisma.admissionApplication.findUniqueOrThrow({ where: { applicationNo } });
    await prisma.admissionApplication.update({ where: { id: app1.id }, data: { meritScore: 91.5 } });

    await agent().post(`/api/admin/admission/applications/${app1.id}/verify`).set("Authorization", auth(token)).expect(200);

    const merit = await agent()
      .post("/api/admin/admission/applications/merit/generate")
      .set("Authorization", auth(token))
      .send({});
    expect(merit.status).toBe(200);
    expect(merit.body.ranked).toBeGreaterThanOrEqual(1);

    const after = await prisma.admissionApplication.findUniqueOrThrow({ where: { id: app1.id } });
    expect(after.status).toBe("verified");
    expect(after.meritRank).toBeGreaterThanOrEqual(1);
  });

  // --- Enrollment: create → verify → allocate number (guards ordering) ---
  it("enforces verify-before-allocate on enrollment", async () => {
    const created = await agent()
      .post("/api/admin/enrollment/forms")
      .set("Authorization", auth(token))
      .send({ name: "Enroll Candidate" });
    expect(created.status).toBe(201);
    const id = created.body.id as string;

    // unique per run — the e2e DB is seeded non-destructively (not reset)
    const enrollmentNumber = `ENRTEST-${Date.now()}`;

    // cannot allocate before verifying
    await agent()
      .post(`/api/admin/enrollment/forms/${id}/allocate-number`)
      .set("Authorization", auth(token))
      .send({ enrollmentNumber })
      .expect(409);

    await agent().post(`/api/admin/enrollment/forms/${id}/verify`).set("Authorization", auth(token)).expect(200);
    const alloc = await agent()
      .post(`/api/admin/enrollment/forms/${id}/allocate-number`)
      .set("Authorization", auth(token))
      .send({ enrollmentNumber });
    expect(alloc.status).toBe(200);
    expect(alloc.body.enrollmentNumber).toBe(enrollmentNumber);
  });

  // --- Fees / RFT: issue → print ---
  it("issues and prints an RFT", async () => {
    const issued = await agent()
      .post("/api/admin/fees/rft")
      .set("Authorization", auth(token))
      .send({ studentName: "Refund Student", amount: 1500, reason: "Excess fee" });
    expect(issued.status).toBe(201);
    expect(issued.body.rftNo).toMatch(/^RFT-/);
    const printed = await agent()
      .get(`/api/admin/fees/rft/${issued.body.id}/print`)
      .set("Authorization", auth(token));
    expect(printed.status).toBe(200);
    expect(printed.body.status).toBe("printed");
  });

  // --- Degree: create → deliver ---
  it("creates and delivers a degree application", async () => {
    const created = await agent()
      .post("/api/admin/degree/applications")
      .set("Authorization", auth(token))
      .send({ studentName: "Graduand One", convocationYear: 2026 });
    expect(created.status).toBe(201);
    const id = created.body.id as string;
    const delivered = await agent()
      .post(`/api/admin/degree/applications/${id}/deliver`)
      .set("Authorization", auth(token));
    expect(delivered.body.status).toBe("delivered");
  });

  // --- Default-deny still holds for the new admin routes ---
  it("rejects the new admin routes without auth", async () => {
    await agent().get("/api/admin/grievance").expect(401);
    await agent().get("/api/admin/admission/applications").expect(401);
    await agent().get("/api/admin/fees/rft").expect(401);
    await agent().get("/api/admin/degree/applications").expect(401);
  });
});
