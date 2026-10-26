import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

const SAP_BASE_URL =
  process.env.SAP_BASE_URL ?? "http://uolerp.uol.edu.pk:8000"
const SAP_SERVICE =
  process.env.SAP_EMP_SERVICE ?? "/sap/opu/odata/sap/Z_EMP_INFO_API_SRV"
const SAP_USERNAME = process.env.SAP_EMP_BASIC_AUTH_USERNAME
const SAP_PASSWORD = process.env.SAP_EMP_BASIC_AUTH_PASSWORD

/**
 * GET /api/sap-debug?email=imran.asghar@spmo.uol.edu.pk[&set=EmpinfoSet]
 * Debug route — probes the SAP empinfoSet OData endpoint (uppercases the
 * email; sweeps entity-set casings unless ?set= pins one).
 * Restricted to SUPER_ADMIN, and disabled entirely in production unless
 * SAP_DEBUG_ENABLED=true is set explicitly.
 */
export async function GET(req: Request) {
  if (process.env.NODE_ENV === "production" && process.env.SAP_DEBUG_ENABLED !== "true") {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const session = await auth()
  if ((session?.user as { role?: string } | undefined)?.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const email = searchParams.get("email")
  const setParam = searchParams.get("set")

  if (!email) {
    return NextResponse.json({ error: "Missing email param" }, { status: 400 })
  }

  const authHeader =
    SAP_USERNAME && SAP_PASSWORD
      ? "Basic " + Buffer.from(`${SAP_USERNAME}:${SAP_PASSWORD}`).toString("base64")
      : ""

  // Probe one entity set, or sweep the likely casings when ?set= is omitted.
  const candidates = setParam
    ? [setParam]
    : ["empinfoSet", "EmpinfoSet", "EmpInfoSet", "EMPINFOSet", "EMPINFOSET", "EmpinfosSet"]

  const attempts: { set: string; status: number; data: unknown }[] = []

  for (const setName of candidates) {
    const url = `${SAP_BASE_URL}${SAP_SERVICE}/${setName}('${encodeURIComponent(email.toUpperCase())}')`
    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        signal: AbortSignal.timeout(10_000),
      })
      const text = await response.text()
      let json: unknown
      try {
        json = JSON.parse(text)
      } catch {
        json = text.slice(0, 2000)
      }
      const missing =
        response.status === 404 &&
        text.includes("Resource not found for segment")
      if (setParam || !missing) {
        return NextResponse.json({ tried: setName, status: response.status, data: json, attempts })
      }
      attempts.push({ set: setName, status: response.status, data: null })
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Fetch failed", tried: setName },
        { status: 500 }
      )
    }
  }

  return NextResponse.json(
    { error: "No entity-set casing matched", attempts },
    { status: 404 }
  )
}
