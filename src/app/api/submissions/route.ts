import { createSubmissionSchema } from "@/schemas/submission"
import { withMember } from "@/server/http/handler"
import { created, ok } from "@/server/http/response"
import * as submissionsService from "@/server/services/submissions.service"

const TAG = "api/submissions"

export const POST = withMember(TAG, async ({ req, session, email }) => {
  const { framework_id } = createSubmissionSchema.parse(await req.json())
  const result = await submissionsService.start(email, framework_id, session.user.name ?? "")
  return result.existing ? ok(result) : created(result)
})
