import { useMemo } from "react";
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
    assignments: number;
    submissions: number;
    attendanceMarks: number;
};

type ClassLookup = {
    id: number;
    subject?: { name?: string | null } | null;
};

type SubjectActivity = {
    subjectName: string;
    label: string;
    assignments: number;
    submissions: number;
    attendanceMarks: number;
};

interface ClassActivityChartProps {
    /** Render the student-facing version for the student's enrolled subjects. */
    personal?: boolean;
}
const SERIES = [
    { key: "assignments", label: "Homework", color: VIZ.cat[0] },
    { key: "submissions", label: "Submissions", color: VIZ.cat[1] },
    { key: "attendanceMarks", label: "Attendance", color: VIZ.cat[2] },
] as const;

const truncate = (name: string, max = 16) => (name.length > max ? `${name.slice(0, max - 1)}...` : name);

export function ClassActivityChart({ personal = false }: ClassActivityChartProps) {
    const { data, isLoading, isError, refetch } = useApiQuery<{ data: ClassActivity[] }>("/dashboard/class-activity");
    const { data: classData, isLoading: classesLoading } = useApiQuery<{ data: ClassLookup[] }>("/classes?limit=100");
    const subjectByClassId = useMemo(
        () => new Map((classData?.data ?? []).map((item) => [item.id, item.subject?.name?.trim() || "Other subjects"])),
        [classData?.data],
    );
    const subjects = useMemo<SubjectActivity[]>(() => {
        const grouped = new Map<string, SubjectActivity>();
        for (const item of data?.data ?? []) {
            const subjectName = subjectByClassId.get(item.classId) ?? "Other subjects";
            const current = grouped.get(subjectName) ?? {
                subjectName,
                label: truncate(subjectName),
                assignments: 0,
                submissions: 0,
                attendanceMarks: 0,
            };
            current.assignments += item.assignments;
            current.submissions += item.submissions;
            current.attendanceMarks += item.attendanceMarks;
            grouped.set(subjectName, current);
        }
        return Array.from(grouped.values());
    }, [data?.data, subjectByClassId]);

    const totals = subjects.reduce(
        (acc, subject) => ({
            assignments: acc.assignments + subject.assignments,
            submissions: acc.submissions + subject.submissions,
            attendanceMarks: acc.attendanceMarks + subject.attendanceMarks,
        }),
        { assignments: 0, submissions: 0, attendanceMarks: 0 },
    );
    const busiest = subjects
        .map((subject) => ({ name: subject.subjectName, score: subject.assignments + subject.submissions + subject.attendanceMarks }))
        .sort((a, b) => b.score - a.score)[0];
    const chartHeight = Math.max(220, subjects.length * 56 + 40);

    return (
        <div className="rounded-xl border p-4">
            <h2 className="text-xl font-semibold">Subject Activity</h2>
            <p className="mb-4 mt-1 text-sm text-muted-foreground">
                {personal
                    ? "How active each of your subjects has been over the last 30 days."
                    : "Homework, submissions, and attendance by subject over the last 30 days."}
            </p>

            {isLoading || classesLoading ? (
                <Skeleton className="h-[280px] w-full" />
            ) : isError ? (
                <ErrorState
                    className="h-[280px] justify-center"
                    description="Unable to load subject activity."
                    onRetry={refetch}
                />
            ) : subjects.length === 0 ? (
                <EmptyState
                    className="h-[280px] justify-center"
                    icon={Activity}
                    title="No subject activity yet"
                    description={
                        personal
                            ? "Subject activity will appear once homework and attendance are recorded."
                            : "Subject activity will appear once the school records work."
                    }
                />
            ) : (
                <>
                    <ResponsiveContainer width="100%" height={chartHeight}>
                        <BarChart
                            data={subjects}
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
                                        heading={(payload?.[0]?.payload as SubjectActivity | undefined)?.subjectName}
                                        unit="items"
                                    />
                                )}
                            />
                            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} iconType="circle" iconSize={9} />
                            {SERIES.map((series) => (
                                <Bar
                                    key={series.key}
                                    dataKey={series.key}
                                    name={series.label}
                                    fill={series.color}
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
                                Across your <span className="font-medium">{subjects.length}</span>{" "}
                                {subjects.length === 1 ? "subject" : "subjects"} in the last 30 days:{" "}
                                {totals.assignments} homework item{totals.assignments === 1 ? "" : "s"} set,{" "}
                                {totals.submissions} submission{totals.submissions === 1 ? "" : "s"},{" "}
                                {totals.attendanceMarks} attendance record{totals.attendanceMarks === 1 ? "" : "s"}
                                {busiest && busiest.score > 0 ? (
                                    <>. Most active: <span className="font-medium">{busiest.name}</span></>
                                ) : "."}
                            </p>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                {SERIES.map((series) => (
                                    <span key={series.key} className="flex items-center gap-1.5">
                                        <span className="h-2 w-2 rounded-[3px]" style={{ backgroundColor: series.color }} aria-hidden="true" />
                                        {series.label} — {totals[series.key]}
                                    </span>
                                ))}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Counts are grouped by subject for a quick view of where activity is highest.
                            </p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
