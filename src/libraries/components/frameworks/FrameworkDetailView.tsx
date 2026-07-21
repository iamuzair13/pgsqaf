"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft, Pencil } from "lucide-react";
import { FrameworkStatusBadge } from "./FrameworkStatusBadge";
import { CriteriaList } from "@/libraries/components/criteria/CriteriaList";
import type { Framework } from "@/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface FrameworkDetailViewProps { id: number; }

export function FrameworkDetailView({ id }: FrameworkDetailViewProps) {
  const [fw, setFw] = React.useState<Framework | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/frameworks/${id}`)
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data?.error ?? "Failed to load framework")
        }
        const data = await res.json()
        if (!cancelled) setFw(data)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load framework")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [id])

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-5 w-24" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-96" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (error || !fw) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Button variant="ghost" size="sm" className="mb-3 -ml-2 gap-1 text-muted-foreground" render={<Link href="/frameworks" />}>
          <ChevronLeft size={14} aria-hidden="true" />
          Frameworks
        </Button>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-base font-medium text-foreground mb-2">Unable to load framework</p>
          <p className="text-sm text-muted-foreground">{error ?? "Framework not found"}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back + header */}
      <div>
        <Button variant="ghost" size="sm" className="mb-3 -ml-2 gap-1 text-muted-foreground" render={<Link href="/frameworks" />}>
          <ChevronLeft size={14} aria-hidden="true" />
          Frameworks
        </Button>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-foreground">{fw.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {fw.created_by_name ?? "Unknown"}
              <span aria-hidden="true"> · </span>
              {fw.created_at ? new Date(fw.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
              {fw.updated_at && (
                <> · Updated {new Date(fw.updated_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <span className="inline-flex items-center rounded-md border border-border bg-muted/40 px-2 py-1 text-xs text-muted-foreground">
              <span className="mr-1 font-medium text-foreground tabular-nums">{fw.criteria_count ?? 0}</span>
              criteria
            </span>
            <span className="inline-flex items-center rounded-md border border-border bg-muted/40 px-2 py-1 text-xs text-muted-foreground">
              v{fw.version}
            </span>
            <FrameworkStatusBadge status={fw.status} />
            <Button variant="outline" size="sm" className="h-7 shrink-0 gap-1.5 px-2.5" render={<Link href={`/frameworks/${id}/edit`} />}>
              <Pencil size={13} aria-hidden="true" />
              Edit
            </Button>
          </div>
        </div>
      </div>

      {/* Description */}
      {fw.description && (
        <div className="rounded-lg border border-border bg-muted/20 px-4 py-3">
          <p className="text-sm leading-6 text-muted-foreground">{fw.description}</p>
        </div>
      )}

      {/* Criteria list */}
      <CriteriaList frameworkId={id} />
    </div>
  );
}
