import { z } from "zod";

/** The 16 seed roles (rebuild plan §17). */
export const ROLE_KEYS = [
  "super_admin",
  "university_admin",
  "admission_admin",
  "admission_verifier",
  "enrollment_admin",
  "academic_admin",
  "exam_admin",
  "marks_admin",
  "finance_admin",
  "grievance_admin",
  "notice_admin",
  "college_admin",
  "college_exam_operator",
  "college_marks_operator",
  "student",
  "applicant",
] as const;

export const roleKeySchema = z.enum(ROLE_KEYS);

export type RoleKey = z.infer<typeof roleKeySchema>;
