import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { dummyErpProfile } from "@/lib/dummy-profile"

export async function GET() {
  try {
    const frameworks = await query(
      `SELECT f.id, f.title, f.description, f.version, f.updated_at,
              COUNT(DISTINCT c.id)::int AS criteria_count,
              COUNT(DISTINCT i.id)::int AS indicator_count
       FROM frameworks f
       LEFT JOIN criteria c ON c.framework_id = f.id
       LEFT JOIN indicators i ON i.criteria_id = c.id
       WHERE f.status = 'PUBLISHED'
       GROUP BY f.id
       ORDER BY f.updated_at DESC`
    )

    const submissions = await query(
      `SELECT s.id, s.framework_id, f.title AS framework_title,
              f.version AS framework_version, s.status, s.progress,
              s.total_score, s.submitted_at, s.created_at, s.updated_at,
              COUNT(DISTINCT sa.indicator_id)::int AS answered_count,
              COUNT(DISTINCT i.id)::int AS indicator_count
       FROM submissions s
       JOIN frameworks f ON f.id = s.framework_id
       LEFT JOIN criteria c ON c.framework_id = f.id
       LEFT JOIN indicators i ON i.criteria_id = c.id
       LEFT JOIN submission_answers sa
         ON sa.submission_id = s.id AND sa.indicator_id = i.id AND sa.score IS NOT NULL
       WHERE s.erp_id = $1
       GROUP BY s.id, f.id
       ORDER BY s.updated_at DESC`,
      [dummyErpProfile.erp_id]
    )

    return NextResponse.json({ profile: dummyErpProfile, frameworks, submissions })
  } catch (error) {
    console.error("[GET /api/profile]", error)
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 })
  }
}
