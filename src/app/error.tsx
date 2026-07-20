"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 bg-background">
      <p className="text-5xl font-medium tabular-nums text-muted-foreground/40 mb-4">!</p>
      <h1 className="text-xl font-semibold text-foreground mb-2">Something went wrong</h1>
      <p className="text-sm text-muted-foreground max-w-sm mb-8">
        {error.message || "An unexpected error occurred. Please try again."}
      </p>
      <div className="flex items-center gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button variant="ghost" nativeButton={false} render={<a href="/" />}>Go home</Button>
      </div>
    </div>
  );
}
