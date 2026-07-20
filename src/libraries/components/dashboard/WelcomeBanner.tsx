import Link from "next/link";
import { Button } from "@/components/ui/button";

export function WelcomeBanner() {
  return (
    <div className="rounded-xl bg-primary text-primary-foreground p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 min-h-[140px]">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight mb-1">
          Welcome to PGSQAF
        </h1>
        <p className="text-sm text-primary-foreground/80">
          Postgraduate Studies Quality Assurance Framework
        </p>
      </div>
      <Button variant="secondary" size="lg" render={<Link href="/frameworks" />}>
        View Frameworks
      </Button>
    </div>
  );
}
