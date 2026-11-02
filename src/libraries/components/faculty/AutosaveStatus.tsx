"use client"

import { AnimatePresence, motion } from "framer-motion"
import { CheckCircle2, CloudOff, Loader2 } from "lucide-react"
import { fade } from "@/lib/motion"

export type SaveState = "idle" | "dirty" | "saving" | "saved" | "error"

const LABEL: Record<SaveState, { text: string; icon: typeof Loader2 | null; className: string }> = {
  idle: { text: "", icon: null, className: "text-muted-foreground" },
  dirty: { text: "Unsaved changes", icon: null, className: "text-muted-foreground" },
  saving: { text: "Saving…", icon: Loader2, className: "text-muted-foreground" },
  saved: { text: "Saved just now", icon: CheckCircle2, className: "text-success" },
  error: { text: "Couldn't save. Will retry on next change", icon: CloudOff, className: "text-destructive" },
}

/** Small cross-fading status line — sits beside the wizard nav. */
export function AutosaveStatus({ state }: { state: SaveState }) {
  const { text, icon: Icon, className } = LABEL[state]
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={state}
        variants={fade}
        initial="hidden"
        animate="show"
        exit="exit"
        className={`inline-flex items-center gap-1.5 text-xs font-medium ${className}`}
      >
        {Icon && <Icon size={13} className={state === "saving" ? "animate-spin" : ""} />}
        {text}
      </motion.span>
    </AnimatePresence>
  )
}
