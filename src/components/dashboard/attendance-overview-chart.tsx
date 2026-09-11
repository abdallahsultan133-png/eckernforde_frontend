import { useState } from "react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ReferenceLine,
    ResponsiveContainer,
} from "recharts";
import { CalendarRange } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { useApiQuery } from "@/hooks/use-api-query.ts";
import { VIZ, activeDot, axisProps, crosshair, gridProps } from "./chart-kit";

type TrendPoint = {
    date: string;
    attendanceRate: number;
    present: number;
    absent: number;
    late: number;
};

const RANGE_OPTIONS = [
    { value: "7", label: "7 days" },
    { value: "30", label: "30 days" },
    { value: "90", label: "3 months" },
    { value: "365", label: "Academic year" },
] as const;

const STATUS = [
    { key: "present", label: "Present", color: VIZ.good },
    { key: "late", label: "Late", color: VIZ.warning },
    { key: "absent", label: "Absent", color: VIZ.critical },
] as const;

const formatLabel = (iso: string, range: string) => {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    if (range === "365") return date.toLocaleDateString(undefined, { month: "short" });
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

interface AttendanceOverviewChartProps {
    /**
     * Render the student-facing version: the data is the signed-in student's own
     * attendance, so the copy, tooltip and a summary read in "your check-ins"
     * terms rather than the org-wide "records over time".
     */
    personal?: boolean;
}

type RatePoint = TrendPoint & { label: string; total: number };

/** Rate leads (the headline number); the day's raw breakdown follows. */
function RateTooltip({
    active,
    payload,
    label,
}: {
    active?: boolean;
    label?: string | number;
    payload?: ReadonlyArray<{ payload?: RatePoint }>;
}) {
    const p = payload?.[0]?.payload;
    if (!active || !p) return null;
    return (
        <div className="min-w-[9rem] rounded-lg border border-border/60 bg-popover px-3 py-2 text-xs shadow-lg">
            <div className="flex items-baseline justify-between gap-4">
                <span className="font-medium text-popover-foreground">{label}</span>
                <span className="font-semibold tabular-nums text-popover-foreground">{p.attendanceRate}% present</span>
            </div>
            <div className="mt-1.5 space-y-1">
                {STATUS.map((s) => (
                    <div key={s.key} className="flex items-center gap-2">
                        <span className="h-0.5 w-3 shrink-0 rounded-full" style={{ background: s.color }} aria-hidden="true" />
                        <span className="text-muted-foreground">{s.label}</span>
                        <span className="ml-auto tabular-nums text-popover-foreground">{p[s.key]}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function AttendanceOverviewChart({ personal = false }: AttendanceOverviewChartProps) {
    const [range, setRange] = useState<string>("30");
    const { data, isLoading, isError, refetch } = useApiQuery<{ data: TrendPoint[] }>(
        `/dashboard/attendance-trend?range=${range}`
    );
    const points: RatePoint[] = (data?.data ?? []).map((p) => ({
        ...p,
        label: formatLabel(p.date, range),
        total: p.present + p.late + p.absent,
    }));

    const totals = points.reduce(
        (acc, p) => ({ present: acc.present + p.present, late: acc.late + p.late, absent: acc.absent + p.absent }),
        { present: 0, late: 0, absent: 0 },
    );
    const totalMarks = totals.present + totals.late + totals.absent;
    const presentRate = totalMarks > 0 ? Math.round((totals.present / totalMarks) * 1000) / 10 : 0;
    const rangeLabel = RANGE_OPTIONS.find((o) => o.value === range)?.label ?? `${range} days`;

    return (
        <div className="rounded-xl border p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl font-semibold">Attendance Overview</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {personal
                            ? "The share of your recorded classes you showed up to, day by day."
                            : "Share of recorded classes marked present, day by day."}
                    </p>
                </div>
                <Tabs value={range} onValueChange={setRange}>
                    <TabsList>
                        {RANGE_OPTIONS.map((opt) => (
                            <TabsTrigger key={opt.value} value={opt.value} className="text-xs">
                                {opt.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>
            </div>

            {isLoading ? (
                <Skeleton className="h-[300px] w-full" />
            ) : isError ? (
                <ErrorState
                    className="h-[300px] justify-center"
                    description="Unable to load attendance data."
                    onRetry={refetch}
                />
            ) : points.length === 0 ? (
                <EmptyState
                    className="h-[300px] justify-center"
                    icon={CalendarRange}
                    title="No attendance recorded yet"
                    description={
                        personal
                            ? "Once your teachers start recording attendance for your classes, your day-by-day trend shows up here."
                            : "Mark attendance for a class to see the trend here."
                    }
                    action={{ label: personal ? "View my attendance" : "Mark attendance", to: "/attendance" }}
                />
            ) : (
                <>
                    {totalMarks > 0 && (
                        <p className="mb-3 text-sm text-muted-foreground">
                            <span className="font-semibold text-foreground">{presentRate}%</span> present overall across{" "}
                            <span className="tabular-nums">{totalMarks.toLocaleString()}</span>{" "}
                            {personal ? "check-ins" : "records"} in the {rangeLabel.toLowerCase()}.
                        </p>
                    )}
                    <ResponsiveContainer width="100%" height={288}>
                        <AreaChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                            <defs>
                                <linearGradient id="attendance-fill" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={VIZ.good} stopOpacity={0.18} />
                                    <stop offset="100%" stopColor={VIZ.good} stopOpacity={0.02} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid {...gridProps} />
                            <XAxis dataKey="label" {...axisProps} minTickGap={24} />
                            <YAxis
                                {...axisProps}
                                width={46}
                                domain={[0, 100]}
                                ticks={[0, 25, 50, 75, 100]}
                                tickFormatter={(v: number) => `${v}%`}
                            />
                            <Tooltip cursor={crosshair} content={<RateTooltip />} />
                            {totalMarks > 0 && (
                                <ReferenceLine
                                    y={presentRate}
                                    stroke={VIZ.axis}
                                    strokeDasharray="4 4"
                                    strokeOpacity={0.7}
                                    label={{
                                        value: `avg ${presentRate}%`,
                                        position: "insideTopRight",
                                        fontSize: 10,
                                        fill: VIZ.axis,
                                    }}
                                />
                            )}
                            <Area
                                type="monotone"
                                dataKey="attendanceRate"
                                name="Present rate"
                                stroke={VIZ.good}
                                strokeWidth={2}
                                fill="url(#attendance-fill)"
                                dot={false}
                                activeDot={{ ...activeDot, fill: VIZ.good }}
                                isAnimationActive={false}
                            />
                        </AreaChart>
                    </ResponsiveContainer>

                    {personal && (
                        <div className="mt-4 space-y-2 border-t pt-4">
                            <p className="text-sm text-foreground">
                                You were present at{" "}
                                <span className="font-medium">{presentRate}%</span> of your{" "}
                                <span className="font-medium">{totalMarks}</span>{" "}
                                recorded class check-in{totalMarks === 1 ? "" : "s"} in the {rangeLabel.toLowerCase()}
                                {totalMarks > 0 ? (
                                    <>
                                        {" "}— {totals.present} present, {totals.late} late, {totals.absent} absent.
                                    </>
                                ) : (
                                    "."
                                )}
                            </p>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                {STATUS.map((s) => (
                                    <span key={s.key} className="flex items-center gap-1.5">
                                        <span
                                            className="h-2 w-2 rounded-[3px]"
                                            style={{ backgroundColor: s.color }}
                                            aria-hidden="true"
                                        />
                                        {s.label} — {totals[s.key]}
                                    </span>
                                ))}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Each point is one day. Only sessions a teacher recorded attendance for are shown — if a class looks missing, ask your teacher.
                            </p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
