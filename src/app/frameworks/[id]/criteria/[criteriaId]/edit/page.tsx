import { MainLayout } from "@/libraries/components/layout/MainLayout";
import { CriteriaEditView } from "@/libraries/components/criteria/CriteriaEditView";

interface Props {
  params: Promise<{ id: string; criteriaId: string }>;
}

export default async function CriteriaEditPage({ params }: Props) {
  const { id, criteriaId } = await params;
  return (
    <MainLayout>
      <CriteriaEditView frameworkId={Number(id)} criteriaId={Number(criteriaId)} />
    </MainLayout>
  );
}
