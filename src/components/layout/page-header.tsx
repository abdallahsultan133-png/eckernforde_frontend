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
  /** Compact context above the title, such as a class or academic period. */
  eyebrow?: ReactNode;
  /** Optional metadata below the description. */
  metadata?: ReactNode;
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
  eyebrow,
  metadata,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn("space-y-3", className)}>
      {breadcrumb && <Breadcrumb />}
      {above}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0 space-y-1">
          {eyebrow && (
            <div className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
              {eyebrow}
            </div>
          )}
          <h1 className="font-display text-2xl font-semibold tracking-[-0.02em] text-foreground">
            {title}
          </h1>
          {description && (
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
          )}
          {metadata && <div className="pt-1 text-sm text-muted-foreground">{metadata}</div>}
        </div>
        {actions && (
          <div className="flex w-full shrink-0 flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}

PageHeader.displayName = "PageHeader";
