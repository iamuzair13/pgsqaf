"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2, ChevronLeft, Download, FileText, Loader2, Paperclip, Save, Send, X } from "lucide-react";
import { toast } from "sonner";
import type { SubmissionAnswer, SubmissionDetail } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

type Answers = Record<number, SubmissionAnswer>;

function emptyAnswer(indicatorId: number): SubmissionAnswer {
  return {
    indicator_id: indicatorId,
    rubric_id: null,
    score: null,
    response: "",
    attachment_name: null,
    attachment_type: null,
    attachment_data: null,
  };
}

export function SubmissionForm({ id }: { id: number }) {
  const [submission, setSubmission] = React.useState<SubmissionDetail | null>(null);
  const [answers, setAnswers] = React.useState<Answers>({});
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState<"save" | "submit" | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch(`/api/submissions/${id}`, { cache: "no-store" });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? "Failed to load submission");
        if (cancelled) return;
        const detail = result as SubmissionDetail;
        const initial: Answers = {};
        detail.criteria.forEach((criterion) => criterion.indicators.forEach((indicator) => {
          initial[indicator.id] = indicator.answer ?? emptyAnswer(indicator.id);
        }));
        setSubmission(detail);
        setAnswers(initial);
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Failed to load submission");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const indicators = submission?.criteria.flatMap((criterion) => criterion.indicators) ?? [];
  const completedCount = indicators.filter((indicator) => answers[indicator.id]?.rubric_id !== null).length;
  const progress = indicators.length ? Math.round((completedCount / indicators.length) * 100) : 0;
  const readOnly = submission?.status === "SUBMITTED";

  function updateAnswer(indicatorId: number, changes: Partial<SubmissionAnswer>) {
    setAnswers((current) => ({
      ...current,
      [indicatorId]: { ...(current[indicatorId] ?? emptyAnswer(indicatorId)), ...changes },
    }));
  }

  async function attachFile(indicatorId: number, file: File | undefined) {
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Attachments must be 5 MB or smaller");
      return;
    }
    const data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Unable to read attachment"));
      reader.readAsDataURL(file);
    });
    updateAnswer(indicatorId, { attachment_name: file.name, attachment_type: file.type, attachment_data: data });
  }

  async function persist(action: "save" | "submit") {
    if (action === "submit" && !window.confirm("Submit this appraisal? You will not be able to edit it afterwards.")) return;
    setSaving(action);
    try {
      const response = await fetch(`/api/submissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, answers: Object.values(answers) }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Failed to save submission");
      setSubmission((current) => current ? {
        ...current,
        status: result.status,
        progress: result.progress,
        total_score: result.total_score,
        submitted_at: result.status === "SUBMITTED" ? new Date().toISOString() : current.submitted_at,
      } : current);
      toast.success(action === "submit" ? "Appraisal submitted successfully" : "Draft saved");
    } catch (saveError) {
      toast.error(saveError instanceof Error ? saveError.message : "Failed to save submission");
    } finally {
      setSaving(null);
    }
  }

  if (loading) {
    return <div className="space-y-5"><Skeleton className="h-24 w-full" /><Skeleton className="h-48 w-full" /><Skeleton className="h-48 w-full" /></div>;
  }

  if (error || !submission) {
    return (
      <div className="flex min-h-72 flex-col items-center justify-center gap-3 text-center">
        <p className="font-medium">Unable to load submission</p><p className="text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" render={<Link href="/profile" />}>Back to profile</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-fade-in">
      <div>
        <Button variant="ghost" size="sm" className="-ml-2 mb-3" render={<Link href="/profile" />}><ChevronLeft size={14} />Profile</Button>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant={readOnly ? "default" : "secondary"}>{readOnly ? "Submitted" : "Draft"}</Badge>
              <span className="text-xs text-muted-foreground">v{submission.framework_version} · Submission #{submission.id}</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">{submission.framework_title}</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{submission.framework_description}</p>
          </div>
          {readOnly && submission.total_score !== null && (
            <div className="rounded-lg border bg-primary/5 px-5 py-3 text-center">
              <p className="text-2xl font-semibold tabular-nums text-primary">{Number(submission.total_score).toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">Overall score</p>
            </div>
          )}
        </div>
      </div>

      <Card hover={false} className="sticky top-0 z-20 py-4 shadow-sm">
        <CardContent className="flex flex-col gap-3 px-4 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center justify-between text-xs"><span>{completedCount} of {indicators.length} indicators rated</span><span className="font-medium tabular-nums">{progress}%</span></div>
            <Progress value={progress} />
          </div>
          {!readOnly && (
            <div className="flex gap-2">
              <Button variant="outline" disabled={saving !== null} onClick={() => void persist("save")}>
                {saving === "save" ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}Save draft
              </Button>
              <Button disabled={saving !== null} onClick={() => void persist("submit")}>
                {saving === "submit" ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}Submit
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {submission.criteria.map((criterion, criterionIndex) => (
        <Card key={criterion.id} hover={false}>
          <CardHeader divider>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">{criterionIndex + 1}</div>
              <div><CardTitle>{criterion.title}</CardTitle><p className="mt-1 text-xs text-muted-foreground">{criterion.domain} · Weight {Number(criterion.total_weight).toFixed(1)}%</p></div>
            </div>
          </CardHeader>
          <CardContent className="divide-y px-5">
            {criterion.indicators.map((indicator, indicatorIndex) => {
              const answer = answers[indicator.id] ?? emptyAnswer(indicator.id);
              return (
                <section key={indicator.id} className="py-6 first:pt-2 last:pb-1">
                  <div className="mb-4 flex items-start gap-3">
                    <span className="mt-0.5 text-xs tabular-nums text-muted-foreground">{criterionIndex + 1}.{indicatorIndex + 1}</span>
                    <div className="flex-1"><p className="text-sm font-medium leading-6">{indicator.question}</p>{indicator.require_attachment && <Badge variant="outline" className="mt-2 gap-1"><Paperclip size={11} />Evidence required</Badge>}</div>
                  </div>

                  <div className="ml-0 grid gap-5 sm:ml-8">
                    <div>
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Select performance level</p>
                      <div className="grid gap-2 md:grid-cols-2">
                        {criterion.rubrics.map((rubric) => {
                          const selected = answer.rubric_id === rubric.id;
                          return (
                            <button key={rubric.id} type="button" disabled={readOnly} onClick={() => updateAnswer(indicator.id, { rubric_id: rubric.id, score: rubric.score })} className={cn("rounded-lg border p-3 text-left transition-colors", selected ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "hover:border-primary/40", readOnly && "cursor-default")}>
                              <div className="flex items-center justify-between gap-2"><span className="text-sm font-medium">{rubric.descriptor_name}</span><Badge variant={selected ? "default" : "secondary"}>{rubric.score}</Badge></div>
                              <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{rubric.performance_standard}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-muted-foreground" htmlFor={`response-${indicator.id}`}>Supporting remarks</label>
                      <Textarea id={`response-${indicator.id}`} value={answer.response} disabled={readOnly} placeholder="Add context, outcomes, or supporting details..." className="min-h-24" onChange={(event) => updateAnswer(indicator.id, { response: event.target.value })} />
                    </div>

                    <div>
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Supporting evidence {indicator.require_attachment && <span className="text-destructive">*</span>}</p>
                      {answer.attachment_name ? (
                        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 p-3">
                          <FileText size={16} className="text-primary" />
                          <span className="min-w-0 flex-1 truncate text-sm">{answer.attachment_name}</span>
                          {answer.attachment_data && <Button variant="ghost" size="icon-sm" render={<a href={answer.attachment_data} download={answer.attachment_name} />} aria-label="Download attachment"><Download size={14} /></Button>}
                          {!readOnly && <Button variant="ghost" size="icon-sm" onClick={() => updateAnswer(indicator.id, { attachment_name: null, attachment_type: null, attachment_data: null })} aria-label="Remove attachment"><X size={14} /></Button>}
                        </div>
                      ) : readOnly ? (
                        <p className="text-sm text-muted-foreground">No attachment provided</p>
                      ) : (
                        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed p-4 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground">
                          <Paperclip size={15} />Choose file <span className="text-xs">(max 5 MB)</span>
                          <input type="file" className="sr-only" onChange={(event) => void attachFile(indicator.id, event.target.files?.[0])} />
                        </label>
                      )}
                    </div>
                  </div>
                </section>
              );
            })}
          </CardContent>
        </Card>
      ))}

      {readOnly ? (
        <div className="flex items-center justify-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm text-emerald-700 dark:text-emerald-400"><CheckCircle2 size={17} />This appraisal is submitted and read-only.</div>
      ) : (
        <div className="flex flex-col justify-end gap-2 border-t pt-5 sm:flex-row">
          <Button variant="outline" disabled={saving !== null} onClick={() => void persist("save")}><Save size={15} />Save draft</Button>
          <Button disabled={saving !== null} onClick={() => void persist("submit")}><Send size={15} />Submit appraisal</Button>
        </div>
      )}
    </div>
  );
}
