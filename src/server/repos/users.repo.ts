import { query } from "@/lib/db"
import type { User } from "@/types"

const USER_COLS = "id, name, email, role, status, created_at, updated_at"

export function listUsers() {
  return query<Omit<User, "password">>(
    `SELECT ${USER_COLS} FROM users ORDER BY created_at DESC`
  )
}

export function findUserByEmail(email: string, excludeId?: number) {
  return excludeId === undefined
    ? query<{ id: number }>("SELECT id FROM users WHERE email = $1 LIMIT 1", [email])
    : query<{ id: number }>(
        "SELECT id FROM users WHERE email = $1 AND id != $2 LIMIT 1",
        [email, excludeId]
      )
}

export function createUser(input: {
  name: string
  email: string
  passwordHash: string
  role: "SUPER_ADMIN" | "ADMIN"
}) {
  return query<Omit<User, "password">>(
    `INSERT INTO users (name, email, password, role, status)
     VALUES ($1, $2, $3, $4, TRUE)
     RETURNING ${USER_COLS}`,
    [input.name, input.email, input.passwordHash, input.role]
  )
}

export async function updateUser(
  id: number,
  columns: { column: string; value: unknown }[]
): Promise<Omit<User, "password"> | null> {
  if (!columns.length) return null
  const set = columns.map((c, i) => `${c.column} = $${i + 1}`).join(", ")
  const rows = await query<Omit<User, "password">>(
    `UPDATE users SET ${set} WHERE id = $${columns.length + 1} RETURNING ${USER_COLS}`,
    [...columns.map((c) => c.value), id]
  )
  return rows[0] ?? null
}

export async function deleteUser(id: number) {
  return (await query<{ id: number }>("DELETE FROM users WHERE id = $1 RETURNING id", [id])).length > 0
}
