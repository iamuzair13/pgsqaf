import { NextResponse } from "next/server"
import { testConnection } from "@/lib/db"

export async function GET() {
  const ok = await testConnection()
  return NextResponse.json(
    { db: ok ? "connected" : "unreachable" },
    { status: ok ? 200 : 503 }
  )
}
