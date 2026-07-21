"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Building2, CalendarDays, ChevronRight, FileCheck2, GraduationCap, IdCard, Mail, MapPin, Play, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { ErpProfile, SubmissionSummary } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AvailableFramework {
  id: number;
  title: string;
  description: string;
  version: string;
  criteria_count: number;
  indicator_count: number;
  updated_at: string;
}

interface ProfileData {
  profile: ErpProfile;
  frameworks: AvailableFramework[];
  submissions: SubmissionSummary[];
}

function formatDate(value: string | null) {
  if (!value) return "Not submitted";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function UserProfile() {
  const router = useRouter();
  const [data, setData] = React.useState<ProfileData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [busyId, setBusyId] = React.useState<number | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    try {
      const response = await fetch("/api/profile", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Failed to load profile");
      setData(result);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { void load(); }, [load]);

  async function startSubmission(frameworkId: number) {
    setBusyId(frameworkId);
    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ framework_id: frameworkId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Failed to start appraisal");
      if (result.existing) toast.info("Your existing draft has been opened");
      router.push(`/profile/submissions/${result.id}`);
    } catch (startError) {
      toast.error(startError instanceof Error ? startError.message : "Failed to start appraisal");
      setBusyId(null);
    }
  }

  async function deleteDraft(submissionId: number) {
    if (!window.confirm("Delete this draft and all of its saved answers?")) return;
    setBusyId(submissionId);
    try {
      const response = await fetch(`/api/submissions/${submissionId}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Failed to delete draft");
      toast.success("Draft deleted");
      await load();
    } catch (deleteError) {
      toast.error(deleteError instanceof Error ? deleteError.message : "Failed to delete draft");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-44 w-full" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-72 flex-col items-center justify-center gap-3 text-center">
        <p className="font-medium">Unable to load the test profile</p>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" onClick={() => { setLoading(true); void load(); }}>Try again</Button>
      </div>
    );
  }

  const { profile, submissions, frameworks } = data;
  const drafts = submissions.filter((item) => item.status === "DRAFT").length;
  const completed = submissions.filter((item) => item.status === "SUBMITTED").length;
  const initials = profile.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-in">
      <Card hover={false} className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-card to-card">
        <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-primary text-2xl font-semibold text-primary-foreground shadow-sm">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{profile.name}</h1>
              <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">{profile.status}</Badge>
              <Badge variant="outline">ERP test profile</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{profile.program} · {profile.semester}</p>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><IdCard size={14} />{profile.registration_no}</span>
              <span className="flex items-center gap-1.5"><Mail size={14} />{profile.email}</span>
              <span className="flex items-center gap-1.5"><MapPin size={14} />{profile.campus}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={FileCheck2} label="Submitted" value={completed} />
        <StatCard icon={CalendarDays} label="Drafts" value={drafts} />
        <StatCard icon={BookOpen} label="Available frameworks" value={frameworks.length} />
      </div>

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <Tabs defaultValue="submissions" className="min-w-0 flex-col">
          <TabsList variant="line" className="mb-5 h-auto w-full max-w-full shrink-0 justify-start overflow-x-auto border-b py-1">
            <TabsTrigger value="submissions" className="h-8 shrink-0 flex-none px-3">My submissions <Badge variant="secondary" className="ml-1">{submissions.length}</Badge></TabsTrigger>
            <TabsTrigger value="available" className="h-8 shrink-0 flex-none px-3">Available appraisals <Badge variant="secondary" className="ml-1">{frameworks.length}</Badge></TabsTrigger>
          </TabsList>
          <TabsContent value="submissions" className="min-w-0 w-full">
            <div className="space-y-3">
              {submissions.length === 0 ? (
                <EmptyState title="No submissions yet" description="Choose an available framework to start your first appraisal." />
              ) : submissions.map((submission) => (
                <Card key={submission.id} hover={false} className="py-4">
                  <CardContent className="flex min-w-0 flex-col gap-4 px-4 lg:flex-row lg:items-center">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-medium">{submission.framework_title}</p>
                        <Badge variant={submission.status === "SUBMITTED" ? "default" : "secondary"}>{submission.status === "SUBMITTED" ? "Submitted" : "Draft"}</Badge>
                        <span className="text-xs text-muted-foreground">v{submission.framework_version}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {submission.answered_count} of {submission.indicator_count} indicators answered · Updated {formatDate(submission.updated_at)}
                      </p>
                      <Progress value={submission.progress} className="mt-3 max-w-md" />
                    </div>
                    {submission.status === "SUBMITTED" && submission.total_score !== null && (
                      <div className="text-left sm:text-right">
                        <p className="text-xl font-semibold tabular-nums">{Number(submission.total_score).toFixed(1)}%</p>
                        <p className="text-xs text-muted-foreground">Self-appraisal score</p>
                      </div>
                    )}
                    <div className="flex gap-2">
                      {submission.status === "DRAFT" && (
                        <Button variant="outline" size="icon-sm" disabled={busyId === submission.id} onClick={() => void deleteDraft(submission.id)} aria-label="Delete draft">
                          <Trash2 size={14} />
                        </Button>
                      )}
                      <Button size="sm" onClick={() => router.push(`/profile/submissions/${submission.id}`)}>
                        {submission.status === "DRAFT" ? "Continue" : "View"}<ChevronRight size={14} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="available" className="min-w-0 w-full">
            <div className="space-y-3">
              {frameworks.length === 0 ? (
                <EmptyState title="No published appraisals" description="Published frameworks will appear here when they become available." />
              ) : frameworks.map((framework) => (
                <Card key={framework.id} hover={false} className="py-4">
                  <CardContent className="flex min-w-0 flex-col gap-4 px-4 lg:flex-row lg:items-center">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{framework.title}</p>
                        <Badge variant="outline">v{framework.version}</Badge>
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{framework.description || "No description provided."}</p>
                      <p className="mt-2 text-xs text-muted-foreground">{framework.criteria_count} criteria · {framework.indicator_count} indicators</p>
                    </div>
                    <Button size="sm" disabled={busyId === framework.id} onClick={() => void startSubmission(framework.id)}>
                      <Play size={14} />{busyId === framework.id ? "Opening..." : "Start appraisal"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <Card hover={false} className="h-fit min-w-0">
          <CardHeader><CardTitle>Academic details</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-sm">
            <Detail icon={Building2} label="Faculty" value={profile.faculty} />
            <Detail icon={GraduationCap} label="Department" value={profile.department} />
            <Detail icon={BookOpen} label="Program" value={profile.program} />
            <Detail icon={IdCard} label="ERP identifier" value={profile.erp_id} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number }) {
  return (
    <Card hover={false} className="py-4">
      <CardContent className="flex items-center gap-3 px-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon size={18} /></div>
        <div><p className="text-xl font-semibold tabular-nums">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>
      </CardContent>
    </Card>
  );
}

function Detail({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <Icon size={16} className="mt-0.5 shrink-0 text-muted-foreground" />
      <div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-0.5 font-medium leading-snug">{value}</p></div>
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border border-dashed p-10 text-center">
      <p className="font-medium">{title}</p><p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
