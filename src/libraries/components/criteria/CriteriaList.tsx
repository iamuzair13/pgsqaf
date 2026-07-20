"use client";

import * as React from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import type { Criteria } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface CriteriaListProps {
  frameworkId: number;
  loading?: boolean;
}

export function CriteriaList({ frameworkId, loading = false }: CriteriaListProps) {
  const [criterias, setCriterias] = React.useState<Criteria[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/frameworks/${frameworkId}/criteria`)
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled) setCriterias(data.map((c: Record<string, unknown>) => ({ ...c, total_weight: Number(c.total_weight) }) as unknown as Criteria[]))
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [frameworkId])

  const showLoading = loading || isLoading

  const totalWeight = criterias.reduce((sum, c) => sum + c.total_weight, 0);
  const weightValid = Math.abs(totalWeight - 100) < 0.01;

  if (showLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Weight validation strip */}
      {criterias.length > 0 && (
        <div
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm",
            weightValid
              ? "bg-green-500/10 text-green-700 dark:text-green-400"
              : "bg-destructive/10 text-destructive"
          )}
          role="status"
          aria-live="polite"
        >
          {weightValid
            ? "Total weight is exactly 100%"
            : `Total weight is ${totalWeight.toFixed(1)}% — must equal 100%`}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {criterias.length} {criterias.length === 1 ? "criterion" : "criteria"}
        </p>
        <Button variant="outline" size="sm" render={<Link href={`/frameworks/${frameworkId}/criteria/new`} />}>
          <Plus size={13} aria-hidden="true" />
          Add Criteria
        </Button>
      </div>

      {/* List */}
      {criterias.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-base font-medium text-foreground mb-2">No criteria yet</p>
          <p className="text-sm text-muted-foreground mb-4">
            Add criteria to define the evaluation dimensions of this framework.
          </p>
          <Button render={<Link href={`/frameworks/${frameworkId}/criteria/new`} />}>
            <Plus size={13} aria-hidden="true" />
            Add First Criterion
          </Button>
        </div>
      ) : (
        <ol className="space-y-3" aria-label="Framework criteria">
          {criterias.map((criteria) => (
            <li key={criteria.id}>
              <Link
                href={`/frameworks/${frameworkId}/criteria/${criteria.id}`}
                className="group block p-4 rounded-lg border border-border bg-card transition-colors hover:border-primary/40 hover:bg-muted/30 focus-visible:outline-2 focus-visible:outline-offset-1"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs tabular-nums text-muted-foreground">#{criteria.display_order}</span>
                      <Badge variant="secondary">{criteria.domain}</Badge>
                    </div>
                    <p className="text-sm font-medium text-foreground">{criteria.title}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{criteria.measure}</p>
                    <p className="text-xs text-muted-foreground">{criteria.indicators_count ?? 0} indicators</p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums w-12 text-right text-foreground shrink-0">
                    {criteria.total_weight.toFixed(0)}%
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
