import { NextRequest, NextResponse } from "next/server"
import pool, { query } from "@/lib/db"
import { dummyErpProfile } from "@/lib/dummy-profile"

type AnswerInput = {
  indicator_id: number
  rubric_id: number | null
  score: number | null
  response: string
  attachment_name: string | null
  attachment_type: string | null
  attachment_data?: string | null
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const submissionId = Number(id)
  if (!Number.isInteger(submissionId)) {
    return NextResponse.json({ error: "Invalid submission" }, { status: 400 })
  }

  try {
    const submissions = await query<Record<string, unknown>>(
      `SELECT s.*, f.title AS framework_title, f.version AS framework_version,
              f.description AS framework_description,
              COUNT(DISTINCT sa.indicator_id) FILTER (WHERE sa.score IS NOT NULL)::int AS answered_count,
              COUNT(DISTINCT i.id)::int AS indicator_count
       FROM submissions s
       JOIN frameworks f ON f.id = s.framework_id
       LEFT JOIN criteria c ON c.framework_id = f.id
       LEFT JOIN indicators i ON i.criteria_id = c.id
       LEFT JOIN submission_answers sa ON sa.submission_id = s.id AND sa.indicator_id = i.id
       WHERE s.id = $1 AND s.erp_id = $2
       GROUP BY s.id, f.id`,
      [submissionId, dummyErpProfile.erp_id]
    )
    if (!submissions.length) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }

    const criteria = await query<Record<string, unknown>>(
      `SELECT id, framework_id, title, domain, measure, total_weight, display_order
       FROM criteria WHERE framework_id = $1 ORDER BY display_order, id`,
      [submissions[0].framework_id]
    )
    const criteriaIds = criteria.map((item) => Number(item.id))
    const indicators = criteriaIds.length
      ? await query<Record<string, unknown>>(
          `SELECT i.id, i.criteria_id, i.question, i.weight, i.require_attachment, i.display_order,
                  sa.rubric_id, sa.score, sa.response, sa.attachment_name,
                  sa.attachment_type, sa.attachment_data
           FROM indicators i
           LEFT JOIN submission_answers sa ON sa.indicator_id = i.id AND sa.submission_id = $1
           WHERE i.criteria_id = ANY($2::bigint[])
           ORDER BY i.display_order, i.id`,
          [submissionId, criteriaIds]
        )
      : []
    const rubrics = criteriaIds.length
      ? await query<Record<string, unknown>>(
          `SELECT r.id, r.criteria_id, r.score, r.descriptor_id,
                  rd.name AS descriptor_name, r.performance_standard, r.display_order
           FROM rubrics r
           JOIN rubric_descriptors rd ON rd.id = r.descriptor_id
           WHERE r.criteria_id = ANY($1::bigint[])
           ORDER BY r.display_order, r.id`,
          [criteriaIds]
        )
      : []

    const resultCriteria = criteria.map((item) => ({
      ...item,
      indicators: indicators
        .filter((indicator) => Number(indicator.criteria_id) === Number(item.id))
        .map((indicator) => ({
          id: indicator.id,
          criteria_id: indicator.criteria_id,
          question: indicator.question,
          weight: indicator.weight,
          require_attachment: indicator.require_attachment,
          display_order: indicator.display_order,
          answer: indicator.rubric_id === null && indicator.score === null && !indicator.response && !indicator.attachment_name
            ? null
            : {
                indicator_id: indicator.id,
                rubric_id: indicator.rubric_id,
                score: indicator.score,
                response: indicator.response ?? "",
                attachment_name: indicator.attachment_name,
                attachment_type: indicator.attachment_type,
                attachment_data: indicator.attachment_data,
              },
        })),
      rubrics: rubrics.filter((rubric) => Number(rubric.criteria_id) === Number(item.id)),
    }))

    return NextResponse.json({ ...submissions[0], criteria: resultCriteria })
  } catch (error) {
    console.error("[GET /api/submissions/:id]", error)
    return NextResponse.json({ error: "Failed to load submission" }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const submissionId = Number(id)
  if (!Number.isInteger(submissionId)) {
    return NextResponse.json({ error: "Invalid submission" }, { status: 400 })
  }

  const client = await pool.connect()
  try {
    const body = await req.json() as { action?: "save" | "submit"; answers?: AnswerInput[] }
    const action = body.action === "submit" ? "submit" : "save"
    const answers = Array.isArray(body.answers) ? body.answers : []

    await client.query("BEGIN")
    const submissionResult = await client.query(
      `SELECT id, framework_id, status FROM submissions
       WHERE id = $1 AND erp_id = $2 FOR UPDATE`,
      [submissionId, dummyErpProfile.erp_id]
    )
    if (!submissionResult.rows.length) {
      await client.query("ROLLBACK")
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }
    if (submissionResult.rows[0].status === "SUBMITTED") {
      await client.query("ROLLBACK")
      return NextResponse.json({ error: "Submitted appraisals cannot be changed" }, { status: 409 })
    }

    const indicatorResult = await client.query(
      `SELECT i.id, i.criteria_id, i.require_attachment, c.total_weight
       FROM indicators i
       JOIN criteria c ON c.id = i.criteria_id
       WHERE c.framework_id = $1`,
      [submissionResult.rows[0].framework_id]
    )
    const rubricResult = await client.query(
      `SELECT r.id, r.criteria_id, r.score
       FROM rubrics r
       JOIN criteria c ON c.id = r.criteria_id
       WHERE c.framework_id = $1`,
      [submissionResult.rows[0].framework_id]
    )
    const indicatorMap = new Map(indicatorResult.rows.map((row) => [Number(row.id), row]))
    const rubricMap = new Map(rubricResult.rows.map((row) => [Number(row.id), row]))
    const normalized = new Map<number, AnswerInput>()

    for (const answer of answers) {
      const indicator = indicatorMap.get(Number(answer.indicator_id))
      if (!indicator) {
        await client.query("ROLLBACK")
        return NextResponse.json({ error: "An answer does not belong to this framework" }, { status: 400 })
      }
      const rubric = answer.rubric_id === null ? null : rubricMap.get(Number(answer.rubric_id))
      if (rubric && Number(rubric.criteria_id) !== Number(indicator.criteria_id)) {
        await client.query("ROLLBACK")
        return NextResponse.json({ error: "An invalid rubric was selected" }, { status: 400 })
      }
      if (answer.attachment_data && String(answer.attachment_data).length > 7_000_000) {
        await client.query("ROLLBACK")
        return NextResponse.json({ error: "An attachment exceeds the 5 MB limit" }, { status: 400 })
      }
      normalized.set(Number(answer.indicator_id), {
        indicator_id: Number(answer.indicator_id),
        rubric_id: rubric ? Number(rubric.id) : null,
        score: rubric ? Number(rubric.score) : null,
        response: String(answer.response ?? "").trim(),
        attachment_name: answer.attachment_name ? String(answer.attachment_name) : null,
        attachment_type: answer.attachment_type ? String(answer.attachment_type) : null,
        attachment_data: answer.attachment_data ? String(answer.attachment_data) : null,
      })
    }

    if (action === "submit") {
      const missing = indicatorResult.rows.filter((indicator) => {
        const answer = normalized.get(Number(indicator.id))
        return !answer?.rubric_id || (indicator.require_attachment && !answer.attachment_name)
      })
      if (missing.length) {
        await client.query("ROLLBACK")
        return NextResponse.json(
          { error: `Complete all ratings and required attachments (${missing.length} remaining)` },
          { status: 400 }
        )
      }
    }

    for (const answer of normalized.values()) {
      await client.query(
        `INSERT INTO submission_answers
           (submission_id, indicator_id, rubric_id, score, response, attachment_name, attachment_type, attachment_data)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (submission_id, indicator_id) DO UPDATE SET
           rubric_id = EXCLUDED.rubric_id,
           score = EXCLUDED.score,
           response = EXCLUDED.response,
           attachment_name = EXCLUDED.attachment_name,
           attachment_type = EXCLUDED.attachment_type,
           attachment_data = EXCLUDED.attachment_data`,
        [
          submissionId,
          answer.indicator_id,
          answer.rubric_id,
          answer.score,
          answer.response,
          answer.attachment_name,
          answer.attachment_type,
          answer.attachment_data,
        ]
      )
    }

    const answeredCount = [...normalized.values()].filter((answer) => answer.score !== null).length
    const totalIndicators = indicatorResult.rows.length
    const progress = totalIndicators ? Math.round((answeredCount / totalIndicators) * 100) : 0
    let totalScore: number | null = null

    if (action === "submit") {
      const criteriaIds = [...new Set(indicatorResult.rows.map((row) => Number(row.criteria_id)))]
      let earnedWeight = 0
      let totalWeight = 0
      for (const criteriaId of criteriaIds) {
        const criteriaIndicators = indicatorResult.rows.filter((row) => Number(row.criteria_id) === criteriaId)
        const scores = criteriaIndicators.map((row) => normalized.get(Number(row.id))?.score ?? 0)
        const maxScore = Math.max(
          1,
          ...rubricResult.rows.filter((row) => Number(row.criteria_id) === criteriaId).map((row) => Number(row.score))
        )
        const weight = Number(criteriaIndicators[0]?.total_weight ?? 0)
        const average = scores.reduce((sum, score) => sum + score, 0) / Math.max(scores.length, 1)
        earnedWeight += (average / maxScore) * weight
        totalWeight += weight
      }
      totalScore = totalWeight > 0 ? (earnedWeight / totalWeight) * 100 : 0
    }

    await client.query(
      `UPDATE submissions SET status = $2, progress = $3, total_score = $4,
              submitted_at = CASE WHEN $2 = 'SUBMITTED' THEN CURRENT_TIMESTAMP ELSE NULL END
       WHERE id = $1`,
      [submissionId, action === "submit" ? "SUBMITTED" : "DRAFT", progress, totalScore]
    )
    await client.query("COMMIT")

    return NextResponse.json({ success: true, status: action === "submit" ? "SUBMITTED" : "DRAFT", progress, total_score: totalScore })
  } catch (error) {
    await client.query("ROLLBACK")
    console.error("[PATCH /api/submissions/:id]", error)
    return NextResponse.json({ error: "Failed to save submission" }, { status: 500 })
  } finally {
    client.release()
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const submissionId = Number(id)
  if (!Number.isInteger(submissionId)) {
    return NextResponse.json({ error: "Invalid submission" }, { status: 400 })
  }

  try {
    const rows = await query<{ id: number }>(
      "DELETE FROM submissions WHERE id = $1 AND erp_id = $2 AND status = 'DRAFT' RETURNING id",
      [submissionId, dummyErpProfile.erp_id]
    )
    if (!rows.length) {
      return NextResponse.json({ error: "Only draft submissions can be deleted" }, { status: 409 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[DELETE /api/submissions/:id]", error)
    return NextResponse.json({ error: "Failed to delete draft" }, { status: 500 })
  }
}
