import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; criteriaId: string }> }
) {
  const { id, criteriaId } = await params
  const frameworkId = parseInt(id)
  const cId = parseInt(criteriaId)

  if (isNaN(frameworkId) || isNaN(cId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 })
  }

  try {
    const criteriaRows = await query(
      `SELECT c.id, c.framework_id, c.title, c.domain, c.measure,
              c.total_weight, c.display_order
       FROM criteria c
       WHERE c.id = $1 AND c.framework_id = $2`,
      [cId, frameworkId]
    )

    if (!criteriaRows.length) {
      return NextResponse.json({ error: "Criteria not found" }, { status: 404 })
    }

    const indicators = await query(
      `SELECT i.id, i.criteria_id, i.question, i.weight, i.require_attachment, i.display_order
       FROM indicators i
       WHERE i.criteria_id = $1
       ORDER BY i.display_order ASC`,
      [cId]
    )

    const rubrics = await query(
      `SELECT r.id, r.criteria_id, r.score, r.descriptor_id, r.performance_standard, r.display_order,
              rd.name AS descriptor_name
       FROM rubrics r
       JOIN rubric_descriptors rd ON rd.id = r.descriptor_id
       WHERE r.criteria_id = $1
       ORDER BY r.display_order ASC`,
      [cId]
    )

    const quantRows = await query(
      `SELECT q.id, q.criteria_id, q.assigned_score, q.weight_factor, q.weighted_score
       FROM criteria_quantification q
       WHERE q.criteria_id = $1`,
      [cId]
    )

    const evidence = await query(
      `SELECT e.id, e.criteria_id, e.title, e.description, e.require_attachment, e.file_path
       FROM evidence e
       WHERE e.criteria_id = $1
       ORDER BY e.id ASC`,
      [cId]
    )

    return NextResponse.json({
      ...criteriaRows[0],
      indicators,
      rubrics,
      quantification: quantRows[0] ?? null,
      evidence,
    })
  } catch (err) {
    console.error("[GET /api/frameworks/:id/criteria/:criteriaId]", err)
    return NextResponse.json({ error: "Failed to fetch criteria" }, { status: 500 })
  }
}
