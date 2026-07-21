import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import { DashboardStats } from "@/libraries/components/dashboard/DashboardStats";
import { AppraisalList } from "@/libraries/components/appraisals/AppraisalList";
import { MainLayout } from "@/libraries/components/layout/MainLayout";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <MainLayout>
      <div className="mx-auto max-w-[1440px] space-y-8">
        <div className="flex flex-col gap-5 border-b border-border/70 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">Quality assurance workspace</p>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Dashboard overview</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Monitor postgraduate appraisals, identify submissions requiring attention, and track institutional quality performance.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex h-9 items-center gap-2 rounded-lg border border-border/70 bg-card px-3 text-xs text-muted-foreground">
              <CalendarDays size={14} aria-hidden="true" />
              21 July 2026
            </div>
            <Button size="sm" render={<Link href="#appraisals" />}>
              Review pending
              <ArrowRight size={14} aria-hidden="true" />
            </Button>
          </div>
        </div>

        <DashboardStats />

        <section id="appraisals" className="scroll-mt-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">Submission activity</h2>
            <p className="mt-1 text-sm text-muted-foreground">Review and manage the latest appraisal submissions across faculties and programs.</p>
          </div>
          <AppraisalList />
        </section>
      </div>
    </MainLayout>
  );
}
