import { z } from "zod";

export function validateScore(score: unknown): boolean {
  return z.number().min(0).max(100).safeParse(score).success;
}

export function validateEmail(email: unknown): boolean {
  return z.string().email().safeParse(email).success;
}

export const appraisalSchema = z.object({
  programId: z.string().min(1, "Program is required"),
  evaluatorId: z.string().min(1, "Evaluator is required"),
  criteriaScores: z.record(z.string(), z.number().min(0).max(100)),
  comments: z.string().optional(),
  status: z.enum(["draft", "submitted", "in-review", "completed"]),
  evaluationDate: z.date(),
});

export type AppraisalFormData = z.infer<typeof appraisalSchema>;

export const programSchema = z.object({
  name: z.string().min(3, "Program name must be at least 3 characters"),
  code: z.string().min(2).max(10),
  level: z.enum(["masters", "phd", "postdoc"]),
  department: z.string().min(1, "Department is required"),
  coordinator: z.string().min(1, "Coordinator is required"),
  accreditationStatus: z.enum(["accredited", "pending", "not-accredited"]),
});

export type ProgramFormData = z.infer<typeof programSchema>;
