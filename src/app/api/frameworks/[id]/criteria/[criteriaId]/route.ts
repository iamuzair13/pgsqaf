import { withAdmin } from "@/server/http/handler"
import { paramId } from "@/server/http/params"
import { ok } from "@/server/http/response"
import { NotFoundError } from "@/server/http/errors"
import { criteriaInputSchema } from "@/schemas/framework"
import { getCriteriaBundle } from "@/server/repos/frameworks.repo"
import { updateCriteria } from "@/server/services/frameworks.service"

const TAG = "api/frameworks/:id/criteria/:criteriaId"

export const GET = withAdmin(TAG, async ({ params }) => {
  const bundle = await getCriteriaBundle(
    paramId(params.id, "framework ID"),
    paramId(params.criteriaId, "criteria ID")
  )
  if (!bundle) throw new NotFoundError("Criteria not found")
  return ok(bundle)
})

export const PUT = withAdmin(TAG, async ({ req, params }) => {
  const body = criteriaInputSchema.parse(await req.json())
  const result = await updateCriteria(
    paramId(params.id, "framework ID"),
    paramId(params.criteriaId, "criteria ID"),
    body
  )
  return ok(result)
})
