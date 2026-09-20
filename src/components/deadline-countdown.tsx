import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { AlarmClock, CalendarClock, CircleAlert } from "lucide-react";

import { cn } from "@/lib/utils";

type Props = {
  dueAt: string | null | undefined;
  variant?: "inline" | "panel";
  className?: string;
};

const SECOND = 1_000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const pad = (value: number) => String(value).padStart(2, "0");

function remainingParts(milliseconds: number) {
  const value = Math.max(0, milliseconds);
  return {
    days: Math.floor(value / DAY),
    hours: Math.floor((value % DAY) / HOUR),
    minutes: Math.floor((value % HOUR) / MINUTE),
    seconds: Math.floor((value % MINUTE) / SECOND),
  };
}

function dueLabel(target: number) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit",
  }).format(target);
}

function urgency(remaining: number) {
  if (remaining < HOUR) return { label: "Due in less than an hour", tone: "critical" as const };
  if (remaining < DAY) return { label: "Due today", tone: "warning" as const };
  if (remaining < 3 * DAY) return { label: "Due soon", tone: "notice" as const };
  return { label: "On track", tone: "calm" as const };
}

/** Live assignment deadline with a compact-list and a detailed, accessible panel variant. */
export function DeadlineCountdown({ dueAt, variant = "inline", className }: Props) {
  const target = dueAt ? Date.parse(dueAt) : Number.NaN;
  const valid = Number.isFinite(target);
  const [now, setNow] = useState(() => Date.now());
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!valid) return;
    // Align ticking to the next second so the display does not drift during a long visit.
    const delay = SECOND - (Date.now() % SECOND);
    let interval: number | undefined;
    const timeout = window.setTimeout(() => {
      setNow(Date.now());
      interval = window.setInterval(() => setNow(Date.now()), SECOND);
    }, delay);
    return () => {
      window.clearTimeout(timeout);
      if (interval !== undefined) window.clearInterval(interval);
    };
  }, [valid, dueAt]);

  if (!valid) return <span className={cn("inline-flex items-center gap-1.5 text-xs text-muted-foreground", className)}><CalendarClock className="h-3.5 w-3.5" aria-hidden="true" /> No due date</span>;

  const remaining = target - now;
  const passed = remaining <= 0;
  const values = remainingParts(remaining);
  const absolute = dueLabel(target);

  if (variant === "inline") {
    return <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium tabular-nums", passed ? "text-destructive" : remaining < DAY ? "text-amber-700 dark:text-amber-400" : "text-muted-foreground", className)} title={`Due ${absolute}`}><AlarmClock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />{passed ? `Closed · due ${absolute}` : values.days > 0 ? `${values.days}d ${pad(values.hours)}:${pad(values.minutes)}:${pad(values.seconds)} left` : `${pad(values.hours)}:${pad(values.minutes)}:${pad(values.seconds)} left`}</span>;
  }

  if (passed) return <div className={cn("flex items-start gap-3 rounded-xl border border-destructive/25 bg-destructive/[0.06] p-4 text-sm", className)}><CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden="true" /><div><p className="font-semibold text-destructive">Deadline passed</p><p className="mt-1 text-muted-foreground">Submissions closed on {absolute}.</p></div></div>;

  const state = urgency(remaining);
  const stateClasses = {
    calm: "border-primary/20 bg-primary/[0.045] text-primary",
    notice: "border-sky-500/25 bg-sky-500/[0.07] text-sky-700 dark:text-sky-300",
    warning: "border-amber-500/25 bg-amber-500/[0.08] text-amber-700 dark:text-amber-300",
    critical: "border-destructive/25 bg-destructive/[0.07] text-destructive",
  }[state.tone];
  const cellClasses = {
    calm: "border-primary/15 bg-background",
    notice: "border-sky-500/20 bg-sky-500/[0.045]",
    warning: "border-amber-500/20 bg-amber-500/[0.055]",
    critical: "border-destructive/20 bg-destructive/[0.05]",
  }[state.tone];
  const cells = [{ value: values.days, label: values.days === 1 ? "Day" : "Days", padded: false }, { value: values.hours, label: "Hours", padded: true }, { value: values.minutes, label: "Minutes", padded: true }, { value: values.seconds, label: "Seconds", padded: true }];

  return <section className={cn("overflow-hidden rounded-xl border border-border/70 bg-muted/[0.18]", className)} aria-label="Assignment deadline">
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/70 px-4 py-3.5 sm:px-5">
      <div className="flex items-start gap-2.5"><span className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border", stateClasses)}><AlarmClock className="h-4 w-4" aria-hidden="true" /></span><div><p className="text-sm font-semibold">Time remaining</p><p className="mt-0.5 text-xs text-muted-foreground">Due {absolute}</p></div></div>
      <span className={cn("rounded-full border px-2.5 py-1 text-[11px] font-semibold", stateClasses)}>{state.label}</span>
    </div>
    <div className="flex flex-nowrap gap-2 overflow-x-auto p-3 sm:gap-3 sm:p-4" role="timer" aria-live="polite" aria-label={`${values.days} days, ${values.hours} hours, ${values.minutes} minutes and ${values.seconds} seconds remaining`}>
      {cells.map((cell) => <div key={cell.label} className={cn("inline-flex min-w-[4.75rem] flex-1 items-center justify-center gap-1.5 rounded-lg border px-2 py-3 text-center sm:gap-2 sm:px-3", cellClasses)}><motion.span key={cell.value} initial={reduceMotion ? false : { opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.16 }} className="font-mono text-xl font-bold tracking-tight tabular-nums sm:text-2xl">{cell.padded ? pad(cell.value) : cell.value}</motion.span><span className={cn("text-[9px] font-semibold uppercase tracking-[0.08em] sm:text-[10px]", cell.label === "Seconds" ? "text-destructive" : "text-muted-foreground")}>{cell.label}</span></div>)}
    </div>
  </section>;
}
