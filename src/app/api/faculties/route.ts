import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import type { Faculty } from "@/types"

// GET /api/faculties — list all faculties with counts
export async function GET() {
  try {
    const rows = await query<Faculty>(
      `SELECT f.id, f.name, f.code, f.dean, f.description, f.status,
              f.created_at, f.updated_at,
              (SELECT COUNT(*) FROM departments d WHERE d.faculty_id = f.id)::int AS department_count,
              (SELECT COUNT(*) FROM programs p
               JOIN departments d ON d.id = p.department_id
               WHERE d.faculty_id = f.id)::int AS program_count
       FROM faculties f
       ORDER BY f.name ASC`
    )
    return NextResponse.json(rows)
  } catch (err) {
    console.error("[GET /api/faculties]", err)
    return NextResponse.json({ error: "Failed to fetch faculties" }, { status: 500 })
  }
}

// POST /api/faculties — create a new faculty
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, code, dean, description } = body as {
      name?: string
      code?: string
      dean?: string
      description?: string
    }

    if (!name?.trim() || !code?.trim()) {
      return NextResponse.json(
        { error: "Name and code are required" },
        { status: 400 }
      )
    }

    const rows = await query<Faculty>(
      `INSERT INTO faculties (name, code, dean, description)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, code, dean, description, status, created_at, updated_at`,
      [name.trim(), code.trim().toUpperCase(), dean?.trim() || null, description?.trim() || null]
    )

    return NextResponse.json(rows[0], { status: 201 })
  } catch (err) {
    console.error("[POST /api/faculties]", err)
    const message = err instanceof Error && err.message.includes("unique")
      ? "A faculty with this code already exists"
      : "Failed to create faculty"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
