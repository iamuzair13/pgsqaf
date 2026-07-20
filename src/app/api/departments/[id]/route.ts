import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import type { Department } from "@/types"

// PATCH /api/departments/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const deptId = parseInt(id, 10)
    if (isNaN(deptId)) {
      return NextResponse.json({ error: "Invalid department ID" }, { status: 400 })
    }

    const body = await req.json()
    const { faculty_id, name, code, head, description, status } = body as {
      faculty_id?: number
      name?: string
      code?: string
      head?: string
      description?: string
      status?: boolean
    }

    const fields: string[] = []
    const values: unknown[] = []
    let idx = 1

    if (faculty_id !== undefined) { fields.push(`faculty_id = $${idx++}`); values.push(faculty_id) }
    if (name !== undefined) { fields.push(`name = $${idx++}`); values.push(name.trim()) }
    if (code !== undefined) { fields.push(`code = $${idx++}`); values.push(code.trim().toUpperCase()) }
    if (head !== undefined) { fields.push(`head = $${idx++}`); values.push(head?.trim() || null) }
    if (description !== undefined) { fields.push(`description = $${idx++}`); values.push(description?.trim() || null) }
    if (status !== undefined) { fields.push(`status = $${idx++}`); values.push(status) }

    if (fields.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    values.push(deptId)

    const rows = await query<Department>(
      `UPDATE departments SET ${fields.join(", ")} WHERE id = $${idx}
       RETURNING id, faculty_id, name, code, head, description, status, created_at, updated_at`,
      values
    )

    if (rows.length === 0) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 })
    }

    return NextResponse.json(rows[0])
  } catch (err) {
    console.error("[PATCH /api/departments/[id]]", err)
    return NextResponse.json({ error: "Failed to update department" }, { status: 500 })
  }
}

// DELETE /api/departments/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const deptId = parseInt(id, 10)
    if (isNaN(deptId)) {
      return NextResponse.json({ error: "Invalid department ID" }, { status: 400 })
    }

    const rows = await query<{ id: number }>(
      "DELETE FROM departments WHERE id = $1 RETURNING id",
      [deptId]
    )

    if (rows.length === 0) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[DELETE /api/departments/[id]]", err)
    return NextResponse.json({ error: "Failed to delete department" }, { status: 500 })
  }
}
