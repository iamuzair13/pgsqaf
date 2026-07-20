import type { FrameworkStatus } from "@/types";
import { Badge, type badgeVariants } from "@/components/ui/badge";
import type { VariantProps } from "class-variance-authority";

type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];

const config: Record<FrameworkStatus, { label: string; variant: BadgeVariant }> = {
  PUBLISHED: { label: "Published", variant: "default"     },
  DRAFT:     { label: "Draft",     variant: "outline"     },
  ARCHIVED:  { label: "Archived",  variant: "secondary"   },
};

export function FrameworkStatusBadge({ status }: { status: FrameworkStatus }) {
  const { label, variant } = config[status];
  return <Badge variant={variant}>{label}</Badge>;
}
