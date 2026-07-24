import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { requireAdmin } from "@/lib/auth-guard"
import type { Program } from "@/types"

// GET /api/programs?department_id=X
export async function GET(req: NextRequest) {
  const { response } = await requireAdmin()
  if (response) return response

  try {
    const { searchParams } = new URL(req.url)
    const departmentId = searchParams.get("department_id")

    let sql = `SELECT p.id, p.department_id, d.name AS department_name,
                      f.name AS faculty_name,
                      p.name, p.code, p.level, p.duration_years,
                      p.description, p.status, p.created_at, p.updated_at
               FROM programs p
               JOIN departments d ON d.id = p.department_id
               JOIN faculties f ON f.id = d.faculty_id`
    const params: unknown[] = []

    if (departmentId) {
      sql += ` WHERE p.department_id = $1`
      params.push(parseInt(departmentId, 10))
    }

    sql += ` ORDER BY p.name ASC`

    const rows = await query<Program>(sql, params)
    return NextResponse.json(rows)
  } catch (err) {
    console.error("[GET /api/programs]", err)
    return NextResponse.json({ error: "Failed to fetch programs" }, { status: 500 })
  }
}

// POST /api/programs
export async function POST(req: NextRequest) {
  const { response } = await requireAdmin()
  if (response) return response

  try {
    const body = await req.json()
    const { department_id, name, code, level, duration_years, description } = body as {
      department_id?: number
      name?: string
      code?: string
      level?: string
      duration_years?: number
      description?: string
    }

    if (!department_id || !name?.trim() || !code?.trim() || !level?.trim()) {
      return NextResponse.json(
        { error: "Department, name, code, and level are required" },
        { status: 400 }
      )
    }

    const rows = await query<Program>(
      `INSERT INTO programs (department_id, name, code, level, duration_years, description)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, department_id, name, code, level, duration_years, description, status, created_at, updated_at`,
      [
        department_id,
        name.trim(),
        code.trim().toUpperCase(),
        level.trim(),
        duration_years ?? 2.0,
        description?.trim() || null,
      ]
    )

    return NextResponse.json(rows[0], { status: 201 })
  } catch (err) {
    console.error("[POST /api/programs]", err)
    const message = err instanceof Error && err.message.includes("unique")
      ? "A program with this code already exists"
      : "Failed to create program"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
