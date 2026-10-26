import { getToken } from "next-auth/jwt"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { allowedRolesFor, PUBLIC_PATHS } from "@/lib/permissions"
import type { UserRole } from "@/types"

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))
  if (isPublic) return NextResponse.next()

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  })

  if (!token) {
    const signInUrl = new URL("/sign-in", req.url)
    signInUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(signInUrl)
  }

  const role = token.role as UserRole | undefined

  // Fail closed: a valid token must carry a known role.
  // (An older token signed before roles existed, or a malformed one, gets no access.)
  if (role !== "FACULTY" && role !== "ADMIN" && role !== "SUPER_ADMIN") {
    const signInUrl = new URL("/sign-in", req.url)
    return NextResponse.redirect(signInUrl)
  }

  const allowed = allowedRolesFor(pathname)

  // Unmatched routes: faculty stay confined to their allowlist; admins pass.
  if (allowed === null) {
    if (role === "FACULTY") {
      return NextResponse.redirect(new URL("/profile", req.url))
    }
    return NextResponse.next()
  }

  if (!allowed.includes(role)) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Insufficient permissions" } },
        { status: 403 }
      )
    }
    const target = role === "FACULTY" ? "/profile" : "/"
    return NextResponse.redirect(new URL(target, req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
