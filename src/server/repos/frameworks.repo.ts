import { query, type DbHandle } from "@/lib/db"
import type { CriteriaInput } from "@/schemas/framework"

async function rows<T>(db: DbHandle, text: string, params?: unknown[]): Promise<T[]> {
  const r = await db.query(text, params)
  return r.rows as T[]
}

export interface FrameworkRow {
  id: number
  title: string
  description: string | null
  status: string
  version: string
  created_by: number
  created_by_name: string | null
  created_at: string
  updated_at: string
  criteria_count: number
}

export function listFrameworks() {
  return query<FrameworkRow>(
    `SELECT f.id, f.title, f.description, f.status, f.version,
            f.created_by, u.name AS created_by_name,
            f.created_at, f.updated_at,
            COUNT(c.id)::int AS criteria_count
     FROM frameworks f
     LEFT JOIN users    u ON u.id = f.created_by
     LEFT JOIN criteria c ON c.framework_id = f.id
     GROUP BY f.id, u.name
     ORDER BY f.created_at DESC`
  )
}

export async function getFrameworkById(id: number) {
  const rows = await query<FrameworkRow>(
    `SELECT f.id, f.title, f.description, f.status, f.version,
            f.created_by, u.name AS created_by_name,
            f.created_at, f.updated_at,
            COUNT(c.id)::int AS criteria_count
     FROM frameworks f
     LEFT JOIN users    u ON u.id = f.created_by
     LEFT JOIN criteria c ON c.framework_id = f.id
     WHERE f.id = $1
     GROUP BY f.id, u.name`,
    [id]
  )
  return rows[0] ?? null
}

export async function deleteFrameworkById(id: number) {
  const rows = await query<{ id: number }>(
    "DELETE FROM frameworks WHERE id = $1 RETURNING id",
    [id]
  )
  return rows.length > 0
}

export interface PublishedFrameworkRow {
  id: number
  title: string
  description: string | null
  version: string
  criteria_count: number
  indicator_count: number
  updated_at: string
}

/**
 * Every published framework — shown to all faculty at /profile.
 * Framework assignments are an admin-side organization concern;
 * they do not gate faculty visibility.
 */
export function listPublished() {
  return query<PublishedFrameworkRow>(
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
}

export function listCriteria(frameworkId: number) {
  return query(
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
}

export async function getCriteriaBundle(frameworkId: number, criteriaId: number) {
  const criteria = await query(
    `SELECT c.id, c.framework_id, c.title, c.domain, c.measure,
            c.total_weight, c.display_order
     FROM criteria c
     WHERE c.id = $1 AND c.framework_id = $2`,
    [criteriaId, frameworkId]
  )
  if (!criteria.length) return null

  const [indicators, rubrics, quantification, evidence] = await Promise.all([
    query(
      `SELECT i.id, i.criteria_id, i.question, i.weight, i.require_attachment, i.display_order
       FROM indicators i
       WHERE i.criteria_id = $1
       ORDER BY i.display_order ASC`,
      [criteriaId]
    ),
    query(
      `SELECT r.id, r.criteria_id, r.score, r.descriptor_id, r.performance_standard, r.display_order,
              rd.name AS descriptor_name
       FROM rubrics r
       JOIN rubric_descriptors rd ON rd.id = r.descriptor_id
       WHERE r.criteria_id = $1
       ORDER BY r.display_order ASC`,
      [criteriaId]
    ),
    query(
      `SELECT q.id, q.criteria_id, q.assigned_score, q.weight_factor, q.weighted_score
       FROM criteria_quantification q
       WHERE q.criteria_id = $1`,
      [criteriaId]
    ),
    query(
      `SELECT e.id, e.criteria_id, e.title, e.description, e.require_attachment, e.file_path
       FROM evidence e
       WHERE e.criteria_id = $1
       ORDER BY e.id ASC`,
      [criteriaId]
    ),
  ])

  return {
    ...criteria[0],
    indicators,
    rubrics,
    quantification: quantification[0] ?? null,
    evidence,
  }
}

/* ------------------------- criteria writes ------------------------- */

export function criteriaBelongsToFramework(db: DbHandle, frameworkId: number, criteriaId: number) {
  return rows<{ id: number }>(
    db,
    `SELECT id FROM criteria WHERE id = $1 AND framework_id = $2`,
    [criteriaId, frameworkId]
  ).then((r) => r.length > 0)
}

/**
 * True when any submission answer references this criterion's
 * indicators or rubrics — those rows are ON DELETE RESTRICT and
 * replacing children would destroy historical appraisal data.
 */
export function criteriaHasAnswers(db: DbHandle, criteriaId: number) {
  return rows<{ has: boolean }>(
    db,
    `SELECT EXISTS(
       SELECT 1 FROM submission_answers sa
       JOIN indicators i ON i.id = sa.indicator_id
       WHERE i.criteria_id = $1
     ) AS has`,
    [criteriaId]
  ).then((r) => r[0]?.has ?? false)
}

export function updateCriteriaHeader(db: DbHandle, criteriaId: number, c: CriteriaInput) {
  const totalWeight = c.indicators.reduce((s, i) => s + (isNaN(i.weight) ? 0 : i.weight), 0)
  return db.query(
    `UPDATE criteria SET title = $1, domain = $2, measure = $3, total_weight = $4
     WHERE id = $5`,
    [c.title, c.domain, c.measure, totalWeight.toFixed(2), criteriaId]
  )
}

export function deleteCriteriaChildren(db: DbHandle, criteriaId: number) {
  return Promise.all([
    db.query(`DELETE FROM indicators WHERE criteria_id = $1`, [criteriaId]),
    db.query(`DELETE FROM rubrics WHERE criteria_id = $1`, [criteriaId]),
    db.query(`DELETE FROM criteria_quantification WHERE criteria_id = $1`, [criteriaId]),
    db.query(`DELETE FROM evidence WHERE criteria_id = $1`, [criteriaId]),
  ])
}

export function nextCriteriaOrder(db: DbHandle, frameworkId: number) {
  return rows<{ next: number }>(
    db,
    `SELECT COALESCE(MAX(display_order), -1) + 1 AS next FROM criteria WHERE framework_id = $1`,
    [frameworkId]
  ).then((r) => r[0]?.next ?? 0)
}

/* ------------------------- transactional inserts ------------------------- */

export async function insertFramework(
  db: DbHandle,
  header: { title: string; description?: string; status: string; version: string },
  createdBy: number
): Promise<number> {
  const r = await rows<{ id: number }>(
    db,
    `INSERT INTO frameworks (title, description, status, version, created_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [header.title, header.description || null, header.status, header.version, createdBy]
  )
  return r[0].id
}

export async function insertCriteria(
  db: DbHandle,
  frameworkId: number,
  c: CriteriaInput,
  displayOrder: number
): Promise<number> {
  const totalWeight = c.indicators.reduce(
    (sum, ind) => sum + (isNaN(ind.weight) ? 0 : ind.weight),
    0
  )
  const r = await rows<{ id: number }>(
    db,
    `INSERT INTO criteria (framework_id, title, domain, measure, total_weight, display_order)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [frameworkId, c.title, c.domain, c.measure, totalWeight.toFixed(2), displayOrder]
  )
  return r[0].id
}

export async function insertIndicator(
  db: DbHandle,
  criteriaId: number,
  ind: CriteriaInput["indicators"][number],
  displayOrder: number
) {
  await db.query(
    `INSERT INTO indicators (criteria_id, question, weight, require_attachment, display_order)
     VALUES ($1, $2, $3, $4, $5)`,
    [criteriaId, ind.question, isNaN(ind.weight) ? 0 : ind.weight, ind.requireAttachment, displayOrder]
  )
}

export async function insertRubric(
  db: DbHandle,
  criteriaId: number,
  rubric: CriteriaInput["rubrics"][number],
  displayOrder: number
) {
  const desc = await rows<{ id: number }>(
    db,
    `SELECT id FROM rubric_descriptors WHERE name = $1 LIMIT 1`,
    [rubric.descriptor || "Good"]
  )
  const descriptorId = desc[0]?.id ?? 3 // fallback: "Good"
  await db.query(
    `INSERT INTO rubrics (criteria_id, score, descriptor_id, performance_standard, display_order)
     VALUES ($1, $2, $3, $4, $5)`,
    [criteriaId, rubric.score, descriptorId, rubric.performanceStandard, displayOrder]
  )
}

export async function insertQuantification(
  db: DbHandle,
  criteriaId: number,
  q: CriteriaInput["quantification"]
) {
  await db.query(
    `INSERT INTO criteria_quantification
       (criteria_id, assigned_score, weight_factor, weighted_score)
     VALUES ($1, $2, $3, $4)`,
    [criteriaId, q.assignedScore, q.weightFactor, (q.assignedScore * q.weightFactor).toFixed(3)]
  )
}

export async function insertEvidence(
  db: DbHandle,
  criteriaId: number,
  ev: CriteriaInput["evidence"][number]
) {
  await db.query(
    `INSERT INTO evidence (criteria_id, title, description, require_attachment)
     VALUES ($1, $2, $3, $4)`,
    [criteriaId, ev.title.trim(), ev.description?.trim() || null, ev.requireAttachment]
  )
}

export async function insertAssignment(
  db: DbHandle,
  frameworkId: number,
  assignment: NonNullable<import("@/schemas/framework").CreateFrameworkInput["assignment"]>
) {
  const { scope } = assignment
  if (scope === "ORGANIZATION") {
    await db.query(
      `INSERT INTO framework_assignments (framework_id, scope_type) VALUES ($1, 'ORGANIZATION')`,
      [frameworkId]
    )
    return
  }
  const [column, ids] =
    scope === "FACULTY"
      ? (["faculty_id", assignment.facultyIds] as const)
      : scope === "DEPARTMENT"
        ? (["department_id", assignment.departmentIds] as const)
        : (["program_id", assignment.programIds] as const)

  for (const targetId of ids) {
    await db.query(
      `INSERT INTO framework_assignments (framework_id, scope_type, ${column})
       VALUES ($1, $2, $3)`,
      [frameworkId, scope, targetId]
    )
  }
}
