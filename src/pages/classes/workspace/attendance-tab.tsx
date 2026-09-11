import { Link } from "react-router";
import { ClipboardCheck } from "lucide-react";

import { Button } from "@/components/ui/button.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { EmptyState } from "@/components/ui/empty-state.tsx";
import { ErrorState } from "@/components/ui/error-state.tsx";
import { StatusBadge, type StatusTone } from "@/components/ui/status-badge.tsx";
import { useApiQuery } from "@/hooks/use-api-query.ts";
import { SectionCard } from "./section-card.tsx";

type ReportRow = {
  studentId: string;
  name: string;
  email: string;
  totalMarked: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  attendanceRate: number | null;
};

function rateTone(rate: number | null): StatusTone {
  if (rate === null) return "neutral";
  if (rate >= 90) return "success";
  if (rate >= 75) return "warning";
  return "critical";
}

export function AttendanceTab({ classId, canManage }: { classId: number; canManage: boolean }) {
  const { data, isLoading, isError, refetch } = useApiQuery<{ data: ReportRow[] }>(
    `/attendance/class/${classId}/report`,
  );
  const rows = (data?.data ?? []).map((r) => ({
    ...r,
    totalMarked: Number(r.totalMarked),
    presentCount: Number(r.presentCount),
    absentCount: Number(r.absentCount),
    lateCount: Number(r.lateCount),
  }));

  const rated = rows.filter((r) => r.totalMarked > 0);
  const classAvg =
    rated.length > 0
      ? Math.round(rated.reduce((s, r) => s + (r.attendanceRate ?? 0), 0) / rated.length)
      : null;

  const markButton = canManage ? (
    <Button asChild size="sm">
      <Link to={`/attendance?classId=${classId}`}>
        <ClipboardCheck className="mr-1.5 h-4 w-4" />
        Mark attendance
      </Link>
    </Button>
  ) : undefined;

  return (
    <SectionCard
      title="Attendance"
      action={markButton}
      flush
    >
      {isLoading ? (
        <div className="divide-y">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-3.5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-5 w-14" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="p-5">
          <ErrorState
            title="Attendance unavailable"
            description="You don't have access to this class's attendance."
            onRetry={refetch}
          />
        </div>
      ) : rows.length === 0 ? (
        <div className="p-5">
          <EmptyState
            icon={ClipboardCheck}
            title="No students enrolled"
            description="Enrol students in this class to start recording attendance."
          />
        </div>
      ) : rated.length === 0 ? (
        <div className="p-5">
          <EmptyState
            icon={ClipboardCheck}
            title="No attendance recorded yet"
            description={
              canManage
                ? "Take attendance for a session and per-student rates will show up here."
                : "Attendance for this class hasn't been recorded yet."
            }
            action={canManage ? { label: "Mark attendance", to: `/attendance?classId=${classId}` } : undefined}
          />
        </div>
      ) : (
        <>
          {classAvg !== null && (
            <p className="border-b bg-muted/30 px-5 py-2.5 text-xs text-muted-foreground">
              Class average:{" "}
              <span className="font-semibold text-foreground">{classAvg}%</span> present across{" "}
              {rated.length} student{rated.length === 1 ? "" : "s"} with recorded sessions
            </p>
          )}
          <ul className="divide-y">
            {rows.map((r) => (
              <li key={r.studentId} className="flex items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <Link to={`/students/${r.studentId}`} className="text-sm font-medium hover:underline">
                    {r.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {r.totalMarked > 0
                      ? `${r.presentCount} present · ${r.lateCount} late · ${r.absentCount} absent`
                      : "No sessions recorded"}
                  </p>
                </div>
                <StatusBadge tone={rateTone(r.attendanceRate)}>
                  {r.attendanceRate === null ? "—" : `${r.attendanceRate}%`}
                </StatusBadge>
              </li>
            ))}
          </ul>
        </>
      )}
    </SectionCard>
  );
}

AttendanceTab.displayName = "AttendanceTab";
