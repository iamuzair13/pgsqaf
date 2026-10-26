import { query } from "@/lib/db"
import type { Department, Faculty, Program } from "@/types"

/* ------------------------------- Faculties ------------------------------- */

export function listFaculties() {
  return query<Faculty>(
    `SELECT f.id, f.name, f.code, f.dean, f.description, f.status,
            f.created_at, f.updated_at,
            (SELECT COUNT(*) FROM departments d WHERE d.faculty_id = f.id)::int AS department_count,
            (SELECT COUNT(*) FROM programs p
             JOIN departments d ON d.id = p.department_id
             WHERE d.faculty_id = f.id)::int AS program_count
     FROM faculties f
     ORDER BY f.name ASC`
  )
}

export function createFaculty(input: {
  name: string
  code: string
  dean?: string
  description?: string
}) {
  return query<Faculty>(
    `INSERT INTO faculties (name, code, dean, description)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, code, dean, description, status, created_at, updated_at`,
    [input.name, input.code, input.dean ?? null, input.description ?? null]
  )
}

/* ------------------------------ Departments ------------------------------ */

export function listDepartments(facultyId?: number) {
  const sql = `SELECT d.id, d.faculty_id, f.name AS faculty_name,
                      d.name, d.code, d.head, d.description, d.status,
                      d.created_at, d.updated_at,
                      (SELECT COUNT(*) FROM programs p WHERE p.department_id = d.id)::int AS program_count
               FROM departments d
               JOIN faculties f ON f.id = d.faculty_id`
  const where = facultyId ? ` WHERE d.faculty_id = $1` : ""
  return query<Department>(sql + where + ` ORDER BY d.name ASC`, facultyId ? [facultyId] : [])
}

export function createDepartment(input: {
  faculty_id: number
  name: string
  code: string
  head?: string
  description?: string
}) {
  return query<Department>(
    `INSERT INTO departments (faculty_id, name, code, head, description)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, faculty_id, name, code, head, description, status, created_at, updated_at`,
    [input.faculty_id, input.name, input.code, input.head ?? null, input.description ?? null]
  )
}

/* -------------------------------- Programs ------------------------------- */

export function listPrograms(departmentId?: number) {
  const sql = `SELECT p.id, p.department_id, d.name AS department_name,
                      f.name AS faculty_name,
                      p.name, p.code, p.level, p.duration_years,
                      p.description, p.status, p.created_at, p.updated_at
               FROM programs p
               JOIN departments d ON d.id = p.department_id
               JOIN faculties f ON f.id = d.faculty_id`
  const where = departmentId ? ` WHERE p.department_id = $1` : ""
  return query<Program>(sql + where + ` ORDER BY p.name ASC`, departmentId ? [departmentId] : [])
}

export function createProgram(input: {
  department_id: number
  name: string
  code: string
  level: string
  duration_years: number
  description?: string
}) {
  return query<Program>(
    `INSERT INTO programs (department_id, name, code, level, duration_years, description)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, department_id, name, code, level, duration_years, description, status, created_at, updated_at`,
    [
      input.department_id,
      input.name,
      input.code,
      input.level,
      input.duration_years,
      input.description ?? null,
    ]
  )
}

/* ------------------------------ generic update --------------------------- */

type ColumnValue = { column: string; value: unknown }

/**
 * Builds and runs `UPDATE <table> SET col = $n ... WHERE id = $n` for the
 * given column list. Returns the updated row or null. Columns are a fixed
 * allowlist per table — never derived from user input.
 */
async function updateById<T>(
  table: string,
  id: number,
  columns: ColumnValue[],
  returning: string
): Promise<T | null> {
  if (!columns.length) return null
  const set = columns.map((c, i) => `${c.column} = $${i + 1}`).join(", ")
  const values = [...columns.map((c) => c.value), id]
  const rows = await query<T>(
    `UPDATE ${table} SET ${set} WHERE id = $${columns.length + 1} RETURNING ${returning}`,
    values
  )
  return rows[0] ?? null
}

const FACULTY_COLS = "id, name, code, dean, description, status, created_at, updated_at"
const DEPARTMENT_COLS = "id, faculty_id, name, code, head, description, status, created_at, updated_at"
const PROGRAM_COLS = "id, department_id, name, code, level, duration_years, description, status, created_at, updated_at"

export function updateFaculty(
  id: number,
  input: Partial<{ name: string; code: string; dean: string | null; description: string | null; status: boolean }>
) {
  const cols: ColumnValue[] = []
  if (input.name !== undefined) cols.push({ column: "name", value: input.name })
  if (input.code !== undefined) cols.push({ column: "code", value: input.code })
  if (input.dean !== undefined) cols.push({ column: "dean", value: input.dean })
  if (input.description !== undefined) cols.push({ column: "description", value: input.description })
  if (input.status !== undefined) cols.push({ column: "status", value: input.status })
  return updateById<Faculty>("faculties", id, cols, FACULTY_COLS)
}

export function updateDepartment(
  id: number,
  input: Partial<{ faculty_id: number; name: string; code: string; head: string | null; description: string | null; status: boolean }>
) {
  const cols: ColumnValue[] = []
  if (input.faculty_id !== undefined) cols.push({ column: "faculty_id", value: input.faculty_id })
  if (input.name !== undefined) cols.push({ column: "name", value: input.name })
  if (input.code !== undefined) cols.push({ column: "code", value: input.code })
  if (input.head !== undefined) cols.push({ column: "head", value: input.head })
  if (input.description !== undefined) cols.push({ column: "description", value: input.description })
  if (input.status !== undefined) cols.push({ column: "status", value: input.status })
  return updateById<Department>("departments", id, cols, DEPARTMENT_COLS)
}

export function updateProgram(
  id: number,
  input: Partial<{ department_id: number; name: string; code: string; level: string; duration_years: number; description: string | null; status: boolean }>
) {
  const cols: ColumnValue[] = []
  if (input.department_id !== undefined) cols.push({ column: "department_id", value: input.department_id })
  if (input.name !== undefined) cols.push({ column: "name", value: input.name })
  if (input.code !== undefined) cols.push({ column: "code", value: input.code })
  if (input.level !== undefined) cols.push({ column: "level", value: input.level })
  if (input.duration_years !== undefined) cols.push({ column: "duration_years", value: input.duration_years })
  if (input.description !== undefined) cols.push({ column: "description", value: input.description })
  if (input.status !== undefined) cols.push({ column: "status", value: input.status })
  return updateById<Program>("programs", id, cols, PROGRAM_COLS)
}

/* -------------------------------- deletes -------------------------------- */

export async function deleteFaculty(id: number) {
  return (await query<{ id: number }>("DELETE FROM faculties WHERE id = $1 RETURNING id", [id])).length > 0
}
export async function deleteDepartment(id: number) {
  return (await query<{ id: number }>("DELETE FROM departments WHERE id = $1 RETURNING id", [id])).length > 0
}
export async function deleteProgram(id: number) {
  return (await query<{ id: number }>("DELETE FROM programs WHERE id = $1 RETURNING id", [id])).length > 0
}
