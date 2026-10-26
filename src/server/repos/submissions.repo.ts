import { query, type DbHandle } from "@/lib/db"
import type { AnswerInput } from "@/schemas/submission"

async function rows<T>(db: DbHandle, text: string, params?: unknown[]): Promise<T[]> {
  const r = await db.query(text, params)
  return r.rows as T[]
}

export function findPublishedFramework(frameworkId: number) {
  return query<{ id: number }>(
    "SELECT id FROM frameworks WHERE id = $1 AND status = 'PUBLISHED' LIMIT 1",
    [frameworkId]
  )
}

export function findDraftSubmission(erpId: string, frameworkId: number) {
  return query<{ id: number }>(
    `SELECT id FROM submissions
     WHERE erp_id = $1 AND framework_id = $2 AND status = 'DRAFT'
     ORDER BY updated_at DESC LIMIT 1`,
    [erpId, frameworkId]
  )
}

export function createSubmission(input: {
  erp_id: string
  applicant_name: string
  applicant_email: string
  registration_no: string
  faculty: string
  department: string
  program: string
  framework_id: number
}) {
  return query<{ id: number }>(
    `INSERT INTO submissions
       (erp_id, applicant_name, applicant_email, registration_no, faculty, department, program, framework_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id`,
    [
      input.erp_id,
      input.applicant_name,
      input.applicant_email,
      input.registration_no,
      input.faculty,
      input.department,
      input.program,
      input.framework_id,
    ]
  )
}

export function getSubmissionSummary(submissionId: number, erpId: string) {
  return query<Record<string, unknown>>(
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
    [submissionId, erpId]
  )
}

export function listCriteriaForFramework(frameworkId: number) {
  return query<Record<string, unknown>>(
    `SELECT id, framework_id, title, domain, measure, total_weight, display_order
     FROM criteria WHERE framework_id = $1 ORDER BY display_order, id`,
    [frameworkId]
  )
}

export function listIndicatorsWithAnswers(submissionId: number, criteriaIds: number[]) {
  return query<Record<string, unknown>>(
    `SELECT i.id, i.criteria_id, i.question, i.weight, i.require_attachment, i.display_order,
            sa.rubric_id, sa.score, sa.response, sa.attachment_name,
            sa.attachment_type, sa.attachment_data
     FROM indicators i
     LEFT JOIN submission_answers sa ON sa.indicator_id = i.id AND sa.submission_id = $1
     WHERE i.criteria_id = ANY($2::bigint[])
     ORDER BY i.display_order, i.id`,
    [submissionId, criteriaIds]
  )
}

export function listRubricsForCriteria(criteriaIds: number[]) {
  return query<Record<string, unknown>>(
    `SELECT r.id, r.criteria_id, r.score, r.descriptor_id,
            rd.name AS descriptor_name, r.performance_standard, r.display_order
     FROM rubrics r
     JOIN rubric_descriptors rd ON rd.id = r.descriptor_id
     WHERE r.criteria_id = ANY($1::bigint[])
     ORDER BY r.display_order, r.id`,
    [criteriaIds]
  )
}

export function getSubmissionForUpdate(db: DbHandle, submissionId: number, erpId: string) {
  return rows<{ id: number; framework_id: number; status: string }>(
    db,
    `SELECT id, framework_id, status FROM submissions
     WHERE id = $1 AND erp_id = $2 FOR UPDATE`,
    [submissionId, erpId]
  )
}

export function listIndicatorsForFramework(
  db: DbHandle,
  frameworkId: number
) {
  return rows<{ id: number; criteria_id: number; require_attachment: boolean; total_weight: number }>(
    db,
    `SELECT i.id, i.criteria_id, i.require_attachment, c.total_weight
     FROM indicators i
     JOIN criteria c ON c.id = i.criteria_id
     WHERE c.framework_id = $1`,
    [frameworkId]
  )
}

export function listRubricsForFramework(
  db: DbHandle,
  frameworkId: number
) {
  return rows<{ id: number; criteria_id: number; score: number }>(
    db,
    `SELECT r.id, r.criteria_id, r.score
     FROM rubrics r
     JOIN criteria c ON c.id = r.criteria_id
     WHERE c.framework_id = $1`,
    [frameworkId]
  )
}

export function upsertAnswer(db: DbHandle, submissionId: number, answer: AnswerInput) {
  return db.query(
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
      answer.rubric_id ?? null,
      answer.score ?? null,
      answer.response,
      answer.attachment_name ?? null,
      answer.attachment_type ?? null,
      answer.attachment_data ?? null,
    ]
  )
}

export function listAnswers(db: DbHandle, submissionId: number) {
  return rows<{
    indicator_id: number
    rubric_id: number | null
    score: number | null
    attachment_name: string | null
  }>(
    db,
    `SELECT indicator_id, rubric_id, score, attachment_name
     FROM submission_answers WHERE submission_id = $1`,
    [submissionId]
  )
}

export function updateSubmissionResult(
  db: DbHandle,
  submissionId: number,
  status: "DRAFT" | "SUBMITTED",
  progress: number,
  totalScore: number | null
) {
  return db.query(
    `UPDATE submissions SET status = $2, progress = $3, total_score = $4,
            submitted_at = CASE WHEN $2 = 'SUBMITTED'::submission_status
                                THEN CURRENT_TIMESTAMP ELSE NULL END
     WHERE id = $1`,
    [submissionId, status, progress, totalScore]
  )
}

export async function deleteDraftSubmission(submissionId: number, erpId: string) {
  const r = await query<{ id: number }>(
    "DELETE FROM submissions WHERE id = $1 AND erp_id = $2 AND status = 'DRAFT' RETURNING id",
    [submissionId, erpId]
  )
  return r.length > 0
}
