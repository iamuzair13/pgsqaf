import { withMember } from "@/server/http/handler"
import { ok } from "@/server/http/response"
import { publishedForFaculty } from "@/server/services/frameworks.service"

const TAG = "api/profile/frameworks"

export const GET = withMember(TAG, async () => {
  const frameworks = await publishedForFaculty()
  return ok({ frameworks })
})
