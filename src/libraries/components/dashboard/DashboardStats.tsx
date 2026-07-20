"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { ClipboardList, Clock, CheckCircle2, TrendingUp, TrendingDown, ArrowRight } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

/* ------------------------------------------------------------------ */
/*  Data                                                              */
/* ------------------------------------------------------------------ */

const stats = [
  {
    label: "Total Appraisals",
    value: 142,
    display: "142",
    sub: "All-time submissions",
    trend: "up" as const,
    trendLabel: "+12 this month",
    icon: ClipboardList,
    color: "blue",
    sparkline: [110, 118, 122, 128, 130, 135, 138, 142],
  },
  {
    label: "Pending Appraisals",
    value: 24,
    display: "24",
    sub: "Awaiting review",
    trend: "down" as const,
    trendLabel: "-5 this week",
    icon: Clock,
    color: "amber",
    sparkline: [38, 35, 32, 30, 28, 27, 25, 24],
  },
  {
    label: "Approved Appraisals",
    value: 108,
    display: "108",
    sub: "76% approval rate",
    trend: "up" as const,
    trendLabel: "+8 this month",
    icon: CheckCircle2,
    color: "emerald",
    sparkline: [82, 88, 92, 96, 99, 102, 105, 108],
  },
  {
    label: "Average Score",
    value: 83.4,
    display: "83.4%",
    sub: "Current quarter",
    trend: "up" as const,
    trendLabel: "+4.2%",
    icon: TrendingUp,
    color: "violet",
    sparkline: [72, 74, 76, 75, 78, 80, 81, 83],
  },
]

const colorMap = {
  blue: {
    icon: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    accent: "bg-blue-500",
    line: "#3b82f6",
    area: "rgba(59,130,246,0.12)",
    badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  violet: {
    icon: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    accent: "bg-violet-500",
    line: "#8b5cf6",
    area: "rgba(139,92,246,0.12)",
    badge: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
  amber: {
    icon: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    accent: "bg-amber-500",
    line: "#f59e0b",
    area: "rgba(245,158,11,0.12)",
    badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  emerald: {
    icon: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    accent: "bg-emerald-500",
    line: "#10b981",
    area: "rgba(16,185,129,0.12)",
    badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
}

/* ------------------------------------------------------------------ */
/*  Sparkline SVG                                                     */
/* ------------------------------------------------------------------ */

function Sparkline({ data, color }: { data: number[]; color: keyof typeof colorMap }) {
  const c = colorMap[color]
  const w = 100
  const h = 36
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1

  const points = data.map((v, i) => ({
    x: (i / (data.length - 1)) * w,
    y: h - ((v - min) / range) * (h - 4) - 2,
  }))

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ")
  const areaPath = `${linePath} L ${w} ${h} L 0 ${h} Z`

  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full h-9">
      <defs>
        <linearGradient id={`spark-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c.line} stopOpacity="0.25" />
          <stop offset="100%" stopColor={c.line} stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path
        d={areaPath}
        fill={`url(#spark-${color})`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      />
      <motion.path
        d={linePath}
        fill="none"
        stroke={c.line}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, ease: [0.4, 0, 0.2, 1], delay: 0.1 }}
      />
      <motion.circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r="2"
        fill={c.line}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, delay: 1 }}
      />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/*  Animated counter                                                  */
/* ------------------------------------------------------------------ */

function Counter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [display, setDisplay] = React.useState(0)

  React.useEffect(() => {
    const duration = 700
    const start = performance.now()
    const from = 0
    const to = value

    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplay(parseFloat((from + (to - from) * eased).toFixed(1)))
      if (p < 1) requestAnimationFrame(tick)
    }

    requestAnimationFrame(tick)
  }, [value])

  const formatted = Number.isInteger(value)
    ? Math.round(display).toString()
    : display.toFixed(1)

  return <>{formatted}{suffix}</>
}

/* ------------------------------------------------------------------ */
/*  StatCard                                                          */
/* ------------------------------------------------------------------ */

interface DashboardStatsProps {
  loading?: boolean
}

export function DashboardStats({ loading = false }: DashboardStatsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-9 w-full rounded" />
            <Skeleton className="h-3 w-28" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => {
        const c = colorMap[stat.color as keyof typeof colorMap]
        const Icon = stat.icon
        const TrendIcon = stat.trend === "up" ? TrendingUp : TrendingDown
        const trendClass = stat.trend === "up"
          ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
          : "text-red-500 dark:text-red-400 bg-red-500/10"

        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.07, ease: [0.4, 0, 0.2, 1] }}
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
            className={cn(
              "group relative flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-5 overflow-hidden",
              "hover:border-border hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-shadow duration-300"
            )}
          >
            {/* Colored top accent bar */}
            <div className={cn("absolute top-0 left-0 right-0 h-[3px]", c.accent)} />

            {/* Header row */}
            <div className="flex items-start justify-between pt-1">
              <p className="text-[0.6875rem] font-semibold uppercase tracking-widest text-muted-foreground">
                {stat.label}
              </p>
              <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", c.icon)}>
                <Icon size={15} strokeWidth={2} />
              </div>
            </div>

            {/* Value */}
            <div className="flex items-baseline gap-1">
              <span className="text-[2rem] font-bold tracking-[-0.03em] text-foreground tabular-nums leading-none">
                <Counter
                  value={stat.value}
                  suffix={stat.display.includes("%") ? "%" : ""}
                />
              </span>
            </div>

            {/* Sparkline */}
            <Sparkline data={stat.sparkline} color={stat.color as keyof typeof colorMap} />

            {/* Footer */}
            <div className="flex items-center justify-between">
              <p className="text-[0.75rem] text-muted-foreground">{stat.sub}</p>
              <span className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold",
                trendClass
              )}>
                <TrendIcon size={11} strokeWidth={2.5} />
                {stat.trendLabel}
              </span>
            </div>

            {/* Subtle hover arrow */}
            <motion.div
              className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              initial={false}
            >
              <ArrowRight size={13} className="text-muted-foreground" />
            </motion.div>
          </motion.div>
        )
      })}
    </div>
  )
}
