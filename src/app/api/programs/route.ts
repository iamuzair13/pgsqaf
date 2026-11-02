import { createProgramSchema } from "@/schemas/org"
import { withAdmin } from "@/server/http/handler"
import { created, ok } from "@/server/http/response"
import { createProgram, listPrograms } from "@/server/repos/org.repo"
import { ConflictError } from "@/server/http/errors"

const TAG = "api/programs"

export const GET = withAdmin(TAG, async ({ req }) => {
  const departmentId = req.nextUrl.searchParams.get("department_id")
  const id = departmentId ? parseInt(departmentId, 10) : undefined
  return ok(await listPrograms(id && !isNaN(id) ? id : undefined))
})

export const POST = withAdmin(TAG, async ({ req }) => {
  const input = createProgramSchema.parse(await req.json())
  try {
    const rows = await createProgram({
      department_id: input.department_id,
      name: input.name.trim(),
      code: input.code.trim().toUpperCase(),
      level: input.level.trim(),
      duration_years: input.duration_years,
      description: input.description?.trim(),
    })
    return created(rows[0])
  } catch (err) {
    if (err instanceof Error && err.message.includes("unique")) {
      throw new ConflictError("A program with this code already exists")
    }
    throw err
  }
})
