import { CalendarClock, FileText } from "lucide-react";
import { ActionQueue } from "@/components/dashboard/action-queue";
import { DeadlineCountdown } from "@/components/deadline-countdown";
import { useApiQuery } from "@/hooks/use-api-query.ts";

type AssignmentRow = { id: number; title: string; dueAt: string | null; maxScore: number; class: { id: number; name: string }; mySubmission?: { status: string; score: number | null } | null };

interface UpcomingAssignmentsProps {
  /** Student view uses a due-soon framing; teacher view shows set deadlines. */
  personal?: boolean;
  /** Only show assignments due within this many days (default 21). */
  withinDays?: number;
  max?: number;
  classId?: number;
  subjectId?: number;
}

export function UpcomingAssignments({ personal = false, withinDays = 21, max = 6, classId, subjectId }: UpcomingAssignmentsProps) {
  const day = new Date().toISOString().slice(0, 10);
  const end = new Date(Date.parse(day) + withinDays * 86400000).toISOString();
  const { data, isLoading, isError, refetch } = useApiQuery<{ data: AssignmentRow[] }>(`/assignments?limit=${max}&sort=dueSoon&dueFrom=${day}&dueTo=${end}${classId ? `&classId=${classId}` : ""}${subjectId ? `&subjectId=${subjectId}` : ""}`);
  const now = Date.now();
  const horizon = now + withinDays * 24 * 60 * 60 * 1000;
  const upcoming = (data?.data ?? []).filter((assignment) => {
    if (!assignment.dueAt) return false;
    const timestamp = new Date(assignment.dueAt).getTime();
    return timestamp > now && timestamp <= horizon;
  }).sort((a, b) => new Date(a.dueAt!).getTime() - new Date(b.dueAt!).getTime());

  return <ActionQueue title={personal ? "Due soon" : "Upcoming deadlines"} icon={CalendarClock} isLoading={isLoading} isError={isError} onRetry={refetch} maxItems={max} emptyIcon={FileText} emptyTitle="Nothing due soon" emptyDescription={personal ? `No assignments due in the next ${withinDays} days.` : `No assignments you've set fall due in the next ${withinDays} days.`} viewAll={{ label: "All assignments", href: "/assignments" }} items={upcoming.map((assignment) => ({
    id: assignment.id,
    title: assignment.title,
    meta: `${assignment.class.name}${personal && assignment.mySubmission ? ` - ${assignment.mySubmission.status}` : ""}`,
    href: `/assignments/${assignment.id}`,
    trailing: <DeadlineCountdown dueAt={assignment.dueAt} variant="inline" />,
  }))} />;
}

UpcomingAssignments.displayName = "UpcomingAssignments";
