import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import { Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { useApiQuery } from "@/hooks/use-api-query.ts";
import { VIZ, axisProps, barCursor, gridProps } from "./chart-kit";
import { VizTooltip } from "./viz-tooltip";

type ClassActivity = {
    classId: number;
    className: string;
    assignments: number;
    submissions: number;
    attendanceMarks: number;
};

interface ClassActivityChartProps {
    /**
     * Render the student-facing version: the rows are the signed-in student's
     * own enrolled classes, so the copy explains this is a read on which of
     * *your* classes are busiest (counts are class-wide, not just your own work).
     */
    personal?: boolean;
}

// Categorical — fixed slot order, colour follows the metric (never its rank).
const SERIES = [
    { key: "assignments", label: "Assignments", color: VIZ.cat[0] },
    { key: "submissions", label: "Submissions", color: VIZ.cat[1] },
    { key: "attendanceMarks", label: "Attendance", color: VIZ.cat[2] },
] as const;

const truncate = (name: string, max = 16) => (name.length > max ? `${name.slice(0, max - 1)}…` : name);

export function ClassActivityChart({ personal = false }: ClassActivityChartProps) {
    const { data, isLoading, isError, refetch } = useApiQuery<{ data: ClassActivity[] }>("/dashboard/class-activity");
    const classes = (data?.data ?? []).map((c) => ({ ...c, label: truncate(c.className) }));

    const totals = classes.reduce(
        (acc, c) => ({
            assignments: acc.assignments + c.assignments,
            submissions: acc.submissions + c.submissions,
            attendanceMarks: acc.attendanceMarks + c.attendanceMarks,
        }),
        { assignments: 0, submissions: 0, attendanceMarks: 0 },
    );
    const busiest = classes
        .map((c) => ({ name: c.className, score: c.assignments + c.submissions + c.attendanceMarks }))
        .sort((a, b) => b.score - a.score)[0];

    const chartHeight = Math.max(220, classes.length * 56 + 40);

    return (
        <div className="rounded-xl border p-6">
            <h2 className="text-xl font-semibold">Class Activity</h2>
            <p className="mb-4 mt-1 text-sm text-muted-foreground">
                {personal
                    ? "How busy each of your classes has been over the last 30 days — new assignments set, work submitted, and attendance taken."
                    : "Assignments set, work submitted, and attendance taken per class — last 30 days."}
            </p>

            {isLoading ? (
                <Skeleton className="h-[280px] w-full" />
            ) : isError ? (
                <ErrorState
                    className="h-[280px] justify-center"
                    description="Unable to load class activity."
                    onRetry={refetch}
                />
            ) : classes.length === 0 ? (
                <EmptyState
                    className="h-[280px] justify-center"
                    icon={Activity}
                    title="No class activity yet"
                    description={
                        personal
                            ? "Once your classes start setting assignments and taking attendance, you'll see which ones are most active here."
                            : "Activity will show up here once classes start recording work."
                    }
                />
            ) : (
                <>
                    <ResponsiveContainer width="100%" height={chartHeight}>
                        <BarChart
                            data={classes}
                            layout="vertical"
                            margin={{ top: 4, right: 12, bottom: 0, left: 4 }}
                            barGap={2}
                            barCategoryGap="28%"
                        >
                            <CartesianGrid {...gridProps} vertical horizontal={false} />
                            <XAxis type="number" allowDecimals={false} {...axisProps} />
                            <YAxis type="category" dataKey="label" width={96} {...axisProps} />
                            <Tooltip
                                cursor={barCursor}
                                content={({ active, payload }) => (
                                    <VizTooltip
                                        active={active}
                                        payload={payload}
                                        heading={
                                            (payload?.[0]?.payload as ClassActivity | undefined)?.className
                                        }
                                        unit="items"
                                    />
                                )}
                            />
                            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} iconType="circle" iconSize={9} />
                            {SERIES.map((s) => (
                                <Bar
                                    key={s.key}
                                    dataKey={s.key}
                                    name={s.label}
                                    fill={s.color}
                                    radius={[0, 4, 4, 0]}
                                    maxBarSize={13}
                                    isAnimationActive={false}
                                />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>

                    {personal && (
                        <div className="mt-4 space-y-2 border-t pt-4">
                            <p className="text-sm text-foreground">
                                Across your <span className="font-medium">{classes.length}</span>{" "}
                                {classes.length === 1 ? "class" : "classes"} in the last 30 days:{" "}
                                {totals.assignments} assignment{totals.assignments === 1 ? "" : "s"} set,{" "}
                                {totals.submissions} submission{totals.submissions === 1 ? "" : "s"},{" "}
                                {totals.attendanceMarks} attendance record{totals.attendanceMarks === 1 ? "" : "s"}
                                {busiest && busiest.score > 0 ? (
                                    <>. Most active: <span className="font-medium">{busiest.name}</span></>
                                ) : (
                                    "."
                                )}
                            </p>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                {SERIES.map((s) => (
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
                                Counts cover the whole class, not just your own work — a quick read on where the most is happening.
                            </p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
