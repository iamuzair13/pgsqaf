/**
 * Live score estimate shown while the applicant answers.
 *
 * This calls the SAME pure scoring function the server uses — the
 * estimate can never drift from what the server computes on submit.
 * The server's `total_score` is still authoritative; this is feedback only.
 */
import { calculateSubmission } from "@/server/scoring/calculate"
import type { Rubric, SubmissionAnswer, SubmissionCriteria } from "@/types"

export interface DraftAnswers {
  [indicatorId: number]: SubmissionAnswer
}

/** Estimate total_score for the current draft. Returns null when nothing scored. */
export function estimateScore(criteria: SubmissionCriteria[], answers: DraftAnswers): number | null {
  const scored = Object.values(answers).filter((a) => a.score !== null)
  if (!scored.length) return null

  const result = calculateSubmission({
    criteria: criteria.map((c) => ({ id: c.id, total_weight: Number(c.total_weight) })),
    indicators: criteria.flatMap((c) =>
      c.indicators.map((i) => ({ id: i.id, criteria_id: c.id }))
    ),
    rubrics: criteria.flatMap((c) =>
      c.rubrics.map((r) => ({ id: r.id, criteria_id: c.id, score: r.score }))
    ),
    answers: Object.values(answers).map((a) => ({
      indicator_id: a.indicator_id,
      rubric_id: a.rubric_id,
      score: a.score,
    })),
  })
  return result.total
}

/** Per-criterion scores for the result screen breakdown. */
export function breakdown(criteria: SubmissionCriteria[], answers: DraftAnswers) {
  return calculateSubmission({
    criteria: criteria.map((c) => ({ id: c.id, total_weight: Number(c.total_weight) })),
    indicators: criteria.flatMap((c) =>
      c.indicators.map((i) => ({ id: i.id, criteria_id: c.id }))
    ),
    rubrics: criteria.flatMap((c) =>
      c.rubrics.map((r) => ({ id: r.id, criteria_id: c.id, score: r.score }))
    ),
    answers: Object.values(answers).map((a) => ({
      indicator_id: a.indicator_id,
      rubric_id: a.rubric_id,
      score: a.score,
    })),
  }).perCriterion
}

/** Fraction of indicators the applicant has scored (0–1). */
export function answeredFraction(criteria: SubmissionCriteria[], answers: DraftAnswers) {
  const indicators = criteria.flatMap((c) => c.indicators)
  if (!indicators.length) return 0
  const answered = indicators.filter((i) => answers[i.id]?.rubric_id !== null && answers[i.id]?.rubric_id !== undefined).length
  return answered / indicators.length
}

/** Indicators still incomplete — drives both the Submit blocker and the review checklist. */
export function missingIndicators(criteria: SubmissionCriteria[], answers: DraftAnswers) {
  return criteria.flatMap((c) =>
    c.indicators.filter((i) => {
      const a = answers[i.id]
      const unscored = !a?.rubric_id
      const noAttachment = i.require_attachment && !a?.attachment_name
      return unscored || noAttachment
    })
  )
}

/* ------------------------------ level colors ----------------------------- */

const LEVEL_VAR: Record<string, string> = {
  outstanding: "--lvl-outstanding",
  excellent: "--lvl-excellent",
  good: "--lvl-good",
  average: "--lvl-average",
  poor: "--lvl-poor",
  unsatisfactory: "--lvl-unsatisfactory",
}

/** CSS var token for a rubric descriptor name ("Outstanding" → var(--lvl-outstanding)). */
export function levelVar(descriptorName: string | null | undefined): string {
  const key = (descriptorName ?? "").toLowerCase()
  return `var(${LEVEL_VAR[key] ?? "--muted-foreground"})`
}

/** Fallback when descriptors aren't available: score/maxScore → level var. */
export function levelVarForScore(rubric: Pick<Rubric, "score">, maxScore: number): string {
  if (!maxScore || rubric.score >= maxScore) return "var(--lvl-outstanding)"
  const fraction = rubric.score / maxScore
  if (fraction >= 0.75) return "var(--lvl-excellent)"
  if (fraction >= 0.6) return "var(--lvl-good)"
  if (fraction >= 0.45) return "var(--lvl-average)"
  if (fraction >= 0.3) return "var(--lvl-poor)"
  return "var(--lvl-unsatisfactory)"
}

/** Band a 0–100 score into a level color (used by ScoreRing when descriptors aren't in context). */
export function levelVarForTotal(score: number | null): string {
  if (score === null) return "var(--muted-foreground)"
  if (score >= 90) return "var(--lvl-outstanding)"
  if (score >= 75) return "var(--lvl-excellent)"
  if (score >= 60) return "var(--lvl-good)"
  if (score >= 45) return "var(--lvl-average)"
  if (score >= 30) return "var(--lvl-poor)"
  return "var(--lvl-unsatisfactory)"
}
