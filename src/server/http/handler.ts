import { NextRequest, NextResponse } from "next/server"
import { ZodError } from "zod"
import type { Session } from "next-auth"
import { auth } from "@/lib/auth"
import type { UserRole } from "@/types"
import { AppError, ForbiddenError, UnauthorizedError } from "./errors"
import { fail } from "./response"

export interface RouteContext<P = Record<string, string>> {
  req: NextRequest
  params: P
  session: Session
}

export interface MemberContext<P = Record<string, string>>
  extends RouteContext<P> {
  /** The signed-in person's email — their SAP-verified identity. */
  email: string
}

type RouteParams = { params: Promise<Record<string, string>> }

type Handler<C> = (ctx: C) => Promise<NextResponse | Response>

/**
 * Wraps a route handler with:
 *   auth → await params → try/catch → standard error mapping → request logging.
 */
function wrap<P, C extends RouteContext<P>>(
  tag: string,
  getContext: (
    req: NextRequest,
    params: P
  ) => Promise<{ ctx?: C; error?: NextResponse }>,
  handler: Handler<C>
) {
  return async (req: NextRequest, route: RouteParams) => {
    try {
      const params = (await route.params) as P
      const { ctx, error } = await getContext(req, params)
      if (error) return error
      return await handler(ctx as C)
    } catch (err) {
      return mapError(tag, err)
    }
  }
}

function mapError(tag: string, err: unknown): NextResponse {
  if (err instanceof ZodError) {
    return fail(400, "VALIDATION_ERROR", "Invalid request data", err.issues)
  }
  if (err instanceof AppError) {
    return fail(err.status, err.code, err.message, err.details)
  }
  console.error(`[${tag}]`, err)
  return fail(500, "INTERNAL_ERROR", "Something went wrong")
}

/** Any authenticated session. */
export function withAuth<P = Record<string, string>>(
  tag: string,
  handler: Handler<RouteContext<P>>
) {
  return wrap<P, RouteContext<P>>(tag, async (req, params: P) => {
    const session = await auth()
    if (!session?.user) return { error: toResponse(new UnauthorizedError()) }
    return { ctx: { req, params, session } }
  }, handler)
}

/** Session must have one of the given roles. */
export function withRoles<P = Record<string, string>>(
  tag: string,
  roles: readonly UserRole[],
  handler: Handler<RouteContext<P>>
) {
  return wrap<P, RouteContext<P>>(tag, async (req, params: P) => {
    const session = await auth()
    if (!session?.user) return { error: toResponse(new UnauthorizedError()) }
    if (!roles.includes(session.user.role)) {
      return { error: toResponse(new ForbiddenError("Forbidden: insufficient role")) }
    }
    return { ctx: { req, params, session } }
  }, handler)
}

/** SUPER_ADMIN or ADMIN. */
export function withAdmin<P = Record<string, string>>(
  tag: string,
  handler: Handler<RouteContext<P>>
) {
  return withRoles<P>(tag, ["SUPER_ADMIN", "ADMIN"], handler)
}

/** SUPER_ADMIN only. */
export function withSuperAdmin<P = Record<string, string>>(
  tag: string,
  handler: Handler<RouteContext<P>>
) {
  return withRoles<P>(tag, ["SUPER_ADMIN"], handler)
}

/**
 * Any authenticated member (faculty or admin) — the email is their
 * SAP identity. SAP membership is verified inside the service when a
 * submission is created, so pure sysadmins without an employee record
 * can browse but cannot start an appraisal.
 */
export function withMember<P = Record<string, string>>(
  tag: string,
  handler: Handler<MemberContext<P>>
) {
  return wrap<P, MemberContext<P>>(tag, async (req, params: P) => {
    const session = await auth()
    if (!session?.user) return { error: toResponse(new UnauthorizedError()) }
    if (!session.user.email) {
      return { error: toResponse(new ForbiddenError("No identity on this session")) }
    }
    return { ctx: { req, params, session, email: session.user.email } }
  }, handler)
}

function toResponse(err: AppError): NextResponse {
  return fail(err.status, err.code, err.message, err.details)
}
