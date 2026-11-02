import { MainLayout } from "@/libraries/components/layout/MainLayout";
import { CriteriaEditView } from "@/libraries/components/criteria/CriteriaEditView";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function NewCriteriaPage({ params }: Props) {
  const { id } = await params;
  return (
    <MainLayout>
      <CriteriaEditView frameworkId={Number(id)} />
    </MainLayout>
  );
}
