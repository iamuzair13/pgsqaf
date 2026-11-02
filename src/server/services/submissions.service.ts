import pool from "@/lib/db"
import { fetchSapEmployee } from "@/lib/sap"
import type { PatchSubmissionInput } from "@/schemas/submission"
import { calculateSubmission } from "@/server/scoring/calculate"
import {
  ConflictError,
  BadRequestError,
  NotFoundError,
} from "@/server/http/errors"
import * as repo from "@/server/repos/submissions.repo"

const MAX_ATTACHMENT_BYTES = 7_000_000 // ~5 MB base64

type IndicatorRow = { id: number; criteria_id: number; require_attachment: boolean; total_weight: number }
type RubricRow = { id: number; criteria_id: number; score: number }
type AnswerRow = { indicator_id: number; rubric_id: number | null; score: number | null }

function scoreRows(indicators: IndicatorRow[], rubrics: RubricRow[], answers: AnswerRow[]) {
  const criteriaMap = new Map<number, number>()
  for (const i of indicators) criteriaMap.set(Number(i.criteria_id), Number(i.total_weight))
  return calculateSubmission({
    criteria: [...criteriaMap.entries()].map(([id, w]) => ({ id, total_weight: w })),
    indicators: indicators.map((i) => ({ id: Number(i.id), criteria_id: Number(i.criteria_id) })),
    rubrics: rubrics.map((r) => ({ id: Number(r.id), criteria_id: Number(r.criteria_id), score: Number(r.score) })),
    answers: answers.map((a) => ({
      indicator_id: Number(a.indicator_id),
      rubric_id: a.rubric_id === null ? null : Number(a.rubric_id),
      score: a.score === null ? null : Number(a.score),
    })),
  })
}

export async function start(email: string, frameworkId: number, fallbackName: string) {
  const framework = await repo.findPublishedFramework(frameworkId)
  if (!framework.length) {
    throw new NotFoundError("Published framework not found")
  }

  const erpId = email.toLowerCase()

  const existing = await repo.findDraftSubmission(erpId, frameworkId)
  if (existing.length) {
    return { id: existing[0].id, existing: true }
  }

  const employee = await fetchSapEmployee(email)
  if (!employee) {
    throw new NotFoundError("Employee record not found")
  }

  // The submissions row is the applicant's only DB identity — users stores
  // admins only, so we snapshot the SAP record here at creation time.
  const created = await repo.createSubmission({
    erp_id: erpId,
    applicant_name: employee.name !== "Unknown" ? employee.name : fallbackName,
    applicant_email: employee.email,
    registration_no: employee.empId ?? erpId,
    faculty: employee.faculty ?? "",
    department: employee.department ?? "",
    program: employee.designation ?? "",
    framework_id: frameworkId,
  })
  return { id: created[0].id }
}

export async function getDetail(submissionId: number, email: string) {
  const submissions = await repo.getSubmissionSummary(submissionId, email.toLowerCase())
  if (!submissions.length) {
    throw new NotFoundError("Submission not found")
  }

  const frameworkId = Number(submissions[0].framework_id)
  const criteria = await repo.listCriteriaForFramework(frameworkId)
  const criteriaIds = criteria.map((c) => Number(c.id))

  const [indicators, rubrics] = criteriaIds.length
    ? await Promise.all([
        repo.listIndicatorsWithAnswers(submissionId, criteriaIds),
        repo.listRubricsForCriteria(criteriaIds),
      ])
    : [[], []]

  const resultCriteria = criteria.map((item) => ({
    ...item,
    indicators: indicators
      .filter((ind) => Number(ind.criteria_id) === Number(item.id))
      .map((ind) => ({
        id: ind.id,
        criteria_id: ind.criteria_id,
        question: ind.question,
        weight: ind.weight,
        require_attachment: ind.require_attachment,
        display_order: ind.display_order,
        answer:
          ind.rubric_id === null && ind.score === null && !ind.response && !ind.attachment_name
            ? null
            : {
                indicator_id: ind.id,
                rubric_id: ind.rubric_id,
                score: ind.score,
                response: ind.response ?? "",
                attachment_name: ind.attachment_name,
                attachment_type: ind.attachment_type,
                attachment_data: ind.attachment_data,
              },
      })),
    rubrics: rubrics.filter((r) => Number(r.criteria_id) === Number(item.id)),
  }))

  return { ...submissions[0], criteria: resultCriteria }
}

export async function save(submissionId: number, email: string, input: PatchSubmissionInput) {
  const client = await pool.connect()
  try {
    await client.query("BEGIN")

    const submissionRows = await repo.getSubmissionForUpdate(client, submissionId, email.toLowerCase())
    if (!submissionRows.length) {
      throw new NotFoundError("Submission not found")
    }
    if (submissionRows[0].status === "SUBMITTED") {
      throw new ConflictError("Submitted appraisals cannot be changed")
    }

    const frameworkId = submissionRows[0].framework_id
    const [indicatorRows, rubricRows] = await Promise.all([
      repo.listIndicatorsForFramework(client, frameworkId),
      repo.listRubricsForFramework(client, frameworkId),
    ])

    const indicatorMap = new Map(indicatorRows.map((r) => [Number(r.id), r]))
    const rubricMap = new Map(rubricRows.map((r) => [Number(r.id), r]))
    const normalized = new Map<number, PatchSubmissionInput["answers"][number]>()

    for (const answer of input.answers) {
      const indicator = indicatorMap.get(Number(answer.indicator_id))
      if (!indicator) {
        throw new BadRequestError("An answer does not belong to this framework")
      }
      const rubricId = answer.rubric_id ?? null
      const rubric = rubricId === null ? null : rubricMap.get(Number(rubricId))
      if (rubric && Number(rubric.criteria_id) !== Number(indicator.criteria_id)) {
        throw new BadRequestError("An invalid rubric was selected")
      }
      if (answer.attachment_data && answer.attachment_data.length > MAX_ATTACHMENT_BYTES) {
        throw new BadRequestError("An attachment exceeds the 5 MB limit")
      }
      normalized.set(Number(answer.indicator_id), {
        ...answer,
        indicator_id: Number(answer.indicator_id),
        rubric_id: rubric ? Number(rubric.id) : null,
        score: rubric ? Number(rubric.score) : null,
        response: answer.response.trim(),
        attachment_name: answer.attachment_name ?? null,
        attachment_type: answer.attachment_type ?? null,
        attachment_data: answer.attachment_data ?? null,
      })
    }

    for (const answer of normalized.values()) {
      await repo.upsertAnswer(client, submissionId, answer)
    }

    // Score over the FULL stored answer set, so partial saves still produce
    // correct progress and submit-validation sees previously saved answers.
    const stored = await repo.listAnswers(client, submissionId)

    const scored = scoreRows(indicatorRows, rubricRows, stored)

    if (input.action === "submit") {
      const storedMap = new Map(stored.map((a) => [Number(a.indicator_id), a]))
      const missing = indicatorRows.filter((indicator) => {
        const answer = storedMap.get(Number(indicator.id))
        return !answer?.rubric_id || (indicator.require_attachment && !answer.attachment_name)
      })
      // Persist draft progress even when submit validation fails —
      // the applicant's work is never lost on a failed submit attempt.
      if (missing.length) {
        await repo.updateSubmissionResult(client, submissionId, "DRAFT", scored.progress, null)
        await client.query("COMMIT")
        throw new BadRequestError(
          `Complete all ratings and required attachments (${missing.length} remaining)`,
          { missing: missing.map((i) => Number(i.id)) }
        )
      }
      await repo.updateSubmissionResult(client, submissionId, "SUBMITTED", scored.progress, scored.total)
      await client.query("COMMIT")
      return { success: true, status: "SUBMITTED" as const, progress: scored.progress, total_score: scored.total }
    }

    await repo.updateSubmissionResult(client, submissionId, "DRAFT", scored.progress, null)
    await client.query("COMMIT")

    return { success: true, status: "DRAFT" as const, progress: scored.progress, total_score: null }
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {})
    throw err
  } finally {
    client.release()
  }
}

export async function remove(submissionId: number, email: string) {
  const deleted = await repo.deleteDraftSubmission(submissionId, email.toLowerCase())
  if (!deleted) {
    throw new ConflictError("Only draft submissions can be deleted")
  }
  return { success: true }
}
