import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import bcrypt from "bcryptjs"
import type { User } from "@/types"

// GET /api/users — list all admin users
export async function GET() {
  try {
    const rows = await query<Omit<User, "password">>(
      `SELECT id, name, email, role, status, created_at, updated_at
       FROM users
       ORDER BY created_at DESC`
    )
    return NextResponse.json(rows)
  } catch (err) {
    console.error("[GET /api/users]", err)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}

// POST /api/users — create a new admin user
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, password, role } = body as {
      name?: string
      email?: string
      password?: string
      role?: "SUPER_ADMIN" | "ADMIN"
    }

    if (!name?.trim() || !email?.trim() || !password?.trim()) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()
    const assignedRole = role === "SUPER_ADMIN" ? "SUPER_ADMIN" : "ADMIN"

    // Check for existing email
    const existing = await query<{ id: number }>(
      "SELECT id FROM users WHERE email = $1 LIMIT 1",
      [normalizedEmail]
    )
    if (existing.length > 0) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      )
    }

    const hashed = await bcrypt.hash(password, 10)

    const rows = await query<Omit<User, "password">>(
      `INSERT INTO users (name, email, password, role, status)
       VALUES ($1, $2, $3, $4, TRUE)
       RETURNING id, name, email, role, status, created_at, updated_at`,
      [name.trim(), normalizedEmail, hashed, assignedRole]
    )

    return NextResponse.json(rows[0], { status: 201 })
  } catch (err) {
    console.error("[POST /api/users]", err)
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
}
