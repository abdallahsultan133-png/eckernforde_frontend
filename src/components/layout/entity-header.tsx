import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface EntityHeaderProps {
  identity: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  status?: ReactNode;
  metadata?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

/** Identity-first header for student, teacher, class and subject workspaces. */
export function EntityHeader({
  identity,
  title,
  subtitle,
  status,
  metadata,
  actions,
  className,
}: EntityHeaderProps) {
  return (
    <header className={cn("border-y border-border bg-card", className)}>
      <div className="flex flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:px-6">
        <div className="shrink-0">{identity}</div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-xl font-semibold tracking-[-0.02em] text-foreground sm:text-2xl">
              {title}
            </h1>
            {status}
          </div>
          {subtitle && <div className="mt-1 text-sm text-muted-foreground">{subtitle}</div>}
          {metadata && <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">{metadata}</div>}
        </div>
        {actions && <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">{actions}</div>}
      </div>
    </header>
  );
}

