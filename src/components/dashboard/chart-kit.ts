/**
 * Shared chart chrome so every dashboard chart reads as one system.
 *
 * Colour roles (defined in App.css as --viz-*, validated with the dataviz
 * skill's checks):
 *   • categorical  → VIZ.cat[0..2]  blue / orange / aqua, assigned in fixed order
 *   • status       → VIZ.good / warning / critical  (present / late / absent)
 *   • single hue   → VIZ.primary    (grade-distribution counts — one series)
 * Grid and axis text use the app's own border / muted-foreground tokens so
 * they stay recessive and theme-correct.
 *
 * The tooltip readout lives in ./viz-tooltip.tsx.
 */

export const VIZ = {
    cat: ["var(--viz-cat-1)", "var(--viz-cat-2)", "var(--viz-cat-3)"] as const,
    good: "var(--viz-good)",
    warning: "var(--viz-warning)",
    critical: "var(--viz-critical)",
    primary: "var(--viz-primary)",
    surface: "var(--card)",
    grid: "var(--border)",
    axis: "var(--muted-foreground)",
};

/** Recessive hairline grid — solid, one direction, never dashed. */
export const gridProps = {
    stroke: VIZ.grid,
    strokeOpacity: 0.6,
    vertical: false as const,
    horizontal: true as const,
};

/** Clean axis: no spine, no tick marks, muted 12px labels with breathing room. */
export const axisProps = {
    stroke: VIZ.axis,
    tick: { fill: VIZ.axis, fontSize: 12 } as const,
    tickLine: false as const,
    axisLine: false as const,
    tickMargin: 8,
};

/** Faint block that follows the pointer across a bar chart's category. */
export const barCursor = { fill: "var(--muted)", fillOpacity: 0.5, radius: 4 } as const;

/** Thin vertical hairline that snaps to the nearest point on a line/area chart. */
export const crosshair = { stroke: VIZ.axis, strokeWidth: 1, strokeOpacity: 0.6 } as const;

/** Hover end-dot with a 2px surface ring so it stays legible over a fill. */
export const activeDot = { r: 4, strokeWidth: 2, stroke: VIZ.surface } as const;
