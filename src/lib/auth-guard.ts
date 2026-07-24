import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

/**
 * Returns the authenticated session if the user is an admin (SUPER_ADMIN or ADMIN).
 * Returns null and sends a 401/403 response otherwise.
 *
 * Usage in API route handlers:
 * ```ts
 * const session = await requireAdmin();
 * if (!session) return; // response already sent
 * ```
 */
export async function requireAdmin() {
  const session = await auth();

  if (!session?.user) {
    return { session: null, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const role = (session.user as { role?: string }).role;
  if (role === "STUDENT") {
    return { session: null, response: NextResponse.json({ error: "Forbidden: admin access required" }, { status: 403 }) };
  }

  return { session, response: null };
}
