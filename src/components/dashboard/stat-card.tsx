import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
    title: string;
    value: string;
    icon: LucideIcon;
    description?: string;
    color?: "blue" | "green" | "amber" | "red" | "purple";
    index?: number;
    /** When set (0-100), renders a meter under the value — for percentage-based stats. */
    percent?: number;
    /**
     * Percent (or percentage-point, for rates) change vs. the prior period.
     * Only render this when the backend actually supplies a value for the
     * metric — `undefined`/`null` renders no trend row rather than a fake one.
     */
    trendValue?: number | null;
    trendLabel?: string;
}

// Colour lives only in the accents — the surface stays neutral so the numbers
// carry the card. `tile` = the icon chip, `bar` = the hairline along the top,
// `glow` = a soft corner light, `meter` = the progress fill.
const ACCENT = {
    blue: {
        tile: "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300",
        bar: "from-blue-500/60",
        glow: "bg-blue-500/[0.12]",
        meter: "bg-blue-500 dark:bg-blue-400",
        hoverBorder: "group-hover:border-blue-500/40",
    },
    green: {
        tile: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300",
        bar: "from-emerald-500/60",
        glow: "bg-emerald-500/[0.12]",
        meter: "bg-emerald-500 dark:bg-emerald-400",
        hoverBorder: "group-hover:border-emerald-500/40",
    },
    amber: {
        tile: "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300",
        bar: "from-amber-500/60",
        glow: "bg-amber-500/[0.12]",
        meter: "bg-amber-500 dark:bg-amber-400",
        hoverBorder: "group-hover:border-amber-500/40",
    },
    red: {
        tile: "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-300",
        bar: "from-red-500/60",
        glow: "bg-red-500/[0.12]",
        meter: "bg-red-500 dark:bg-red-400",
        hoverBorder: "group-hover:border-red-500/40",
    },
    purple: {
        tile: "bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300",
        bar: "from-violet-500/60",
        glow: "bg-violet-500/[0.12]",
        meter: "bg-violet-500 dark:bg-violet-400",
        hoverBorder: "group-hover:border-violet-500/40",
    },
};

/** Eases a numeric value up from 0 on mount / when it changes. Non-numeric
 *  values (e.g. "—") and reduced-motion users get the final value immediately. */
function useCountUp(target: string) {
    const reduce = useReducedMotion();
    const [display, setDisplay] = useState(target);

    useEffect(() => {
        const match = target.match(/^(\D*)(-?\d[\d,]*(?:\.\d+)?)(.*)$/);
        if (!match || reduce) {
            setDisplay(target);
            return;
        }
        const [, prefix, numStr, suffix] = match;
        const end = parseFloat(numStr.replace(/,/g, ""));
        const decimals = numStr.split(".")[1]?.length ?? 0;
        if (!Number.isFinite(end) || end === 0) {
            setDisplay(target);
            return;
        }

        const duration = 850;
        const startedAt = performance.now();
        let raf = 0;
        const step = (now: number) => {
            const t = Math.min(1, (now - startedAt) / duration);
            const eased = 1 - Math.pow(1 - t, 3);
            const current = end * eased;
            setDisplay(
                `${prefix}${current.toLocaleString(undefined, {
                    minimumFractionDigits: decimals,
                    maximumFractionDigits: decimals,
                })}${suffix}`,
            );
            if (t < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
        return () => cancelAnimationFrame(raf);
    }, [target, reduce]);

    return display;
}

function TrendPill({ value, label = "vs last month" }: { value: number; label?: string }) {
    const flat = Math.abs(value) < 0.1;
    const up = value > 0;
    const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight;
    const tone = flat
        ? "bg-muted text-muted-foreground"
        : up
            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            : "bg-red-500/10 text-red-600 dark:text-red-400";

    return (
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={cn("inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold", tone)}>
                <Icon className="h-3 w-3" />
                {flat ? "0%" : `${up ? "+" : ""}${value}%`}
            </span>
            {label}
        </span>
    );
}

export function StatCard({
    title,
    value,
    icon: Icon,
    description,
    color = "blue",
    index = 0,
    percent,
    trendValue,
    trendLabel,
}: StatCardProps) {
    const accent = ACCENT[color];
    const display = useCountUp(value);

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: index * 0.06, ease: "easeOut" }}
            className="group"
        >
            <Card
                className={cn(
                    "relative gap-0 overflow-hidden p-5 transition-all duration-200",
                    "hover:-translate-y-0.5 hover:shadow-lg",
                    accent.hoverBorder,
                )}
            >
                {/* top hairline accent */}
                <span className={cn("pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r to-transparent", accent.bar)} />
                {/* soft corner light */}
                <span className={cn("pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl", accent.glow)} />

                <div className="relative flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-2">
                        <p className="truncate text-[13px] font-medium text-muted-foreground">{title}</p>
                        <p className="text-[2rem] font-semibold leading-none tracking-tight text-foreground">
                            {display}
                        </p>
                    </div>
                    <span
                        className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ring-black/[0.04] dark:ring-white/[0.06]",
                            accent.tile,
                        )}
                    >
                        <Icon className="h-[18px] w-[18px]" />
                    </span>
                </div>

                <div className="relative mt-3 space-y-2">
                    {trendValue !== undefined && trendValue !== null ? (
                        <TrendPill value={trendValue} label={trendLabel} />
                    ) : (
                        description && <p className="text-xs text-muted-foreground">{description}</p>
                    )}

                    {percent !== undefined && (
                        <div className="flex items-center gap-2">
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                                <motion.div
                                    className={cn("h-full rounded-full", accent.meter)}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
                                    transition={{ duration: 0.7, delay: 0.15 + index * 0.06, ease: "easeOut" }}
                                />
                            </div>
                            <span className="text-[11px] font-medium tabular-nums text-muted-foreground">
                                {Math.round(percent)}%
                            </span>
                        </div>
                    )}
                </div>
            </Card>
        </motion.div>
    );
}
