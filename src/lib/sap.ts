import type { SapEmployee } from "@/types";

const SAP_BASE_URL =
  process.env.SAP_BASE_URL ?? "http://uolerp.uol.edu.pk:8000";
const SAP_SERVICE =
  process.env.SAP_EMP_SERVICE ?? "/sap/opu/odata/sap/Z_EMP_INFO_API_SRV";
const SAP_USERNAME = process.env.SAP_EMP_BASIC_AUTH_USERNAME;
const SAP_PASSWORD = process.env.SAP_EMP_BASIC_AUTH_PASSWORD;
const SAP_TIMEOUT_MS = 8_000;
const CACHE_TTL_MS =
  Number(process.env.SAP_CACHE_TTL_SECONDS ?? 600) * 1000;

/* ------------------------------------------------------------------ */
/*  In-memory TTL cache keyed by lowercased email                      */
/* ------------------------------------------------------------------ */

const cache = new Map<string, { employee: SapEmployee | null; expires: number }>()

function cacheGet(email: string): SapEmployee | null | undefined {
  const entry = cache.get(email)
  if (!entry) return undefined
  if (entry.expires < Date.now()) {
    cache.delete(email)
    return undefined
  }
  return entry.employee
}

function cacheSet(email: string, employee: SapEmployee | null) {
  // Bound the cache so it can't grow unbounded between deploys
  if (cache.size > 5_000) cache.clear()
  cache.set(email, { employee, expires: Date.now() + CACHE_TTL_MS })
}

/** One-way hash for logs — never log raw emails or employee PII. */
function hashId(id: string): string {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0
  return (h >>> 0).toString(16)
}

/* ------------------------------------------------------------------ */
/*  Email variants — the SAP key filter is case-sensitive              */
/* ------------------------------------------------------------------ */

/**
 * The empinfoSet key filter is case-sensitive in SAP, and the ERP stores
 * addresses in ALL-CAPS. Try ALL-CAPS first, then as entered, lowercase,
 * and Title-Case local part — first hit wins.
 */
export function emailVariants(email: string): string[] {
  const trimmed = email.trim()
  const [local = "", domain = ""] = trimmed.split("@")
  const titleLocal = local
    .split(/([._-])/)
    .map((seg) => (seg ? seg[0].toUpperCase() + seg.slice(1).toLowerCase() : seg))
    .join("")
  const variants = [
    trimmed.toUpperCase(),
    trimmed,
    trimmed.toLowerCase(),
    `${titleLocal}@${domain.toLowerCase()}`,
  ]
  return [...new Set(variants)]
}

/* ------------------------------------------------------------------ */
/*  Response parsing — empinfoSet field names vary by SAP config       */
/* ------------------------------------------------------------------ */

function pick(d: Record<string, unknown>, ...keys: string[]): string | null {
  for (const k of keys) {
    const v = d[k]
    if (typeof v === "string" && v.trim()) return v.trim()
  }
  return null
}

/**
 * Maps a raw SAP OData record to our internal SapEmployee shape.
 * Verified against live empinfoSet output: EmployeeId, FirstName,
 * LastName, EmailAddress, Department, Designation, MobileNumber,
 * EmploymentStatus. Fallbacks kept in case fields are added later.
 */
function toEmployee(d: Record<string, unknown>, email: string): SapEmployee {
  const first = pick(d, "FirstName")
  const last = pick(d, "LastName")
  const joined = [first, last].filter(Boolean).join(" ")
  return {
    // Canonical identity is lowercase — SAP stores the key in ALL-CAPS.
    email: (pick(d, "EmailAddress", "Email", "SmtpAddr", "Mail") ?? email).toLowerCase(),
    empId: pick(d, "EmployeeId", "Pernr", "EmpId", "EmpNo"),
    name: joined || pick(d, "Ename", "EmpName", "FullName", "Name") || "Unknown",
    designation: pick(d, "Designation", "StellTxt", "Position", "JobTitle"),
    department: pick(d, "Department", "DeptName", "OrgehTxt", "OrgUnit"),
    faculty: pick(d, "Faculty", "FacultyName", "PersAreaTxt"),
    campus: pick(d, "Campus", "WerksTxt", "Location"),
    mobile: pick(d, "MobileNumber", "Mobile", "Telnr", "Phone"),
    employmentStatus: pick(d, "EmploymentStatus", "Status"),
  }
}

/* ------------------------------------------------------------------ */

/**
 * SAP entity set names are case-sensitive too — the service may register
 * it as EmpinfoSet / EmpInfoSet etc. Once a casing succeeds we remember it
 * so later lookups go straight to the right set.
 */
const ENTITY_SETS = ["empinfoSet", "EmpinfoSet", "EmpInfoSet", "EMPINFOSet", "EMPINFOSET"]
let resolvedEntitySet: string | null = null

type FetchResult =
  | { kind: "ok"; employee: SapEmployee }
  | { kind: "miss" }        // entity set valid, key not found
  | { kind: "set-missing" } // entity set name itself rejected
  | { kind: "error" }       // network / server failure — abort everything

async function fetchRaw(setName: string, emailVariant: string): Promise<FetchResult> {
  const url = `${SAP_BASE_URL}${SAP_SERVICE}/${setName}('${encodeURIComponent(emailVariant)}')`

  const authHeader =
    SAP_USERNAME && SAP_PASSWORD
      ? "Basic " + Buffer.from(`${SAP_USERNAME}:${SAP_PASSWORD}`).toString("base64")
      : ""

  const started = Date.now()
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
    signal: AbortSignal.timeout(SAP_TIMEOUT_MS),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => "")
    const setMissing =
      response.status === 404 && body.includes("Resource not found for segment")
    console.error("[SAP] emp lookup failed", {
      id: hashId(emailVariant),
      set: setName,
      status: response.status,
      ms: Date.now() - started,
    })
    return { kind: setMissing ? "set-missing" : "miss" }
  }

  const json = await response.json()

  // SAP OData v2 wraps results in { d: { results: [...] } } for collections,
  // and { d: { ...fields } } for single entities. OData v4 uses { ...fields }.
  const d = json?.d?.results?.[0] ?? json?.d ?? json

  if (!d || typeof d !== "object" || Object.keys(d).length === 0) {
    console.error("[SAP] empty employee record", { id: hashId(emailVariant) })
    return { kind: "miss" }
  }

  console.log("[SAP] emp lookup ok", {
    id: hashId(emailVariant),
    set: setName,
    ms: Date.now() - started,
  })
  return { kind: "ok", employee: toEmployee(d as Record<string, unknown>, emailVariant) }
}

/**
 * Fetch a faculty/employee record from the SAP OData service by email.
 * Tries entity-set name casings and email case variants because the SAP
 * key filter is case-sensitive on both. Returns null if the employee is
 * not found or the request fails.
 *
 * All network calls happen server-side — credentials are never exposed.
 * Results are cached for SAP_CACHE_TTL_SECONDS keyed by lowercase email.
 */
export async function fetchSapEmployee(email: string): Promise<SapEmployee | null> {
  if (!email || !email.includes("@")) return null

  const cacheKey = email.trim().toLowerCase()
  const cached = cacheGet(cacheKey)
  if (cached !== undefined) return cached

  const variants = emailVariants(email)
  const setNames = resolvedEntitySet
    ? [resolvedEntitySet, ...ENTITY_SETS.filter((s) => s !== resolvedEntitySet)]
    : ENTITY_SETS

  for (const setName of setNames) {
    let setValid = true
    for (const variant of variants) {
      try {
        const result = await fetchRaw(setName, variant)
        if (result.kind === "ok") {
          resolvedEntitySet = setName
          cacheSet(cacheKey, result.employee)
          return result.employee
        }
        if (result.kind === "set-missing") {
          setValid = false
          break // wrong set name — try the next casing
        }
        if (result.kind === "error") return null
      } catch (err) {
        console.error("[SAP] fetch error", {
          id: hashId(variant),
          set: setName,
          error: err instanceof Error ? err.message : "unknown",
        })
        // Network/timeout — all remaining combinations are unreachable
        return null
      }
    }
    if (setValid) {
      // The set exists but no email variant matched — the record doesn't
      // exist; other set-name casings resolve to the same set.
      resolvedEntitySet = setName
      break
    }
  }

  cacheSet(cacheKey, null)
  return null
}

/**
 * Verify an employee by email and return the record if valid.
 * Throws an Error with a user-friendly message if not found.
 */
export async function verifyEmployee(email: string): Promise<SapEmployee> {
  const employee = await fetchSapEmployee(email)
  if (!employee) {
    throw new Error("Employee record not found. Please use your official University account.")
  }
  return employee
}
