-- CreateEnum
CREATE TYPE "ProgramLevel" AS ENUM ('ug', 'pg', 'phd', 'diploma');

-- CreateEnum
CREATE TYPE "SubjectType" AS ENUM ('theory', 'practical', 'cce', 'project');

-- CreateEnum
CREATE TYPE "SchemeStatus" AS ENUM ('draft', 'approved', 'removed');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('male', 'female', 'other');

-- CreateEnum
CREATE TYPE "StudentStatus" AS ENUM ('active', 'cancelled', 'passed_out', 'suspended');

-- CreateEnum
CREATE TYPE "ExamStudentType" AS ENUM ('regular', 'private', 'ex_regular', 'atkt', 'supplementary');

-- CreateEnum
CREATE TYPE "ExamFormStatus" AS ENUM ('draft', 'applied', 'verified', 'rejected');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'paid', 'failed', 'refunded');

-- CreateEnum
CREATE TYPE "MarksBatchStatus" AS ENUM ('open', 'submitted', 'locked');

-- CreateEnum
CREATE TYPE "MarksEntryStatus" AS ENUM ('draft', 'entered', 'corrected', 'withheld');

-- CreateEnum
CREATE TYPE "CorrectionStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "PublicationStatus" AS ENUM ('draft', 'pending_approval', 'published');

-- CreateEnum
CREATE TYPE "RvRtType" AS ENUM ('revaluation', 'retotal');

-- CreateTable
CREATE TABLE "academic_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "createdBy" UUID,
    "updatedBy" UUID,

    CONSTRAINT "academic_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "academicSessionId" UUID NOT NULL,
    "isOpen" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "createdBy" UUID,
    "updatedBy" UUID,

    CONSTRAINT "exam_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faculties" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "faculties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "colleges" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "facultyId" UUID,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "createdBy" UUID,
    "updatedBy" UUID,

    CONSTRAINT "colleges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "facultyId" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "programs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "level" "ProgramLevel" NOT NULL,
    "departmentId" UUID,
    "facultyId" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "programId" UUID NOT NULL,
    "durationYears" INTEGER NOT NULL DEFAULT 3,
    "semesterSystem" BOOLEAN NOT NULL DEFAULT true,
    "totalSemesters" INTEGER NOT NULL DEFAULT 6,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "createdBy" UUID,
    "updatedBy" UUID,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subjects" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "SubjectType" NOT NULL DEFAULT 'theory',
    "credits" INTEGER NOT NULL DEFAULT 4,
    "maxMarks" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_subjects" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "courseId" UUID NOT NULL,
    "subjectId" UUID NOT NULL,
    "semester" INTEGER NOT NULL,
    "isElective" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "course_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schemes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "courseId" UUID NOT NULL,
    "academicSessionId" UUID NOT NULL,
    "status" "SchemeStatus" NOT NULL DEFAULT 'draft',
    "approvedBy" UUID,
    "approvedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "schemes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "enrollmentNumber" TEXT NOT NULL,
    "userId" UUID,
    "name" TEXT NOT NULL,
    "dob" DATE,
    "gender" "Gender",
    "category" TEXT,
    "collegeId" UUID NOT NULL,
    "programId" UUID NOT NULL,
    "courseId" UUID NOT NULL,
    "academicSessionId" UUID NOT NULL,
    "currentSemester" INTEGER NOT NULL DEFAULT 1,
    "status" "StudentStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "createdBy" UUID,
    "updatedBy" UUID,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_documents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "studentId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "fileId" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_forms" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "studentId" UUID NOT NULL,
    "examSessionId" UUID NOT NULL,
    "courseId" UUID NOT NULL,
    "collegeId" UUID NOT NULL,
    "semester" INTEGER NOT NULL,
    "rollNumber" TEXT,
    "studentType" "ExamStudentType" NOT NULL DEFAULT 'regular',
    "status" "ExamFormStatus" NOT NULL DEFAULT 'draft',
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "verifiedBy" UUID,
    "verifiedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "exam_forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_form_subjects" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "examFormId" UUID NOT NULL,
    "subjectId" UUID NOT NULL,

    CONSTRAINT "exam_form_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_form_status_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "examFormId" UUID NOT NULL,
    "fromStatus" "ExamFormStatus",
    "toStatus" "ExamFormStatus" NOT NULL,
    "actorUserId" UUID,
    "note" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exam_form_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marks_batches" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "examSessionId" UUID NOT NULL,
    "courseId" UUID NOT NULL,
    "subjectId" UUID NOT NULL,
    "collegeId" UUID,
    "semester" INTEGER NOT NULL,
    "status" "MarksBatchStatus" NOT NULL DEFAULT 'open',
    "createdBy" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "marks_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marks_entries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "batchId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "cceMarks" DECIMAL(6,2),
    "theoryMarks" DECIMAL(6,2),
    "practicalMarks" DECIMAL(6,2),
    "projectMarks" DECIMAL(6,2),
    "totalMarks" DECIMAL(6,2),
    "maxMarks" DECIMAL(6,2) NOT NULL DEFAULT 100,
    "grade" TEXT,
    "status" "MarksEntryStatus" NOT NULL DEFAULT 'draft',
    "createdBy" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "marks_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marks_imports" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "batchId" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'validated',
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "validRows" INTEGER NOT NULL DEFAULT 0,
    "errorRows" INTEGER NOT NULL DEFAULT 0,
    "errors" JSONB,
    "createdBy" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marks_imports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marks_corrections" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "marksEntryId" UUID NOT NULL,
    "oldValues" JSONB NOT NULL,
    "newValues" JSONB NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "CorrectionStatus" NOT NULL DEFAULT 'pending',
    "requestedBy" UUID,
    "approvedBy" UUID,
    "approvedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marks_corrections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "withheld_results" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "studentId" UUID NOT NULL,
    "examSessionId" UUID NOT NULL,
    "reason" TEXT NOT NULL,
    "clearedAt" TIMESTAMPTZ(6),
    "clearedBy" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "withheld_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "result_publications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "examSessionId" UUID NOT NULL,
    "courseId" UUID NOT NULL,
    "semester" INTEGER NOT NULL,
    "status" "PublicationStatus" NOT NULL DEFAULT 'draft',
    "resultType" TEXT NOT NULL DEFAULT 'regular',
    "submittedBy" UUID,
    "approvedBy" UUID,
    "publishedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "result_publications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rvrt_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "studentId" UUID NOT NULL,
    "examSessionId" UUID NOT NULL,
    "subjectId" UUID NOT NULL,
    "type" "RvRtType" NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'requested',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rvrt_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "academic_sessions_code_key" ON "academic_sessions"("code");

-- CreateIndex
CREATE UNIQUE INDEX "exam_sessions_code_key" ON "exam_sessions"("code");

-- CreateIndex
CREATE UNIQUE INDEX "faculties_code_key" ON "faculties"("code");

-- CreateIndex
CREATE UNIQUE INDEX "colleges_code_key" ON "colleges"("code");

-- CreateIndex
CREATE UNIQUE INDEX "departments_code_key" ON "departments"("code");

-- CreateIndex
CREATE UNIQUE INDEX "programs_code_key" ON "programs"("code");

-- CreateIndex
CREATE UNIQUE INDEX "courses_code_key" ON "courses"("code");

-- CreateIndex
CREATE INDEX "courses_programId_idx" ON "courses"("programId");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_code_key" ON "subjects"("code");

-- CreateIndex
CREATE INDEX "course_subjects_courseId_semester_idx" ON "course_subjects"("courseId", "semester");

-- CreateIndex
CREATE UNIQUE INDEX "course_subjects_courseId_subjectId_semester_key" ON "course_subjects"("courseId", "subjectId", "semester");

-- CreateIndex
CREATE UNIQUE INDEX "schemes_courseId_academicSessionId_key" ON "schemes"("courseId", "academicSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "students_enrollmentNumber_key" ON "students"("enrollmentNumber");

-- CreateIndex
CREATE INDEX "students_collegeId_idx" ON "students"("collegeId");

-- CreateIndex
CREATE INDEX "students_courseId_idx" ON "students"("courseId");

-- CreateIndex
CREATE INDEX "students_academicSessionId_idx" ON "students"("academicSessionId");

-- CreateIndex
CREATE INDEX "student_documents_studentId_idx" ON "student_documents"("studentId");

-- CreateIndex
CREATE INDEX "exam_forms_collegeId_idx" ON "exam_forms"("collegeId");

-- CreateIndex
CREATE INDEX "exam_forms_examSessionId_status_idx" ON "exam_forms"("examSessionId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "exam_forms_examSessionId_rollNumber_key" ON "exam_forms"("examSessionId", "rollNumber");

-- CreateIndex
CREATE UNIQUE INDEX "exam_forms_studentId_examSessionId_key" ON "exam_forms"("studentId", "examSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "exam_form_subjects_examFormId_subjectId_key" ON "exam_form_subjects"("examFormId", "subjectId");

-- CreateIndex
CREATE INDEX "exam_form_status_history_examFormId_idx" ON "exam_form_status_history"("examFormId");

-- CreateIndex
CREATE INDEX "marks_batches_collegeId_idx" ON "marks_batches"("collegeId");

-- CreateIndex
CREATE UNIQUE INDEX "marks_batches_examSessionId_courseId_subjectId_semester_key" ON "marks_batches"("examSessionId", "courseId", "subjectId", "semester");

-- CreateIndex
CREATE INDEX "marks_entries_studentId_idx" ON "marks_entries"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "marks_entries_batchId_studentId_key" ON "marks_entries"("batchId", "studentId");

-- CreateIndex
CREATE INDEX "marks_imports_batchId_idx" ON "marks_imports"("batchId");

-- CreateIndex
CREATE INDEX "marks_corrections_marksEntryId_idx" ON "marks_corrections"("marksEntryId");

-- CreateIndex
CREATE INDEX "withheld_results_studentId_idx" ON "withheld_results"("studentId");

-- CreateIndex
CREATE INDEX "result_publications_status_idx" ON "result_publications"("status");

-- CreateIndex
CREATE UNIQUE INDEX "result_publications_examSessionId_courseId_semester_resultT_key" ON "result_publications"("examSessionId", "courseId", "semester", "resultType");

-- CreateIndex
CREATE INDEX "rvrt_requests_studentId_idx" ON "rvrt_requests"("studentId");

-- AddForeignKey
ALTER TABLE "exam_sessions" ADD CONSTRAINT "exam_sessions_academicSessionId_fkey" FOREIGN KEY ("academicSessionId") REFERENCES "academic_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "colleges" ADD CONSTRAINT "colleges_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "faculties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "faculties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programs" ADD CONSTRAINT "programs_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programs" ADD CONSTRAINT "programs_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "faculties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_subjects" ADD CONSTRAINT "course_subjects_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_subjects" ADD CONSTRAINT "course_subjects_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schemes" ADD CONSTRAINT "schemes_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schemes" ADD CONSTRAINT "schemes_academicSessionId_fkey" FOREIGN KEY ("academicSessionId") REFERENCES "academic_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "colleges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_academicSessionId_fkey" FOREIGN KEY ("academicSessionId") REFERENCES "academic_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_documents" ADD CONSTRAINT "student_documents_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_forms" ADD CONSTRAINT "exam_forms_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_forms" ADD CONSTRAINT "exam_forms_examSessionId_fkey" FOREIGN KEY ("examSessionId") REFERENCES "exam_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_forms" ADD CONSTRAINT "exam_forms_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_forms" ADD CONSTRAINT "exam_forms_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "colleges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_form_subjects" ADD CONSTRAINT "exam_form_subjects_examFormId_fkey" FOREIGN KEY ("examFormId") REFERENCES "exam_forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_form_status_history" ADD CONSTRAINT "exam_form_status_history_examFormId_fkey" FOREIGN KEY ("examFormId") REFERENCES "exam_forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marks_batches" ADD CONSTRAINT "marks_batches_examSessionId_fkey" FOREIGN KEY ("examSessionId") REFERENCES "exam_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marks_batches" ADD CONSTRAINT "marks_batches_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marks_batches" ADD CONSTRAINT "marks_batches_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marks_entries" ADD CONSTRAINT "marks_entries_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "marks_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marks_entries" ADD CONSTRAINT "marks_entries_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marks_imports" ADD CONSTRAINT "marks_imports_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "marks_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marks_corrections" ADD CONSTRAINT "marks_corrections_marksEntryId_fkey" FOREIGN KEY ("marksEntryId") REFERENCES "marks_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "result_publications" ADD CONSTRAINT "result_publications_examSessionId_fkey" FOREIGN KEY ("examSessionId") REFERENCES "exam_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "result_publications" ADD CONSTRAINT "result_publications_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
