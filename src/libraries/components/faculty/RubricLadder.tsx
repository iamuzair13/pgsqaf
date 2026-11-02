"use client"

import * as React from "react"
import { motion } from "framer-motion"
import type { Rubric } from "@/types"
import { cn } from "@/lib/utils"
import { levelVar } from "./scoring"
import { t } from "@/lib/motion"

interface RubricLadderProps {
  rubrics: Rubric[]
  selectedRubricId: number | null
  onSelect: (rubric: Rubric) => void
  disabled?: boolean
}

/**
 * Radio-group of rubric levels — selected row gets a level-coloured rail
 * and a subtle tinted background. Descriptor text is always visible;
 * colour alone never carries meaning.
 */
export function RubricLadder({ rubrics, selectedRubricId, onSelect, disabled }: RubricLadderProps) {
  const sorted = React.useMemo(
    () => [...rubrics].sort((a, b) => b.score - a.score),
    [rubrics]
  )

  return (
    <div role="radiogroup" className="space-y-1.5">
      {sorted.map((rubric) => {
        const selected = rubric.id === selectedRubricId
        const color = levelVar(rubric.descriptor_name)
        return (
          <button
            key={rubric.id}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onSelect(rubric)}
            className={cn(
              "relative w-full text-left rounded-lg border px-3.5 py-2.5 transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
              "disabled:cursor-default",
              selected
                ? "border-transparent"
                : "border-border hover:border-foreground/20 hover:bg-muted/40"
            )}
            style={
              selected
                ? {
                    background: `color-mix(in srgb, ${color} 9%, transparent)`,
                    borderColor: `color-mix(in srgb, ${color} 35%, transparent)`,
                  }
                : undefined
            }
          >
            {/* Level rail — animates in via layout animation */}
            {selected && (
              <motion.span
                layoutId={undefined}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={t.fast}
                className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full origin-top"
                style={{ background: color }}
              />
            )}
            <div className="flex items-baseline justify-between gap-3 pl-1.5">
              <span className="flex items-baseline gap-2">
                <span
                  className="text-[0.8125rem] font-semibold tabular-nums"
                  style={{ color }}
                >
                  {rubric.score}
                </span>
                <span className="text-[0.8125rem] font-medium">
                  {rubric.descriptor_name ?? "Level"}
                </span>
              </span>
              <span className="text-[0.6875rem] text-muted-foreground text-right leading-snug">
                {rubric.performance_standard}
              </span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
