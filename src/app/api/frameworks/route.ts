import { createFrameworkSchema } from "@/schemas/framework"
import { withAdmin } from "@/server/http/handler"
import { created, ok } from "@/server/http/response"
import { listFrameworks } from "@/server/repos/frameworks.repo"
import * as frameworksService from "@/server/services/frameworks.service"

const TAG = "api/frameworks"

export const GET = withAdmin(TAG, async () => ok(await listFrameworks()))

export const POST = withAdmin(TAG, async ({ req, session }) => {
  const input = createFrameworkSchema.parse(await req.json())
  const framework = await frameworksService.create(input, Number(session.user.id))
  return created(framework)
})
