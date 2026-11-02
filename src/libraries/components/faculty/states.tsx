"use client"

import * as React from "react"
import { AlertCircle, Inbox } from "lucide-react"
import { Button } from "@/components/ui/button"

interface StateProps {
  title: string
  help?: string
  action?: React.ReactNode
}

/** One-line title, one-line help, one action. Invites the next step. */
export function EmptyState({ title, help, action }: StateProps) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center gap-2 text-center px-6">
      <Inbox size={22} className="text-muted-foreground/50" strokeWidth={1.5} />
      <p className="font-medium">{title}</p>
      {help && <p className="text-sm text-muted-foreground max-w-sm">{help}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

/** Same shape as EmptyState but explains what went wrong and how to fix it. */
export function ErrorState({ title, help, action }: StateProps) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center gap-2 text-center px-6">
      <AlertCircle size={22} className="text-destructive/70" strokeWidth={1.5} />
      <p className="font-medium">{title}</p>
      {help && <p className="text-sm text-muted-foreground max-w-sm">{help}</p>}
      {action}
    </div>
  )
}

export function RetryButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="outline" size="sm" onClick={onClick} className="mt-2">
      Try again
    </Button>
  )
}
