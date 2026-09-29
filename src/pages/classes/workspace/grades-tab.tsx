import { Link } from "react-router";
import { BarChart3, GraduationCap, CalendarClock } from "lucide-react";

import { Button } from "@/components/ui/button.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { EmptyState } from "@/components/ui/empty-state.tsx";
import { ErrorState } from "@/components/ui/error-state.tsx";
import { StatusBadge, type StatusTone } from "@/components/ui/status-badge.tsx";
import { useApiQuery } from "@/hooks/use-api-query.ts";
import { SectionCard } from "./section-card.tsx";

type GradebookRow = {
  studentId: string;
  name: string;
  finalGrade: number | null;
  letterGrade: string | null;
  isOverridden: boolean;
};

type ExamRow = {
  id: number;
  title: string;
  examType: "midterm" | "annual";
  scheduledAt: string | null;
  maxScore: number;
  venue: string | null;
};

function letterTone(letter: string | null): StatusTone {
  if (letter === "A" || letter === "B") return "success";
  if (letter === "C") return "warning";
  if (letter === "D" || letter === "F") return "critical";
  return "neutral";
}

export function GradesTab({ classId, canManage }: { classId: number; canManage: boolean }) {
  const gradebook = useApiQuery<{ data: GradebookRow[] }>(`/grades/gradebook/${classId}`);
  const exams = useApiQuery<{ data: ExamRow[] }>(`/grades/exams?classId=${classId}`);

  const rows = gradebook.data?.data ?? [];
  const examList = (exams.data?.data ?? [])
    .slice()
    .sort((a, b) => {
      const at = a.scheduledAt ? new Date(a.scheduledAt).getTime() : Infinity;
      const bt = b.scheduledAt ? new Date(b.scheduledAt).getTime() : Infinity;
      return at - bt;
    });

  const openGradebook = canManage ? (
    <Button asChild size="sm">
      <Link to={`/grades?classId=${classId}`}>
        <BarChart3 className="mr-1.5 h-4 w-4" />
        Open homework grade book
      </Link>
    </Button>
  ) : undefined;

  return (
    <div className="space-y-5">
      <SectionCard
        title="Final grades"
        count={gradebook.isLoading || gradebook.isError ? undefined : rows.length}
        action={openGradebook}
        flush
      >
        {gradebook.isLoading ? (
          <div className="divide-y">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3.5">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-5 w-20" />
              </div>
            ))}
          </div>
        ) : gradebook.isError ? (
          <div className="p-5">
            <ErrorState
              title="Grades unavailable"
              description="You don't have access to this class's grades."
              onRetry={gradebook.refetch}
            />
          </div>
        ) : rows.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={GraduationCap}
              title="No grades yet"
              description={
                canManage
                  ? "Grade homework, then compute or override final grades in the homework grade book."
                  : "Final grades for this class haven't been posted yet."
              }
              action={canManage ? { label: "Open homework grade book", to: `/grades?classId=${classId}` } : undefined}
            />
          </div>
        ) : (
          <ul className="divide-y">
            {rows.map((r) => (
              <li key={r.studentId} className="flex items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <Link to={`/students/${r.studentId}`} className="text-sm font-medium hover:underline">
                    {r.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {r.finalGrade !== null ? `${r.finalGrade}%` : "Not computed"}
                    {r.isOverridden ? " · teacher override" : ""}
                  </p>
                </div>
                <StatusBadge tone={letterTone(r.letterGrade)}>
                  {r.letterGrade ?? "—"}
                </StatusBadge>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard
        title="Exams"
        count={exams.isLoading || exams.isError ? undefined : examList.length}
        flush
      >
        {exams.isLoading ? (
          <div className="divide-y">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="px-5 py-3.5">
                <Skeleton className="h-4 w-48" />
              </div>
            ))}
          </div>
        ) : exams.isError ? (
          <div className="p-5">
            <ErrorState description="Couldn't load exams for this class." onRetry={exams.refetch} />
          </div>
        ) : examList.length === 0 ? (
          <div className="p-5">
            <EmptyState icon={CalendarClock} title="No exams scheduled" description="Exams for this class will appear here." />
          </div>
        ) : (
          <ul className="divide-y">
            {examList.map((e) => (
              <li key={e.id} className="flex items-center gap-3 px-5 py-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <CalendarClock className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{e.title} <span className="font-normal text-muted-foreground">({e.examType === "annual" ? "Terminal/Annual" : "Midterm"})</span></span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {e.scheduledAt
                      ? new Date(e.scheduledAt).toLocaleString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })
                      : "Not scheduled"}
                    {e.venue ? ` · ${e.venue}` : ""} · {e.maxScore} pts
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}

GradesTab.displayName = "GradesTab";
