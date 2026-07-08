-- CreateEnum
CREATE TYPE "GrievanceCategory" AS ENUM ('admission_form', 'admission_payment', 'admitcard_withheld', 'result', 'degree', 'marksheet', 'other');

-- CreateEnum
CREATE TYPE "GrievanceStatus" AS ENUM ('open', 'assigned', 'replied', 'closed');

-- CreateEnum
CREATE TYPE "AdmissionStatus" AS ENUM ('pending', 'verified', 'deficiency', 'rejected', 'admitted', 'cancelled');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('pending', 'verified', 'rejected');

-- CreateEnum
CREATE TYPE "RftStatus" AS ENUM ('draft', 'issued', 'printed', 'cancelled');

-- CreateEnum
CREATE TYPE "DegreeStatus" AS ENUM ('applied', 'approved', 'printed', 'delivered');

-- CreateTable
CREATE TABLE "grievances" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ticketNo" TEXT NOT NULL,
    "category" "GrievanceCategory" NOT NULL DEFAULT 'other',
    "enrollmentNo" TEXT,
    "rollNo" TEXT,
    "name" TEXT NOT NULL,
    "fatherName" TEXT,
    "mobile" TEXT NOT NULL,
    "email" TEXT,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "status" "GrievanceStatus" NOT NULL DEFAULT 'open',
    "assignedTo" UUID,
    "assignedAt" TIMESTAMPTZ(6),
    "closedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "grievances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grievance_replies" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "grievanceId" UUID NOT NULL,
    "authorUserId" UUID,
    "message" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "grievance_replies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notices" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "category" TEXT,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMPTZ(6),
    "hiddenAt" TIMESTAMPTZ(6),
    "createdBy" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "notices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admission_applications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "applicationNo" TEXT NOT NULL,
    "academicSessionId" UUID,
    "courseId" UUID,
    "admissionType" TEXT NOT NULL DEFAULT 'regular',
    "name" TEXT NOT NULL,
    "fatherName" TEXT,
    "motherName" TEXT,
    "gender" "Gender",
    "dob" DATE,
    "category" TEXT,
    "mobile" TEXT NOT NULL,
    "email" TEXT,
    "admissionRound" TEXT,
    "meritScore" DECIMAL(8,3),
    "meritRank" INTEGER,
    "status" "AdmissionStatus" NOT NULL DEFAULT 'pending',
    "deficiencyNote" TEXT,
    "verifiedBy" UUID,
    "verifiedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "admission_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admission_verifiers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "email" TEXT,
    "mobile" TEXT,
    "courseIds" UUID[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "admission_verifiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollment_forms" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "applicationId" UUID,
    "academicSessionId" UUID,
    "courseId" UUID,
    "name" TEXT NOT NULL,
    "mobile" TEXT,
    "enrollmentNumber" TEXT,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'pending',
    "verifiedBy" UUID,
    "verifiedAt" TIMESTAMPTZ(6),
    "rejectedReason" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "enrollment_forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_transactions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "orderNo" TEXT NOT NULL,
    "enrollmentNo" TEXT,
    "studentName" TEXT,
    "feesFor" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "txnDate" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fee_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rft_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "rftNo" TEXT NOT NULL,
    "feeTransactionId" UUID,
    "enrollmentNo" TEXT,
    "studentName" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "reason" TEXT,
    "bankDetails" TEXT,
    "status" "RftStatus" NOT NULL DEFAULT 'issued',
    "issuedBy" UUID,
    "issuedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "rft_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "degree_applications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "applicationNo" TEXT NOT NULL,
    "enrollmentNo" TEXT,
    "studentName" TEXT NOT NULL,
    "courseId" UUID,
    "academicSessionId" UUID,
    "convocationYear" INTEGER,
    "status" "DegreeStatus" NOT NULL DEFAULT 'applied',
    "deliveredBy" UUID,
    "deliveredAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "degree_applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "grievances_ticketNo_key" ON "grievances"("ticketNo");

-- CreateIndex
CREATE INDEX "grievances_status_idx" ON "grievances"("status");

-- CreateIndex
CREATE INDEX "grievances_category_idx" ON "grievances"("category");

-- CreateIndex
CREATE INDEX "grievance_replies_grievanceId_idx" ON "grievance_replies"("grievanceId");

-- CreateIndex
CREATE INDEX "notices_isPublished_publishedAt_idx" ON "notices"("isPublished", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "admission_applications_applicationNo_key" ON "admission_applications"("applicationNo");

-- CreateIndex
CREATE INDEX "admission_applications_status_idx" ON "admission_applications"("status");

-- CreateIndex
CREATE INDEX "admission_applications_courseId_idx" ON "admission_applications"("courseId");

-- CreateIndex
CREATE INDEX "admission_applications_academicSessionId_idx" ON "admission_applications"("academicSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "enrollment_forms_enrollmentNumber_key" ON "enrollment_forms"("enrollmentNumber");

-- CreateIndex
CREATE INDEX "enrollment_forms_status_idx" ON "enrollment_forms"("status");

-- CreateIndex
CREATE INDEX "enrollment_forms_courseId_idx" ON "enrollment_forms"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "fee_transactions_orderNo_key" ON "fee_transactions"("orderNo");

-- CreateIndex
CREATE INDEX "fee_transactions_status_idx" ON "fee_transactions"("status");

-- CreateIndex
CREATE INDEX "fee_transactions_enrollmentNo_idx" ON "fee_transactions"("enrollmentNo");

-- CreateIndex
CREATE UNIQUE INDEX "rft_requests_rftNo_key" ON "rft_requests"("rftNo");

-- CreateIndex
CREATE UNIQUE INDEX "rft_requests_feeTransactionId_key" ON "rft_requests"("feeTransactionId");

-- CreateIndex
CREATE INDEX "rft_requests_status_idx" ON "rft_requests"("status");

-- CreateIndex
CREATE UNIQUE INDEX "degree_applications_applicationNo_key" ON "degree_applications"("applicationNo");

-- CreateIndex
CREATE INDEX "degree_applications_status_idx" ON "degree_applications"("status");

-- AddForeignKey
ALTER TABLE "grievance_replies" ADD CONSTRAINT "grievance_replies_grievanceId_fkey" FOREIGN KEY ("grievanceId") REFERENCES "grievances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission_applications" ADD CONSTRAINT "admission_applications_academicSessionId_fkey" FOREIGN KEY ("academicSessionId") REFERENCES "academic_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission_applications" ADD CONSTRAINT "admission_applications_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment_forms" ADD CONSTRAINT "enrollment_forms_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "admission_applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment_forms" ADD CONSTRAINT "enrollment_forms_academicSessionId_fkey" FOREIGN KEY ("academicSessionId") REFERENCES "academic_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment_forms" ADD CONSTRAINT "enrollment_forms_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rft_requests" ADD CONSTRAINT "rft_requests_feeTransactionId_fkey" FOREIGN KEY ("feeTransactionId") REFERENCES "fee_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "degree_applications" ADD CONSTRAINT "degree_applications_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "degree_applications" ADD CONSTRAINT "degree_applications_academicSessionId_fkey" FOREIGN KEY ("academicSessionId") REFERENCES "academic_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
