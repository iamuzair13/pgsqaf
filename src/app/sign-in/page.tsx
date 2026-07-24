"use client"

import * as React from "react"
import { motion } from "framer-motion"
import {
  GraduationCap,
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  ShieldCheck,
  BookOpen,
  ClipboardList,
  BarChart3,
  Award,
  AlertCircle,
  FlaskConical,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { signInAction, studentTestSignInAction, googleSignInAction } from "@/app/actions/auth"

/* ------------------------------------------------------------------ */
/*  Left panel feature list                                           */
/* ------------------------------------------------------------------ */

const features = [
  {
    icon: BookOpen,
    title: "Framework Management",
    desc: "Define and publish quality appraisal frameworks with versioned criteria and indicators.",
    tag: "Frameworks",
  },
  {
    icon: ClipboardList,
    title: "Structured Appraisals",
    desc: "Conduct systematic evaluations against rubric descriptors with weighted scoring.",
    tag: "Appraisals",
  },
  {
    icon: BarChart3,
    title: "Analytics & Reporting",
    desc: "Track quality scores over time with visual trend analysis and exportable reports.",
    tag: "Analytics",
  },
  {
    icon: Award,
    title: "Evidence-Based Review",
    desc: "Attach supporting evidence directly to criteria for transparent audit trails.",
    tag: "Evidence",
  },
]

/* ------------------------------------------------------------------ */
/*  Animated sparkline bars (decorative)                              */
/* ------------------------------------------------------------------ */

const barHeights = [28, 44, 36, 60, 48, 72, 56, 80, 64, 92, 76, 100, 84]

function SparkBars() {
  return (
    <div className="flex items-end gap-1.5 h-28 mt-6 opacity-20">
      {barHeights.map((h, i) => (
        <motion.div
          key={i}
          className="flex-1 rounded-sm bg-white"
          initial={{ height: 0 }}
          animate={{ height: `${h}%` }}
          transition={{ duration: 0.6, delay: i * 0.05, ease: [0.4, 0, 0.2, 1] }}
        />
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Sign-in form                                                      */
/* ------------------------------------------------------------------ */

export default function SignInPage() {
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)
  const [remember, setRemember] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Student authentication state
  const [googleLoading, setGoogleLoading] = React.useState(false)
  const [testSapId, setTestSapId] = React.useState("")
  const [testLoading, setTestLoading] = React.useState(false)
  const [testError, setTestError] = React.useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const result = await signInAction(email, password)
      if (result?.error) setError(result.error)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    setError(null)
    try {
      await googleSignInAction()
    } catch {
      setGoogleLoading(false)
      setError("Google sign-in failed. Please try again.")
    }
  }

  const handleTestSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setTestError(null)
    setTestLoading(true)
    try {
      const result = await studentTestSignInAction(testSapId)
      if (result?.error) setTestError(result.error)
    } finally {
      setTestLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel ── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[52%] relative overflow-hidden px-12 py-10"
        style={{
          background: "oklch(0.18 0.06 20)",
        }}
      >
        {/* Noise texture overlay */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
            opacity: 0.6,
          }}
        />

        {/* Gradient orb */}
        <div
          className="pointer-events-none absolute -top-32 -right-32 w-[480px] h-[480px] rounded-full"
          style={{
            background: "radial-gradient(circle, oklch(0.45 0.18 22 / 0.25) 0%, transparent 70%)",
          }}
        />
        <div
          className="pointer-events-none absolute -bottom-40 -left-20 w-[360px] h-[360px] rounded-full"
          style={{
            background: "radial-gradient(circle, oklch(0.35 0.14 18 / 0.2) 0%, transparent 70%)",
          }}
        />

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative z-10 flex items-center gap-2.5"
        >
          <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center">
            <GraduationCap size={18} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-none">PGSQAF</p>
            <p className="text-[0.625rem] text-white/50 leading-none mt-0.5">The University of Lahore</p>
          </div>
        </motion.div>

        {/* Headline */}
        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[0.6875rem] text-white/60 font-medium mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Academic Year 2025–26
            </div>

            <h1 className="text-4xl font-bold text-white leading-[1.15] tracking-tight">
              Postgraduate Studies<br />
              <span style={{ color: "oklch(0.72 0.18 35)" }}>Quality Appraisal</span><br />
              Framework
            </h1>

            <p className="mt-4 text-sm text-white/50 leading-relaxed max-w-sm">
              A unified platform for systematic quality evaluation, evidence-based appraisals,
              and performance monitoring across all postgraduate programs.
            </p>
          </motion.div>

          <SparkBars />
        </div>

        {/* Features */}
        <div className="relative z-10 space-y-3">
          {features.map((f, i) => {
            const Icon = f.icon
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.2 + i * 0.08 }}
                className="flex items-start gap-3 group"
              >
                <div className="mt-0.5 w-7 h-7 rounded-md bg-white/8 border border-white/10 flex items-center justify-center shrink-0">
                  <Icon size={13} className="text-white/70" strokeWidth={1.8} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-white/80">{f.title}</p>
                    <span className="text-[0.5625rem] font-medium px-1.5 py-0.5 rounded bg-white/8 text-white/40 uppercase tracking-wider">
                      {f.tag}
                    </span>
                  </div>
                  <p className="text-[0.6875rem] text-white/35 leading-relaxed mt-0.5">{f.desc}</p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-background">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
          className="w-full max-w-[380px]"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <GraduationCap size={16} className="text-primary-foreground" />
            </div>
            <p className="text-sm font-bold text-foreground">PGSQAF</p>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground tracking-tight">Welcome back</h2>
            <p className="text-sm text-muted-foreground mt-1.5">
              Sign in to the{" "}
              <span className="text-primary font-medium">University of Lahore</span>{" "}
              quality appraisal portal
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-[0.6875rem] font-semibold uppercase tracking-widest text-muted-foreground">
                University Email
              </label>
              <div className="relative">
                <Mail
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                />
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="name@uol.edu.pk"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className={cn(
                    "w-full h-10 pl-9 pr-3 rounded-lg border border-border bg-background text-sm text-foreground",
                    "placeholder:text-muted-foreground/60",
                    "focus:outline-none focus:ring-2 focus:ring-ring/25 focus:border-ring/60",
                    "transition-all duration-150"
                  )}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-[0.6875rem] font-semibold uppercase tracking-widest text-muted-foreground">
                Password
              </label>
              <div className="relative">
                <Lock
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                />
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className={cn(
                    "w-full h-10 pl-9 pr-10 rounded-lg border border-border bg-background text-sm text-foreground",
                    "placeholder:text-muted-foreground/60",
                    "focus:outline-none focus:ring-2 focus:ring-ring/25 focus:border-ring/60",
                    "transition-all duration-150"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Remember + forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-border accent-primary"
                />
                <span className="text-xs text-muted-foreground">Keep me signed in</span>
              </label>
              <a href="#" className="text-xs text-primary font-medium hover:underline underline-offset-4 transition-colors">
                Forgot password?
              </a>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-destructive/30 bg-destructive/8 text-xs text-destructive font-medium"
              >
                <AlertCircle size={13} className="shrink-0" />
                {error}
              </motion.div>
            )}

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "w-full h-10 rounded-lg text-sm font-semibold flex items-center justify-center gap-2",
                "bg-primary text-primary-foreground",
                "hover:opacity-90 active:opacity-80 transition-opacity duration-150",
                "disabled:opacity-60 disabled:cursor-not-allowed"
              )}
            >
              {loading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                  className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground"
                />
              ) : (
                <>
                  <LogIn size={15} strokeWidth={2} />
                  Sign in to Portal
                </>
              )}
            </motion.button>
          </form>

          {/* ── Divider ── */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border/60" />
            <span className="text-[0.6875rem] font-medium uppercase tracking-widest text-muted-foreground/50">
              Student Access
            </span>
            <div className="h-px flex-1 bg-border/60" />
          </div>

          {/* ── Google Sign-In ── */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className={cn(
              "w-full h-10 rounded-lg border border-border bg-background text-sm font-medium flex items-center justify-center gap-2.5",
              "hover:bg-muted/50 active:bg-muted transition-colors duration-150",
              "disabled:opacity-60 disabled:cursor-not-allowed"
            )}
          >
            {googleLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <svg width={16} height={16} viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            Sign in with Google
          </button>

          {/* ── Dev Test Mode ── */}
          {process.env.NODE_ENV === "development" && (
            <div className="mt-4 rounded-lg border border-dashed border-amber-500/40 bg-amber-500/5 p-4">
              <div className="mb-2 flex items-center gap-2">
                <FlaskConical size={14} className="text-amber-600 dark:text-amber-400" />
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                  Dev Test Mode
                </p>
              </div>
              <form onSubmit={handleTestSignIn} className="space-y-2.5">
                <input
                  type="text"
                  placeholder="Student ID (e.g. 746539)"
                  value={testSapId}
                  onChange={(e) => setTestSapId(e.target.value)}
                  required
                  className={cn(
                    "w-full h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground",
                    "placeholder:text-muted-foreground/60",
                    "focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/40",
                    "transition-all duration-150"
                  )}
                />
                {testError && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-destructive/30 bg-destructive/8 text-xs text-destructive font-medium"
                  >
                    <AlertCircle size={12} className="shrink-0" />
                    {testError}
                  </motion.div>
                )}
                <button
                  type="submit"
                  disabled={testLoading}
                  className={cn(
                    "w-full h-9 rounded-lg text-xs font-semibold flex items-center justify-center gap-2",
                    "bg-amber-600 text-white",
                    "hover:bg-amber-700 active:bg-amber-800 transition-colors duration-150",
                    "disabled:opacity-60 disabled:cursor-not-allowed"
                  )}
                >
                  {testLoading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <>
                      <FlaskConical size={13} />
                      Test Authentication
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-border/60">
            <p className="text-center text-[0.6875rem] text-muted-foreground/60 leading-relaxed">
              <ShieldCheck size={11} className="inline mr-1 mb-0.5" />
              Protected by university authentication protocols.{" "}
              Need help?{" "}
              <a href="mailto:itsupport@uol.edu.pk" className="text-primary hover:underline underline-offset-4">
                Contact IT Support
              </a>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
