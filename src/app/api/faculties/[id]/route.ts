import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import type { Faculty } from "@/types"

// PATCH /api/faculties/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const facultyId = parseInt(id, 10)
    if (isNaN(facultyId)) {
      return NextResponse.json({ error: "Invalid faculty ID" }, { status: 400 })
    }

    const body = await req.json()
    const { name, code, dean, description, status } = body as {
      name?: string
      code?: string
      dean?: string
      description?: string
      status?: boolean
    }

    const fields: string[] = []
    const values: unknown[] = []
    let idx = 1

    if (name !== undefined) { fields.push(`name = $${idx++}`); values.push(name.trim()) }
    if (code !== undefined) { fields.push(`code = $${idx++}`); values.push(code.trim().toUpperCase()) }
    if (dean !== undefined) { fields.push(`dean = $${idx++}`); values.push(dean?.trim() || null) }
    if (description !== undefined) { fields.push(`description = $${idx++}`); values.push(description?.trim() || null) }
    if (status !== undefined) { fields.push(`status = $${idx++}`); values.push(status) }

    if (fields.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    values.push(facultyId)

    const rows = await query<Faculty>(
      `UPDATE faculties SET ${fields.join(", ")} WHERE id = $${idx}
       RETURNING id, name, code, dean, description, status, created_at, updated_at`,
      values
    )

    if (rows.length === 0) {
      return NextResponse.json({ error: "Faculty not found" }, { status: 404 })
    }

    return NextResponse.json(rows[0])
  } catch (err) {
    console.error("[PATCH /api/faculties/[id]]", err)
    return NextResponse.json({ error: "Failed to update faculty" }, { status: 500 })
  }
}

// DELETE /api/faculties/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const facultyId = parseInt(id, 10)
    if (isNaN(facultyId)) {
      return NextResponse.json({ error: "Invalid faculty ID" }, { status: 400 })
    }

    const rows = await query<{ id: number }>(
      "DELETE FROM faculties WHERE id = $1 RETURNING id",
      [facultyId]
    )

    if (rows.length === 0) {
      return NextResponse.json({ error: "Faculty not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[DELETE /api/faculties/[id]]", err)
    return NextResponse.json({ error: "Failed to delete faculty" }, { status: 500 })
  }
}
