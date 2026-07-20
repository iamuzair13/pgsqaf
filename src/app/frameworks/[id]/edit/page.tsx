import { MainLayout } from "@/libraries/components/layout/MainLayout";
import { FrameworkForm } from "@/libraries/components/frameworks/FrameworkForm";
import { CriteriaList } from "@/libraries/components/criteria/CriteriaList";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { query } from "@/lib/db";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditFrameworkPage({ params }: Props) {
  const { id } = await params;
  const numId = Number(id);

  const rows = await query(
    `SELECT f.id, f.title, f.description, f.status, f.version, f.created_by
     FROM frameworks f
     WHERE f.id = $1`,
    [numId]
  );

  const framework = rows[0] as { id: number; title: string; description: string; status: "DRAFT" | "PUBLISHED" | "ARCHIVED"; version: string; created_by: number } | undefined;

  return (
    <MainLayout>
      <div className="space-y-8 animate-fade-in">
        <header>
          <Button variant="ghost" size="sm" className="mb-3 -ml-2 gap-1 text-muted-foreground" render={<Link href={`/frameworks/${id}`} />}>
            <ChevronLeft size={14} aria-hidden="true" />
            Back to Framework
          </Button>
          <h1 className="text-xl font-semibold text-foreground">Edit Framework</h1>
          <p className="text-sm text-muted-foreground mt-1">{framework?.title ?? "Framework not found"}</p>
        </header>
        {framework ? (
          <>
            <FrameworkForm mode="edit" initialData={framework} />

            {/* Criteria & Indicators management */}
            <div className="space-y-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Criteria & Indicators</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">Manage evaluation criteria and their indicators for this framework.</p>
                </div>
              </div>
              <CriteriaList frameworkId={numId} />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-base font-medium text-foreground mb-2">Framework not found</p>
            <Button render={<Link href="/frameworks" />}>Back to Frameworks</Button>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
