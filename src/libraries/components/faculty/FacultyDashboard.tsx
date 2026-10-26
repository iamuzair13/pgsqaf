"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { useSession } from "next-auth/react"
import {
  BookOpen,
  Building2,
  Briefcase,
  ChevronRight,
  IdCard,
  Landmark,
  Mail,
  Phone,
  Play,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"
import type { EmpProfile } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { fadeUp, stagger } from "@/lib/motion"
import {
  useAssignedFrameworks,
  useDeleteDraft,
  useProfile,
  useStartSubmission,
} from "./hooks"
import { EmptyState, ErrorState, RetryButton } from "./states"

function formatDate(value: string | null) {
  if (!value) return "—"
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

/* ------------------------------------------------------------------ */
/*  Identity — the full SAP record                                     */
/* ------------------------------------------------------------------ */

function Field({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ size?: number | string; className?: string }>
  label: string
  value: string | null | undefined
}) {
  if (!value) return null
  return (
    <div className="flex items-start gap-2.5">
      <Icon size={14} className="mt-0.5 shrink-0 text-muted-foreground/70" />
      <div className="min-w-0">
        <p className="text-[0.6875rem] text-muted-foreground leading-none">{label}</p>
        <p className="mt-1 text-sm font-medium leading-snug truncate">{value}</p>
      </div>
    </div>
  )
}

function IdentityBlock({ profile }: { profile: EmpProfile }) {
  return (
    <motion.section variants={fadeUp} className="space-y-5">
      <div>
        <h1
          className="text-3xl font-semibold leading-tight"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {profile.name}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {profile.designation}
          {profile.department ? ` · ${profile.department}` : ""}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-x-8 gap-y-4 rounded-lg border border-border p-5 sm:grid-cols-2 lg:grid-cols-3">
        <Field icon={IdCard} label="Employee no." value={profile.emp_no} />
        <Field icon={Mail} label="Email" value={profile.email} />
        <Field icon={Phone} label="Mobile" value={profile.mobile} />
        <Field icon={Briefcase} label="Designation" value={profile.designation} />
        <Field icon={Building2} label="Department" value={profile.department} />
        <Field icon={Landmark} label="Faculty" value={profile.faculty} />
        <Field icon={Building2} label="Campus" value={profile.campus} />
      </div>
    </motion.section>
  )
}

/** Fallback header for signed-in users with no SAP employee record (admins). */
function SessionIdentity({ name, email }: { name: string; email: string }) {
  return (
    <motion.section variants={fadeUp} className="space-y-5">
      <div>
        <h1
          className="text-3xl font-semibold leading-tight"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {name}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Administrator account</p>
      </div>
      <div className="grid grid-cols-1 gap-x-8 gap-y-4 rounded-lg border border-border p-5 sm:grid-cols-2 lg:grid-cols-3">
        <Field icon={Mail} label="Email" value={email} />
      </div>
    </motion.section>
  )
}

/* ------------------------------------------------------------------ */
/*  Stats strip — plain figures, not identical cards                   */
/* ------------------------------------------------------------------ */

function StatsStrip({ submissions }: { submissions: { status: string; total_score: number | null }[] }) {
  const submitted = submissions.filter((s) => s.status === "SUBMITTED")
  const drafts = submissions.length - submitted.length
  const scores = submitted.map((s) => s.total_score).filter((v): v is number => v !== null)
  const latest = scores.length ? Math.round(scores[scores.length - 1]) : null

  const stats: { label: string; value: string }[] = [
    { label: "Appraisals started", value: String(submissions.length) },
    { label: "Submitted", value: String(submitted.length) },
    { label: "In draft", value: String(drafts) },
    { label: "Latest score", value: latest === null ? "—" : `${latest}/100` },
  ]

  return (
    <motion.div variants={fadeUp} className="flex flex-wrap gap-x-10 gap-y-3 border-y border-border py-4">
      {stats.map((s) => (
        <div key={s.label}>
          <p
            className="text-2xl font-semibold leading-none tabular-nums"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {s.value}
          </p>
          <p className="mt-1 text-[0.6875rem] text-muted-foreground">{s.label}</p>
        </div>
      ))}
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/*  Dashboard                                                          */
/* ------------------------------------------------------------------ */

export function FacultyDashboard() {
  const router = useRouter()
  const { data: session } = useSession()
  const profile = useProfile()
  const frameworks = useAssignedFrameworks()
  const start = useStartSubmission()
  const deleteDraft = useDeleteDraft()
  const [busyId, setBusyId] = React.useState<number | null>(null)

  if (profile.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (profile.isError || !profile.data) {
    return (
      <ErrorState
        title="Unable to load your profile"
        help={profile.error instanceof Error ? profile.error.message : "Check your connection, then try again."}
        action={<RetryButton onClick={() => void profile.refetch()} />}
      />
    )
  }

  const { profile: identity, submissions } = profile.data

  async function begin(frameworkId: number) {
    setBusyId(frameworkId)
    try {
      const res = await start.mutateAsync(frameworkId)
      if (res.existing) toast.info("Your existing draft has been opened")
      router.push(`/profile/submissions/${res.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start appraisal")
      setBusyId(null)
    }
  }

  async function removeDraft(id: number) {
    if (!window.confirm("Delete this draft and all of its saved answers?")) return
    setBusyId(id)
    try {
      await deleteDraft.mutateAsync(id)
      toast.success("Draft deleted")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete draft")
    } finally {
      setBusyId(null)
    }
  }

  return (
    <motion.div variants={stagger(0.07)} initial="hidden" animate="show" className="space-y-8">
      {identity ? (
        <IdentityBlock profile={identity} />
      ) : (
        <SessionIdentity
          name={session?.user?.name ?? "My Applications"}
          email={session?.user?.email ?? ""}
        />
      )}
      <StatsStrip submissions={submissions} />

      {/* Your appraisals */}
      <motion.section variants={fadeUp} className="space-y-3">
        <h2 className="text-sm font-semibold">Your appraisals</h2>
        {submissions.length === 0 ? (
          <EmptyState
            title="No appraisals yet"
            help="Pick a framework below to start your first appraisal."
          />
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {submissions.map((s) => (
              <li key={s.id} className="flex items-center gap-4 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{s.framework_title}</p>
                    <Badge variant={s.status === "SUBMITTED" ? "default" : "secondary"}>
                      {s.status === "SUBMITTED" ? "Submitted" : "Draft"}
                    </Badge>
                  </div>
                  <div className="mt-1.5 flex items-center gap-3">
                    <Progress value={s.progress} className="h-1.5 w-36" />
                    <span className="text-[0.6875rem] tabular-nums text-muted-foreground">
                      {s.progress}% · last saved {formatDate(s.updated_at)}
                      {s.total_score !== null && ` · score ${Math.round(s.total_score)}/100`}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {s.status === "DRAFT" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Delete draft"
                      disabled={busyId === s.id}
                      onClick={() => void removeDraft(s.id)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  )}
                  <Button
                    variant={s.status === "DRAFT" ? "default" : "outline"}
                    size="sm"
                    nativeButton={false}
                    render={<Link href={`/profile/submissions/${s.id}`} />}
                  >
                    {s.status === "DRAFT" ? "Continue" : "View result"}
                    <ChevronRight size={14} className="ml-1" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </motion.section>

      {/* Start a new appraisal */}
      <motion.section variants={fadeUp} className="space-y-3">
        <h2 className="text-sm font-semibold">Start a new appraisal</h2>
        {frameworks.isLoading ? (
          <Skeleton className="h-28 w-full" />
        ) : frameworks.isError ? (
          <ErrorState
            title="Couldn't load available frameworks"
            action={<RetryButton onClick={() => void frameworks.refetch()} />}
          />
        ) : !frameworks.data?.length ? (
          <EmptyState
            title="Nothing assigned to you yet"
            help="Frameworks appear here when one is published for your program or organization-wide."
          />
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {frameworks.data.map((f) => (
              <li key={f.id} className="flex items-center gap-4 px-4 py-3">
                <BookOpen size={16} className="text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {f.title}
                    <span className="ml-2 text-xs font-normal text-muted-foreground">v{f.version}</span>
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {f.criteria_count} criteria · {f.indicator_count} indicators
                  </p>
                </div>
                <Button size="sm" disabled={busyId !== null} onClick={() => void begin(f.id)}>
                  <Play size={13} className="mr-1.5" />
                  {busyId === f.id ? "Opening…" : "Start"}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </motion.section>
    </motion.div>
  )
}
