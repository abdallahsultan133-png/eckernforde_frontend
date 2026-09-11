import { CalendarClock, FileText } from "lucide-react";
import { ActionQueue } from "@/components/dashboard/action-queue";
import { DeadlineCountdown } from "@/components/deadline-countdown";
import { useApiQuery } from "@/hooks/use-api-query.ts";

type AssignmentRow = {
  id: number;
  title: string;
  dueAt: string | null;
  maxScore: number;
  class: { id: number; name: string };
};

interface UpcomingAssignmentsProps {
  /** Student view — "due soon" framing; otherwise a teacher's "deadlines you've set". */
  personal?: boolean;
  /** Only show assignments due within this many days (default 21). */
  withinDays?: number;
  max?: number;
}

/**
 * Assignments with a future due date, soonest first, each with a live countdown.
 * `GET /assignments` is already row-scoped server-side (a teacher's own classes,
 * a student's enrolled classes). The list carries no per-student submission
 * status, so this deliberately says only what's true for everyone — when it's
 * due — and leaves "have I submitted?" to the assignment page and the
 * dashboard's pending-count stat.
 */
export function UpcomingAssignments({
  personal = false,
  withinDays = 21,
  max = 6,
}: UpcomingAssignmentsProps) {
  const { data, isLoading, isError, refetch } = useApiQuery<{ data: AssignmentRow[] }>(
    "/assignments?limit=100",
  );

  const now = Date.now();
  const horizon = now + withinDays * 24 * 60 * 60 * 1000;
  const upcoming = (data?.data ?? [])
    .filter((a) => {
      if (!a.dueAt) return false;
      const t = new Date(a.dueAt).getTime();
      return t > now && t <= horizon;
    })
    .sort((a, b) => new Date(a.dueAt!).getTime() - new Date(b.dueAt!).getTime());

  return (
    <ActionQueue
      title={personal ? "Due soon" : "Upcoming deadlines"}
      icon={CalendarClock}
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
      maxItems={max}
      emptyIcon={FileText}
      emptyTitle="Nothing due soon"
      emptyDescription={
        personal
          ? `No assignments due in the next ${withinDays} days.`
          : `No assignments you've set fall due in the next ${withinDays} days.`
      }
      viewAll={{ label: "All assignments", href: "/assignments" }}
      items={upcoming.map((a) => ({
        id: a.id,
        title: a.title,
        meta: a.class.name,
        href: `/assignments/${a.id}`,
        trailing: <DeadlineCountdown dueAt={a.dueAt} variant="inline" />,
      }))}
    />
  );
}

UpcomingAssignments.displayName = "UpcomingAssignments";
