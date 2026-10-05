import { useEffect, useMemo, useState, type ComponentType } from "react";
import { useSearchParams } from "react-router";
import { ClipboardCheck, Printer } from "lucide-react";
import { DeferredPdfDownload, type PdfModule } from "@/components/pdf/deferred-pdf-download";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApiQuery } from "@/hooks/use-api-query";
import { useDownload } from "@/hooks/use-download";
import { portalSchoolName, type PortalSchoolBand } from "@/lib/school-brand";

type ChildClass = { id: number; name: string; schoolLevel: "nursery" | "primary" | "secondary" | null; subject: { id: number; name: string } | null };
type Child = { id: string; name: string; email?: string; enrolledClasses: ChildClass[] };
type AcademicYear = { id: number; name: string; startsOn: string; endsOn: string };
type AttendanceRow = { id: number; classId: number; className: string; subjectName: string | null; date: string; status: "present" | "absent" | "late" | "excused"; notes: string | null };
type SubjectSummary = { studentId: string; name: string; email: string; subjectName: string; totalMarked: number; presentCount: number; absentCount: number; lateCount: number; excusedCount: number; attendanceRate: number | null };

const loadAttendancePdf = async () => {
  const [{ pdf }, { AttendanceReportDocument }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("@/components/pdf/attendance-report-document"),
  ]);
  return { pdf: pdf as unknown as PdfModule["pdf"], DocumentComponent: AttendanceReportDocument as unknown as ComponentType<Record<string, unknown>> };
};

const attendanceRate = (row: SubjectSummary) => row.totalMarked ? Math.round((row.presentCount / row.totalMarked) * 1000) / 10 : null;

export default function ParentAttendance() {
  const [params] = useSearchParams();
  const studentId = params.get("childId") ?? "";
  const academicYearId = params.get("academicYearId") ?? "";
  const [classId, setClassId] = useState("all");
  useEffect(() => setClassId("all"), [studentId, academicYearId]);
  const { narrateDownload } = useDownload();
  const childrenQuery = useApiQuery<{ data: Child[] }>(academicYearId ? `/profile/my-children?academicYearId=${encodeURIComponent(academicYearId)}` : null);
  const yearsQuery = useApiQuery<{ data: AcademicYear[] }>("/grades/academic-years");
  const recordsQuery = useApiQuery<{ data: AttendanceRow[] }>(studentId && academicYearId
    ? `/attendance/student/${encodeURIComponent(studentId)}?academicYearId=${encodeURIComponent(academicYearId)}&limit=2000`
    : null);
  const child = childrenQuery.data?.data.find((item) => item.id === studentId);
  const year = yearsQuery.data?.data.find((item) => String(item.id) === academicYearId);
  const classes = useMemo(() => child?.enrolledClasses ?? [], [child?.enrolledClasses]);
  const records = recordsQuery.data?.data ?? [];
  const selectedClass = classes.find((item) => String(item.id) === classId);
  const visibleRecords = classId === "all" ? records : records.filter((item) => String(item.classId) === classId);
  const summaries = useMemo(() => {
    const grouped = new Map<string, SubjectSummary>();
    for (const item of classes) {
      const subjectName = item.subject?.name ?? item.name;
      grouped.set(subjectName, { studentId, name: child?.name ?? "Student", email: child?.email ?? "", subjectName, totalMarked: 0, presentCount: 0, absentCount: 0, lateCount: 0, excusedCount: 0, attendanceRate: null });
    }
    for (const item of visibleRecords) {
      const subjectName = item.subjectName ?? item.className;
      const row = grouped.get(subjectName) ?? { studentId, name: child?.name ?? "Student", email: child?.email ?? "", subjectName, totalMarked: 0, presentCount: 0, absentCount: 0, lateCount: 0, excusedCount: 0, attendanceRate: null };
      row.totalMarked += 1;
      if (item.status === "present") row.presentCount += 1;
      if (item.status === "absent") row.absentCount += 1;
      if (item.status === "late") row.lateCount += 1;
      if (item.status === "excused") row.excusedCount += 1;
      row.attendanceRate = attendanceRate(row);
      grouped.set(subjectName, row);
    }
    const rows = [...grouped.values()];
    return classId === "all" ? rows.sort((a, b) => a.subjectName.localeCompare(b.subjectName)) : rows.filter((row) => row.subjectName === (selectedClass?.subject?.name ?? selectedClass?.name));
  }, [classes, visibleRecords, studentId, child?.name, child?.email, classId, selectedClass?.name, selectedClass?.subject?.name]);
  const dates = visibleRecords.map((item) => item.date).sort();
  const schoolBand: PortalSchoolBand = classes.some((item) => item.schoolLevel === "secondary") ? "secondary"
    : classes.some((item) => item.schoolLevel === "primary" || item.schoolLevel === "nursery") ? "primary" : null;
  const loading = childrenQuery.isLoading || yearsQuery.isLoading || recordsQuery.isLoading;
  const error = childrenQuery.isError || yearsQuery.isError || recordsQuery.isError || !child || !year;
  const fileName = `attendance-${(child?.name ?? "student").trim().replace(/\s+/g, "-").toLowerCase()}-${academicYearId}.pdf`;

  return <PageContainer className="attendance-report space-y-5">
    <PageHeader
      breadcrumb
      showBackLink={false}
      title="Attendance Report"
      description={child && year ? `${child.name} · ${year.name}` : "Selected child's attendance"}
      actions={<>
        {classes.length > 0 && <Select value={classId} onValueChange={setClassId}>
          <SelectTrigger className="w-full sm:w-[200px]" aria-label="Select subject"><SelectValue placeholder="All subjects" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All subjects</SelectItem>{classes.map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.subject?.name ?? item.name}</SelectItem>)}</SelectContent>
        </Select>}
        {!loading && !error && summaries.length > 0 && <>
          <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="mr-1.5 h-4 w-4" />Print</Button>
          <DeferredPdfDownload
            fileName={fileName}
            load={loadAttendancePdf}
            documentProps={{
              className: classId === "all" ? "All Subjects" : selectedClass?.name,
              studentReport: true,
              allSubjectsReport: classId === "all",
              studentName: child?.name,
              studentClassName: [...new Set(classes.map((item) => item.name))].join(" / "),
              subjectName: selectedClass?.subject?.name,
              rows: summaries,
              firstDate: dates[0] ?? null,
              lastDate: dates.at(-1) ?? null,
              schoolName: portalSchoolName(schoolBand),
              schoolBand,
            }}
            onDownload={() => narrateDownload(fileName)}
          />
        </>}
      </>}
    />
    {loading ? <div className="space-y-3" aria-busy="true"><Skeleton className="h-20 w-full" /><Skeleton className="h-64 w-full" /></div>
      : error ? <ErrorState title="Unable to load this attendance record" description="The selected child or academic year is unavailable, or the record could not be loaded." onRetry={() => { childrenQuery.refetch(); yearsQuery.refetch(); recordsQuery.refetch(); }} />
      : summaries.length === 0 ? <EmptyState icon={ClipboardCheck} title="No attendance recorded" description={`There are no enrolled subjects or attendance records for ${child.name} in ${year.name}.`} />
      : <>
        <div className="overflow-x-auto border-y border-border bg-card sm:rounded-lg sm:border">
          <Table><TableHeader><TableRow><TableHead>Subject</TableHead><TableHead className="text-center">Present</TableHead><TableHead className="text-center">Absent</TableHead><TableHead className="text-center">Late</TableHead><TableHead className="text-center">Excused</TableHead><TableHead className="min-w-36">Attendance Rate</TableHead></TableRow></TableHeader>
            <TableBody>{summaries.map((row) => <TableRow key={row.subjectName}><TableCell className="font-medium">{row.subjectName}</TableCell><TableCell className="text-center">{row.presentCount}</TableCell><TableCell className="text-center">{row.absentCount}</TableCell><TableCell className="text-center">{row.lateCount}</TableCell><TableCell className="text-center">{row.excusedCount}</TableCell><TableCell><div className="flex items-center gap-2"><Progress value={row.attendanceRate ?? 0} className="h-2 min-w-0 flex-1" /><span className="w-12 text-right text-xs font-medium tabular-nums">{row.attendanceRate === null ? "—" : `${row.attendanceRate}%`}</span></div></TableCell></TableRow>)}</TableBody>
          </Table>
        </div>
        <section className="space-y-3"><h2 className="text-lg font-semibold">Daily history</h2>
          {visibleRecords.length === 0 ? <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">No attendance has been marked for this selection yet.</p>
            : <div className="overflow-x-auto rounded-lg border"><Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Subject</TableHead><TableHead>Status</TableHead><TableHead>Note</TableHead></TableRow></TableHeader><TableBody>{visibleRecords.map((record) => <TableRow key={record.id}><TableCell className="whitespace-nowrap">{new Date(`${record.date}T00:00:00`).toLocaleDateString()}</TableCell><TableCell className="font-medium">{record.subjectName ?? "Subject not recorded"}</TableCell><TableCell><StatusBadge tone={record.status === "present" ? "success" : record.status === "late" ? "warning" : record.status === "absent" ? "critical" : "neutral"}>{record.status}</StatusBadge></TableCell><TableCell className="text-muted-foreground">{record.notes || "—"}</TableCell></TableRow>)}</TableBody></Table></div>}
        </section>
      </>}
  </PageContainer>;
}
