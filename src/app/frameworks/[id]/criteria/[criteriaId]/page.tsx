import { MainLayout } from "@/libraries/components/layout/MainLayout";
import { CriteriaDetailView } from "@/libraries/components/criteria/CriteriaDetailView";

interface Props {
  params: Promise<{ id: string; criteriaId: string }>;
}

export default async function CriteriaDetailPage({ params }: Props) {
  const { id, criteriaId } = await params;
  return (
    <MainLayout>
      <CriteriaDetailView frameworkId={Number(id)} criteriaId={Number(criteriaId)} />
    </MainLayout>
  );
}
