import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { requireAdmin } from "@/lib/auth-guard"
import bcrypt from "bcryptjs"
import type { User } from "@/types"

// PATCH /api/users/[id] — update user (name, email, role, status, optional password)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requireAdmin()
  if (response) return response

  try {
    const { id } = await params
    const userId = parseInt(id, 10)
    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 })
    }

    const body = await req.json()
    const { name, email, role, status, password } = body as {
      name?: string
      email?: string
      role?: "SUPER_ADMIN" | "ADMIN"
      status?: boolean
      password?: string
    }

    // Build dynamic SET clause
    const fields: string[] = []
    const values: unknown[] = []
    let idx = 1

    if (name !== undefined) {
      fields.push(`name = $${idx++}`)
      values.push(name.trim())
    }
    if (email !== undefined) {
      const normalizedEmail = email.toLowerCase().trim()
      // Check uniqueness (exclude self)
      const dup = await query<{ id: number }>(
        "SELECT id FROM users WHERE email = $1 AND id != $2 LIMIT 1",
        [normalizedEmail, userId]
      )
      if (dup.length > 0) {
        return NextResponse.json(
          { error: "A user with this email already exists" },
          { status: 409 }
        )
      }
      fields.push(`email = $${idx++}`)
      values.push(normalizedEmail)
    }
    if (role !== undefined) {
      const assignedRole = role === "SUPER_ADMIN" ? "SUPER_ADMIN" : "ADMIN"
      fields.push(`role = $${idx++}`)
      values.push(assignedRole)
    }
    if (status !== undefined) {
      fields.push(`status = $${idx++}`)
      values.push(status)
    }
    if (password !== undefined && password.trim().length > 0) {
      if (password.length < 6) {
        return NextResponse.json(
          { error: "Password must be at least 6 characters" },
          { status: 400 }
        )
      }
      const hashed = await bcrypt.hash(password, 10)
      fields.push(`password = $${idx++}`)
      values.push(hashed)
    }

    if (fields.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    values.push(userId)

    const rows = await query<Omit<User, "password">>(
      `UPDATE users SET ${fields.join(", ")} WHERE id = $${idx}
       RETURNING id, name, email, role, status, created_at, updated_at`,
      values
    )

    if (rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(rows[0])
  } catch (err) {
    console.error("[PATCH /api/users/[id]]", err)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}

// DELETE /api/users/[id] — delete a user
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requireAdmin()
  if (response) return response

  try {
    const { id } = await params
    const userId = parseInt(id, 10)
    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 })
    }

    const rows = await query<{ id: number }>(
      "DELETE FROM users WHERE id = $1 RETURNING id",
      [userId]
    )

    if (rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[DELETE /api/users/[id]]", err)
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
  }
}
