export type QualityGrade = "A" | "B" | "C" | "D" | "F";

export function getQualityGrade(score: number): QualityGrade {
  if (score >= 90) return "A";
  if (score >= 75) return "B";
  if (score >= 60) return "C";
  if (score >= 50) return "D";
  return "F";
}

export function getScoreColor(score: number): string {
  if (score >= 90) return "text-green-600";
  if (score >= 75) return "text-blue-600";
  if (score >= 60) return "text-amber-600";
  return "text-red-600";
}

export function getScoreBadgeVariant(score: number): "success" | "info" | "warning" | "danger" {
  if (score >= 90) return "success";
  if (score >= 75) return "info";
  if (score >= 60) return "warning";
  return "danger";
}

export function calculateWeightedScore(
  scores: Record<string, number>,
  weights: Record<string, number>
): number {
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  if (totalWeight === 0) return 0;

  const weightedSum = Object.entries(scores).reduce((sum, [key, score]) => {
    const weight = weights[key] ?? 0;
    return sum + score * weight;
  }, 0);

  return Math.round(weightedSum / totalWeight);
}

export function getAppraisalStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: "Draft",
    submitted: "Submitted",
    "in-review": "In Review",
    completed: "Completed",
  };
  return labels[status] ?? status;
}
