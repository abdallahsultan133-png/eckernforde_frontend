import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "default" | "success" | "warning" | "critical" | "info";

export interface SummaryItem {
  label: string;
  value: ReactNode;
  tone?: Tone;
  hint?: string;
}

const VALUE_TONE: Record<Tone, string> = {
  default: "text-foreground",
  success: "text-emerald-600 dark:text-emerald-400",
  warning: "text-amber-600 dark:text-amber-400",
  critical: "text-red-600 dark:text-red-400",
  info: "text-blue-600 dark:text-blue-400",
};

/**
 * A compact horizontal band of headline numbers — class average, count at risk,
 * grade spread. Lighter than the dashboard `StatCard` (no animation, no meter);
 * meant to sit above a table and summarise what's in it.
 */
export function SummaryBar({
  items,
  className,
}: {
  items: SummaryItem[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 divide-x divide-y overflow-hidden rounded-xl border sm:grid-cols-3 sm:divide-y-0 md:flex md:divide-y-0",
        className,
      )}
    >
      {items.map((item, i) => (
        <div key={i} className="min-w-0 flex-1 px-4 py-3">
          <div
            className={cn(
              "text-lg font-semibold tabular-nums leading-tight",
              VALUE_TONE[item.tone ?? "default"],
            )}
          >
            {item.value}
          </div>
          <div className="mt-0.5 truncate text-xs text-muted-foreground">{item.label}</div>
          {item.hint && (
            <div className="truncate text-[11px] text-muted-foreground/70">{item.hint}</div>
          )}
        </div>
      ))}
    </div>
  );
}

SummaryBar.displayName = "SummaryBar";
