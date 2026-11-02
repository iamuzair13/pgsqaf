import { MainLayout } from "@/libraries/components/layout/MainLayout";
import { SubmissionWizard } from "@/libraries/components/faculty/SubmissionWizard";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SubmissionPage({ params }: Props) {
  const { id } = await params;
  return (
    <MainLayout>
      <SubmissionWizard id={Number(id)} />
    </MainLayout>
  );
}
