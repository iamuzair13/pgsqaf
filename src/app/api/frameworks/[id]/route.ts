import { withAdmin } from "@/server/http/handler"
import { paramId } from "@/server/http/params"
import { ok } from "@/server/http/response"
import { NotFoundError } from "@/server/http/errors"
import { deleteFrameworkById, getFrameworkById } from "@/server/repos/frameworks.repo"

const TAG = "api/frameworks/:id"

export const GET = withAdmin(TAG, async ({ params }) => {
  const framework = await getFrameworkById(paramId(params.id, "framework ID"))
  if (!framework) throw new NotFoundError("Framework not found")
  return ok(framework)
})

export const DELETE = withAdmin(TAG, async ({ params }) => {
  const deleted = await deleteFrameworkById(paramId(params.id, "framework ID"))
  if (!deleted) throw new NotFoundError("Framework not found")
  return ok({ success: true })
})
