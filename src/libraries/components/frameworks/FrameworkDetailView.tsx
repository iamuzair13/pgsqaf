"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft, Pencil } from "lucide-react";
import { FrameworkStatusBadge } from "./FrameworkStatusBadge";
import { CriteriaList } from "@/libraries/components/criteria/CriteriaList";
import type { Framework } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap mb-1">
              <h1 className="text-xl font-semibold text-foreground">{fw.title}</h1>
              <span className="text-sm tabular-nums text-muted-foreground">v{fw.version}</span>
              <FrameworkStatusBadge status={fw.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              {fw.created_by_name ?? "Unknown"}
              <span aria-hidden="true"> · </span>
              {fw.created_at ? new Date(fw.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
              {fw.updated_at && (
                <> · Updated {new Date(fw.updated_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</>
              )}
            </p>
          </div>

          <Button variant="outline" size="sm" className="shrink-0 gap-1.5" render={<Link href={`/frameworks/${id}/edit`} />}>
            <Pencil size={13} aria-hidden="true" />
            Edit
          </Button>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        {[
          { label: "Total Criteria",  value: String(fw.criteria_count ?? 0), sub: undefined },
          { label: "Version",         value: `v${fw.version}`, sub: fw.status },
          { label: "Status",          value: fw.status, sub: undefined },
        ].map(({ label, value, sub }) => (
          <Card key={label}>
            <CardContent className="p-5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">{label}</p>
              <p className="text-xl font-semibold tabular-nums text-foreground">{value}</p>
              {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Description */}
      {fw.description && (
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground leading-relaxed">{fw.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Criteria list */}
      <CriteriaList frameworkId={id} />
    </div>
  );
}
