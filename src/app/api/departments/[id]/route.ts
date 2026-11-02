import { updateDepartmentSchema } from "@/schemas/org"
import { withAdmin } from "@/server/http/handler"
import { paramId } from "@/server/http/params"
import { ok } from "@/server/http/response"
import { BadRequestError, NotFoundError } from "@/server/http/errors"
import { deleteDepartment, updateDepartment } from "@/server/repos/org.repo"

const TAG = "api/departments/:id"

export const PATCH = withAdmin(TAG, async ({ req, params }) => {
  const id = paramId(params.id, "department ID")
  const input = updateDepartmentSchema.parse(await req.json())
  if (Object.keys(input).length === 0) throw new BadRequestError("No fields to update")

  const updated = await updateDepartment(id, {
    ...(input.faculty_id !== undefined && { faculty_id: input.faculty_id }),
    ...(input.name !== undefined && { name: input.name.trim() }),
    ...(input.code !== undefined && { code: input.code.trim().toUpperCase() }),
    ...(input.head !== undefined && { head: input.head?.trim() || null }),
    ...(input.description !== undefined && { description: input.description?.trim() || null }),
    ...(input.status !== undefined && { status: input.status }),
  })
  if (!updated) throw new NotFoundError("Department not found")
  return ok(updated)
})

export const DELETE = withAdmin(TAG, async ({ params }) => {
  const deleted = await deleteDepartment(paramId(params.id, "department ID"))
  if (!deleted) throw new NotFoundError("Department not found")
  return ok({ success: true })
})
