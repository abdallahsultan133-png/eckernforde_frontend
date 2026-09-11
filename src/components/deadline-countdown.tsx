import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlarmClock, CalendarClock } from "lucide-react";

import { cn } from "@/lib/utils";

type Props = {
    /** ISO timestamp of the assignment deadline, or null/undefined for "no due date". */
    dueAt: string | null | undefined;
    /** `inline` — one compact line for cards. `panel` — big rolling day/hr/min/sec blocks. */
    variant?: "inline" | "panel";
    className?: string;
};

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const pad = (n: number) => String(n).padStart(2, "0");

const parts = (ms: number) => ({
    days: Math.floor(ms / DAY),
    hours: Math.floor((ms % DAY) / HOUR),
    minutes: Math.floor((ms % HOUR) / MINUTE),
    seconds: Math.floor((ms % MINUTE) / SECOND),
});

const absoluteLabel = (target: number) =>
    new Date(target).toLocaleString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

/**
 * Live "time left to submit" countdown for an assignment deadline. Ticks every
 * second; on the `panel` variant each digit rolls downwards as it changes, so a
 * student can watch the window close in real time.
 */
export function DeadlineCountdown({ dueAt, variant = "inline", className }: Props) {
    const target = dueAt ? new Date(dueAt).getTime() : null;
    const valid = target !== null && !Number.isNaN(target);

    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        if (!valid) return;
        const id = setInterval(() => setNow(Date.now()), SECOND);
        return () => clearInterval(id);
    }, [valid]);

    if (!valid) {
        return (
            <span className={cn("inline-flex items-center gap-1.5 text-xs text-muted-foreground", className)}>
                <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" /> No due date
            </span>
        );
    }

    const remaining = (target as number) - now;
    const passed = remaining <= 0;
    const { days, hours, minutes, seconds } = parts(Math.max(0, remaining));
    const absolute = absoluteLabel(target as number);

    const tone = passed || remaining < HOUR
        ? "text-red-600 dark:text-red-400"
        : remaining < DAY
            ? "text-amber-600 dark:text-amber-400"
            : "text-foreground";

    // ── Inline (cards) ──────────────────────────────────────────────────────
    if (variant === "inline") {
        return (
            <span
                className={cn("inline-flex items-center gap-1.5 text-xs font-medium tabular-nums", tone, className)}
                title={`Due ${absolute}`}
            >
                <AlarmClock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {passed ? (
                    <>Closed &mdash; was due {absolute}</>
                ) : days > 0 ? (
                    <>{days}d {pad(hours)}:{pad(minutes)}:{pad(seconds)} left</>
                ) : (
                    <>{pad(hours)}:{pad(minutes)}:{pad(seconds)} left</>
                )}
            </span>
        );
    }

    // ── Panel (detail page) ─────────────────────────────────────────────────
    if (passed) {
        return (
            <div
                className={cn(
                    "flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300",
                    className,
                )}
            >
                <AlarmClock className="h-4 w-4 shrink-0" aria-hidden="true" />
                Deadline passed &mdash; submissions closed {absolute}.
            </div>
        );
    }

    // Each unit gets its own jewel-tone panel so the four blocks read as
    // distinct at a glance (days = indigo, hrs = cyan, min = emerald, sec =
    // fuchsia). When the deadline is close the urgency state overrides the ring,
    // glow and digit colour (below) so the red / amber warning still dominates.
    type CellStyle = { panel: string; ring: string; digit: string; label: string };
    const CELL_STYLES: CellStyle[] = [
        { panel: "from-indigo-700 to-indigo-950",   ring: "ring-1 ring-indigo-300/30",  digit: "text-indigo-50 [text-shadow:0_0_12px_rgba(129,140,248,0.55)]",  label: "text-indigo-600 dark:text-indigo-300/80" },
        { panel: "from-cyan-700 to-cyan-950",       ring: "ring-1 ring-cyan-300/30",    digit: "text-cyan-50 [text-shadow:0_0_12px_rgba(34,211,238,0.55)]",     label: "text-cyan-600 dark:text-cyan-300/80" },
        { panel: "from-emerald-700 to-emerald-950", ring: "ring-1 ring-emerald-300/30", digit: "text-emerald-50 [text-shadow:0_0_12px_rgba(52,211,153,0.55)]",  label: "text-emerald-600 dark:text-emerald-300/80" },
        { panel: "from-fuchsia-700 to-fuchsia-950", ring: "ring-1 ring-fuchsia-300/30", digit: "text-fuchsia-50 [text-shadow:0_0_12px_rgba(232,121,249,0.55)]", label: "text-fuchsia-600 dark:text-fuchsia-300/80" },
    ];

    const cells: Array<{ value: number; label: string; padded: boolean; style: CellStyle }> = [
        { value: days, label: days === 1 ? "day" : "days", padded: false, style: CELL_STYLES[0]! },
        { value: hours, label: "hrs", padded: true, style: CELL_STYLES[1]! },
        { value: minutes, label: "min", padded: true, style: CELL_STYLES[2]! },
        { value: seconds, label: "sec", padded: true, style: CELL_STYLES[3]! },
    ];

    const urgent = remaining < HOUR;
    const soon = !urgent && remaining < DAY;

    // Shared drop shadow for the calm state; the urgency states swap in a
    // coloured ring + outer glow that applies to all four cells at once.
    const baseShadow = "shadow-[0_8px_20px_-8px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.08)]";
    const urgencyAccent = urgent
        ? "ring-2 ring-red-500/70 shadow-[0_8px_20px_-6px_rgba(0,0,0,0.55),0_0_18px_-2px_rgba(239,68,68,0.55),inset_0_1px_0_0_rgba(255,255,255,0.08)]"
        : soon
            ? "ring-2 ring-amber-400/60 shadow-[0_8px_20px_-6px_rgba(0,0,0,0.55),0_0_16px_-3px_rgba(251,191,36,0.5),inset_0_1px_0_0_rgba(255,255,255,0.08)]"
            : null;
    const urgencyDigit = urgent
        ? "text-red-200 [text-shadow:0_0_12px_rgba(239,68,68,0.5)]"
        : soon
            ? "text-amber-100 [text-shadow:0_0_12px_rgba(251,191,36,0.5)]"
            : null;
    const urgencyLabel = urgent
        ? "text-red-600 dark:text-red-400"
        : soon
            ? "text-amber-600 dark:text-amber-400"
            : null;

    return (
        <div className={cn("space-y-2.5", className)}>
            <p className={cn("flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide", tone)}>
                <AlarmClock className="h-3.5 w-3.5" aria-hidden="true" /> Time until deadline
            </p>
            <div className="flex items-start gap-2" role="timer" aria-label={`Deadline ${absolute}`}>
                {cells.map((cell) => (
                    <div key={cell.label} className="flex flex-col items-center gap-1.5">
                        {/* split-flap style display: tinted panel, glass sheen, hinge seam */}
                        <div
                            className={cn(
                                "relative h-14 w-[3.75rem] overflow-hidden rounded-xl border border-white/10 bg-gradient-to-b",
                                cell.style.panel,
                                urgencyAccent ?? cn(cell.style.ring, baseShadow),
                            )}
                        >
                            <span className="pointer-events-none absolute inset-x-0 top-0 z-10 h-1/2 bg-gradient-to-b from-white/10 to-transparent" />
                            <span className="pointer-events-none absolute inset-x-0 top-1/2 z-10 h-px -translate-y-[0.5px] bg-black/55" />
                            <span className="pointer-events-none absolute inset-x-0 top-1/2 z-10 h-px translate-y-[0.5px] bg-white/[0.06]" />
                            <AnimatePresence initial={false}>
                                <motion.span
                                    key={cell.value}
                                    initial={{ y: "-70%", opacity: 0 }}
                                    animate={{ y: "0%", opacity: 1 }}
                                    exit={{ y: "70%", opacity: 0 }}
                                    transition={{ duration: 0.16, ease: "circOut" }}
                                    className={cn(
                                        "absolute inset-0 flex items-center justify-center font-mono text-[1.6rem] font-bold tabular-nums",
                                        urgencyDigit ?? cell.style.digit,
                                    )}
                                >
                                    {cell.padded ? pad(cell.value) : cell.value}
                                </motion.span>
                            </AnimatePresence>
                        </div>
                        <span
                            className={cn(
                                "text-[10px] font-semibold uppercase tracking-[0.15em]",
                                urgencyLabel ?? cell.style.label,
                            )}
                        >
                            {cell.label}
                        </span>
                    </div>
                ))}
            </div>
            <p className="text-xs text-muted-foreground">Due {absolute}</p>
        </div>
    );
}
