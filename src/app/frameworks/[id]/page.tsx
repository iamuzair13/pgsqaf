import { MainLayout } from "@/libraries/components/layout/MainLayout";
import { FrameworkDetailView } from "@/libraries/components/frameworks/FrameworkDetailView";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function FrameworkDetailPage({ params }: Props) {
  const { id } = await params;
  return (
    <MainLayout>
      <FrameworkDetailView id={Number(id)} />
    </MainLayout>
  );
}
