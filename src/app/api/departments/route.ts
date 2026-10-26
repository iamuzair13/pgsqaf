import { createDepartmentSchema } from "@/schemas/org"
import { withAdmin } from "@/server/http/handler"
import { created, ok } from "@/server/http/response"
import { createDepartment, listDepartments } from "@/server/repos/org.repo"
import { ConflictError } from "@/server/http/errors"

const TAG = "api/departments"

export const GET = withAdmin(TAG, async ({ req }) => {
  const facultyId = req.nextUrl.searchParams.get("faculty_id")
  const id = facultyId ? parseInt(facultyId, 10) : undefined
  return ok(await listDepartments(id && !isNaN(id) ? id : undefined))
})

export const POST = withAdmin(TAG, async ({ req }) => {
  const input = createDepartmentSchema.parse(await req.json())
  try {
    const rows = await createDepartment({
      faculty_id: input.faculty_id,
      name: input.name.trim(),
      code: input.code.trim().toUpperCase(),
      head: input.head?.trim(),
      description: input.description?.trim(),
    })
    return created(rows[0])
  } catch (err) {
    if (err instanceof Error && err.message.includes("unique")) {
      throw new ConflictError("A department with this code already exists")
    }
    throw err
  }
})
