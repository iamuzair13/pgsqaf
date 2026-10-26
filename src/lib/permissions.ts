import type { UserRole } from "@/types"

/**
 * Single source of truth for route → role access.
 * Read by middleware (redirect/403), server/http wrappers, and the sidebar.
 *
 * Matching is prefix-based: "/frameworks" covers "/frameworks/12/edit".
 * More specific prefixes win over shorter ones.
 */
export const ROUTE_ACCESS: Record<string, readonly UserRole[]> = {
  // Admin pages
  "/": ["SUPER_ADMIN", "ADMIN"],
  "/frameworks": ["SUPER_ADMIN", "ADMIN"],
  "/setup": ["SUPER_ADMIN"],
  "/settings": ["SUPER_ADMIN"],

  // Faculty-facing page (admins may view but get no SAP data)
  "/profile": ["FACULTY", "ADMIN", "SUPER_ADMIN"],

  // Admin APIs
  "/api/frameworks": ["SUPER_ADMIN", "ADMIN"],
  "/api/faculties": ["SUPER_ADMIN", "ADMIN"],
  "/api/departments": ["SUPER_ADMIN", "ADMIN"],
  "/api/programs": ["SUPER_ADMIN", "ADMIN"],
  "/api/users": ["SUPER_ADMIN"],

  // Member APIs — any signed-in user; scoped by session.user.email
  // inside the handlers. SAP verification happens in the service when
  // a submission is actually created.
  "/api/profile": ["SUPER_ADMIN", "ADMIN", "FACULTY"],
  "/api/submissions": ["SUPER_ADMIN", "ADMIN", "FACULTY"],
}

/** Paths that never require a token. */
export const PUBLIC_PATHS = ["/sign-in", "/api/auth", "/api/health"]

/** Roles treated as administrative in the UI. */
export const ADMIN_ROLES: readonly UserRole[] = ["SUPER_ADMIN", "ADMIN"]

/**
 * Returns the allowed roles for a pathname via longest-prefix match,
 * or null when the path has no explicit rule (any authenticated user).
 */
export function allowedRolesFor(pathname: string): readonly UserRole[] | null {
  let best: string | null = null
  for (const prefix of Object.keys(ROUTE_ACCESS)) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) {
      if (!best || prefix.length > best.length) best = prefix
    }
  }
  return best ? ROUTE_ACCESS[best] : null
}
