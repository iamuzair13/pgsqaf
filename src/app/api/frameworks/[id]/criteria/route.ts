import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { requireAdmin } from "@/lib/auth-guard"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requireAdmin()
  if (response) return response

  const { id } = await params
  const frameworkId = parseInt(id)

  if (isNaN(frameworkId)) {
    return NextResponse.json({ error: "Invalid framework ID" }, { status: 400 })
  }

  try {
    const rows = await query(
      `SELECT c.id, c.framework_id, c.title, c.domain, c.measure,
              c.total_weight, c.display_order,
              COUNT(i.id)::int AS indicators_count
       FROM criteria c
       LEFT JOIN indicators i ON i.criteria_id = c.id
       WHERE c.framework_id = $1
       GROUP BY c.id
       ORDER BY c.display_order ASC`,
      [frameworkId]
    )

    return NextResponse.json(rows)
  } catch (err) {
    console.error("[GET /api/frameworks/:id/criteria]", err)
    return NextResponse.json({ error: "Failed to fetch criteria" }, { status: 500 })
  }
}
