"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { CheckCircle2 } from "lucide-react"
import type { SubmissionDetail } from "@/types"
import { Button } from "@/components/ui/button"
import { ScoreRing } from "./ScoreRing"
import { breakdown, levelVarForTotal } from "./scoring"
import { fadeUp, stagger } from "@/lib/motion"

function formatDate(value: string | null) {
  if (!value) return ""
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

/**
 * Result screen after submit — score ring draws once, breakdown rows
 * stagger in underneath (the orchestrated entrance per §6.7).
 */
export function ResultView({ submission }: { submission: SubmissionDetail }) {
  const answers = React.useMemo(() => {
    const map: Record<number, NonNullable<(typeof submission.criteria)[number]["indicators"][number]["answer"]>> = {}
    for (const c of submission.criteria)
      for (const i of c.indicators) if (i.answer) map[i.id] = i.answer
    return map
  }, [submission])

  const rows = breakdown(submission.criteria, answers)
  const total = submission.total_score ?? 0

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-8">
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="show"
        className="flex flex-col items-center gap-3 text-center"
      >
        <CheckCircle2 size={20} className="text-success" />
        <div>
          <h1 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
            {submission.framework_title}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Submitted {formatDate(submission.submitted_at)} · v{submission.framework_version}
          </p>
        </div>
        <div className="mt-4">
          <ScoreRing value={total} />
        </div>
      </motion.div>

      <motion.div variants={stagger(0.06)} initial="hidden" animate="show" className="space-y-2">
        {submission.criteria.map((criterion) => {
          const row = rows.find((r) => r.criteria_id === criterion.id)
          const pct = row ? Math.round(row.normalized * 100) : 0
          const color = levelVarForTotal(pct)
          return (
            <motion.div
              key={criterion.id}
              variants={fadeUp}
              className="rounded-lg border border-border px-4 py-3"
            >
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm font-medium">{criterion.title}</p>
                <p className="text-sm tabular-nums font-semibold" style={{ color }}>
                  {row?.average.toFixed(1)}/{row?.max_score} · {pct}%
                </p>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            </motion.div>
          )
        })}
      </motion.div>

      <div className="flex justify-center">
        <Button variant="outline" nativeButton={false} render={<Link href="/profile" />}>
          Back to profile
        </Button>
      </div>
    </div>
  )
}
