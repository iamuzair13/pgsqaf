import { z } from "zod"

export const createFacultySchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
  dean: z.string().optional(),
  description: z.string().optional(),
})
export const updateFacultySchema = createFacultySchema.partial().extend({
  status: z.boolean().optional(),
})

export const createDepartmentSchema = z.object({
  faculty_id: z.coerce.number().int().positive(),
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
  head: z.string().optional(),
  description: z.string().optional(),
})
export const updateDepartmentSchema = createDepartmentSchema.partial().extend({
  status: z.boolean().optional(),
})

export const createProgramSchema = z.object({
  department_id: z.coerce.number().int().positive(),
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
  level: z.string().min(1, "Level is required"),
  duration_years: z.coerce.number().default(2.0),
  description: z.string().optional(),
})
export const updateProgramSchema = createProgramSchema.partial().extend({
  status: z.boolean().optional(),
})

export type CreateFacultyInput = z.infer<typeof createFacultySchema>
export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>
export type CreateProgramInput = z.infer<typeof createProgramSchema>
