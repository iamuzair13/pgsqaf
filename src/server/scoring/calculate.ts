/**
 * Pure submission scoring — no DB, no side effects.
 *
 * Rules (unchanged from the original PATCH handler):
 *  - progress = % of indicators that have a non-null score.
 *  - per criterion: average of its indicator scores (unanswered = 0)
 *    normalised by the criterion's max rubric score, then multiplied by
 *    the criterion's total_weight.
 *  - total = earned weight / total weight, expressed as a percentage.
 */

export interface ScoringCriterion {
  id: number
  total_weight: number
}

export interface ScoringIndicator {
  id: number
  criteria_id: number
}

export interface ScoringRubric {
  id: number
  criteria_id: number
  score: number
}

export interface ScoringAnswer {
  indicator_id: number
  rubric_id: number | null
  score: number | null
}

export interface CriterionScore {
  criteria_id: number
  average: number
  max_score: number
  normalized: number // average / max_score
  weight: number
  earned: number // normalized * weight
}

export interface SubmissionScore {
  progress: number // 0–100
  perCriterion: CriterionScore[]
  total: number // 0–100 weighted percentage
}

export function calculateSubmission(input: {
  criteria: ScoringCriterion[]
  indicators: ScoringIndicator[]
  rubrics: ScoringRubric[]
  answers: ScoringAnswer[]
}): SubmissionScore {
  const { criteria, indicators, rubrics, answers } = input

  const answersByIndicator = new Map(
    answers.map((a) => [Number(a.indicator_id), a])
  )
  const rubricsByCriteria = new Map<number, ScoringRubric[]>()
  for (const r of rubrics) {
    const list = rubricsByCriteria.get(Number(r.criteria_id)) ?? []
    list.push(r)
    rubricsByCriteria.set(Number(r.criteria_id), list)
  }

  const answeredCount = indicators.filter(
    (i) => (answersByIndicator.get(Number(i.id))?.score ?? null) !== null
  ).length
  const progress = indicators.length
    ? Math.round((answeredCount / indicators.length) * 100)
    : 0

  const perCriterion: CriterionScore[] = []
  let earnedWeight = 0
  let totalWeight = 0

  for (const c of criteria) {
    const cid = Number(c.id)
    const criterionIndicators = indicators.filter(
      (i) => Number(i.criteria_id) === cid
    )
    const criterionRubrics = rubricsByCriteria.get(cid) ?? []

    const maxScore = Math.max(1, ...criterionRubrics.map((r) => Number(r.score)))
    const weight = Number(c.total_weight) || 0

    const scores = criterionIndicators.map(
      (i) => answersByIndicator.get(Number(i.id))?.score ?? 0
    )
    const average =
      scores.reduce((sum, s) => sum + s, 0) / Math.max(scores.length, 1)

    const normalized = average / maxScore
    const earned = normalized * weight

    perCriterion.push({
      criteria_id: cid,
      average,
      max_score: maxScore,
      normalized,
      weight,
      earned,
    })

    earnedWeight += earned
    totalWeight += weight
  }

  const total = totalWeight > 0 ? (earnedWeight / totalWeight) * 100 : 0

  return { progress, perCriterion, total }
}
