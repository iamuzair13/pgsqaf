import { updateProgramSchema } from "@/schemas/org"
import { withAdmin } from "@/server/http/handler"
import { paramId } from "@/server/http/params"
import { ok } from "@/server/http/response"
import { BadRequestError, NotFoundError } from "@/server/http/errors"
import { deleteProgram, updateProgram } from "@/server/repos/org.repo"

const TAG = "api/programs/:id"

export const PATCH = withAdmin(TAG, async ({ req, params }) => {
  const id = paramId(params.id, "program ID")
  const input = updateProgramSchema.parse(await req.json())
  if (Object.keys(input).length === 0) throw new BadRequestError("No fields to update")

  const updated = await updateProgram(id, {
    ...(input.department_id !== undefined && { department_id: input.department_id }),
    ...(input.name !== undefined && { name: input.name.trim() }),
    ...(input.code !== undefined && { code: input.code.trim().toUpperCase() }),
    ...(input.level !== undefined && { level: input.level.trim() }),
    ...(input.duration_years !== undefined && { duration_years: input.duration_years }),
    ...(input.description !== undefined && { description: input.description?.trim() || null }),
    ...(input.status !== undefined && { status: input.status }),
  })
  if (!updated) throw new NotFoundError("Program not found")
  return ok(updated)
})

export const DELETE = withAdmin(TAG, async ({ params }) => {
  const deleted = await deleteProgram(paramId(params.id, "program ID"))
  if (!deleted) throw new NotFoundError("Program not found")
  return ok({ success: true })
})
