import { z } from "zod"

const numeric = z.coerce.number()
const intish = z.coerce.number().int()

export const indicatorInputSchema = z.object({
  question: z.string().min(1, "Indicator question is required"),
  weight: numeric.default(0),
  requireAttachment: z.boolean().default(false),
})

export const rubricInputSchema = z.object({
  score: intish.default(0),
  descriptor: z.string().default(""),
  performanceStandard: z.string().default(""),
})

export const evidenceInputSchema = z.object({
  title: z.string().default(""),
  description: z.string().optional(),
  requireAttachment: z.boolean().default(false),
})

export const quantificationInputSchema = z.object({
  assignedScore: intish.default(0),
  weightFactor: numeric.default(0),
})

export const criteriaInputSchema = z.object({
  title: z.string().min(1, "Criteria title is required"),
  domain: z.string().min(1, "Domain is required"),
  measure: z.string().min(1, "Measure is required"),
  indicators: z.array(indicatorInputSchema).default([]),
  rubrics: z.array(rubricInputSchema).default([]),
  evidence: z.array(evidenceInputSchema).default([]),
  quantification: quantificationInputSchema.default({ assignedScore: 0, weightFactor: 0 }),
})

export const assignmentInputSchema = z.object({
  scope: z.enum(["ORGANIZATION", "FACULTY", "DEPARTMENT", "PROGRAM"]),
  facultyIds: z.array(intish).default([]),
  departmentIds: z.array(intish).default([]),
  programIds: z.array(intish).default([]),
})

export const createFrameworkSchema = z.object({
  header: z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    version: z.string().min(1, "Version is required"),
    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  }),
  criterias: z.array(criteriaInputSchema).min(1, "At least one criteria is required"),
  assignment: assignmentInputSchema.optional(),
})

export type CreateFrameworkInput = z.infer<typeof createFrameworkSchema>
export type CriteriaInput = z.infer<typeof criteriaInputSchema>
