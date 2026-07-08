import { z } from "zod";
import { paginationQuerySchema } from "./common.js";

// --- Marks ---
export const marksEntryUpsertSchema = z.object({
  batchId: z.string().uuid(),
  studentId: z.string().uuid(),
  cceMarks: z.number().min(0).optional(),
  theoryMarks: z.number().min(0).optional(),
  practicalMarks: z.number().min(0).optional(),
  projectMarks: z.number().min(0).optional(),
  maxMarks: z.number().min(1).default(100),
});
export type MarksEntryUpsertInput = z.infer<typeof marksEntryUpsertSchema>;

// --- Result publication (separation of duties: submit vs approve) ---
export const publicationTargetSchema = z.object({
  examSessionId: z.string().uuid(),
  courseId: z.string().uuid(),
  semester: z.number().int().min(1),
  resultType: z.string().default("regular"),
});
export type PublicationTargetInput = z.infer<typeof publicationTargetSchema>;

// --- Public result lookup ---
export const resultSearchSchema = z.object({
  enrollmentNumber: z.string().min(1),
  rollNumber: z.string().min(1),
});
export type ResultSearchInput = z.infer<typeof resultSearchSchema>;
