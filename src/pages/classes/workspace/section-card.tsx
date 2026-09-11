import type { ReactNode } from "react";
import { cn } from "@/lib/utils.ts";

interface SectionCardProps {
  title: ReactNode;
  /** Small count pill next to the title. */
  count?: number;
  /** Right-aligned slot — usually a single action button. */
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Drop the inner padding (for edge-to-edge divided lists). */
  flush?: boolean;
}

/** The shared frame for every class-workspace tab: a bordered card with a
 *  header row (title · count · action) over the tab body. */
export function SectionCard({
  title,
  count,
  action,
  children,
  className,
  flush = false,
}: SectionCardProps) {
  return (
    <div className={cn("rounded-xl border", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-5 py-3.5">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          {title}
          {typeof count === "number" && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold tabular-nums text-muted-foreground">
              {count}
            </span>
          )}
        </h2>
        {action}
      </div>
      <div className={cn(!flush && "p-5")}>{children}</div>
    </div>
  );
}

SectionCard.displayName = "SectionCard";
