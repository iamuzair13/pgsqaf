"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft, Paperclip } from "lucide-react";
import type { Indicator, Rubric, CriteriaQuantification, Evidence } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface CriteriaDetailData {
  id: number;
  framework_id: number;
  title: string;
  domain: string;
  measure: string;
  total_weight: number;
  display_order: number;
  indicators: Indicator[];
  rubrics: Rubric[];
  quantification: CriteriaQuantification | null;
  evidence: Evidence[];
}

interface CriteriaDetailViewProps {
  frameworkId: number;
  criteriaId: number;
}

function parseCriteria(raw: Record<string, unknown>): CriteriaDetailData {
  return {
    id: Number(raw.id),
    framework_id: Number(raw.framework_id),
    title: String(raw.title ?? ""),
    domain: String(raw.domain ?? ""),
    measure: String(raw.measure ?? ""),
    total_weight: Number(raw.total_weight ?? 0),
    display_order: Number(raw.display_order ?? 0),
    indicators: ((raw.indicators as Record<string, unknown>[]) ?? []).map((i) => ({
      id: Number(i.id),
      criteria_id: Number(i.criteria_id),
      question: String(i.question ?? ""),
      weight: Number(i.weight ?? 0),
      require_attachment: Boolean(i.require_attachment),
      display_order: Number(i.display_order ?? 0),
    })),
    rubrics: ((raw.rubrics as Record<string, unknown>[]) ?? []).map((r) => ({
      id: Number(r.id),
      criteria_id: Number(r.criteria_id),
      score: Number(r.score ?? 0),
      descriptor_id: Number(r.descriptor_id ?? 0),
      descriptor_name: String(r.descriptor_name ?? ""),
      performance_standard: String(r.performance_standard ?? ""),
      display_order: Number(r.display_order ?? 0),
    })),
    quantification: raw.quantification
      ? {
          id: Number((raw.quantification as Record<string, unknown>).id),
          criteria_id: Number((raw.quantification as Record<string, unknown>).criteria_id),
          assigned_score: Number((raw.quantification as Record<string, unknown>).assigned_score ?? 0),
          weight_factor: Number((raw.quantification as Record<string, unknown>).weight_factor ?? 0),
          weighted_score: Number((raw.quantification as Record<string, unknown>).weighted_score ?? 0),
        }
      : null,
    evidence: ((raw.evidence as Record<string, unknown>[]) ?? []).map((e) => ({
      id: Number(e.id),
      criteria_id: Number(e.criteria_id),
      title: String(e.title ?? ""),
      description: String(e.description ?? ""),
      require_attachment: Boolean(e.require_attachment),
      file_path: String(e.file_path ?? ""),
    })),
  };
}

export function CriteriaDetailView({ frameworkId, criteriaId }: CriteriaDetailViewProps) {
  const [data, setData] = React.useState<CriteriaDetailData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/frameworks/${frameworkId}/criteria/${criteriaId}`);
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d?.error ?? "Failed to load criteria");
        }
        const d = await res.json();
        if (!cancelled) setData(parseCriteria(d));
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load criteria");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true };
  }, [frameworkId, criteriaId]);

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-5 w-32" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-96" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Button variant="ghost" size="sm" className="mb-3 -ml-2 gap-1 text-muted-foreground" render={<Link href={`/frameworks/${frameworkId}`} />}>
          <ChevronLeft size={14} aria-hidden="true" />
          Back to Framework
        </Button>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-base font-medium text-foreground mb-2">Unable to load criteria</p>
          <p className="text-sm text-muted-foreground">{error ?? "Criteria not found"}</p>
        </div>
      </div>
    );
  }

  const criteria = data;
  const eachWeight = criteria.indicators.length > 0 ? 100 / criteria.indicators.length : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumb + header */}
      <div>
        <Button variant="ghost" size="sm" className="mb-3 -ml-2 gap-1 text-muted-foreground" render={<Link href={`/frameworks/${frameworkId}`} />}>
          <ChevronLeft size={14} aria-hidden="true" />
          Back to Framework
        </Button>

        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <Badge variant="secondary">{criteria.domain}</Badge>
          <span className="text-xs text-muted-foreground">#{criteria.display_order}</span>
        </div>
        <h1 className="text-xl font-semibold text-foreground mb-1">{criteria.title}</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">{criteria.measure}</p>
      </div>

      {/* Weight info */}
      <div className="flex items-start gap-2 px-4 py-3 rounded-lg text-sm bg-muted/50 text-muted-foreground">
        Criteria weight: <span className="font-semibold tabular-nums text-foreground">{criteria.total_weight}%</span>
        {criteria.indicators.length > 0 && (
          <span className="ml-1">· Each indicator: {eachWeight.toFixed(2)}% of criteria</span>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="indicators" className="flex flex-col gap-6">
        <TabsList variant="line" className="flex-row items-start h-auto justify-start w-full border-b border-border rounded-none pb-0 shrink-0">
          <TabsTrigger value="indicators" className="w-full justify-start px-0 py-3 border-b border-transparent data-[selected]:border-primary data-[selected]:text-foreground">Indicators <span className="ml-1 text-xs tabular-nums text-muted-foreground">{criteria.indicators.length}</span></TabsTrigger>
          <TabsTrigger value="rubrics" className="w-full justify-start px-0 py-3 border-b border-transparent data-[selected]:border-primary data-[selected]:text-foreground">Rubrics <span className="ml-1 text-xs tabular-nums text-muted-foreground">{criteria.rubrics.length}</span></TabsTrigger>
          <TabsTrigger value="evidence" className="w-full justify-start px-0 py-3 border-b border-transparent data-[selected]:border-primary data-[selected]:text-foreground">Evidence <span className="ml-1 text-xs tabular-nums text-muted-foreground">{criteria.evidence.length}</span></TabsTrigger>
          <TabsTrigger value="quantification" className="w-full justify-start px-0 py-3 border-b border-transparent data-[selected]:border-primary data-[selected]:text-foreground">Quantification</TabsTrigger>
        </TabsList>
        <div className="flex-1 min-w-0">
          <TabsContent value="indicators" className="pt-0">
            <IndicatorsTab indicators={criteria.indicators} eachWeight={eachWeight} />
          </TabsContent>
          <TabsContent value="rubrics" className="pt-0">
            <RubricsTab rubrics={criteria.rubrics} />
          </TabsContent>
          <TabsContent value="evidence" className="pt-0">
            <EvidenceTab evidence={criteria.evidence} />
          </TabsContent>
          <TabsContent value="quantification" className="pt-0">
            <QuantificationTab quant={criteria.quantification} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

/* ─── Indicators ─── */

function IndicatorsTab({ indicators, eachWeight }: { indicators: Indicator[]; eachWeight: number }) {
  if (indicators.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-base font-medium text-foreground mb-2">No indicators yet</p>
        <p className="text-sm text-muted-foreground">Indicators will appear here once added.</p>
      </div>
    );
  }

  return (
    <ol className="space-y-1">
      {indicators.map((ind, idx) => (
        <li key={ind.id} className="flex items-start gap-3 py-4 border-b border-border last:border-0">
          <span className="text-xs tabular-nums shrink-0 w-5 text-right mt-1 text-muted-foreground">{idx + 1}</span>
          <div className="flex-1 min-w-0 space-y-1.5">
            <p className="text-sm text-foreground">{ind.question}</p>
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant="secondary" className="tabular-nums">{ind.weight.toFixed(2)}%</Badge>
              {ind.require_attachment && (
                <Badge variant="outline" className="gap-1">
                  <Paperclip size={10} aria-hidden="true" /> Attachment required
                </Badge>
              )}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

/* ─── Rubrics ─── */

function RubricsTab({ rubrics }: { rubrics: Rubric[] }) {
  if (rubrics.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-base font-medium text-foreground mb-2">No rubrics yet</p>
        <p className="text-sm text-muted-foreground">Rubric scoring levels will appear here once added.</p>
      </div>
    );
  }

  return (
    <ol>
      {rubrics.map((rubric, idx) => (
        <li
          key={rubric.id}
          className={cn("flex items-start gap-4 py-4", idx < rubrics.length - 1 && "border-b border-border")}
        >
          <div className="shrink-0 w-8 text-center">
            <p className="text-xl font-semibold tabular-nums text-foreground">{rubric.score}</p>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground mb-1">{rubric.descriptor_name}</p>
            <p className="text-sm text-muted-foreground">{rubric.performance_standard}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

/* ─── Evidence ─── */

function EvidenceTab({ evidence }: { evidence: Evidence[] }) {
  if (evidence.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-base font-medium text-foreground mb-2">No evidence defined</p>
        <p className="text-sm text-muted-foreground">Evidence items will appear here once added.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {evidence.map((ev) => (
        <Card key={ev.id}>
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-foreground">{ev.title}</p>
              {ev.require_attachment && (
                <Badge variant="outline" className="shrink-0 gap-1">
                  <Paperclip size={10} aria-hidden="true" /> Attachment required
                </Badge>
              )}
            </div>
            {ev.description && (
              <p className="text-sm text-muted-foreground">{ev.description}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ─── Quantification ─── */

function QuantificationTab({ quant }: { quant: CriteriaQuantification | null }) {
  if (!quant) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-base font-medium text-foreground mb-2">No quantification set</p>
        <p className="text-sm text-muted-foreground">Quantification will appear here once configured.</p>
      </div>
    );
  }

  return (
    <Card className="max-w-sm">
      <CardContent className="p-6 space-y-4">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Assigned Score</p>
          <p className="text-2xl font-semibold tabular-nums text-foreground">{quant.assigned_score}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Weight Factor</p>
          <p className="text-2xl font-semibold tabular-nums text-foreground">{quant.weight_factor.toFixed(3)}</p>
        </div>
        <div className="pt-2 border-t border-border space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Weighted Score</p>
          <p className="text-2xl font-semibold tabular-nums text-primary">{quant.weighted_score.toFixed(3)}</p>
        </div>
      </CardContent>
    </Card>
  );
}
