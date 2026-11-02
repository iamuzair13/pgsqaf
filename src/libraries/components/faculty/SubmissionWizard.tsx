"use client"

import * as React from "react"
import Link from "next/link"
import { AnimatePresence, motion } from "framer-motion"
import { CheckCircle2, ChevronLeft, ChevronRight, CircleAlert, Send } from "lucide-react"
import { toast } from "sonner"
import type { Rubric, SubmissionAnswer, SubmissionDetail } from "@/types"
import { ApiError } from "@/lib/api"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { stepSlide, fadeUp } from "@/lib/motion"
import { useSaveSubmission, useSubmission } from "./hooks"
import { estimateScore, missingIndicators } from "./scoring"
import { AttachmentField } from "./AttachmentField"
import { AutosaveStatus, type SaveState } from "./AutosaveStatus"
import { RubricLadder } from "./RubricLadder"
import { ResultView } from "./ResultView"
import { EmptyState, ErrorState, RetryButton } from "./states"

const AUTOSAVE_MS = 800

type Answers = Record<number, SubmissionAnswer>

function emptyAnswer(indicatorId: number): SubmissionAnswer {
  return {
    indicator_id: indicatorId,
    rubric_id: null,
    score: null,
    response: "",
    attachment_name: null,
    attachment_type: null,
    attachment_data: null,
  }
}

/* ------------------------------------------------------------------ */
/*  Entry point — fetch + branch                                       */
/* ------------------------------------------------------------------ */

export function SubmissionWizard({ id }: { id: number }) {
  const { data, isLoading, isError, error, refetch } = useSubmission(id)

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-5 py-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }
  if (isError || !data) {
    return (
      <ErrorState
        title="Unable to load submission"
        help={error instanceof Error ? error.message : undefined}
        action={
          <div className="flex gap-2">
            <RetryButton onClick={() => void refetch()} />
            <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/profile" />}>
              Back to profile
            </Button>
          </div>
        }
      />
    )
  }
  if (data.status === "SUBMITTED") {
    return <ResultView submission={data} />
  }
  return <DraftWizard key={data.id} submission={data} />
}

/* ------------------------------------------------------------------ */
/*  Draft wizard — criteria steps + review, debounced autosave         */
/* ------------------------------------------------------------------ */

function DraftWizard({ submission }: { submission: SubmissionDetail }) {
  const [answers, setAnswers] = React.useState<Answers>(() => {
    const initial: Answers = {}
    for (const c of submission.criteria)
      for (const i of c.indicators) initial[i.id] = i.answer ?? emptyAnswer(i.id)
    return initial
  })
  const [step, setStep] = React.useState(0)
  const [direction, setDirection] = React.useState<1 | -1>(1)
  const [saveState, setSaveState] = React.useState<SaveState>("idle")
  const [submitting, setSubmitting] = React.useState(false)

  const answersRef = React.useRef(answers)
  answersRef.current = answers
  const dirtyRef = React.useRef<Set<number>>(new Set())
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const save = useSaveSubmission(submission.id)

  const allIndicators = submission.criteria.flatMap((c) => c.indicators)
  const onReview = step === submission.criteria.length
  const criterion = submission.criteria[step]
  const missing = missingIndicators(submission.criteria, answers)
  const estimate = estimateScore(submission.criteria, answers)
  const answeredCount = allIndicators.filter((i) => answers[i.id]?.rubric_id !== null).length
  const progress = allIndicators.length ? Math.round((answeredCount / allIndicators.length) * 100) : 0

  const flush = React.useCallback(async () => {
    const ids = [...dirtyRef.current]
    if (!ids.length) return
    const payload = ids.map((indicatorId) => {
      const a = answersRef.current[indicatorId] ?? emptyAnswer(indicatorId)
      return {
        indicator_id: indicatorId,
        rubric_id: a.rubric_id,
        response: a.response ?? "",
        attachment_name: a.attachment_name,
        attachment_type: a.attachment_type,
        attachment_data: a.attachment_data ?? null,
      }
    })
    ids.forEach((i) => dirtyRef.current.delete(i))
    setSaveState("saving")
    try {
      await save.mutateAsync({ action: "save", answers: payload })
      setSaveState(dirtyRef.current.size ? "dirty" : "saved")
    } catch {
      ids.forEach((i) => dirtyRef.current.add(i))
      setSaveState("error")
    }
  }, [save])

  const scheduleFlush = React.useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => void flush(), AUTOSAVE_MS)
  }, [flush])

  function updateAnswer(indicatorId: number, changes: Partial<SubmissionAnswer>) {
    setAnswers((current) => ({
      ...current,
      [indicatorId]: { ...(current[indicatorId] ?? emptyAnswer(indicatorId)), ...changes },
    }))
    dirtyRef.current.add(indicatorId)
    setSaveState("dirty")
    scheduleFlush()
  }

  // Warn before leaving with pending saves; flush on unmount.
  React.useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current.size) e.preventDefault()
    }
    window.addEventListener("beforeunload", onBeforeUnload)
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  function go(next: number) {
    setDirection(next > step ? 1 : -1)
    setStep(next)
  }

  async function handleSubmit() {
    if (missing.length) return
    setSubmitting(true)
    try {
      if (timerRef.current) clearTimeout(timerRef.current)
      await flush()
      const res = await save.mutateAsync({ action: "submit", answers: [] })
      if (res.status === "SUBMITTED") {
        toast.success("Appraisal submitted")
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        toast.error(err.message)
      } else {
        toast.error("Submission failed. Check your connection and try again.")
      }
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-semibold leading-tight"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {submission.framework_title}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            v{submission.framework_version} · {answeredCount} of {allIndicators.length} answered
          </p>
        </div>
        <AutosaveStatus state={saveState} />
      </div>

      <Progress value={progress} className="h-1.5" />

      {/* Step rail */}
      <ol className="flex flex-wrap items-center gap-1.5">
        {submission.criteria.map((c, i) => {
          const done = c.indicators.every((ind) => answers[ind.id]?.rubric_id !== null)
          const active = i === step
          return (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => go(i)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.6875rem] font-medium transition-colors",
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : done
                      ? "border-success/40 text-success"
                      : "border-border text-muted-foreground hover:text-foreground"
                )}
              >
                {done ? <CheckCircle2 size={11} /> : <span className="tabular-nums">{i + 1}</span>}
                <span className="max-w-36 truncate">{c.title}</span>
              </button>
            </li>
          )
        })}
        <li>
          <button
            type="button"
            onClick={() => go(submission.criteria.length)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-[0.6875rem] font-medium transition-colors",
              onReview ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            Review
          </button>
        </li>
      </ol>

      {/* Step content — slides in direction of travel */}
      <AnimatePresence mode="wait" initial={false} custom={direction}>
        <motion.div key={step} {...stepSlide(direction)} className="space-y-5">
          {onReview ? (
            <ReviewStep
              submission={submission}
              answers={answers}
              missing={missing}
              estimate={estimate}
              onJumpTo={go}
            />
          ) : (
            criterion && (
              <CriterionStep
                criterion={criterion}
                answers={answers}
                onUpdate={updateAnswer}
              />
            )
          )}
        </motion.div>
      </AnimatePresence>

      {/* Nav */}
      <div className="flex items-center justify-between border-t border-border pt-4">
        <Button variant="outline" onClick={() => go(step - 1)} disabled={step === 0}>
          <ChevronLeft size={15} className="mr-1" /> Back
        </Button>
        {onReview ? (
          <Button onClick={() => void handleSubmit()} disabled={submitting || missing.length > 0}>
            {submitting ? "Submitting…" : (
              <>
                <Send size={14} className="mr-1.5" /> Submit appraisal
              </>
            )}
          </Button>
        ) : (
          <Button onClick={() => go(step + 1)}>
            {step === submission.criteria.length - 1 ? "Review" : "Next"}
            <ChevronRight size={15} className="ml-1" />
          </Button>
        )}
      </div>
      {onReview && missing.length > 0 && (
        <p className="flex items-center gap-1.5 text-xs text-warning -mt-2 justify-end">
          <CircleAlert size={12} /> {missing.length} item{missing.length === 1 ? "" : "s"} still need a rating or attachment
        </p>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  One criterion step — its indicators, rubric ladder, attachments    */
/* ------------------------------------------------------------------ */

function CriterionStep({
  criterion,
  answers,
  onUpdate,
}: {
  criterion: SubmissionDetail["criteria"][number]
  answers: Answers
  onUpdate: (indicatorId: number, changes: Partial<SubmissionAnswer>) => void
}) {
  return (
    <motion.section variants={fadeUp} initial="hidden" animate="show" className="space-y-6">
      <header>
        <h2 className="text-lg font-semibold">{criterion.title}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          {criterion.domain} · {criterion.measure} · weight {Number(criterion.total_weight)}
        </p>
      </header>
      {criterion.indicators.map((indicator) => {
        const answer = answers[indicator.id] ?? emptyAnswer(indicator.id)
        return (
          <div key={indicator.id} className="rounded-lg border border-border p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium leading-snug">{indicator.question}</p>
              <span className="text-[0.6875rem] tabular-nums text-muted-foreground whitespace-nowrap">
                weight {Number(indicator.weight)}
              </span>
            </div>
            <RubricLadder
              rubrics={criterion.rubrics}
              selectedRubricId={answer.rubric_id}
              onSelect={(rubric: Rubric) =>
                onUpdate(indicator.id, { rubric_id: rubric.id, score: rubric.score })
              }
            />
            <div className="grid gap-3 sm:grid-cols-[1fr_auto] items-end">
              <Textarea
                placeholder="Notes or justification (optional)"
                value={answer.response ?? ""}
                onChange={(e) => onUpdate(indicator.id, { response: e.target.value })}
                rows={2}
                className="text-sm"
              />
              <AttachmentField
                required={indicator.require_attachment}
                value={{
                  name: answer.attachment_name,
                  type: answer.attachment_type,
                  data: answer.attachment_data ?? null,
                }}
                onChange={(v) =>
                  onUpdate(indicator.id, {
                    attachment_name: v.name,
                    attachment_type: v.type,
                    attachment_data: v.data,
                  })
                }
              />
            </div>
          </div>
        )
      })}
    </motion.section>
  )
}

/* ------------------------------------------------------------------ */
/*  Review step                                                        */
/* ------------------------------------------------------------------ */

function ReviewStep({
  submission,
  answers,
  missing,
  estimate,
  onJumpTo,
}: {
  submission: SubmissionDetail
  answers: Answers
  missing: ReturnType<typeof missingIndicators>
  estimate: number | null
  onJumpTo: (step: number) => void
}) {
  const missingIds = new Set(missing.map((i) => i.id))
  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-lg font-semibold">Review & submit</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          {estimate !== null
            ? `Estimated score ${Math.round(estimate)}/100 — final score is calculated on submit.`
            : "Check every indicator below before submitting."}
        </p>
      </header>
      {submission.criteria.map((criterion, ci) => (
        <div key={criterion.id} className="rounded-lg border border-border">
          <button
            type="button"
            onClick={() => onJumpTo(ci)}
            className="w-full px-4 py-2.5 text-left text-sm font-medium hover:bg-muted/40 rounded-t-lg transition-colors"
          >
            {criterion.title}
          </button>
          <ul className="divide-y divide-border border-t border-border">
            {criterion.indicators.map((indicator) => {
              const answer = answers[indicator.id]
              const rubric = criterion.rubrics.find((r) => r.id === answer?.rubric_id)
              const isMissing = missingIds.has(indicator.id)
              return (
                <li key={indicator.id} className="flex items-center justify-between gap-3 px-4 py-2 text-sm">
                  <span className="text-muted-foreground truncate">{indicator.question}</span>
                  {isMissing ? (
                    <span className="flex items-center gap-1 text-xs text-warning whitespace-nowrap">
                      <CircleAlert size={11} /> Incomplete
                    </span>
                  ) : (
                    <span className="text-xs whitespace-nowrap font-medium">
                      {rubric?.descriptor_name} · {answer?.score}
                      {answer?.attachment_name ? " · attachment" : ""}
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      ))}
      {missing.length === 0 && (
        <EmptyState title="Everything is answered" help="Submitting is final — you won't be able to edit afterwards." />
      )}
    </section>
  )
}
