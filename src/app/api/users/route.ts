import bcrypt from "bcryptjs"
import { createUserSchema } from "@/schemas/user"
import { withSuperAdmin } from "@/server/http/handler"
import { created, ok } from "@/server/http/response"
import { ConflictError } from "@/server/http/errors"
import { createUser, findUserByEmail, listUsers } from "@/server/repos/users.repo"

const TAG = "api/users"

export const GET = withSuperAdmin(TAG, async () => ok(await listUsers()))

export const POST = withSuperAdmin(TAG, async ({ req }) => {
  const input = createUserSchema.parse(await req.json())
  const email = input.email.toLowerCase().trim()

  const existing = await findUserByEmail(email)
  if (existing.length) {
    throw new ConflictError("A user with this email already exists")
  }

  const rows = await createUser({
    name: input.name.trim(),
    email,
    passwordHash: await bcrypt.hash(input.password, 10),
    role: input.role,
  })
  return created(rows[0])
})
