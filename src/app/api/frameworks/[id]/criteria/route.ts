import { withAdmin } from "@/server/http/handler"
import { paramId } from "@/server/http/params"
import { created, ok } from "@/server/http/response"
import { criteriaInputSchema } from "@/schemas/framework"
import { listCriteria } from "@/server/repos/frameworks.repo"
import { addCriteria } from "@/server/services/frameworks.service"

const TAG = "api/frameworks/:id/criteria"

export const GET = withAdmin(TAG, async ({ params }) =>
  ok(await listCriteria(paramId(params.id, "framework ID")))
)

export const POST = withAdmin(TAG, async ({ req, params }) => {
  const body = criteriaInputSchema.parse(await req.json())
  const result = await addCriteria(paramId(params.id, "framework ID"), body)
  return created(result)
})
