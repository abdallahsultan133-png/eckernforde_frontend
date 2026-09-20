import { useMemo } from "react";
import { Link, useSearchParams } from "react-router";
import { ClipboardCheck, ArrowLeft } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApiQuery } from "@/hooks/use-api-query";

type Child = { id: string; name: string };
type AcademicYear = { id: number; name: string; startsOn: string; endsOn: string };
type AttendanceRow = { id: number; classId: number; className: string; date: string; status: "present" | "absent" | "late" | "excused"; notes: string | null };

export default function ParentAttendance() {
  const [params] = useSearchParams();
  const studentId = params.get("childId") ?? "";
  const academicYearId = params.get("academicYearId") ?? "";
  const childrenQuery = useApiQuery<{ data: Child[] }>("/profile/my-children");
  const yearsQuery = useApiQuery<{ data: AcademicYear[] }>("/grades/academic-years");
  const recordsQuery = useApiQuery<{ data: AttendanceRow[] }>(studentId ? `/attendance/student/${encodeURIComponent(studentId)}?limit=200` : null);
  const child = childrenQuery.data?.data.find((item) => item.id === studentId);
  const year = yearsQuery.data?.data.find((item) => String(item.id) === academicYearId);
  const records = useMemo(() => {
    if (!year) return [];
    return (recordsQuery.data?.data ?? []).filter((record) => record.date >= year.startsOn && record.date <= year.endsOn);
  }, [recordsQuery.data, year]);
  const summary = useMemo(() => ({ present: records.filter((r) => r.status === "present").length, absent: records.filter((r) => r.status === "absent").length, late: records.filter((r) => r.status === "late").length, excused: records.filter((r) => r.status === "excused").length }), [records]);
  const loading = childrenQuery.isLoading || yearsQuery.isLoading || recordsQuery.isLoading;
  const error = childrenQuery.isError || yearsQuery.isError || recordsQuery.isError || !child || !year;

  return <PageContainer>
    <PageHeader breadcrumb title="Attendance record" description={child && year ? `${child.name} · ${year.name}` : "Selected child attendance"} actions={<Link to="/parent/attendance" className="inline-flex min-h-10 items-center gap-2 border px-3 text-sm font-medium hover:bg-muted"><ArrowLeft className="h-4 w-4" />Change selection</Link>} />
    {loading ? <div className="space-y-3" aria-busy="true"><Skeleton className="h-20 w-full" /><Skeleton className="h-64 w-full" /></div>
      : error ? <ErrorState title="Unable to load this attendance record" description="The selected child or academic year is unavailable, or the record could not be loaded." onRetry={() => { childrenQuery.refetch(); yearsQuery.refetch(); recordsQuery.refetch(); }} />
      : records.length === 0 ? <EmptyState icon={ClipboardCheck} title="No attendance recorded" description={`There are no attendance records for ${child.name} in ${year.name}.`} />
      : <>
        <dl className="grid grid-cols-2 divide-x border-y bg-card sm:grid-cols-4"><div className="p-4"><dt className="text-xs text-muted-foreground">Present</dt><dd className="mt-1 text-xl font-semibold tabular-nums">{summary.present}</dd></div><div className="p-4"><dt className="text-xs text-muted-foreground">Absent</dt><dd className="mt-1 text-xl font-semibold tabular-nums">{summary.absent}</dd></div><div className="p-4"><dt className="text-xs text-muted-foreground">Late</dt><dd className="mt-1 text-xl font-semibold tabular-nums">{summary.late}</dd></div><div className="p-4"><dt className="text-xs text-muted-foreground">Excused</dt><dd className="mt-1 text-xl font-semibold tabular-nums">{summary.excused}</dd></div></dl>
        <div className="overflow-x-auto rounded-lg border"><Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Class</TableHead><TableHead>Status</TableHead><TableHead>Note</TableHead></TableRow></TableHeader><TableBody>{records.map((record) => <TableRow key={record.id}><TableCell className="whitespace-nowrap">{new Date(`${record.date}T00:00:00`).toLocaleDateString()}</TableCell><TableCell className="font-medium">{record.className}</TableCell><TableCell><StatusBadge tone={record.status === "present" ? "success" : record.status === "late" ? "warning" : record.status === "absent" ? "critical" : "neutral"}>{record.status}</StatusBadge></TableCell><TableCell className="text-muted-foreground">{record.notes || "—"}</TableCell></TableRow>)}</TableBody></Table></div>
      </>}
  </PageContainer>;
}
