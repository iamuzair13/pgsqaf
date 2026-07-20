import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardAction, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const appraisals = [
  { id: 1, framework: "MSc Data Science QAF",     criteria: 12, status: "Completed" as const, score: 88,   date: new Date("2025-07-10") },
  { id: 2, framework: "MBA Executive QAF",         criteria: 9,  status: "In Review" as const, score: 72,   date: new Date("2025-07-12") },
  { id: 3, framework: "PhD Computer Science QAF",  criteria: 15, status: "Completed" as const, score: 91,   date: new Date("2025-07-08") },
  { id: 4, framework: "MSc Engineering QAF",       criteria: 11, status: "Pending" as const,   score: null, date: new Date("2025-07-14") },
  { id: 5, framework: "MA Education QAF",          criteria: 8,  status: "In Review" as const, score: 65,   date: new Date("2025-07-13") },
];

interface RecentAppraisalsProps {
  loading?: boolean;
}

export function RecentAppraisals({ loading = false }: RecentAppraisalsProps) {
  return (
    <Card className="h-full flex flex-col p-2">
      <CardHeader>
        <CardTitle>Recent Appraisals</CardTitle>
        <CardAction>
          <Button variant="link" size="sm" render={<Link href="/appraisals" />}>
            View all
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="flex-1 px-0 pb-0">
        {loading ? (
          <div className="px-4 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-[70%]" />
                  <Skeleton className="h-2.5 w-[45%]" />
                </div>
                <Skeleton className="h-5 w-10" />
              </div>
            ))}
          </div>
        ) : appraisals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <p className="font-medium text-foreground mb-1">No appraisals yet</p>
            <p className="text-sm text-muted-foreground">Appraisals will appear here once created.</p>
          </div>
        ) : (
          <ul>
            {appraisals.map((item, idx) => (
              <li
                key={item.id}
                className={cn(
                  "flex items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/50",
                  idx > 0 && "border-t border-border"
                )}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{item.framework}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.criteria} criteria · {formatDistanceToNow(item.date, { addSuffix: true })}
                  </p>
                </div>
                <div className="shrink-0">
                  {item.score !== null ? (
                    <span className={cn(
                      "text-sm font-semibold tabular-nums",
                      item.score >= 80 ? "text-green-600 dark:text-green-400"
                        : item.score >= 60 ? "text-yellow-600 dark:text-yellow-400"
                        : "text-destructive"
                    )}>
                      {item.score}%
                    </span>
                  ) : (
                    <Badge variant="outline">{item.status}</Badge>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
