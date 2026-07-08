import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import { PrismaClient } from "@erp/db";
import { createTestApp } from "./helpers/test-app.factory.js";
import { SUPERADMIN, COLLEGE_USER } from "./helpers/constants.js";

describe("results vertical", () => {
  let app: NestFastifyApplication;
  let prisma: PrismaClient;
  let superToken: string;
  let courseId: string;
  let examSessionId: string;
  const agent = () => request(app.getHttpServer());

  const loginAdmin = (username: string, password: string) =>
    agent().post("/api/auth/login").send({ loginType: "admin", username, password });

  beforeAll(async () => {
    app = await createTestApp();
    superToken = (await loginAdmin(SUPERADMIN.username, SUPERADMIN.password)).body.accessToken;

    prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });
    const course = await prisma.course.findUniqueOrThrow({ where: { code: "BSC-CS" } });
    const examSession = await prisma.examSession.findUniqueOrThrow({ where: { code: "DEC-2025" } });
    courseId = course.id;
    examSessionId = examSession.id;
  });

  afterAll(async () => {
    await prisma?.$disconnect();
    await app?.close();
  });

  // --- Public results (the user-facing "results") ---

  it("lists published results publicly", async () => {
    const res = await agent().get("/api/public/results/published");
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body.some((r: { course: { code: string } }) => r.course.code === "BSC-CS")).toBe(true);
  });

  it("returns a published result for a valid enrollment + roll number", async () => {
    const res = await agent()
      .post("/api/public/results/search")
      .send({ enrollmentNumber: "ENR2025001", rollNumber: "R-001" });
    expect(res.status).toBe(200);
    expect(res.body.found).toBe(true);
    expect(res.body.student.enrollmentNumber).toBe("ENR2025001");
    expect(res.body.marks.length).toBeGreaterThanOrEqual(1);
    expect(res.body.marks[0].total).toBe(68);
  });

  it("does not leak results for a mismatched roll number", async () => {
    const res = await agent()
      .post("/api/public/results/search")
      .send({ enrollmentNumber: "ENR2025001", rollNumber: "WRONG" });
    expect(res.status).toBe(200);
    expect(res.body.found).toBe(false);
  });

  // --- Courses (the "courses") ---

  it("lists and creates courses (admin)", async () => {
    const list = await agent()
      .get("/api/admin/master/courses")
      .set("Authorization", `Bearer ${superToken}`);
    expect(list.status).toBe(200);
    expect(list.body.data.some((c: { code: string }) => c.code === "BSC-CS")).toBe(true);

    const program = await prisma.program.findFirstOrThrow();
    const created = await agent()
      .post("/api/admin/master/courses")
      .set("Authorization", `Bearer ${superToken}`)
      .send({ name: "B.Sc. Physics", code: "BSC-PHY", programId: program.id });
    expect(created.status).toBe(201);
    expect(created.body.code).toBe("BSC-PHY");
  });

  // --- Students (the "students") ---

  it("lists all students for a global admin", async () => {
    const res = await agent()
      .get("/api/admin/academic/students")
      .set("Authorization", `Bearer ${superToken}`);
    expect(res.status).toBe(200);
    expect(res.body.total).toBeGreaterThanOrEqual(3);
  });

  // --- Scope isolation (college users see only their college) ---

  it("scopes college exam forms to the caller's college", async () => {
    const login = await agent()
      .post("/api/auth/login")
      .send({ loginType: "college", ...COLLEGE_USER });
    const token = login.body.accessToken;
    const res = await agent().get("/api/college/exam/forms").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    // College A (COL-001) has 2 students; College B's form must not appear.
    expect(res.body.total).toBe(2);
    for (const form of res.body.data) {
      expect(form.college.code).toBe("COL-001");
    }
  });

  // --- Separation of duties on result publication ---

  it("enforces separation of duties: marks operator submits, only approver publishes", async () => {
    // Create a marks operator and an exam admin.
    await agent()
      .post("/api/admin/system/users")
      .set("Authorization", `Bearer ${superToken}`)
      .send({
        userType: "admin",
        username: "marksuser",
        displayName: "Marks Operator",
        password: "Test!2026",
        roleKeys: ["marks_admin"],
      });
    await agent()
      .post("/api/admin/system/users")
      .set("Authorization", `Bearer ${superToken}`)
      .send({
        userType: "admin",
        username: "examuser",
        displayName: "Exam Admin",
        password: "Test!2026",
        roleKeys: ["exam_admin"],
      });

    const marksToken = (await loginAdmin("marksuser", "Test!2026")).body.accessToken;
    const examToken = (await loginAdmin("examuser", "Test!2026")).body.accessToken;
    const target = { examSessionId, courseId, semester: 2, resultType: "regular" };

    // Marks operator can submit for approval.
    const submit = await agent()
      .post("/api/admin/results/submit")
      .set("Authorization", `Bearer ${marksToken}`)
      .send(target);
    expect(submit.status).toBe(200);
    expect(submit.body.status).toBe("pending_approval");

    // Marks operator CANNOT approve/publish (lacks result.publication.approve).
    const denied = await agent()
      .post("/api/admin/results/approve")
      .set("Authorization", `Bearer ${marksToken}`)
      .send(target);
    expect(denied.status).toBe(403);

    // Exam admin CAN approve/publish.
    const approved = await agent()
      .post("/api/admin/results/approve")
      .set("Authorization", `Bearer ${examToken}`)
      .send(target);
    expect(approved.status).toBe(200);
    expect(approved.body.status).toBe("published");
    expect(approved.body.publishedAt).toBeTruthy();
  });
});
