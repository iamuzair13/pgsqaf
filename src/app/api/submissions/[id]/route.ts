import { patchSubmissionSchema } from "@/schemas/submission"
import { withMember } from "@/server/http/handler"
import { paramId } from "@/server/http/params"
import { ok } from "@/server/http/response"
import * as submissionsService from "@/server/services/submissions.service"

const TAG = "api/submissions/:id"

export const GET = withMember(TAG, async ({ params, email }) =>
  ok(await submissionsService.getDetail(paramId(params.id, "submission ID"), email))
)

export const PATCH = withMember(TAG, async ({ req, params, email }) => {
  const input = patchSubmissionSchema.parse(await req.json())
  return ok(
    await submissionsService.save(paramId(params.id, "submission ID"), email, input)
  )
})

export const DELETE = withMember(TAG, async ({ params, email }) =>
  ok(await submissionsService.remove(paramId(params.id, "submission ID"), email))
)
