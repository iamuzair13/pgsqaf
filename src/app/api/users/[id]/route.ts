import bcrypt from "bcryptjs"
import { updateUserSchema } from "@/schemas/user"
import { withSuperAdmin } from "@/server/http/handler"
import { paramId } from "@/server/http/params"
import { ok } from "@/server/http/response"
import { BadRequestError, ConflictError, NotFoundError } from "@/server/http/errors"
import { deleteUser, findUserByEmail, updateUser } from "@/server/repos/users.repo"

const TAG = "api/users/:id"

export const PATCH = withSuperAdmin(TAG, async ({ req, params }) => {
  const id = paramId(params.id, "user ID")
  const input = updateUserSchema.parse(await req.json())

  const columns: { column: string; value: unknown }[] = []

  if (input.name !== undefined) columns.push({ column: "name", value: input.name.trim() })
  if (input.email !== undefined) {
    const email = input.email.toLowerCase().trim()
    const dup = await findUserByEmail(email, id)
    if (dup.length) throw new ConflictError("A user with this email already exists")
    columns.push({ column: "email", value: email })
  }
  if (input.role !== undefined) columns.push({ column: "role", value: input.role })
  if (input.status !== undefined) columns.push({ column: "status", value: input.status })
  if (input.password !== undefined && input.password.trim().length > 0) {
    if (input.password.length < 6) {
      throw new BadRequestError("Password must be at least 6 characters")
    }
    columns.push({ column: "password", value: await bcrypt.hash(input.password, 10) })
  }

  if (!columns.length) throw new BadRequestError("No fields to update")

  const updated = await updateUser(id, columns)
  if (!updated) throw new NotFoundError("User not found")
  return ok(updated)
})

export const DELETE = withSuperAdmin(TAG, async ({ params }) => {
  const deleted = await deleteUser(paramId(params.id, "user ID"))
  if (!deleted) throw new NotFoundError("User not found")
  return ok({ success: true })
})
