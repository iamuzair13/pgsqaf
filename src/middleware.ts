import { getToken } from "next-auth/jwt"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const PUBLIC_PATHS = ["/sign-in"]

// Routes that students are allowed to access
const STUDENT_ALLOWED = [
  "/profile",
  "/api/profile",
  "/api/submissions",
  "/api/verify-student",
  "/api/sap-debug",
  "/api/auth",
]

// Routes that only students can access (admins get redirected)
const STUDENT_ONLY = [
  "/profile",
  "/api/profile",
  "/api/submissions",
  "/api/verify-student",
]

function isStudentAllowed(pathname: string): boolean {
  return STUDENT_ALLOWED.some((p) => pathname === p || pathname.startsWith(p + "/"))
}

function isStudentOnly(pathname: string): boolean {
  return STUDENT_ONLY.some((p) => pathname === p || pathname.startsWith(p + "/"))
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))
  const isApiAuth = pathname.startsWith("/api/auth")

  if (isPublic || isApiAuth) return NextResponse.next()

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  })

  if (!token) {
    const signInUrl = new URL("/sign-in", req.url)
    signInUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(signInUrl)
  }

  const role = token.role as string | undefined

  // RBAC: students can only access student routes
  if (role === "STUDENT" && !isStudentAllowed(pathname)) {
    const profileUrl = new URL("/profile", req.url)
    return NextResponse.redirect(profileUrl)
  }

  // RBAC: admins cannot access student-only routes
  if (role !== "STUDENT" && isStudentOnly(pathname)) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Student access only" }, { status: 403 })
    }
    const dashboardUrl = new URL("/", req.url)
    return NextResponse.redirect(dashboardUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
