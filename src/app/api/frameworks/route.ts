import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import pool from "@/lib/db"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { header, criterias, assignment } = body as {
      header: {
        title: string
        description: string
        version: string
        status: "DRAFT" | "PUBLISHED" | "ARCHIVED"
      }
      criterias: Array<{
        title: string
        domain: string
        measure: string
        indicators: Array<{ question: string; weight: string; requireAttachment: boolean }>
        rubrics: Array<{ score: string; descriptor: string; performanceStandard: string }>
        evidence: Array<{ title: string; description: string; requireAttachment: boolean }>
        quantification: { assignedScore: string; weightFactor: string }
      }>
      assignment?: {
        scope: "ORGANIZATION" | "FACULTY" | "DEPARTMENT" | "PROGRAM"
        facultyIds: number[]
        departmentIds: number[]
        programIds: number[]
      }
    }

    // Basic validation
    if (!header?.title || !header?.version || !criterias?.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Use a transaction so everything rolls back on failure
    const client = await pool.connect()
    try {
      await client.query("BEGIN")

      // 1. Insert framework (created_by = 1 until session is wired)
      const fwResult = await client.query(
        `INSERT INTO frameworks (title, description, status, version, created_by)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [header.title, header.description || null, header.status, header.version, 1]
      )
      const frameworkId: number = fwResult.rows[0].id

      for (let ci = 0; ci < criterias.length; ci++) {
        const c = criterias[ci]

        // Calculate total_weight from indicators
        const totalWeight = c.indicators.reduce((sum, ind) => {
          const w = parseFloat(ind.weight)
          return sum + (isNaN(w) ? 0 : w)
        }, 0)

        // 2. Insert criteria
        const cResult = await client.query(
          `INSERT INTO criteria (framework_id, title, domain, measure, total_weight, display_order)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id`,
          [frameworkId, c.title, c.domain, c.measure, totalWeight.toFixed(2), ci]
        )
        const criteriaId: number = cResult.rows[0].id

        // 3. Insert indicators
        for (let ii = 0; ii < c.indicators.length; ii++) {
          const ind = c.indicators[ii]
          await client.query(
            `INSERT INTO indicators (criteria_id, question, weight, require_attachment, display_order)
             VALUES ($1, $2, $3, $4, $5)`,
            [criteriaId, ind.question, parseFloat(ind.weight) || 0, ind.requireAttachment ?? false, ii]
          )
        }

        // 4. Insert rubrics (only rows that have a score or descriptor)
        for (let ri = 0; ri < c.rubrics.length; ri++) {
          const row = c.rubrics[ri]
          if (!row.descriptor && !row.score) continue

          // Resolve descriptor id
          const descRows = await client.query(
            `SELECT id FROM rubric_descriptors WHERE name = $1 LIMIT 1`,
            [row.descriptor || "Good"]
          )
          const descriptorId: number = descRows.rows[0]?.id ?? 3 // fallback: Good

          await client.query(
            `INSERT INTO rubrics (criteria_id, score, descriptor_id, performance_standard, display_order)
             VALUES ($1, $2, $3, $4, $5)`,
            [criteriaId, parseInt(row.score) || 0, descriptorId, row.performanceStandard || "", ri]
          )
        }

        // 5. Insert quantification
        const assignedScore = parseInt(c.quantification.assignedScore) || 0
        const weightFactor  = parseFloat(c.quantification.weightFactor) || 0
        const weightedScore = (assignedScore * weightFactor).toFixed(3)

        await client.query(
          `INSERT INTO criteria_quantification
             (criteria_id, assigned_score, weight_factor, weighted_score)
           VALUES ($1, $2, $3, $4)`,
          [criteriaId, assignedScore, weightFactor, weightedScore]
        )

        // 6. Insert evidence
        for (let ei = 0; ei < c.evidence.length; ei++) {
          const ev = c.evidence[ei]
          if (!ev.title?.trim()) continue
          await client.query(
            `INSERT INTO evidence (criteria_id, title, description, require_attachment)
             VALUES ($1, $2, $3, $4)`,
            [criteriaId, ev.title.trim(), ev.description?.trim() || null, ev.requireAttachment ?? false]
          )
        }
      }

      // 7. Insert framework assignments
      if (assignment) {
        if (assignment.scope === "ORGANIZATION") {
          await client.query(
            `INSERT INTO framework_assignments (framework_id, scope_type)
             VALUES ($1, 'ORGANIZATION')`,
            [frameworkId]
          )
        } else if (assignment.scope === "FACULTY") {
          for (const fid of assignment.facultyIds) {
            await client.query(
              `INSERT INTO framework_assignments (framework_id, scope_type, faculty_id)
               VALUES ($1, 'FACULTY', $2)`,
              [frameworkId, fid]
            )
          }
        } else if (assignment.scope === "DEPARTMENT") {
          for (const did of assignment.departmentIds) {
            await client.query(
              `INSERT INTO framework_assignments (framework_id, scope_type, department_id)
               VALUES ($1, 'DEPARTMENT', $2)`,
              [frameworkId, did]
            )
          }
        } else if (assignment.scope === "PROGRAM") {
          for (const pid of assignment.programIds) {
            await client.query(
              `INSERT INTO framework_assignments (framework_id, scope_type, program_id)
               VALUES ($1, 'PROGRAM', $2)`,
              [frameworkId, pid]
            )
          }
        }
      }

      await client.query("COMMIT")
      return NextResponse.json({ id: frameworkId }, { status: 201 })
    } catch (err) {
      await client.query("ROLLBACK")
      throw err
    } finally {
      client.release()
    }
  } catch (err) {
    console.error("[POST /api/frameworks]", err)
    return NextResponse.json({ error: "Failed to create framework" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const rows = await query(
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
    return NextResponse.json(rows)
  } catch (err) {
    console.error("[GET /api/frameworks]", err)
    return NextResponse.json({ error: "Failed to fetch frameworks" }, { status: 500 })
  }
}
