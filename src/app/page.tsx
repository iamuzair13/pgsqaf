import { DashboardStats } from "@/libraries/components/dashboard/DashboardStats";
import { AppraisalList } from "@/libraries/components/appraisals/AppraisalList";
import { MainLayout } from "@/libraries/components/layout/MainLayout";
import { PageHeader, SectionSpacing, SectionHeader } from "@/libraries/components/layout/PageHeader";
import { query } from "@/lib/db";

async function getOrgCounts() {
  try {
    const [users, faculties, departments, programs] = await Promise.all([
      query<{ count: string }>("SELECT COUNT(*)::text AS count FROM users"),
      query<{ count: string }>("SELECT COUNT(*)::text AS count FROM faculties"),
      query<{ count: string }>("SELECT COUNT(*)::text AS count FROM departments"),
      query<{ count: string }>("SELECT COUNT(*)::text AS count FROM programs"),
    ]);
    return {
      admins: parseInt(users[0]?.count ?? "0", 10),
      faculties: parseInt(faculties[0]?.count ?? "0", 10),
      departments: parseInt(departments[0]?.count ?? "0", 10),
      programs: parseInt(programs[0]?.count ?? "0", 10),
    };
  } catch {
    return { admins: 0, faculties: 0, departments: 0, programs: 0 };
  }
}

export default async function HomePage() {
  const counts = await getOrgCounts();

  return (
    <MainLayout>
      <div className="mx-auto max-w-[1440px]">
        <SectionSpacing className="gap-4">
          <PageHeader
            label="Quality assurance workspace"
            title="Dashboard overview"
            actions={
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-card px-2.5 py-1.5 text-xs font-medium text-muted-foreground">
                  <span className="text-sm font-semibold tabular-nums text-foreground">{counts.admins}</span>
                  Admins
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-card px-2.5 py-1.5 text-xs font-medium text-muted-foreground">
                  <span className="text-sm font-semibold tabular-nums text-foreground">{counts.faculties}</span>
                  Faculties
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-card px-2.5 py-1.5 text-xs font-medium text-muted-foreground">
                  <span className="text-sm font-semibold tabular-nums text-foreground">{counts.departments}</span>
                  Departments
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-card px-2.5 py-1.5 text-xs font-medium text-muted-foreground">
                  <span className="text-sm font-semibold tabular-nums text-foreground">{counts.programs}</span>
                  Programs
                </span>
                <span className="mx-1 hidden h-5 w-px bg-border/70 sm:inline-block" />
               
              </div>
            }
          />

          <DashboardStats />

          <section id="appraisals" className="scroll-mt-6">
            <SectionSpacing gap="default">
              <SectionHeader
                title="Submission activity"
                description="Review and manage the latest appraisal submissions across faculties and programs."
              />
              <AppraisalList />
            </SectionSpacing>
          </section>
        </SectionSpacing>
      </div>
    </MainLayout>
  );
}
