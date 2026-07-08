import { z } from "zod";
import { paginationQuerySchema } from "./common.js";
import { paymentStatusSchema } from "./vertical-crud.js";

const uuid = z.string().uuid();
const optUuid = uuid.optional();

// ---------------------------------------------------------------------------
// Grievance
// ---------------------------------------------------------------------------
export const GRIEVANCE_CATEGORIES = [
  "admission_form",
  "admission_payment",
  "admitcard_withheld",
  "result",
  "degree",
  "marksheet",
  "other",
] as const;
export const grievanceCategorySchema = z.enum(GRIEVANCE_CATEGORIES);

export const GRIEVANCE_STATUSES = ["open", "assigned", "replied", "closed"] as const;
export const grievanceStatusSchema = z.enum(GRIEVANCE_STATUSES);

/** Public complaint registration (mirrors the legacy /uims/Grievance/ form). */
export const grievanceRegisterSchema = z.object({
  category: grievanceCategorySchema,
  enrollmentNo: z.string().max(60).optional(),
  rollNo: z.string().max(60).optional(),
  name: z.string().min(1).max(160),
  fatherName: z.string().max(160).optional(),
  mobile: z.string().min(6).max(20),
  email: z.string().email().max(160).optional(),
  subject: z.string().max(200).optional(),
  body: z.string().min(1).max(4000),
});
export type GrievanceRegisterInput = z.infer<typeof grievanceRegisterSchema>;

export const grievanceSearchSchema = z.object({ ticketNo: z.string().min(1).max(40) });
export type GrievanceSearchInput = z.infer<typeof grievanceSearchSchema>;

export const grievanceQuerySchema = paginationQuerySchema.extend({
  status: grievanceStatusSchema.optional(),
  category: grievanceCategorySchema.optional(),
});
export type GrievanceQuery = z.infer<typeof grievanceQuerySchema>;

export const grievanceAssignSchema = z.object({ assignedTo: uuid });
export type GrievanceAssignInput = z.infer<typeof grievanceAssignSchema>;

export const grievanceReplySchema = z.object({
  message: z.string().min(1).max(4000),
  isPublic: z.boolean().default(true),
});
export type GrievanceReplyInput = z.infer<typeof grievanceReplySchema>;

// ---------------------------------------------------------------------------
// Notices
// ---------------------------------------------------------------------------
export const noticeCreateSchema = z.object({
  title: z.string().min(1).max(240),
  body: z.string().min(1).max(8000),
  category: z.string().max(60).optional(),
  pinned: z.boolean().default(false),
});
export type NoticeCreate = z.infer<typeof noticeCreateSchema>;

export const noticeUpdateSchema = noticeCreateSchema.partial();
export type NoticeUpdate = z.infer<typeof noticeUpdateSchema>;

export const noticeQuerySchema = paginationQuerySchema.extend({
  published: z.coerce.boolean().optional(),
});
export type NoticeQuery = z.infer<typeof noticeQuerySchema>;

// ---------------------------------------------------------------------------
// Admission
// ---------------------------------------------------------------------------
export const ADMISSION_TYPES = ["regular", "private", "phd", "agriculture"] as const;
export const admissionTypeSchema = z.enum(ADMISSION_TYPES);

export const ADMISSION_STATUSES = [
  "pending",
  "verified",
  "deficiency",
  "rejected",
  "admitted",
  "cancelled",
] as const;
export const admissionStatusSchema = z.enum(ADMISSION_STATUSES);

const GENDERS = ["male", "female", "other"] as const;

/** Public applicant registration (mirrors /admission/ registration flows). */
export const admissionRegisterSchema = z.object({
  admissionType: admissionTypeSchema.default("regular"),
  academicSessionId: optUuid,
  courseId: optUuid,
  name: z.string().min(1).max(160),
  fatherName: z.string().max(160).optional(),
  motherName: z.string().max(160).optional(),
  gender: z.enum(GENDERS).optional(),
  dob: z.string().optional(),
  category: z.string().max(40).optional(),
  mobile: z.string().min(6).max(20),
  email: z.string().email().max(160).optional(),
});
export type AdmissionRegisterInput = z.infer<typeof admissionRegisterSchema>;

export const admissionUpdateSchema = admissionRegisterSchema.partial().extend({
  admissionRound: z.string().max(60).optional(),
  meritScore: z.number().optional(),
});
export type AdmissionUpdate = z.infer<typeof admissionUpdateSchema>;

export const admissionQuerySchema = paginationQuerySchema.extend({
  status: admissionStatusSchema.optional(),
  admissionType: admissionTypeSchema.optional(),
  courseId: optUuid,
  academicSessionId: optUuid,
});
export type AdmissionQuery = z.infer<typeof admissionQuerySchema>;

export const admissionDeficiencySchema = z.object({ note: z.string().min(1).max(1000) });
export type AdmissionDeficiencyInput = z.infer<typeof admissionDeficiencySchema>;

export const admissionRejectSchema = z.object({ reason: z.string().max(1000).optional() });
export type AdmissionRejectInput = z.infer<typeof admissionRejectSchema>;

export const meritGenerateSchema = z.object({
  academicSessionId: optUuid,
  courseId: optUuid,
  admissionRound: z.string().max(60).optional(),
});
export type MeritGenerateInput = z.infer<typeof meritGenerateSchema>;

export const admissionVerifierCreateSchema = z.object({
  name: z.string().min(1).max(160),
  email: z.string().email().max(160).optional(),
  mobile: z.string().max(20).optional(),
  courseIds: z.array(uuid).default([]),
  isActive: z.boolean().default(true),
});
export type AdmissionVerifierCreate = z.infer<typeof admissionVerifierCreateSchema>;
export const admissionVerifierUpdateSchema = admissionVerifierCreateSchema.partial();
export const admissionVerifierQuerySchema = paginationQuerySchema.extend({
  isActive: z.coerce.boolean().optional(),
});
export type AdmissionVerifierQuery = z.infer<typeof admissionVerifierQuerySchema>;

// ---------------------------------------------------------------------------
// Enrollment
// ---------------------------------------------------------------------------
export const ENROLLMENT_STATUSES = ["pending", "verified", "rejected"] as const;
export const enrollmentStatusSchema = z.enum(ENROLLMENT_STATUSES);

export const enrollmentCreateSchema = z.object({
  applicationId: optUuid,
  academicSessionId: optUuid,
  courseId: optUuid,
  name: z.string().min(1).max(160),
  mobile: z.string().max(20).optional(),
});
export type EnrollmentCreate = z.infer<typeof enrollmentCreateSchema>;
export const enrollmentUpdateSchema = enrollmentCreateSchema.partial();

export const enrollmentQuerySchema = paginationQuerySchema.extend({
  status: enrollmentStatusSchema.optional(),
  courseId: optUuid,
  academicSessionId: optUuid,
});
export type EnrollmentQuery = z.infer<typeof enrollmentQuerySchema>;

export const enrollmentRejectSchema = z.object({ reason: z.string().max(1000).optional() });
export type EnrollmentRejectInput = z.infer<typeof enrollmentRejectSchema>;

export const enrollmentAllocateSchema = z.object({ enrollmentNumber: z.string().min(1).max(60) });
export type EnrollmentAllocateInput = z.infer<typeof enrollmentAllocateSchema>;

// ---------------------------------------------------------------------------
// Fees / RFT  (paymentStatusSchema is reused from vertical-crud)
// ---------------------------------------------------------------------------
export const feeTransactionCreateSchema = z.object({
  orderNo: z.string().min(1).max(80),
  enrollmentNo: z.string().max(60).optional(),
  studentName: z.string().max(160).optional(),
  feesFor: z.string().min(1).max(160),
  amount: z.number().nonnegative(),
  status: paymentStatusSchema.default("paid"),
});
export type FeeTransactionCreate = z.infer<typeof feeTransactionCreateSchema>;
export const feeTransactionUpdateSchema = feeTransactionCreateSchema.partial();

export const feeTransactionQuerySchema = paginationQuerySchema.extend({
  status: paymentStatusSchema.optional(),
});
export type FeeTransactionQuery = z.infer<typeof feeTransactionQuerySchema>;

export const RFT_STATUSES = ["draft", "issued", "printed", "cancelled"] as const;
export const rftStatusSchema = z.enum(RFT_STATUSES);

export const rftIssueSchema = z.object({
  feeTransactionId: optUuid,
  enrollmentNo: z.string().max(60).optional(),
  studentName: z.string().max(160).optional(),
  amount: z.number().nonnegative(),
  reason: z.string().max(1000).optional(),
  bankDetails: z.string().max(400).optional(),
});
export type RftIssueInput = z.infer<typeof rftIssueSchema>;

export const rftUpdateSchema = rftIssueSchema.partial().extend({
  status: rftStatusSchema.optional(),
});
export type RftUpdateInput = z.infer<typeof rftUpdateSchema>;

export const rftQuerySchema = paginationQuerySchema.extend({
  status: rftStatusSchema.optional(),
});
export type RftQuery = z.infer<typeof rftQuerySchema>;

// ---------------------------------------------------------------------------
// Degree
// ---------------------------------------------------------------------------
export const DEGREE_STATUSES = ["applied", "approved", "printed", "delivered"] as const;
export const degreeStatusSchema = z.enum(DEGREE_STATUSES);

export const degreeCreateSchema = z.object({
  applicationNo: z.string().min(1).max(80).optional(),
  enrollmentNo: z.string().max(60).optional(),
  studentName: z.string().min(1).max(160),
  courseId: optUuid,
  academicSessionId: optUuid,
  convocationYear: z.number().int().min(1900).max(2200).optional(),
});
export type DegreeCreate = z.infer<typeof degreeCreateSchema>;
export const degreeUpdateSchema = degreeCreateSchema.partial().extend({
  status: degreeStatusSchema.optional(),
});
export type DegreeUpdate = z.infer<typeof degreeUpdateSchema>;

export const degreeQuerySchema = paginationQuerySchema.extend({
  status: degreeStatusSchema.optional(),
  courseId: optUuid,
});
export type DegreeQuery = z.infer<typeof degreeQuerySchema>;
