import { z } from "zod";
import { paginationQuerySchema } from "./common.js";

export const PROGRAM_LEVELS = ["ug", "pg", "phd", "diploma"] as const;
export const programLevelSchema = z.enum(PROGRAM_LEVELS);
export type ProgramLevel = z.infer<typeof programLevelSchema>;

export const SUBJECT_TYPES = ["theory", "practical", "cce", "project"] as const;
export const subjectTypeSchema = z.enum(SUBJECT_TYPES);
export type SubjectType = z.infer<typeof subjectTypeSchema>;

/** Query-string boolean that avoids the `Boolean("false") === true` footgun. */
const boolQuery = z
  .union([z.literal("true"), z.literal("false")])
  .transform((v) => v === "true")
  .optional();

const code = z.string().min(1).max(40);
const name = z.string().min(1).max(160);

// --- Faculty ---
export const facultyCreateSchema = z.object({ name, code });
export const facultyUpdateSchema = facultyCreateSchema.partial();
export const facultyQuerySchema = paginationQuerySchema;
export type FacultyCreate = z.infer<typeof facultyCreateSchema>;

// --- College ---
export const collegeCreateSchema = z.object({
  name,
  code,
  facultyId: z.string().uuid().optional(),
  isActive: z.boolean().default(true),
});
export const collegeUpdateSchema = collegeCreateSchema.partial();
export const collegeQuerySchema = paginationQuerySchema.extend({
  facultyId: z.string().uuid().optional(),
  isActive: boolQuery,
});
export type CollegeCreate = z.infer<typeof collegeCreateSchema>;

// --- Department ---
export const departmentCreateSchema = z.object({
  name,
  code,
  facultyId: z.string().uuid().optional(),
});
export const departmentUpdateSchema = departmentCreateSchema.partial();
export const departmentQuerySchema = paginationQuerySchema.extend({
  facultyId: z.string().uuid().optional(),
});

// --- Program ---
export const programCreateSchema = z.object({
  name,
  code,
  level: programLevelSchema,
  departmentId: z.string().uuid().optional(),
  facultyId: z.string().uuid().optional(),
});
export const programUpdateSchema = programCreateSchema.partial();
export const programQuerySchema = paginationQuerySchema.extend({
  level: programLevelSchema.optional(),
  departmentId: z.string().uuid().optional(),
  facultyId: z.string().uuid().optional(),
});

// --- Course ---
export const courseCreateSchema = z.object({
  name,
  code,
  programId: z.string().uuid(),
  durationYears: z.number().int().min(1).max(7).default(3),
  totalSemesters: z.number().int().min(1).max(14).default(6),
});
export const courseUpdateSchema = courseCreateSchema.partial();
export const courseQuerySchema = paginationQuerySchema.extend({
  programId: z.string().uuid().optional(),
});

// --- Subject ---
export const subjectCreateSchema = z.object({
  name,
  code,
  type: subjectTypeSchema.default("theory"),
  credits: z.number().int().min(0).max(20).default(4),
  maxMarks: z.number().int().min(1).max(500).default(100),
});
export const subjectUpdateSchema = subjectCreateSchema.partial();
export const subjectQuerySchema = paginationQuerySchema.extend({
  type: subjectTypeSchema.optional(),
});

// --- Academic session ---
export const academicSessionCreateSchema = z.object({
  name,
  code,
  isCurrent: z.boolean().default(false),
});
export const academicSessionUpdateSchema = academicSessionCreateSchema.partial();
export const academicSessionQuerySchema = paginationQuerySchema.extend({
  isCurrent: boolQuery,
});

// --- Exam session ---
export const examSessionCreateSchema = z.object({
  name,
  code,
  academicSessionId: z.string().uuid(),
  isOpen: z.boolean().default(false),
});
export const examSessionUpdateSchema = examSessionCreateSchema.partial();
export const examSessionQuerySchema = paginationQuerySchema.extend({
  academicSessionId: z.string().uuid().optional(),
  isOpen: boolQuery,
});

// --- Inferred query types (used by API filter builders) ---
export type FacultyQuery = z.infer<typeof facultyQuerySchema>;
export type CollegeQuery = z.infer<typeof collegeQuerySchema>;
export type DepartmentQuery = z.infer<typeof departmentQuerySchema>;
export type ProgramQuery = z.infer<typeof programQuerySchema>;
export type CourseQuery = z.infer<typeof courseQuerySchema>;
export type SubjectQuery = z.infer<typeof subjectQuerySchema>;
export type AcademicSessionQuery = z.infer<typeof academicSessionQuerySchema>;
export type ExamSessionQuery = z.infer<typeof examSessionQuerySchema>;
