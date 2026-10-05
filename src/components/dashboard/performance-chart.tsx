import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    LabelList,
    ResponsiveContainer,
} from "recharts";
import { GraduationCap, TrendingUp, TrendingDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { useApiQuery } from "@/hooks/use-api-query.ts";
import { VIZ, axisProps, barCursor, gridProps } from "./chart-kit";
import { VizTooltip } from "./viz-tooltip";
import { useAdminDashboardYear } from "./admin-dashboard-year";

type GradeBucket = { grade: string; count: number };
type ClassActivity = { classId: number; className: string; subjectName: string | null; avgGrade: number | null };
type SubjectPerformance = { subjectId: number; subjectName: string; avgGrade: number | null; passedCount: number; needsAttentionCount: number; topGradeCount: number; failingCount: number };

interface PerformanceChartProps {
    /** Show a compact top/bottom performing classes list below the bars — admin/teacher only. */
    showClassRanking?: boolean;
    /** Show the top/bottom performing subjects below the bars. */
    showSubjectRanking?: boolean;
    /** Require a Headmaster to choose a class or form before loading results. */
    requireClassOrForm?: boolean;
    /**
    * Render the student-facing version: the data is the signed-in student's
    * published Midterm/Terminal average per subject, grouped by letter grade.
     */
    personal?: boolean;
}

const GRADE_ORDER = ["A", "B", "C", "D", "F"] as const;

const GRADE_MEANING: Record<string, string> = {
    A: "Excellent",
    B: "Good",
    C: "Satisfactory",
    D: "Needs work",
    F: "Failing",
};

export function PerformanceChart({ showClassRanking = false, showSubjectRanking = false, requireClassOrForm = false, personal = false }: PerformanceChartProps) {
    const { withScope, selectedStage } = useAdminDashboardYear();
    const { data, isLoading, isError, refetch } = useApiQuery<{ data: GradeBucket[] }>(requireClassOrForm && !selectedStage ? null : withScope("/dashboard/grade-distribution"));

    // Grade is the identity (it's on the axis); the bar is a single "count"
    // series, so every bar is one hue. Always render A–F in order, filling
    // gaps with 0 so the shape of the distribution is honest.
    const byGrade = new Map((data?.data ?? []).map((b) => [b.grade, b.count]));
    const buckets = GRADE_ORDER.map((grade) => ({ grade, count: byGrade.get(grade) ?? 0 }));
    const total = buckets.reduce((s, b) => s + b.count, 0);

    const { data: activityData } = useApiQuery<{ data: ClassActivity[] }>(
        showClassRanking && (!requireClassOrForm || selectedStage) ? withScope("/dashboard/class-activity") : null
    );
    const { data: subjectData } = useApiQuery<{ data: SubjectPerformance[] }>(
        showSubjectRanking && (!requireClassOrForm || selectedStage) ? withScope("/dashboard/subject-performance") : null
    );
    const ranked = (activityData?.data ?? []).filter((c) => c.avgGrade !== null);
    const topClasses = ranked.slice().sort((a, b) => (b.avgGrade ?? 0) - (a.avgGrade ?? 0)).slice(0, 3);
    const bottomClasses = ranked.slice().sort((a, b) => (a.avgGrade ?? 0) - (b.avgGrade ?? 0)).slice(0, 3);
    const rankedSubjects = (subjectData?.data ?? []).filter((subject) => subject.avgGrade !== null);
    const topSubjects = rankedSubjects.slice().sort((a, b) => b.topGradeCount - a.topGradeCount || (b.avgGrade ?? 0) - (a.avgGrade ?? 0)).slice(0, 2);
    const bottomSubjects = rankedSubjects.slice().sort((a, b) => b.failingCount - a.failingCount || (a.avgGrade ?? 0) - (b.avgGrade ?? 0)).slice(0, 2);

    const topBand = buckets.slice().sort((a, b) => b.count - a.count).find((b) => b.count > 0)?.grade;
    const atOrAboveC = buckets.filter((b) => ["A", "B", "C"].includes(b.grade)).reduce((s, b) => s + b.count, 0);

    const unit = personal ? "subject" : "student";
    const unitPlural = personal ? "subjects" : "students";
    const needsClassOrForm = requireClassOrForm && !selectedStage;

    return (
        <div className="rounded-xl border p-4">
            <h2 className="text-xl font-semibold">{personal ? "Subject grade distribution" : "Student Performance"}</h2>
            <p className="mb-4 mt-1 text-sm text-muted-foreground">
                {showSubjectRanking
                    ? "Each student is counted once using the average of their Midterm and Terminal subject averages."
                    : personal
                    ? "Each subject is counted once using the average of your published Midterm and Terminal marks."
                    : `Each ${unit} is counted once using published Midterm and Terminal subject averages.`}
            </p>

            {needsClassOrForm ? (
                <EmptyState
                    className="h-[260px] justify-center"
                    icon={GraduationCap}
                    title="Choose a class or form"
                    description="Select a class or form above to view its subject performance."
                />
            ) : isLoading ? (
                <Skeleton className="h-[260px] w-full" />
            ) : isError ? (
                <ErrorState
                    className="h-[260px] justify-center"
                    description="Unable to load grade distribution."
                    onRetry={refetch}
                />
            ) : total === 0 ? (
                <EmptyState
                    className="h-[260px] justify-center"
                    icon={GraduationCap}
                    title="No final grades yet"
                    description={
                        personal
                            ? "A subject appears here once both its Midterm and Terminal results are published for this academic year."
                            : "Grade distribution will appear here once grades are recorded."
                    }
                    action={{ label: personal ? "Open report" : "Open homework grade book", to: personal ? "/reports" : "/grades" }}
                />
            ) : (
                <>
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={buckets} margin={{ top: 16, right: 8, bottom: 0, left: 0 }}>
                            <CartesianGrid {...gridProps} />
                            <XAxis dataKey="grade" {...axisProps} />
                            <YAxis {...axisProps} allowDecimals={false} width={28} />
                            <Tooltip
                                cursor={barCursor}
                                content={({ active, payload, label }) => (
                                    <VizTooltip
                                        active={active}
                                        payload={payload}
                                        unit={payload?.[0]?.value === 1 ? unit : unitPlural}
                                        heading={
                                            label != null && GRADE_MEANING[String(label)]
                                                ? `Grade ${label} · ${GRADE_MEANING[String(label)]}`
                                                : `Grade ${label ?? ""}`
                                        }
                                    />
                                )}
                            />
                            <Bar dataKey="count" name="Count" fill={VIZ.primary} radius={[4, 4, 0, 0]} maxBarSize={36}>
                                <LabelList
                                    dataKey="count"
                                    position="top"
                                    offset={8}
                                    className="fill-foreground"
                                    fontSize={12}
                                    fontWeight={600}
                                    formatter={(value: unknown) =>
                                        typeof value === "number" && value > 0 ? value.toString() : ""
                                    }
                                />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>

                    {personal && (
                        <div className="mt-4 space-y-2 border-t pt-4">
                            <p className="text-sm text-foreground">
                                <span className="font-medium">{total}</span>{" "}
                                {total === 1 ? "subject" : "subjects"} graded so far
                                {topBand ? (
                                    <> — most often a <span className="font-medium">{topBand}</span></>
                                ) : null}
                                {total > 0 ? (
                                    <>. {atOrAboveC} of {total} are C or above.</>
                                ) : null}
                            </p>
                            <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                {GRADE_ORDER.map((g) => (
                                    <span key={g}>
                                        <span className="font-medium text-foreground">{g}</span> {GRADE_MEANING[g]}
                                    </span>
                                ))}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Each counted subject has published Midterm and Terminal marks; the two marks are averaged before grading.
                            </p>
                        </div>
                    )}
                </>
            )}

            {showSubjectRanking && rankedSubjects.length > 0 && (
                <div className="mt-6 grid gap-4 border-t pt-4 sm:grid-cols-2">
                    <div>
                        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            <TrendingUp className="h-3.5 w-3.5" /> Highest-performing subjects
                        </p>
                        <ul className="space-y-1.5">
                            {topSubjects.map((subject) => (
                                <li key={subject.subjectId} className="flex items-center justify-between text-sm">
                                    <span className="truncate text-foreground">{subject.subjectName}</span>
                                    <span className="font-medium tabular-nums text-emerald-600 dark:text-emerald-400">{subject.topGradeCount} A grades</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            <TrendingDown className="h-3.5 w-3.5" /> Subjects needing attention
                        </p>
                        <ul className="space-y-1.5">
                            {bottomSubjects.map((subject) => (
                                <li key={subject.subjectId} className="flex items-center justify-between text-sm">
                                    <span className="truncate text-foreground">{subject.subjectName}</span>
                                    <span className="font-medium tabular-nums text-amber-600 dark:text-amber-400">{subject.failingCount} F grades</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {showClassRanking && ranked.length > 0 && (
                <div className="mt-6 grid gap-4 border-t pt-4 sm:grid-cols-2">
                    <div>
                        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            <TrendingUp className="h-3.5 w-3.5" /> Highest performing
                        </p>
                        <ul className="space-y-1.5">
                            {topClasses.map((c) => (
                                <li key={c.classId} className="flex items-center justify-between text-sm">
                                    <span className="truncate text-foreground">{c.subjectName?.trim() || c.className}</span>
                                    <span className="font-medium tabular-nums text-emerald-600 dark:text-emerald-400">{c.avgGrade}%</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            <TrendingDown className="h-3.5 w-3.5" /> Needs attention
                        </p>
                        <ul className="space-y-1.5">
                            {bottomClasses.map((c) => (
                                <li key={c.classId} className="flex items-center justify-between text-sm">
                                    <span className="truncate text-foreground">{c.subjectName?.trim() || c.className}</span>
                                    <span className="font-medium tabular-nums text-amber-600 dark:text-amber-400">{c.avgGrade}%</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
}
