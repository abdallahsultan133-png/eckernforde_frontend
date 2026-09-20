import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Small status pill with tones that are legible in BOTH themes. Several pages
 * (assignments, calendar, report cards) had hand-rolled `bg-red-100 text-red-700`
 * spans with no `dark:` variant — invisible-on-invisible in dark mode. Use this
 * instead so status colour is defined once and stays accessible.
 */
export type StatusTone =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "critical";

const TONE: Record<StatusTone, string> = {
  neutral: "border-border bg-muted/60 text-muted-foreground",
  info: "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  success:
    "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  warning:
    "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  critical: "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300",
};

interface StatusBadgeProps {
  tone?: StatusTone;
  children: ReactNode;
  /** Optional leading icon or dot. */
  icon?: ReactNode;
  className?: string;
  title?: string;
}

export function StatusBadge({
  tone = "neutral",
  children,
  icon,
  className,
  title,
}: StatusBadgeProps) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium",
        TONE[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}
