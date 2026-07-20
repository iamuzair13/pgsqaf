import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import type { Department } from "@/types"

// GET /api/departments?faculty_id=X
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const facultyId = searchParams.get("faculty_id")

    let sql = `SELECT d.id, d.faculty_id, f.name AS faculty_name,
                      d.name, d.code, d.head, d.description, d.status,
                      d.created_at, d.updated_at,
                      (SELECT COUNT(*) FROM programs p WHERE p.department_id = d.id)::int AS program_count
               FROM departments d
               JOIN faculties f ON f.id = d.faculty_id`
    const params: unknown[] = []

    if (facultyId) {
      sql += ` WHERE d.faculty_id = $1`
      params.push(parseInt(facultyId, 10))
    }

    sql += ` ORDER BY d.name ASC`

    const rows = await query<Department>(sql, params)
    return NextResponse.json(rows)
  } catch (err) {
    console.error("[GET /api/departments]", err)
    return NextResponse.json({ error: "Failed to fetch departments" }, { status: 500 })
  }
}

// POST /api/departments
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { faculty_id, name, code, head, description } = body as {
      faculty_id?: number
      name?: string
      code?: string
      head?: string
      description?: string
    }

    if (!faculty_id || !name?.trim() || !code?.trim()) {
      return NextResponse.json(
        { error: "Faculty, name, and code are required" },
        { status: 400 }
      )
    }

    const rows = await query<Department>(
      `INSERT INTO departments (faculty_id, name, code, head, description)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, faculty_id, name, code, head, description, status, created_at, updated_at`,
      [faculty_id, name.trim(), code.trim().toUpperCase(), head?.trim() || null, description?.trim() || null]
    )

    return NextResponse.json(rows[0], { status: 201 })
  } catch (err) {
    console.error("[POST /api/departments]", err)
    const message = err instanceof Error && err.message.includes("unique")
      ? "A department with this code already exists"
      : "Failed to create department"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
