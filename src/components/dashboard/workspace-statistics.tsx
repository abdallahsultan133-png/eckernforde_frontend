import { useApiQuery } from "@/hooks/use-api-query";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ActionQueue } from "./action-queue";

type Stats = { students?: number; teachers?: number; classes?: number; attendanceRate?: number | null; pendingGrading?: number; pendingAssignments?: number; subjects?: number; assignmentCompletionRate?: number | null };
const display = (value: number | null | undefined, suffix = "") => value == null ? "Not recorded" : `${value}${suffix}`;

export function WorkspaceStatistics({ office = false }: { office?: boolean }) {
  const { data, isLoading, isError, refetch } = useApiQuery<Stats>("/dashboard/stats");
  if (isLoading) return <Skeleton className="h-32 w-full" />;
  if (isError) return <ErrorState description="Unable to load school indicators." onRetry={refetch} />;
  const items = office
    ? [["Students", display(data?.students)], ["Teachers", display(data?.teachers)], ["Classes", display(data?.classes)], ["Attendance - 30 days", display(data?.attendanceRate, "%")]]
    : [["My classes", display(data?.classes)], ["Attendance - 30 days", display(data?.attendanceRate, "%")], ["Subjects", display(data?.subjects)]];
  return <dl className="campus-detail-list">{items.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}{!office && data?.assignmentCompletionRate != null && <div><dt>Homework completion</dt><dd>{display(data.assignmentCompletionRate, "%")}</dd></div>}</dl>;
}

export function TeachingAttention() {
  const { data, isLoading, isError, refetch } = useApiQuery<Stats>("/dashboard/stats");
  const pending = data?.pendingGrading;
  return <ActionQueue title="Student submissions" isLoading={isLoading} isError={isError} onRetry={refetch}
    items={pending ? [{ id: "grading", title: `${pending} submissions awaiting grading`, meta: "Review work and return feedback", href: "/homework?filter=needs-grading" }] : []}
    emptyTitle={pending == null ? "Grading summary unavailable" : "Nothing waiting to be graded"}
    emptyDescription="Open homework to review your classes' work." />;
}
