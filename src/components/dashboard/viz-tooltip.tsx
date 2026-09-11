import type { ReactNode } from "react";

type VizTooltipPayloadItem = {
    name?: ReactNode;
    value?: unknown;
    color?: string;
    dataKey?: unknown;
};

type VizTooltipProps = {
    /** Injected by recharts. */
    active?: boolean;
    /** Injected by recharts — the hovered category / x value. */
    label?: string | number;
    /** Injected by recharts — one entry per series at the hovered x. */
    payload?: ReadonlyArray<VizTooltipPayloadItem>;
    /** Appended after each numeric value, e.g. "students" or "%". */
    unit?: string;
    /** Overrides the bold heading (defaults to the category `label`). */
    heading?: ReactNode;
};

/**
 * Tooltip readout: value leads (strong, tabular), series name follows, keyed by
 * a short line of the mark colour — not a filled box. Every series at the
 * hovered X is listed, so the pointer never has to land on a mark. Text is
 * rendered as React children, so untrusted series/category names are escaped.
 */
export function VizTooltip({ active, payload, label, unit, heading }: VizTooltipProps) {
    if (!active || !payload?.length) return null;

    return (
        <div className="rounded-lg border border-border/60 bg-popover px-3 py-2 text-xs shadow-lg">
            {heading != null || (label !== undefined && label !== "") ? (
                <div className="mb-1.5 font-medium text-popover-foreground">{heading ?? label}</div>
            ) : null}
            <div className="space-y-1">
                {payload.map((item, i) => (
                    <div key={String(item.dataKey ?? item.name ?? i)} className="flex items-center gap-2">
                        <span
                            className="h-0.5 w-3 shrink-0 rounded-full"
                            style={{ background: item.color }}
                            aria-hidden="true"
                        />
                        <span className="text-muted-foreground">{item.name}</span>
                        <span className="ml-auto font-medium tabular-nums text-popover-foreground">
                            {typeof item.value === "number" ? item.value.toLocaleString() : String(item.value ?? "")}
                            {unit ? ` ${unit}` : ""}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
