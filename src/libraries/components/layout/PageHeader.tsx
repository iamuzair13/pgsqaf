import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Spacing scale — single source of truth for vertical rhythm         */
/*  24px (gap-6) between tight sections                               */
/*  32px (gap-8) between standard sections                            */
/*  48px (gap-12) between major page regions                          */
/* ------------------------------------------------------------------ */

export const sectionSpacing = {
  tight: "gap-6",
  default: "gap-8",
  wide: "gap-12",
} as const;

/* ------------------------------------------------------------------ */
/*  SectionSpacing — wrapper that applies the consistent scale         */
/* ------------------------------------------------------------------ */

interface SectionSpacingProps {
  children: React.ReactNode;
  gap?: keyof typeof sectionSpacing;
  className?: string;
}

export function SectionSpacing({
  children,
  gap = "default",
  className,
}: SectionSpacingProps) {
  return (
    <div className={cn("flex flex-col", sectionSpacing[gap], className)}>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  PageHeader — reusable two-zone header                             */
/*  Left: label + title + description                                 */
/*  Right: action slot (buttons, date pills, etc.)                    */
/*  Actions align to the title line, not the full paragraph.          */
/* ------------------------------------------------------------------ */

interface PageHeaderProps {
  label?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  label,
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 border-b border-border/70 pb-6 sm:flex-row sm:items-start sm:justify-between",
        className
      )}
    >
      {/* Content zone */}
      <div className="max-w-2xl">
        {label && (
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            {label}
          </p>
        )}
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        )}
      </div>

      {/* Action zone — aligned to the title line on desktop */}
      {actions && (
        <div className="flex flex-wrap items-center gap-3 sm:pt-1">
          {actions}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SectionHeader — lighter sub-section intro                         */
/*  Smaller heading, optional single-line description.                */
/*  Clearly secondary to the page-level PageHeader.                   */
/* ------------------------------------------------------------------ */

interface SectionHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function SectionHeader({
  title,
  description,
  actions,
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4",
        className
      )}
    >
      <div className="min-w-0">
        <h2 className="text-base font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        {description && (
          <p className="mt-0.5 truncate text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}
