import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { requireAdmin } from "@/lib/auth-guard"
import type { Program } from "@/types"

// PATCH /api/programs/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requireAdmin()
  if (response) return response

  try {
    const { id } = await params
    const programId = parseInt(id, 10)
    if (isNaN(programId)) {
      return NextResponse.json({ error: "Invalid program ID" }, { status: 400 })
    }

    const body = await req.json()
    const { department_id, name, code, level, duration_years, description, status } = body as {
      department_id?: number
      name?: string
      code?: string
      level?: string
      duration_years?: number
      description?: string
      status?: boolean
    }

    const fields: string[] = []
    const values: unknown[] = []
    let idx = 1

    if (department_id !== undefined) { fields.push(`department_id = $${idx++}`); values.push(department_id) }
    if (name !== undefined) { fields.push(`name = $${idx++}`); values.push(name.trim()) }
    if (code !== undefined) { fields.push(`code = $${idx++}`); values.push(code.trim().toUpperCase()) }
    if (level !== undefined) { fields.push(`level = $${idx++}`); values.push(level.trim()) }
    if (duration_years !== undefined) { fields.push(`duration_years = $${idx++}`); values.push(duration_years) }
    if (description !== undefined) { fields.push(`description = $${idx++}`); values.push(description?.trim() || null) }
    if (status !== undefined) { fields.push(`status = $${idx++}`); values.push(status) }

    if (fields.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    values.push(programId)

    const rows = await query<Program>(
      `UPDATE programs SET ${fields.join(", ")} WHERE id = $${idx}
       RETURNING id, department_id, name, code, level, duration_years, description, status, created_at, updated_at`,
      values
    )

    if (rows.length === 0) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 })
    }

    return NextResponse.json(rows[0])
  } catch (err) {
    console.error("[PATCH /api/programs/[id]]", err)
    return NextResponse.json({ error: "Failed to update program" }, { status: 500 })
  }
}

// DELETE /api/programs/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requireAdmin()
  if (response) return response

  try {
    const { id } = await params
    const programId = parseInt(id, 10)
    if (isNaN(programId)) {
      return NextResponse.json({ error: "Invalid program ID" }, { status: 400 })
    }

    const rows = await query<{ id: number }>(
      "DELETE FROM programs WHERE id = $1 RETURNING id",
      [programId]
    )

    if (rows.length === 0) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[DELETE /api/programs/[id]]", err)
    return NextResponse.json({ error: "Failed to delete program" }, { status: 500 })
  }
}
