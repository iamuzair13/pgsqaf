import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 bg-background">
      <p className="text-[6rem] font-medium tabular-nums leading-none mb-4 text-muted-foreground/30" aria-hidden="true">
        404
      </p>
      <h1 className="text-xl font-semibold text-foreground mb-2">Page not found</h1>
      <p className="text-sm text-muted-foreground max-w-sm mb-8">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="flex items-center gap-3 flex-wrap justify-center">
        <Button render={<Link href="/" />}>Go to Dashboard</Button>
        <Button variant="ghost" render={<Link href="/frameworks" />}>View Frameworks</Button>
      </div>
    </div>
  );
}
