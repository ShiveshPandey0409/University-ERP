import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import { PrismaClient } from "@erp/db";
import { createTestApp } from "./helpers/test-app.factory.js";
import { SUPERADMIN } from "./helpers/constants.js";

describe("results-vertical CRUD (students, exam forms, marks batches)", () => {
  let app: NestFastifyApplication;
  let prisma: PrismaClient;
  let superToken: string;
  const ids = {
    college: "",
    program: "",
    course: "",
    academicSession: "",
    examSession: "",
    subject: "",
  };
  const agent = () => request(app.getHttpServer());
  const auth = (t: string) => ({ Authorization: `Bearer ${t}` });

  beforeAll(async () => {
    app = await createTestApp();
    superToken = (
      await agent().post("/api/auth/login").send({ loginType: "admin", ...SUPERADMIN })
    ).body.accessToken;
    prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });
    ids.college = (await prisma.college.findUniqueOrThrow({ where: { code: "COL-001" } })).id;
    ids.program = (await prisma.program.findFirstOrThrow()).id;
    ids.course = (await prisma.course.findUniqueOrThrow({ where: { code: "BSC-CS" } })).id;
    ids.academicSession = (await prisma.academicSession.findFirstOrThrow()).id;
    ids.examSession = (await prisma.examSession.findUniqueOrThrow({ where: { code: "DEC-2025" } })).id;
    ids.subject = (await prisma.subject.findUniqueOrThrow({ where: { code: "CS-102" } })).id;
  });

  afterAll(async () => {
    await prisma?.$disconnect();
    await app?.close();
  });

  let studentId = "";

  it("creates, reads, filters, updates and soft-deletes a student", async () => {
    const created = await agent()
      .post("/api/admin/academic/students")
      .set(auth(superToken))
      .send({
        enrollmentNumber: "ENR-CRUD-1",
        name: "Crud Student",
        gender: "male",
        category: "GEN",
        collegeId: ids.college,
        programId: ids.program,
        courseId: ids.course,
        academicSessionId: ids.academicSession,
        currentSemester: 1,
        status: "active",
      });
    expect(created.status).toBe(201);
    studentId = created.body.id;

    // filter by status + search
    const list = await agent()
      .get("/api/admin/academic/students?status=active&search=Crud")
      .set(auth(superToken));
    expect(list.status).toBe(200);
    expect(list.body.data.some((s: { id: string }) => s.id === studentId)).toBe(true);

    // update
    const updated = await agent()
      .patch(`/api/admin/academic/students/${studentId}`)
      .set(auth(superToken))
      .send({ currentSemester: 2, name: "Crud Student II" });
    expect(updated.status).toBe(200);
    expect(updated.body.currentSemester).toBe(2);

    // soft delete
    const del = await agent()
      .delete(`/api/admin/academic/students/${studentId}`)
      .set(auth(superToken));
    expect(del.status).toBe(200);
    expect(del.body.deleted).toBe(true);

    const gone = await agent()
      .get(`/api/admin/academic/students/${studentId}`)
      .set(auth(superToken));
    expect(gone.status).toBe(404);
  });

  it("performs exam form CRUD + verify", async () => {
    // Re-create a student to attach a form to.
    const student = await agent()
      .post("/api/admin/academic/students")
      .set(auth(superToken))
      .send({
        enrollmentNumber: "ENR-CRUD-2",
        name: "Exam Student",
        collegeId: ids.college,
        programId: ids.program,
        courseId: ids.course,
        academicSessionId: ids.academicSession,
      });
    const sid = student.body.id as string;

    const form = await agent()
      .post("/api/admin/exam/forms")
      .set(auth(superToken))
      .send({
        studentId: sid,
        examSessionId: ids.examSession,
        courseId: ids.course,
        collegeId: ids.college,
        semester: 1,
        rollNumber: "R-CRUD-1",
        status: "applied",
      });
    expect(form.status).toBe(201);
    const formId = form.body.id as string;

    // filter by status
    const applied = await agent()
      .get("/api/admin/exam/forms?status=applied")
      .set(auth(superToken));
    expect(applied.body.data.some((f: { id: string }) => f.id === formId)).toBe(true);

    // verify
    const verified = await agent()
      .post(`/api/admin/exam/forms/${formId}/verify`)
      .set(auth(superToken));
    expect(verified.status).toBe(200);
    expect(verified.body.status).toBe("verified");

    // delete
    const del = await agent().delete(`/api/admin/exam/forms/${formId}`).set(auth(superToken));
    expect(del.status).toBe(200);
  });

  it("performs marks batch CRUD", async () => {
    const created = await agent()
      .post("/api/admin/marks/batches")
      .set(auth(superToken))
      .send({
        examSessionId: ids.examSession,
        courseId: ids.course,
        subjectId: ids.subject,
        collegeId: ids.college,
        semester: 1,
        status: "open",
      });
    expect(created.status).toBe(201);
    const batchId = created.body.id as string;

    const list = await agent()
      .get(`/api/admin/marks/batches?courseId=${ids.course}`)
      .set(auth(superToken));
    expect(list.body.data.some((b: { id: string }) => b.id === batchId)).toBe(true);

    const updated = await agent()
      .patch(`/api/admin/marks/batches/${batchId}`)
      .set(auth(superToken))
      .send({ status: "locked" });
    expect(updated.status).toBe(200);
    expect(updated.body.status).toBe("locked");

    const del = await agent().delete(`/api/admin/marks/batches/${batchId}`).set(auth(superToken));
    expect(del.status).toBe(200);
  });

  it("enforces student write permission (read role cannot create)", async () => {
    await agent()
      .post("/api/admin/system/users")
      .set(auth(superToken))
      .send({
        userType: "admin",
        username: "vcuser",
        displayName: "VC User",
        password: "Test!2026",
        roleKeys: ["notice_admin"],
      });
    const token = (
      await agent()
        .post("/api/auth/login")
        .send({ loginType: "admin", username: "vcuser", password: "Test!2026" })
    ).body.accessToken;
    const denied = await agent()
      .post("/api/admin/academic/students")
      .set(auth(token))
      .send({
        enrollmentNumber: "ENR-CRUD-9",
        name: "Nope",
        collegeId: ids.college,
        programId: ids.program,
        courseId: ids.course,
        academicSessionId: ids.academicSession,
      });
    expect(denied.status).toBe(403);
  });
});
