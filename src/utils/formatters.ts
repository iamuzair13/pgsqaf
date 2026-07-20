import { format, formatDistanceToNow } from "date-fns";

export function formatDate(date: Date | string, pattern = "dd MMM yyyy"): string {
  return format(new Date(date), pattern);
}

export function formatRelativeDate(date: Date | string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatScore(score: number): string {
  if (score >= 90) return `${score}% — Excellent`;
  if (score >= 75) return `${score}% — Good`;
  if (score >= 60) return `${score}% — Satisfactory`;
  return `${score}% — Needs Improvement`;
}

export function formatPercentage(value: number, total: number): string {
  if (total === 0) return "0%";
  return `${Math.round((value / total) * 100)}%`;
}
