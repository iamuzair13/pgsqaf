import type { SapStudent } from "@/types";

const SAP_BASE_URL =
  process.env.SAP_BASE_URL ?? "http://uolerp.uol.edu.pk:8000";
const SAP_SERVICE = "/sap/opu/odata/sap/ZSTUDENTHMIS_SRV";
const SAP_USERNAME = process.env.SAP_EMP_BASIC_AUTH_USERNAME;
const SAP_PASSWORD = process.env.SAP_EMP_BASIC_AUTH_PASSWORD;

/**
 * Extract the SAP Student ID from an email address.
 * The portion before the @ symbol is treated as the SAP ID.
 * Example: "746539@student.uol.edu.pk" → "746539"
 */
export function extractSapIdFromEmail(email: string): string | null {
  const match = email.trim().toLowerCase().match(/^([^@]+)@/);
  return match ? match[1] : null;
}

/**
 * Fetch a student record from the SAP OData service.
 * Returns null if the student is not found or the request fails.
 *
 * All network calls happen server-side — credentials are never exposed.
 */
export async function fetchSapStudent(sapId: string): Promise<SapStudent | null> {
  if (!sapId || !/^\d+$/.test(sapId)) return null;

  const url = `${SAP_BASE_URL}${SAP_SERVICE}/studentSet('${sapId}')`;

  const authHeader =
    SAP_USERNAME && SAP_PASSWORD
      ? "Basic " + Buffer.from(`${SAP_USERNAME}:${SAP_PASSWORD}`).toString("base64")
      : "";

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      // SAP endpoints can be slow
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      console.error("[SAP] HTTP", response.status, "for sapId:", sapId);
      return null;
    }

    const json = await response.json();

    // SAP OData v2 wraps results in { d: { results: [...] } } for collections,
    // and { d: { ...fields } } for single entities. OData v4 uses { ...fields }.
    const d = json?.d ?? json;

    if (!d) {
      console.error("[SAP] Empty response for sapId:", sapId, "raw:", JSON.stringify(json).slice(0, 500));
      return null;
    }

    // Log the raw SAP response fields for debugging
    console.log("[SAP] Raw response for sapId", sapId, ":", JSON.stringify(d).slice(0, 1000));

    return {
      sapId: d.SapNo ?? d.SapId ?? sapId,
      name: d.Name ?? d.name ?? "Unknown",
      email: d.Email ?? d.email ?? null,
      program: d.DegrTitle ?? d.DegreeTitle ?? null,
      department: d.DeptName ?? d.DepartmentName ?? null,
      campus: d.Campus ?? null,
      admissionYear: d.AdmAyear ?? d.AdmissionYear ?? null,
      academicYear: d.AcadYear ?? d.AcademicYear ?? null,
      gender: d.Gesch ?? d.Gender ?? null,
      fatherName: d.Fname ?? d.FatherName ?? null,
      mobile: d.Mobile ?? null,
      address: d.Address ?? null,
      nationality: d.Nationality ?? null,
    };
  } catch (err) {
    console.error("[SAP] Fetch error for sapId:", sapId, err);
    return null;
  }
}

/**
 * Verify a student by SAP ID and return the student record if valid.
 * Throws an Error with a user-friendly message if the student is not found.
 */
export async function verifyStudent(sapId: string): Promise<SapStudent> {
  const student = await fetchSapStudent(sapId);
  if (!student) {
    throw new Error("Student record not found. Please use your official University account.");
  }
  return student;
}
