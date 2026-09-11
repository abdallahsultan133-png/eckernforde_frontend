import type { ReactNode } from "react";
import { Breadcrumb } from "@/components/layout/breadcrumb.tsx";
import { cn } from "@/lib/utils.ts";

interface PageHeaderProps {
  title: ReactNode;
  /** One-line context under the title. */
  description?: ReactNode;
  /** Right-aligned slot for primary actions (buttons, filters). */
  actions?: ReactNode;
  /** Render the Refine breadcrumb trail above the title. */
  breadcrumb?: boolean;
  /** Extra node between breadcrumb and title (e.g. a "back" link, a status row). */
  above?: ReactNode;
  className?: string;
}

/**
 * The one page-title block. Replaces the several hand-rolled variants across
 * pages — `<h1 className="text-2xl…">`, `motion.div` + `.page-title`, the
 * `ListViewHeader`/`ShowViewHeader` combos — so every screen's masthead has the
 * same type scale, spacing and responsive behaviour.
 */
export function PageHeader({
  title,
  description,
  actions,
  breadcrumb = false,
  above,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {breadcrumb && <Breadcrumb />}
      {above}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0 space-y-1">
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

PageHeader.displayName = "PageHeader";
