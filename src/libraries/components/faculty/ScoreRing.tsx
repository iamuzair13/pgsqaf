"use client"

import * as React from "react"
import { motion, useReducedMotion } from "framer-motion"
import { RING_DRAW_MS } from "@/lib/motion"
import { levelVarForTotal } from "./scoring"

interface ScoreRingProps {
  /** 0–100 */
  value: number
  size?: number
  label?: string
}

/**
 * The one big moment: SVG ring draws 0 → score while the figure counts up.
 * Colour comes from the rubric level token for that band.
 */
export function ScoreRing({ value, size = 168, label = "Overall score" }: ScoreRingProps) {
  const reduce = useReducedMotion()
  const clamped = Math.max(0, Math.min(100, value))
  const stroke = Math.max(10, size * 0.075)
  const r = (size - stroke) / 2
  const circumference = 2 * Math.PI * r
  const duration = reduce ? 0 : RING_DRAW_MS / 1000

  const [display, setDisplay] = React.useState(reduce ? clamped : 0)
  React.useEffect(() => {
    if (reduce) {
      setDisplay(clamped)
      return
    }
    const start = performance.now()
    let frame: number
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / RING_DRAW_MS)
      // easeOutCubic for the count-up feel
      setDisplay(Math.round(clamped * (1 - Math.pow(1 - p, 3))))
      if (p < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [clamped, reduce])

  const color = levelVarForTotal(clamped)

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--muted)"
            strokeWidth={stroke}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference * (1 - clamped / 100) }}
            transition={{ duration, ease: [0.22, 1, 0.36, 1] }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-semibold leading-none tabular-nums"
            style={{ fontFamily: "var(--font-heading)", fontSize: size * 0.24, color }}
          >
            {display}
          </span>
          <span className="mt-1 text-[0.625rem] uppercase tracking-widest text-muted-foreground">
            / 100
          </span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}
