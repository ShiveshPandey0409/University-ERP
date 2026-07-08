import { z } from "zod";
import { paginationQuerySchema } from "./common.js";

// ---------------------------------------------------------------------------
// Students
// ---------------------------------------------------------------------------
export const GENDERS = ["male", "female", "other"] as const;
export const genderSchema = z.enum(GENDERS);

export const STUDENT_STATUSES = ["active", "cancelled", "passed_out", "suspended"] as const;
export const studentStatusSchema = z.enum(STUDENT_STATUSES);

export const studentCreateSchema = z.object({
  enrollmentNumber: z.string().min(1).max(60),
  name: z.string().min(1).max(160),
  dob: z.string().optional(), // ISO date (yyyy-mm-dd)
  gender: genderSchema.optional(),
  category: z.string().max(40).optional(),
  collegeId: z.string().uuid(),
  programId: z.string().uuid(),
  courseId: z.string().uuid(),
  academicSessionId: z.string().uuid(),
  currentSemester: z.number().int().min(1).max(14).default(1),
  status: studentStatusSchema.default("active"),
});
export type StudentCreate = z.infer<typeof studentCreateSchema>;

export const studentUpdateSchema = studentCreateSchema.partial();

export const studentQuerySchema = paginationQuerySchema.extend({
  collegeId: z.string().uuid().optional(),
  courseId: z.string().uuid().optional(),
  academicSessionId: z.string().uuid().optional(),
  semester: z.coerce.number().int().optional(),
  status: studentStatusSchema.optional(),
});
export type StudentQuery = z.infer<typeof studentQuerySchema>;

// ---------------------------------------------------------------------------
// Exam forms
// ---------------------------------------------------------------------------
export const EXAM_STUDENT_TYPES = [
  "regular",
  "private",
  "ex_regular",
  "atkt",
  "supplementary",
] as const;
export const examStudentTypeSchema = z.enum(EXAM_STUDENT_TYPES);

export const EXAM_FORM_STATUSES = ["draft", "applied", "verified", "rejected"] as const;
export const examFormStatusSchema = z.enum(EXAM_FORM_STATUSES);

export const PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded"] as const;
export const paymentStatusSchema = z.enum(PAYMENT_STATUSES);

export const examFormCreateSchema = z.object({
  studentId: z.string().uuid(),
  examSessionId: z.string().uuid(),
  courseId: z.string().uuid(),
  collegeId: z.string().uuid(),
  semester: z.number().int().min(1).max(14),
  rollNumber: z.string().max(40).optional(),
  studentType: examStudentTypeSchema.default("regular"),
  status: examFormStatusSchema.default("applied"),
  paymentStatus: paymentStatusSchema.default("pending"),
});
export type ExamFormCreate = z.infer<typeof examFormCreateSchema>;

export const examFormUpdateSchema = examFormCreateSchema.partial();

export const examFormQuerySchema = paginationQuerySchema.extend({
  examSessionId: z.string().uuid().optional(),
  courseId: z.string().uuid().optional(),
  status: examFormStatusSchema.optional(),
  studentType: examStudentTypeSchema.optional(),
  paymentStatus: paymentStatusSchema.optional(),
});
export type ExamFormQuery = z.infer<typeof examFormQuerySchema>;

// ---------------------------------------------------------------------------
// Marks batches
// ---------------------------------------------------------------------------
export const MARKS_BATCH_STATUSES = ["open", "submitted", "locked"] as const;
export const marksBatchStatusSchema = z.enum(MARKS_BATCH_STATUSES);

export const marksBatchCreateSchema = z.object({
  examSessionId: z.string().uuid(),
  courseId: z.string().uuid(),
  subjectId: z.string().uuid(),
  collegeId: z.string().uuid().optional(),
  semester: z.number().int().min(1).max(14),
  status: marksBatchStatusSchema.default("open"),
});
export type MarksBatchCreate = z.infer<typeof marksBatchCreateSchema>;

export const marksBatchUpdateSchema = z.object({ status: marksBatchStatusSchema });

export const marksBatchQuerySchema = paginationQuerySchema.extend({
  examSessionId: z.string().uuid().optional(),
  courseId: z.string().uuid().optional(),
  subjectId: z.string().uuid().optional(),
  status: marksBatchStatusSchema.optional(),
});
export type MarksBatchQuery = z.infer<typeof marksBatchQuerySchema>;
