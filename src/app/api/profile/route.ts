import { query } from "@/lib/db"
import { fetchSapEmployee } from "@/lib/sap"
import { withMember } from "@/server/http/handler"
import { ok } from "@/server/http/response"
import type { EmpProfile } from "@/types"

const TAG = "api/profile"

export const GET = withMember(TAG, async ({ session, email }) => {
  // Admins may not have an SAP employee record — the page still works,
  // it just renders a session-only identity block.
  const employee = await fetchSapEmployee(email)

  const erpId = email.toLowerCase()

  const profile: EmpProfile | null = employee ? {
    erp_id: erpId,
    name: employee.name,
    email: employee.email ?? session.user.email,
    emp_no: employee.empId ?? "",
    designation: employee.designation ?? "",
    department: employee.department ?? "",
    faculty: employee.faculty ?? "",
    campus: employee.campus ?? "",
    mobile: employee.mobile ?? "",
  } : null

  const submissions = await query(
    `SELECT s.id, s.framework_id, f.title AS framework_title,
            f.version AS framework_version, s.status, s.progress,
            s.total_score, s.submitted_at, s.created_at, s.updated_at,
            COUNT(DISTINCT sa.indicator_id)::int AS answered_count,
            COUNT(DISTINCT i.id)::int AS indicator_count
     FROM submissions s
     JOIN frameworks f ON f.id = s.framework_id
     LEFT JOIN criteria c ON c.framework_id = f.id
     LEFT JOIN indicators i ON i.criteria_id = c.id
     LEFT JOIN submission_answers sa
       ON sa.submission_id = s.id AND sa.indicator_id = i.id AND sa.score IS NOT NULL
     WHERE s.erp_id = $1
     GROUP BY s.id, f.id
     ORDER BY s.updated_at DESC`,
    [erpId]
  )

  return ok({ profile, submissions })
})
