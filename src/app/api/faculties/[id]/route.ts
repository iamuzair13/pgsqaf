import { updateFacultySchema } from "@/schemas/org"
import { withAdmin } from "@/server/http/handler"
import { paramId } from "@/server/http/params"
import { ok } from "@/server/http/response"
import { BadRequestError, NotFoundError } from "@/server/http/errors"
import { deleteFaculty, updateFaculty } from "@/server/repos/org.repo"

const TAG = "api/faculties/:id"

export const PATCH = withAdmin(TAG, async ({ req, params }) => {
  const id = paramId(params.id, "faculty ID")
  const input = updateFacultySchema.parse(await req.json())
  if (Object.keys(input).length === 0) throw new BadRequestError("No fields to update")

  const updated = await updateFaculty(id, {
    ...(input.name !== undefined && { name: input.name.trim() }),
    ...(input.code !== undefined && { code: input.code.trim().toUpperCase() }),
    ...(input.dean !== undefined && { dean: input.dean?.trim() || null }),
    ...(input.description !== undefined && { description: input.description?.trim() || null }),
    ...(input.status !== undefined && { status: input.status }),
  })
  if (!updated) throw new NotFoundError("Faculty not found")
  return ok(updated)
})

export const DELETE = withAdmin(TAG, async ({ params }) => {
  const deleted = await deleteFaculty(paramId(params.id, "faculty ID"))
  if (!deleted) throw new NotFoundError("Faculty not found")
  return ok({ success: true })
})
