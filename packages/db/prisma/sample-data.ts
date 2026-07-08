import { PrismaClient } from "@prisma/client";

/**
 * Dev/test sample data for the results vertical: one faculty → college →
 * department → program → course with subjects, an academic + exam session,
 * students, marks, and a PUBLISHED result so public lookup returns data
 * immediately. Idempotent via unique codes.
 */
export async function seedSampleData(prisma: PrismaClient): Promise<void> {
  const academicSession = await prisma.academicSession.upsert({
    where: { code: "2025-26" },
    update: { isCurrent: true },
    create: { name: "Academic Year 2025-26", code: "2025-26", isCurrent: true },
  });

  const examSession = await prisma.examSession.upsert({
    where: { code: "DEC-2025" },
    update: { isOpen: true },
    create: {
      name: "December 2025 Examination",
      code: "DEC-2025",
      academicSessionId: academicSession.id,
      isOpen: true,
    },
  });

  const faculty = await prisma.faculty.upsert({
    where: { code: "FOS" },
    update: {},
    create: { name: "Faculty of Science", code: "FOS" },
  });

  const college = await prisma.college.upsert({
    where: { code: "COL-001" },
    update: {},
    create: { name: "Government Science College", code: "COL-001", facultyId: faculty.id },
  });
  // A second college to exercise cross-tenant scope isolation.
  const collegeB = await prisma.college.upsert({
    where: { code: "COL-002" },
    update: {},
    create: { name: "City Arts College", code: "COL-002", facultyId: faculty.id },
  });

  const department = await prisma.department.upsert({
    where: { code: "DEP-CS" },
    update: {},
    create: { name: "Computer Science", code: "DEP-CS", facultyId: faculty.id },
  });

  const program = await prisma.program.upsert({
    where: { code: "PRG-BSC" },
    update: {},
    create: {
      name: "Bachelor of Science",
      code: "PRG-BSC",
      level: "ug",
      departmentId: department.id,
      facultyId: faculty.id,
    },
  });

  const course = await prisma.course.upsert({
    where: { code: "BSC-CS" },
    update: {},
    create: {
      name: "B.Sc. Computer Science",
      code: "BSC-CS",
      programId: program.id,
      durationYears: 3,
      totalSemesters: 6,
    },
  });

  const subjectDefs = [
    { code: "CS-101", name: "Programming Fundamentals", type: "theory" as const },
    { code: "CS-102", name: "Discrete Mathematics", type: "theory" as const },
    { code: "CS-103", name: "Programming Lab", type: "practical" as const },
  ];
  const subjects = [];
  for (const s of subjectDefs) {
    const subject = await prisma.subject.upsert({
      where: { code: s.code },
      update: {},
      create: { code: s.code, name: s.name, type: s.type },
    });
    subjects.push(subject);
    await prisma.courseSubject.upsert({
      where: { courseId_subjectId_semester: { courseId: course.id, subjectId: subject.id, semester: 1 } },
      update: {},
      create: { courseId: course.id, subjectId: subject.id, semester: 1 },
    });
  }

  await prisma.scheme.upsert({
    where: { courseId_academicSessionId: { courseId: course.id, academicSessionId: academicSession.id } },
    update: {},
    create: {
      name: "B.Sc CS Scheme 2025-26",
      courseId: course.id,
      academicSessionId: academicSession.id,
      status: "approved",
    },
  });

  // Attach the dev college user's scope to college COL-001.
  const collegeUser = await prisma.user.findUnique({
    where: { userType_username: { userType: "college", username: "college1" } },
  });
  if (collegeUser) {
    const existingScope = await prisma.userScope.findFirst({
      where: { userId: collegeUser.id, scopeType: "college", collegeId: college.id },
    });
    if (!existingScope) {
      await prisma.userScope.create({
        data: { userId: collegeUser.id, scopeType: "college", collegeId: college.id },
      });
    }
  }

  // Students: two in college A, one in college B (for scope tests).
  const studentDefs = [
    { enroll: "ENR2025001", name: "Aarav Sharma", college: college.id, roll: "R-001" },
    { enroll: "ENR2025002", name: "Diya Patel", college: college.id, roll: "R-002" },
    { enroll: "ENR2025003", name: "Kabir Singh", college: collegeB.id, roll: "R-003" },
  ];
  const students = [];
  for (const sd of studentDefs) {
    const student = await prisma.student.upsert({
      where: { enrollmentNumber: sd.enroll },
      update: {},
      create: {
        enrollmentNumber: sd.enroll,
        name: sd.name,
        collegeId: sd.college,
        programId: program.id,
        courseId: course.id,
        academicSessionId: academicSession.id,
        currentSemester: 1,
        gender: "male",
        category: "GEN",
      },
    });
    students.push({ ...student, roll: sd.roll });

    // Exam form (verified) so results have a roll number context.
    await prisma.examForm.upsert({
      where: { studentId_examSessionId: { studentId: student.id, examSessionId: examSession.id } },
      update: {},
      create: {
        studentId: student.id,
        examSessionId: examSession.id,
        courseId: course.id,
        collegeId: sd.college,
        semester: 1,
        rollNumber: sd.roll,
        status: "verified",
        paymentStatus: "paid",
      },
    });
  }

  // Marks batch + entries for the theory subject, then a PUBLISHED result.
  const theory = subjects[0]!;
  const batch = await prisma.marksBatch.upsert({
    where: {
      examSessionId_courseId_subjectId_semester: {
        examSessionId: examSession.id,
        courseId: course.id,
        subjectId: theory.id,
        semester: 1,
      },
    },
    update: {},
    create: {
      examSessionId: examSession.id,
      courseId: course.id,
      subjectId: theory.id,
      collegeId: college.id,
      semester: 1,
      status: "locked",
    },
  });

  const marks = [68, 74];
  for (let i = 0; i < 2; i++) {
    const student = students[i]!;
    await prisma.marksEntry.upsert({
      where: { batchId_studentId: { batchId: batch.id, studentId: student.id } },
      update: {},
      create: {
        batchId: batch.id,
        studentId: student.id,
        theoryMarks: marks[i]!,
        totalMarks: marks[i]!,
        maxMarks: 100,
        grade: marks[i]! >= 70 ? "A" : "B",
        status: "entered",
      },
    });
  }

  await prisma.resultPublication.upsert({
    where: {
      examSessionId_courseId_semester_resultType: {
        examSessionId: examSession.id,
        courseId: course.id,
        semester: 1,
        resultType: "regular",
      },
    },
    update: { status: "published" },
    create: {
      examSessionId: examSession.id,
      courseId: course.id,
      semester: 1,
      resultType: "regular",
      status: "published",
    },
  });

  console.log("  ✓ sample results-vertical data (course, students, marks, published result)");

  await seedMilestone2Sample(prisma, { academicSessionId: academicSession.id, courseId: course.id });
}

/** Dev/test sample data for admission → enrollment → fees → degree, grievance & notices. */
async function seedMilestone2Sample(
  prisma: PrismaClient,
  ref: { academicSessionId: string; courseId: string },
): Promise<void> {
  // Notices have no natural unique key; seed once by matching the title.
  const notice = await prisma.notice.findFirst({
    where: { title: { startsWith: "Examination Form Deadline" } },
  });
  if (!notice) {
    await prisma.notice.create({
      data: {
        title: "Examination Form Deadline — April 2026",
        body: "Students must submit exam forms by 20 April 2026. Unverified forms will not receive admit cards.",
        category: "Examination",
        pinned: true,
        isPublished: true,
        publishedAt: new Date(),
      },
    });
  }

  const grievances = [
    { ticketNo: "GRV-10000001", category: "result" as const, name: "Asha Verma", mobile: "9800000001", body: "Result not showing.", status: "open" as const },
    { ticketNo: "GRV-10000002", category: "marksheet" as const, name: "Ravi Kumar", mobile: "9800000002", body: "Marksheet name spelling error.", status: "assigned" as const },
  ];
  for (const g of grievances) {
    await prisma.grievance.upsert({ where: { ticketNo: g.ticketNo }, update: {}, create: g });
  }

  const applications = [
    { applicationNo: "ADM-20000001", name: "Neha Singh", admissionType: "regular", mobile: "9700000001", status: "pending" as const },
    { applicationNo: "ADM-20000002", name: "Imran Ali", admissionType: "regular", mobile: "9700000002", status: "verified" as const, meritScore: 88.5 },
    { applicationNo: "ADM-20000003", name: "Priya Nair", admissionType: "private", mobile: "9700000003", status: "verified" as const, meritScore: 92.0 },
  ];
  for (const a of applications) {
    await prisma.admissionApplication.upsert({
      where: { applicationNo: a.applicationNo },
      update: {},
      create: { ...a, academicSessionId: ref.academicSessionId, courseId: ref.courseId },
    });
  }

  const feeTxns = [
    { orderNo: "ORD-30000001", enrollmentNo: "ENR2025001", studentName: "Test Student One", feesFor: "Exam Fee", amount: 1500, status: "paid" as const },
    { orderNo: "ORD-30000002", enrollmentNo: "ENR2025002", studentName: "Test Student Two", feesFor: "Admission Fee", amount: 5000, status: "paid" as const },
  ];
  for (const t of feeTxns) {
    await prisma.feeTransaction.upsert({ where: { orderNo: t.orderNo }, update: {}, create: t });
  }
  await prisma.rftRequest.upsert({
    where: { rftNo: "RFT-40000001" },
    update: {},
    create: { rftNo: "RFT-40000001", enrollmentNo: "ENR2025001", studentName: "Test Student One", amount: 500, reason: "Excess fee", status: "issued" },
  });

  await prisma.degreeApplication.upsert({
    where: { applicationNo: "DEG-50000001" },
    update: {},
    create: { applicationNo: "DEG-50000001", studentName: "Test Student One", enrollmentNo: "ENR2025001", courseId: ref.courseId, academicSessionId: ref.academicSessionId, convocationYear: 2026, status: "applied" },
  });

  console.log("  ✓ sample milestone-2 data (notices, grievances, admissions, fees, degree)");
}
