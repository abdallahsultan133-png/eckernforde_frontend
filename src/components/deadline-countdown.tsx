import { useEffect, useState } from "react";
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
  if (remaining < DAY) return { label: "Less than 24 hours", tone: "warning" as const };
  if (remaining < 3 * DAY) return { label: "Due soon", tone: "notice" as const };
  return { label: "On track", tone: "calm" as const };
}

/** Live assignment deadline with a compact-list and a detailed, accessible panel variant. */
export function DeadlineCountdown({ dueAt, variant = "inline", className }: Props) {
  const target = dueAt ? Date.parse(dueAt) : Number.NaN;
  const valid = Number.isFinite(target);
  const [now, setNow] = useState(() => Date.now());

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

  if (!valid) {
    if (variant === "panel") return <section className={cn("flex items-center gap-3 rounded-xl border bg-muted/20 px-4 py-3", className)} aria-label="Homework deadline"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-background text-muted-foreground"><CalendarClock className="h-4 w-4" aria-hidden="true" /></span><div><p className="text-sm font-semibold">No deadline scheduled</p><p className="text-xs text-muted-foreground">Students can submit until a deadline is added.</p></div></section>;
    return <span className={cn("inline-flex items-center gap-1.5 text-xs text-muted-foreground", className)}><CalendarClock className="h-3.5 w-3.5" aria-hidden="true" /> No due date</span>;
  }

  const remaining = target - now;
  const passed = remaining <= 0;
  const values = remainingParts(remaining);
  const absolute = dueLabel(target);

  if (variant === "inline") {
    return <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium tabular-nums", passed ? "text-destructive" : remaining < DAY ? "text-amber-700 dark:text-amber-400" : "text-muted-foreground", className)} title={`Due ${absolute}`}><AlarmClock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />{passed ? `Closed · due ${absolute}` : values.days > 0 ? `${values.days}d ${pad(values.hours)}:${pad(values.minutes)}:${pad(values.seconds)} left` : `${pad(values.hours)}:${pad(values.minutes)}:${pad(values.seconds)} left`}</span>;
  }

  if (passed) return <section className={cn("relative overflow-hidden rounded-xl border border-destructive/25 bg-card shadow-sm", className)} aria-label="Homework deadline"><div className="absolute inset-x-0 top-0 h-1 bg-destructive" /><div className="flex items-start gap-3 px-4 py-4 sm:px-5"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-destructive/20 bg-destructive/[0.08] text-destructive"><CircleAlert className="h-5 w-5" aria-hidden="true" /></span><div><p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-destructive">Submissions closed</p><p className="mt-0.5 font-semibold">Deadline passed</p><p className="mt-1 text-sm text-muted-foreground">The deadline was {absolute}.</p></div></div></section>;

  const state = urgency(remaining);
  const stateClasses = {
    calm: "border-primary/20 bg-primary/[0.045] text-primary",
    notice: "border-sky-500/25 bg-sky-500/[0.07] text-sky-700 dark:text-sky-300",
    warning: "border-amber-500/25 bg-amber-500/[0.08] text-amber-700 dark:text-amber-300",
    critical: "border-destructive/25 bg-destructive/[0.07] text-destructive",
  }[state.tone];
  const cells = [{ value: values.days, label: values.days === 1 ? "Day" : "Days", padded: false }, { value: values.hours, label: "Hours", padded: true }, { value: values.minutes, label: "Minutes", padded: true }, { value: values.seconds, label: "Seconds", padded: true }];

  return (
    <section className={cn("overflow-hidden rounded-lg border bg-card", className)} aria-label="Homework deadline">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-3">
        <p className="flex items-center gap-2 text-sm font-medium"><AlarmClock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />Time remaining</p>
        <span className={cn("rounded-md border px-2 py-0.5 text-[11px] font-medium", stateClasses)}>{state.label}</span>
      </div>
      <div className="grid grid-cols-4 divide-x px-3 py-4" role="timer" aria-live="off" aria-label={`${values.days} days, ${values.hours} hours, ${values.minutes} minutes and ${values.seconds} seconds remaining`}>
        {cells.map((cell) => (
          <div key={cell.label} className="min-w-0 text-center">
            <span className="block font-mono text-2xl font-semibold leading-none tabular-nums sm:text-3xl">{cell.padded ? pad(cell.value) : cell.value}</span>
            <span className="mt-1.5 block text-[10px] text-muted-foreground">{cell.label}</span>
          </div>
        ))}
      </div>
      <details className="border-t bg-muted/20">
        <summary className="cursor-pointer px-4 py-2 text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">Deadline details</summary>
        <div className="space-y-1 px-4 pb-3 text-xs text-muted-foreground">
          <p>Due <time dateTime={new Date(target).toISOString()} className="font-medium text-foreground">{absolute}</time></p>
          <p>Time zone: {Intl.DateTimeFormat().resolvedOptions().timeZone}</p>
          <p>Submissions close when the countdown reaches zero.</p>
        </div>
      </details>
    </section>
  );
}
