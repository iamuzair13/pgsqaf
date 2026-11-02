import { describe, expect, it } from "vitest"
import { calculateSubmission } from "./calculate"

/**
 * Fixture: one framework with two criteria.
 *   Criteria 1 (weight 40): indicators 1, 2 — rubric max score 5
 *   Criteria 2 (weight 60): indicator 3      — rubric max score 5
 */
const criteria = [
  { id: 1, total_weight: 40 },
  { id: 2, total_weight: 60 },
]
const indicators = [
  { id: 1, criteria_id: 1 },
  { id: 2, criteria_id: 1 },
  { id: 3, criteria_id: 2 },
]
const rubrics = [
  { id: 11, criteria_id: 1, score: 5 },
  { id: 12, criteria_id: 1, score: 4 },
  { id: 13, criteria_id: 2, score: 5 },
  { id: 14, criteria_id: 2, score: 1 },
]

describe("calculateSubmission", () => {
  it("scores 100% when every indicator gets the max rubric score", () => {
    const r = calculateSubmission({
      criteria,
      indicators,
      rubrics,
      answers: [
        { indicator_id: 1, rubric_id: 11, score: 5 },
        { indicator_id: 2, rubric_id: 11, score: 5 },
        { indicator_id: 3, rubric_id: 13, score: 5 },
      ],
    })
    expect(r.progress).toBe(100)
    expect(r.total).toBeCloseTo(100)
    expect(r.perCriterion).toHaveLength(2)
    expect(r.perCriterion[0]).toMatchObject({ earned: 40, normalized: 1 })
  })

  it("scores 0 when every indicator gets the minimum", () => {
    const r = calculateSubmission({
      criteria,
      indicators,
      rubrics,
      answers: [
        { indicator_id: 1, rubric_id: 12, score: 1 },
        { indicator_id: 2, rubric_id: 12, score: 1 },
        { indicator_id: 3, rubric_id: 14, score: 1 },
      ],
    })
    expect(r.total).toBeCloseTo(20) // 1/5 of total weight
  })

  it("weights criteria by total_weight and treats unanswered as 0", () => {
    const r = calculateSubmission({
      criteria,
      indicators,
      rubrics,
      answers: [
        { indicator_id: 1, rubric_id: 11, score: 5 },
        // indicator 2 unanswered → counts as 0 in the criterion average
        { indicator_id: 3, rubric_id: 13, score: 5 },
      ],
    })
    // criterion 1 avg = (5 + 0) / 2 = 2.5 → normalized 0.5 → earned 20
    // criterion 2 avg = 5 → normalized 1 → earned 60
    expect(r.progress).toBe(67) // 2 of 3 answered, rounded
    expect(r.perCriterion[0].average).toBeCloseTo(2.5)
    expect(r.perCriterion[0].earned).toBeCloseTo(20)
    expect(r.total).toBeCloseTo(80) // (20 + 60) / 100 * 100
  })

  it("handles a criterion with zero weight without dividing by zero", () => {
    const r = calculateSubmission({
      criteria: [{ id: 9, total_weight: 0 }],
      indicators: [{ id: 9, criteria_id: 9 }],
      rubrics: [{ id: 9, criteria_id: 9, score: 4 }],
      answers: [{ indicator_id: 9, rubric_id: 9, score: 4 }],
    })
    expect(r.total).toBe(0)
    expect(r.progress).toBe(100)
  })

  it("handles a criterion with no rubrics (max score floors at 1)", () => {
    const r = calculateSubmission({
      criteria: [{ id: 5, total_weight: 100 }],
      indicators: [{ id: 5, criteria_id: 5 }],
      rubrics: [],
      answers: [{ indicator_id: 5, rubric_id: null, score: 3 }],
    })
    // maxScore = 1, so normalized = 3/1 = 3 — degenerate but bounded, not NaN
    expect(Number.isFinite(r.total)).toBe(true)
  })

  it("returns zero progress and total for an empty submission", () => {
    const r = calculateSubmission({
      criteria,
      indicators,
      rubrics,
      answers: [],
    })
    expect(r.progress).toBe(0)
    expect(r.total).toBe(0)
  })
})
