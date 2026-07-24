import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { query } from "@/lib/db"
import { fetchSapStudent } from "@/lib/sap"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sapId = (session.user as { sapId?: string }).sapId
    if (!sapId) {
      return NextResponse.json({ error: "Student identity not found" }, { status: 403 })
    }

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
      [sapId, frameworkId]
    )
    if (existing.length) {
      return NextResponse.json({ id: existing[0].id, existing: true })
    }

    // Fetch student data from SAP for submission metadata
    const student = await fetchSapStudent(sapId)
    if (!student) {
      return NextResponse.json({ error: "Student record not found" }, { status: 404 })
    }

    const rows = await query<{ id: number }>(
      `INSERT INTO submissions
         (erp_id, student_name, student_email, registration_no, faculty, department, program, framework_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        sapId,
        student.name,
        student.email ?? session.user.email,
        "",
        "",
        student.department ?? "",
        student.program ?? "",
        frameworkId,
      ]
    )

    return NextResponse.json({ id: rows[0].id }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/submissions]", error)
    return NextResponse.json({ error: "Failed to start submission" }, { status: 500 })
  }
}
