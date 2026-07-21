import { MainLayout } from "@/libraries/components/layout/MainLayout";
import { SubmissionForm } from "@/libraries/components/profile/SubmissionForm";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SubmissionPage({ params }: Props) {
  const { id } = await params;
  return (
    <MainLayout>
      <SubmissionForm id={Number(id)} />
    </MainLayout>
  );
}
