import { DashboardStats } from "@/libraries/components/dashboard/DashboardStats";
import { AppraisalList } from "@/libraries/components/appraisals/AppraisalList";
import { MainLayout } from "@/libraries/components/layout/MainLayout";

export default function HomePage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <DashboardStats />

        <div>
          <h2 className="text-base font-semibold text-foreground mb-4">Appraisals</h2>
          <AppraisalList />
        </div>
      </div>
    </MainLayout>
  );
}
