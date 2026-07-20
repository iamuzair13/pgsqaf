import { MainLayout } from "@/libraries/components/layout/MainLayout";
import { FrameworkCreator } from "@/libraries/components/frameworks/FrameworkCreator";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NewFrameworkPage() {
  return (
    <MainLayout>
      <div className="animate-fade-in pb-24">
        <header className="mb-8">
          <Button variant="ghost" size="sm" className="mb-3 -ml-2 gap-1 text-muted-foreground" render={<Link href="/frameworks" />}>
            <ChevronLeft size={14} aria-hidden="true" />
            Frameworks
          </Button>
          <h1 className="text-xl font-semibold text-foreground">New Framework</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Define the framework, its criteria, indicators, rubrics, and quantification.
          </p>
        </header>
        <FrameworkCreator />
      </div>
    </MainLayout>
  );
}
