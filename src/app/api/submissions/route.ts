import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { dummyErpProfile } from "@/lib/dummy-profile"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const frameworkId = Number(body.framework_id)

    if (!Number.isInteger(frameworkId)) {
      return NextResponse.json({ error: "Invalid framework" }, { status: 400 })
    }

    const framework = await query<{ id: number }>(
      "SELECT id FROM frameworks WHERE id = $1 AND status = 'PUBLISHED' LIMIT 1",
      [frameworkId]
    )
    if (!framework.length) {
      return NextResponse.json({ error: "Published framework not found" }, { status: 404 })
    }

    const existing = await query<{ id: number }>(
      `SELECT id FROM submissions
       WHERE erp_id = $1 AND framework_id = $2 AND status = 'DRAFT'
       ORDER BY updated_at DESC LIMIT 1`,
      [dummyErpProfile.erp_id, frameworkId]
    )
    if (existing.length) {
      return NextResponse.json({ id: existing[0].id, existing: true })
    }

    const rows = await query<{ id: number }>(
      `INSERT INTO submissions
         (erp_id, student_name, student_email, registration_no, faculty, department, program, framework_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        dummyErpProfile.erp_id,
        dummyErpProfile.name,
        dummyErpProfile.email,
        dummyErpProfile.registration_no,
        dummyErpProfile.faculty,
        dummyErpProfile.department,
        dummyErpProfile.program,
        frameworkId,
      ]
    )

    return NextResponse.json({ id: rows[0].id }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/submissions]", error)
    return NextResponse.json({ error: "Failed to start submission" }, { status: 500 })
  }
}
