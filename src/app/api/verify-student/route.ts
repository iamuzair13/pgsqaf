import { NextRequest, NextResponse } from "next/server";
import { fetchSapStudent } from "@/lib/sap";

/**
 * POST /api/verify-student
 * Body: { sapId: string }
 *
 * Server-side SAP OData verification.
 * SAP Basic Auth credentials are never exposed to the client.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const sapId = String(body.sapId ?? "").trim();

    if (!sapId) {
      return NextResponse.json(
        { error: "Student ID is required." },
        { status: 400 }
      );
    }

    const student = await fetchSapStudent(sapId);

    if (!student) {
      return NextResponse.json(
        { error: "Student record not found. Please use your official University account." },
        { status: 404 }
      );
    }

    return NextResponse.json({ student });
  } catch (error) {
    console.error("[POST /api/verify-student]", error);
    return NextResponse.json(
      { error: "Failed to verify student. Please try again." },
      { status: 500 }
    );
  }
}
