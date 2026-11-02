import { createFacultySchema } from "@/schemas/org"
import { withAdmin } from "@/server/http/handler"
import { created, ok } from "@/server/http/response"
import { createFaculty, listFaculties } from "@/server/repos/org.repo"
import { ConflictError } from "@/server/http/errors"

const TAG = "api/faculties"

export const GET = withAdmin(TAG, async () => ok(await listFaculties()))

export const POST = withAdmin(TAG, async ({ req }) => {
  const input = createFacultySchema.parse(await req.json())
  try {
    const rows = await createFaculty({
      name: input.name.trim(),
      code: input.code.trim().toUpperCase(),
      dean: input.dean?.trim(),
      description: input.description?.trim(),
    })
    return created(rows[0])
  } catch (err) {
    if (err instanceof Error && err.message.includes("unique")) {
      throw new ConflictError("A faculty with this code already exists")
    }
    throw err
  }
})
