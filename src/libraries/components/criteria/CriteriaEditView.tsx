"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ChevronLeft, Save } from "lucide-react";
import { toast } from "sonner";
import {
  CriteriaIndicatorCard,
  newCriteria,
  uid,
  type Criteria,
} from "@/libraries/components/frameworks/FrameworkCreator";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { errorMessage } from "@/lib/api";

interface Props {
  frameworkId: number;
  /** undefined → create mode (POST); number → edit mode (PUT) */
  criteriaId?: number;
}

/* DB bundle → the creator card's Criteria shape */
function toDraft(raw: {
  title?: unknown; domain?: unknown; measure?: unknown; total_weight?: unknown;
  indicators?: { question?: unknown; weight?: unknown; require_attachment?: unknown }[];
  rubrics?: { score?: unknown; descriptor_name?: unknown; performance_standard?: unknown }[];
  evidence?: { title?: unknown; description?: unknown; require_attachment?: unknown }[];
  quantification?: { assigned_score?: unknown; weight_factor?: unknown } | null;
}): Criteria {
  return {
    id: uid(),
    title: String(raw.title ?? ""),
    domain: String(raw.domain ?? ""),
    measure: String(raw.measure ?? ""),
    weight: String(raw.total_weight ?? ""),
    indicators: (raw.indicators ?? []).map((i) => ({
      id: uid(),
      question: String(i.question ?? ""),
      weight: String(i.weight ?? ""),
      requireAttachment: Boolean(i.require_attachment),
    })),
    rubrics: (raw.rubrics ?? []).map((r) => ({
      id: uid(),
      score: String(r.score ?? ""),
      descriptor: String(r.descriptor_name ?? ""),
      performanceStandard: String(r.performance_standard ?? ""),
    })),
    evidence: (raw.evidence ?? []).map((e) => ({
      id: uid(),
      title: String(e.title ?? ""),
      description: String(e.description ?? ""),
      requireAttachment: Boolean(e.require_attachment),
    })),
    quantification: {
      assignedScore: raw.quantification ? String(raw.quantification.assigned_score) : "",
      weightFactor: raw.quantification ? String(raw.quantification.weight_factor) : "",
    },
    collapsed: false,
  };
}

function validate(c: Criteria): string[] {
  const e: string[] = [];
  if (!c.title.trim()) e.push("Title is required");
  if (!c.domain.trim()) e.push("Domain is required");
  if (!c.measure.trim()) e.push("Measure is required");
  const w = parseFloat(c.weight);
  if (isNaN(w) || w < 1 || w > 100) e.push("Weight must be between 1 and 100");
  c.indicators.forEach((ind, i) => {
    if (!ind.question.trim()) e.push(`Indicator ${i + 1}: question is required`);
  });
  c.rubrics.forEach((r, i) => {
    if (!r.descriptor || !r.score) e.push(`Rubric row ${i + 1}: descriptor and score are required`);
  });
  c.evidence.forEach((ev, i) => {
    if (ev.description?.trim() && !ev.title.trim()) e.push(`Evidence ${i + 1}: title is required`);
  });
  return e;
}

export function CriteriaEditView({ frameworkId, criteriaId }: Props) {
  const router = useRouter();
  const isNew = criteriaId === undefined;
  const [draft, setDraft] = React.useState<Criteria | null>(isNew ? newCriteria() : null);
  const [errors, setErrors] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(!isNew);
  const [saving, setSaving] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isNew) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/frameworks/${frameworkId}/criteria/${criteriaId}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(errorMessage(data, "Failed to load criteria"));
        if (!cancelled) setDraft(toDraft(data));
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : "Failed to load criteria");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true };
  }, [frameworkId, criteriaId, isNew]);

  async function handleSave() {
    if (!draft) return;
    const errs = validate(draft);
    setErrors(errs);
    if (errs.length) return;
    setSaving(true);
    try {
      const res = await fetch(
        isNew
          ? `/api/frameworks/${frameworkId}/criteria`
          : `/api/frameworks/${frameworkId}/criteria/${criteriaId}`,
        {
          method: isNew ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: draft.title,
            domain: draft.domain,
            measure: draft.measure,
            indicators: draft.indicators.map((i) => ({
              question: i.question,
              weight: i.weight,
              requireAttachment: i.requireAttachment,
            })),
            rubrics: draft.rubrics.map((r) => ({
              score: r.score,
              descriptor: r.descriptor,
              performanceStandard: r.performanceStandard,
            })),
            evidence: draft.evidence.map((e) => ({
              title: e.title,
              description: e.description,
              requireAttachment: e.requireAttachment,
            })),
            quantification: draft.quantification,
          }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(errorMessage(data, "Failed to save criteria"));
        return;
      }
      toast.success(isNew ? "Criteria added" : "Criteria updated");
      router.push(`/frameworks/${frameworkId}`);
    } catch {
      toast.error("Network error. Please check your connection.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <Button
          variant="ghost" size="sm" className="mb-3 -ml-2 gap-1 text-muted-foreground"
          render={<Link href={`/frameworks/${frameworkId}/edit`} />}
        >
          <ChevronLeft size={14} aria-hidden="true" />
          Back to Edit Framework
        </Button>
        <h1 className="text-xl font-semibold text-foreground">
          {isNew ? "New Criteria" : "Edit Criteria"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Changes replace this criterion&apos;s indicators, rubrics, evidence and quantification in one save.
        </p>
      </div>

      {errors.length > 0 && (
        <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5 flex items-start gap-2">
          <AlertCircle size={14} className="text-destructive shrink-0 mt-0.5" />
          <div className="text-xs text-destructive space-y-0.5">
            {errors.map((e, i) => <p key={i}>{e}</p>)}
          </div>
        </div>
      )}

      {loading ? (
        <Skeleton className="h-96 w-full" />
      ) : loadError || !draft ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-base font-medium text-foreground mb-2">Unable to load criteria</p>
          <p className="text-sm text-muted-foreground">{loadError ?? "Criteria not found"}</p>
        </div>
      ) : (
        <CriteriaIndicatorCard
          criteria={draft}
          index={0}
          onUpdate={setDraft}
          onRemove={() => {}}
          canRemove={false}
        />
      )}

      {!loading && draft && (
        <div className="flex justify-end border-t border-border pt-4">
          <Button onClick={() => void handleSave()} disabled={saving}>
            <Save size={14} className="mr-1.5" />
            {saving ? "Saving…" : isNew ? "Add criteria" : "Save changes"}
          </Button>
        </div>
      )}
    </div>
  );
}
