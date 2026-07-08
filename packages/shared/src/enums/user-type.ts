import { z } from "zod";

export const USER_TYPES = ["admin", "student", "applicant", "college"] as const;

export const userTypeSchema = z.enum(USER_TYPES);

export type UserType = z.infer<typeof userTypeSchema>;
