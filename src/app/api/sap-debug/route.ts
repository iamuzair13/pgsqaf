import { NextResponse } from "next/server";

/**
 * GET /api/sap-debug?sapId=70104078
 * Temporary debug route — returns raw SAP OData response.
 * Remove after field mapping is fixed.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sapId = searchParams.get("sapId");

  if (!sapId) {
    return NextResponse.json({ error: "Missing sapId param" }, { status: 400 });
  }

  const SAP_BASE_URL =
    process.env.SAP_BASE_URL ?? "http://uolerp.uol.edu.pk:8000";
  const SAP_SERVICE = "/sap/opu/odata/sap/ZSTUDENTHMIS_SRV";
  const SAP_USERNAME = process.env.SAP_EMP_BASIC_AUTH_USERNAME;
  const SAP_PASSWORD = process.env.SAP_EMP_BASIC_AUTH_PASSWORD;

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
      signal: AbortSignal.timeout(10_000),
    });

    const text = await response.text();

    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      json = text.slice(0, 2000);
    }

    return NextResponse.json({
      status: response.status,
      url,
      data: json,
    });
  } catch (err) {
    return NextResponse.json({
      error: err instanceof Error ? err.message : "Fetch failed",
      url,
    }, { status: 500 });
  }
}
