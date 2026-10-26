import pool from "@/lib/db"
import type { CreateFrameworkInput, CriteriaInput } from "@/schemas/framework"
import { ConflictError, NotFoundError } from "@/server/http/errors"
import {
  criteriaBelongsToFramework,
  criteriaHasAnswers,
  deleteCriteriaChildren,
  insertAssignment,
  insertCriteria,
  insertEvidence,
  insertFramework,
  insertIndicator,
  insertQuantification,
  insertRubric,
  listPublished,
  nextCriteriaOrder,
  updateCriteriaHeader,
} from "@/server/repos/frameworks.repo"

/**
 * Creates a framework with its criteria, indicators, rubrics,
 * quantification, evidence and assignments in a single transaction.
 * Any failure rolls the whole thing back — no half-built frameworks.
 */
export async function create(input: CreateFrameworkInput, createdBy: number) {
  const client = await pool.connect()
  try {
    await client.query("BEGIN")

    const frameworkId = await insertFramework(client, input.header, createdBy)

    for (let ci = 0; ci < input.criterias.length; ci++) {
      const criteriaId = await insertCriteria(client, frameworkId, input.criterias[ci], ci)
      await insertChildren(client, criteriaId, input.criterias[ci])
    }

    if (input.assignment) {
      await insertAssignment(client, frameworkId, input.assignment)
    }

    await client.query("COMMIT")
    return { id: frameworkId }
  } catch (err) {
    await client.query("ROLLBACK")
    throw err
  } finally {
    client.release()
  }
}

/** Insert a single criterion (with children) into an existing framework. */
export async function addCriteria(frameworkId: number, input: CriteriaInput) {
  const client = await pool.connect()
  try {
    await client.query("BEGIN")
    const order = await nextCriteriaOrder(client, frameworkId)
    const criteriaId = await insertCriteria(client, frameworkId, input, order)
    await insertChildren(client, criteriaId, input)
    await client.query("COMMIT")
    return { id: criteriaId }
  } catch (err) {
    await client.query("ROLLBACK")
    throw err
  } finally {
    client.release()
  }
}

/**
 * Replace a criterion's fields and all child rows in one transaction.
 *
 * Refused (409) once any submission answer references this criterion —
 * indicators/rubrics are ON DELETE RESTRICT, and silently re-creating them
 * would rewrite history on submitted appraisals. Version the framework
 * instead.
 */
export async function updateCriteria(
  frameworkId: number,
  criteriaId: number,
  input: CriteriaInput
) {
  const client = await pool.connect()
  try {
    await client.query("BEGIN")
    if (!(await criteriaBelongsToFramework(client, frameworkId, criteriaId))) {
      throw new NotFoundError("Criteria not found")
    }
    if (await criteriaHasAnswers(client, criteriaId)) {
      throw new ConflictError(
        "This criterion has submissions. Editing it would rewrite appraisal history — publish a new framework version instead."
      )
    }
    await updateCriteriaHeader(client, criteriaId, input)
    await deleteCriteriaChildren(client, criteriaId)
    await insertChildren(client, criteriaId, input)
    await client.query("COMMIT")
    return { id: criteriaId }
  } catch (err) {
    await client.query("ROLLBACK")
    throw err
  } finally {
    client.release()
  }
}

async function insertChildren(
  client: import("@/lib/db").DbHandle,
  criteriaId: number,
  c: CriteriaInput
) {
  for (let ii = 0; ii < c.indicators.length; ii++) {
    await insertIndicator(client, criteriaId, c.indicators[ii], ii)
  }
  for (let ri = 0; ri < c.rubrics.length; ri++) {
    const r = c.rubrics[ri]
    if (!r.descriptor && !r.score) continue
    await insertRubric(client, criteriaId, r, ri)
  }
  await insertQuantification(client, criteriaId, c.quantification)
  for (const ev of c.evidence) {
    if (!ev.title?.trim()) continue
    await insertEvidence(client, criteriaId, ev)
  }
}

/**
 * All published frameworks for the faculty picker at /profile.
 * Assignments are admin-side organization data — faculty see
 * every published framework; the submission stores their SAP identity.
 */
export async function publishedForFaculty() {
  return listPublished()
}
