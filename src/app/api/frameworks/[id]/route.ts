import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const numId = parseInt(id)

  if (isNaN(numId)) {
    return NextResponse.json({ error: "Invalid framework ID" }, { status: 400 })
  }

  try {
    const rows = await query(
      `SELECT f.id, f.title, f.description, f.status, f.version,
              f.created_by, u.name AS created_by_name,
              f.created_at, f.updated_at,
              COUNT(c.id)::int AS criteria_count
       FROM frameworks f
       LEFT JOIN users    u ON u.id = f.created_by
       LEFT JOIN criteria c ON c.framework_id = f.id
       WHERE f.id = $1
       GROUP BY f.id, u.name`,
      [numId]
    )

    if (!rows.length) {
      return NextResponse.json({ error: "Framework not found" }, { status: 404 })
    }

    return NextResponse.json(rows[0])
  } catch (err) {
    console.error("[GET /api/frameworks/:id]", err)
    return NextResponse.json({ error: "Failed to fetch framework" }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const numId = parseInt(id)

  if (isNaN(numId)) {
    return NextResponse.json({ error: "Invalid framework ID" }, { status: 400 })
  }

  try {
    const rows = await query(
      "DELETE FROM frameworks WHERE id = $1 RETURNING id",
      [numId]
    )
    if (!rows.length) {
      return NextResponse.json({ error: "Framework not found" }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[DELETE /api/frameworks/:id]", err)
    return NextResponse.json({ error: "Failed to delete framework" }, { status: 500 })
  }
}
