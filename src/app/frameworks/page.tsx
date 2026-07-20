import { MainLayout } from "@/libraries/components/layout/MainLayout";
import { FrameworksTable } from "@/libraries/components/frameworks/FrameworksTable";

export default function FrameworksPage() {
  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <header>
          <h1 className="text-xl font-semibold text-foreground">Frameworks</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage quality appraisal frameworks, criteria, and indicators.
          </p>
        </header>
        <section aria-label="Frameworks list">
          <FrameworksTable />
        </section>
      </div>
    </MainLayout>
  );
}
