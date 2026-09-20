import type { ReactNode } from "react";
import { SlidersHorizontal, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FilterBarProps {
  search?: ReactNode;
  children?: ReactNode;
  trailing?: ReactNode;
  active?: boolean;
  onClear?: () => void;
  resultLabel?: ReactNode;
  className?: string;
}

/** Search and filters in one predictable, wrapping toolbar. */
export function FilterBar({
  search,
  children,
  trailing,
  active = false,
  onClear,
  resultLabel,
  className,
}: FilterBarProps) {
  return (
    <div className={cn("border-y border-border bg-muted/20", className)}>
      <div className="flex flex-col gap-3 px-3 py-3 sm:px-4 lg:flex-row lg:items-center">
        {search && <div className="w-full lg:max-w-sm">{search}</div>}
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          {children && (
            <>
              <SlidersHorizontal className="hidden h-4 w-4 shrink-0 text-muted-foreground sm:block" aria-hidden="true" />
              {children}
            </>
          )}
          {active && onClear && (
            <Button type="button" variant="ghost" size="sm" className="gap-1.5" onClick={onClear}>
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              Clear filters
            </Button>
          )}
        </div>
        {trailing && <div className="flex shrink-0 items-center gap-2">{trailing}</div>}
      </div>
      {resultLabel && (
        <div className="border-t border-border px-4 py-2 text-xs text-muted-foreground" aria-live="polite">
          {resultLabel}
        </div>
      )}
    </div>
  );
}

