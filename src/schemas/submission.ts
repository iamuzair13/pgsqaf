import { z } from "zod"

export const createSubmissionSchema = z.object({
  framework_id: z.coerce.number().int().positive(),
})

export const answerInputSchema = z.object({
  indicator_id: z.coerce.number().int().positive(),
  rubric_id: z.coerce.number().int().positive().nullable().optional(),
  score: z.coerce.number().int().nullable().optional(),
  response: z.string().default(""),
  attachment_name: z.string().nullable().optional(),
  attachment_type: z.string().nullable().optional(),
  attachment_data: z.string().nullable().optional(),
})

export const patchSubmissionSchema = z.object({
  action: z.enum(["save", "submit"]).default("save"),
  answers: z.array(answerInputSchema).default([]),
})

export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>
export type AnswerInput = z.infer<typeof answerInputSchema>
export type PatchSubmissionInput = z.infer<typeof patchSubmissionSchema>
