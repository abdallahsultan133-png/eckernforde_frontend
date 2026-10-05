import { useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import { useGetIdentity, useList } from "@refinedev/core";
import { Printer } from "lucide-react";
import { useSearchParams } from "react-router";
import { useDownload } from "@/hooks/use-download.ts";
import { DeferredPdfDownload, type PdfModule } from "@/components/pdf/deferred-pdf-download.tsx";

import { PageHeader } from "@/components/layout/page-header.tsx";
import { PageContainer } from "@/components/layout/page-container.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Progress } from "@/components/ui/progress.tsx";
import { EmptyState } from "@/components/ui/empty-state.tsx";
import { ErrorState } from "@/components/ui/error-state.tsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.tsx";
import { useApiQuery } from "@/hooks/use-api-query.ts";
import { UserRole, type ClassDetails, type User } from "@/types";
import { portalSchoolName, type PortalSchoolBand } from "@/lib/school-brand";

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

type AttendanceReportResponse = {
  data: ReportRow[];
  period?: { firstDate: string | null; lastDate: string | null };
};

type AttendanceHistoryRow = {
  id: number;
  classId: number;
  className: string;
  subjectName: string | null;
  date: string;
  status: "present" | "absent" | "late" | "excused";
};

type SubjectAttendanceRow = ReportRow & {
  subjectName: string;
};

const studentStageLabels: Record<string, string> = {
  nursery: "Nursery",
  kindergarten_i: "KG I",
  kindergarten_ii: "KG II",
  kindergarten_iii: "KG III",
  standard_i: "Class I",
  standard_ii: "Class II",
  standard_iii: "Class III",
  standard_iv: "Class IV",
  standard_v: "Class V",
  standard_vi: "Class VI",
  form_i: "Form I",
  form_ii: "Form II",
  form_iii: "Form III",
  form_iv: "Form IV",
};

const formatAttendanceDate = (value: string | null | undefined) => value
  ? new Date(`${value}T00:00:00`).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
  : null;

const loadAttendancePdf = async () => {
  const [{ pdf }, { AttendanceReportDocument }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("@/components/pdf/attendance-report-document.tsx"),
  ]);
  return { pdf: pdf as unknown as PdfModule["pdf"], DocumentComponent: AttendanceReportDocument as unknown as ComponentType<Record<string, unknown>> };
};

const rateColor = (rate: number | null) => {
  if (rate === null) return "text-muted-foreground";
  if (rate >= 90) return "text-emerald-600 dark:text-emerald-400";
  if (rate >= 75) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
};

const attendanceClassLabel = (classItem: ClassDetails) =>
  classItem.subject?.name ? `${classItem.subject.name} — ${classItem.name}` : classItem.name;

const AttendanceReport = () => {
  const { data: identity } = useGetIdentity<User>();
  const isStudent = identity?.role === UserRole.STUDENT;
  const isSchoolStaff = isStudent || identity?.role === UserRole.TEACHER;
  const { data: portal } = useApiQuery<{ data: { context: { schoolBand: "primary" | "secondary"; stage?: string } | null; archiveContext?: { schoolBand: "primary" | "secondary" } | null } }>(isSchoolStaff ? "/portal-context" : null);
  const { narrateDownload } = useDownload();

  const [searchParams] = useSearchParams();
  const [classId, setClassId] = useState<string>(() => isStudent ? "all" : (searchParams.get("classId") ?? ""));

  const { query: classesQuery } = useList<ClassDetails>({
    resource: "classes",
    pagination: { pageSize: 100 },
  });
  const allClasses = useMemo(() => classesQuery?.data?.data ?? [], [classesQuery?.data?.data]);

  // A student can only view their own attendance, and only for a class they're
  // actually enrolled in — so the picker only offers those.
  const { data: enrolledIdsData } = useApiQuery<{ data: number[] }>(isStudent ? "/classes/enrolled-ids" : null);
  const enrolledIds = enrolledIdsData?.data ?? [];
  const classes = isStudent ? allClasses.filter((c) => enrolledIds.includes(c.id)) : allClasses;

  useEffect(() => {
    if (!classId && classes.length > 0) setClassId(String(classes[0].id));
  }, [classes, classId]);

  const { data, isLoading, isError, refetch } = useApiQuery<AttendanceReportResponse>(
    classId && classId !== "all" ? `/attendance/class/${classId}/report` : null,
  );
  const { data: studentHistoryData, isLoading: studentHistoryLoading } = useApiQuery<{ data: AttendanceHistoryRow[] }>(
    isStudent && classId === "all" && identity?.id ? `/attendance/student/${encodeURIComponent(identity.id)}?limit=2000` : null,
  );
  const rows = data?.data ?? [];
  const firstAttendanceDate = formatAttendanceDate(data?.period?.firstDate);
  const lastAttendanceDate = formatAttendanceDate(data?.period?.lastDate);
  const attendancePeriod = firstAttendanceDate && lastAttendanceDate
    ? firstAttendanceDate === lastAttendanceDate
      ? firstAttendanceDate
      : `${firstAttendanceDate} – ${lastAttendanceDate}`
    : null;

  const selectedClass = classes.find((c) => String(c.id) === classId);
  const selectedClassName = selectedClass ? attendanceClassLabel(selectedClass) : "";
  const portalStudentClassName = portal?.data.context?.stage
    ? studentStageLabels[portal.data.context.stage] ?? portal.data.context.stage
    : undefined;
  const studentClassName = useMemo(() => {
    if (!isStudent) return undefined;
    if (classId !== "all") return selectedClass?.name ?? portalStudentClassName;
    if (portalStudentClassName) return portalStudentClassName;
    const names = [...new Set(classes.map((course) => course.name.trim()).filter(Boolean))];
    return names.length === 1 ? names[0] : names.join(" / ");
  }, [classId, classes, isStudent, portalStudentClassName, selectedClass?.name]);
  const allSubjectsAttendancePeriod = useMemo(() => {
    const dates = (studentHistoryData?.data ?? []).map((record) => record.date).filter(Boolean).sort();
    return { firstDate: dates[0] ?? null, lastDate: dates.at(-1) ?? null };
  }, [studentHistoryData?.data]);
  const allSubjectRows = useMemo<SubjectAttendanceRow[]>(() => {
    const grouped = new Map<string, SubjectAttendanceRow>();
    for (const classItem of classes) {
      const subjectName = classItem.subject?.name ?? classItem.name;
      grouped.set(subjectName, {
        studentId: identity?.id ?? "student",
        name: identity?.name ?? "Student",
        email: identity?.email ?? "",
        subjectName,
        totalMarked: 0,
        presentCount: 0,
        absentCount: 0,
        lateCount: 0,
        excusedCount: 0,
        attendanceRate: 0,
      });
    }
    for (const item of studentHistoryData?.data ?? []) {
      const subjectName = item.subjectName ?? item.className;
      const current = grouped.get(subjectName) ?? {
        studentId: identity?.id ?? "student",
        name: identity?.name ?? "Student",
        email: identity?.email ?? "",
        subjectName,
        totalMarked: 0,
        presentCount: 0,
        absentCount: 0,
        lateCount: 0,
        excusedCount: 0,
        attendanceRate: null,
      };
      current.totalMarked += 1;
      if (item.status === "present") current.presentCount += 1;
      if (item.status === "absent") current.absentCount += 1;
      if (item.status === "late") current.lateCount += 1;
      if (item.status === "excused") current.excusedCount += 1;
      current.attendanceRate = Math.round((current.presentCount / current.totalMarked) * 1000) / 10;
      grouped.set(subjectName, current);
    }
    return [...grouped.values()].sort((a, b) => a.subjectName.localeCompare(b.subjectName));
  }, [classes, identity?.email, identity?.id, identity?.name, studentHistoryData?.data]);
  const displayRows = isStudent && classId === "all" ? allSubjectRows : rows;
  const displayRowsLoading = isStudent && classId === "all" ? studentHistoryLoading : isLoading;
  const reportDescription = selectedClass
    ? `${selectedClass.name}${selectedClass.subject?.name ? ` ${selectedClass.subject.name}` : ""} students attendance report`
    : "Students attendance report";
  const roleSchoolBand: PortalSchoolBand = identity?.role === UserRole.PRIMARY_HEADMASTER
    ? "primary"
    : identity?.role === UserRole.SECONDARY_HEADMASTER
      ? "secondary"
      : null;
  const classSchoolBand: PortalSchoolBand = selectedClass?.schoolLevel === "secondary"
    ? "secondary"
    : selectedClass?.schoolLevel === "primary" || selectedClass?.schoolLevel === "nursery"
      ? "primary"
      : null;
  const schoolBand: PortalSchoolBand = roleSchoolBand ?? (isSchoolStaff ? portal?.data.archiveContext?.schoolBand ?? portal?.data.context?.schoolBand ?? classSchoolBand : classSchoolBand);
  const schoolName = portalSchoolName(schoolBand);
  const pdfFileName = `attendance-report-${selectedClassName.replace(/\s+/g, "-").toLowerCase() || classId}.pdf`;

  const withData = rows.filter((r) => r.totalMarked > 0);
  const classAvg =
    withData.length > 0
      ? Math.round(withData.reduce((s, r) => s + (r.attendanceRate ?? 0), 0) / withData.length)
      : 0;
  const belowThreshold = withData.filter((r) => (r.attendanceRate ?? 0) < 75).length;
  const visibleRows = displayRows;

  return (
    <PageContainer className="attendance-report">
      <PageHeader
        className="print:hidden"
        breadcrumb
        title="Attendance Report"
        description={
          `${isStudent ? "Your attendance rate for the selected class." : "Per-student attendance rate for the selected class."}${attendancePeriod ? ` Attendance marked from ${attendancePeriod}.` : ""}`
        }
        actions={
          <>
            <Select value={classId} onValueChange={setClassId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select a class" />
              </SelectTrigger>
              <SelectContent>
                {isStudent && <SelectItem value="all">All subjects</SelectItem>}
                {classes.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.subject?.name ?? c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="mr-1.5 h-4 w-4" /> Print
            </Button>
            {!displayRowsLoading && displayRows.length > 0 && (
              <DeferredPdfDownload
                fileName={classId === "all" ? "attendance-all-subjects.pdf" : pdfFileName}
                load={loadAttendancePdf}
                documentProps={{
                  className: classId === "all" ? "All Subjects" : (selectedClass?.name ?? selectedClassName),
                  studentReport: isStudent,
                  studentAccountReport: isStudent,
                  allSubjectsReport: isStudent && classId === "all",
                  studentName: identity?.name,
                  studentClassName,
                  subjectName: classId === "all" ? undefined : selectedClass?.subject?.name,
                  reportDescription,
                  rows: displayRows,
                  firstDate: classId === "all" ? allSubjectsAttendancePeriod.firstDate : data?.period?.firstDate,
                  lastDate: classId === "all" ? allSubjectsAttendancePeriod.lastDate : data?.period?.lastDate,
                  schoolName,
                  schoolBand,
                }}
                onDownload={() => narrateDownload(pdfFileName)}
              />
            )}
          </>
        }
      />

      <div className="hidden print:block">
        <h1 className="text-xl font-bold">Attendance Report</h1>
        <p className="text-sm text-muted-foreground">
          {selectedClassName} · Generated {new Date().toLocaleDateString()}
        </p>
      </div>

      {!isStudent && !displayRowsLoading && !isError && displayRows.length > 0 && (
        <div className="space-y-1 border-y px-1 py-3 text-sm print:hidden">
          <p>
            Class average: <span className="font-semibold tabular-nums">{classAvg}%</span>
            <span className="mx-2 text-muted-foreground">||</span>
            Students tracked: <span className="font-semibold tabular-nums">{withData.length}</span>
          </p>
          <p>
            Below 75%: <span className="font-semibold tabular-nums">{belowThreshold}</span>
          </p>
        </div>
      )}

      {displayRowsLoading ? (
        <div className="space-y-3 border-y border-border p-4" aria-busy="true">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
        </div>
      ) : isError ? (
        <ErrorState description="Couldn't load the attendance report." onRetry={refetch} />
      ) : displayRows.length === 0 ? (
        <EmptyState
          icon={Printer}
          title={isStudent ? "Nothing recorded yet" : "No data to report"}
          description={
            isStudent
              ? classes.length === 0
                ? "You're not enrolled in any classes yet."
                : "No attendance has been recorded for you in this class yet."
              : "No attendance has been recorded for this class yet."
          }
        />
      ) : (
        <div className="overflow-x-auto border-y border-border bg-card sm:rounded-lg sm:border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{isStudent && classId === "all" ? "Subjects" : "Student"}</TableHead>
                <TableHead className="text-center">Present</TableHead>
                <TableHead className="text-center">Absent</TableHead>
                <TableHead className="text-center">Late</TableHead>
                <TableHead className="text-center">Excused</TableHead>
                <TableHead className="w-[220px]">Attendance Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
            {visibleRows.map((row) => {
              const attendanceRate = row.attendanceRate ?? 0;
               const subjectRow = "subjectName" in row;
              return <TableRow key={row.studentId}>
                <TableCell>
                    <div className="font-medium">{subjectRow ? String(row.subjectName) : row.name}</div>
                  </TableCell>
                  <TableCell className="text-center">{row.presentCount}</TableCell>
                  <TableCell className="text-center">{row.absentCount}</TableCell>
                  <TableCell className="text-center">{row.lateCount}</TableCell>
                  <TableCell className="text-center">{row.excusedCount}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={attendanceRate} className="h-2 min-w-0 flex-1" />
                      <span className={`w-12 text-right text-xs font-medium ${rateColor(attendanceRate)}`}>
                        {attendanceRate}%
                      </span>
                    </div>
                  </TableCell>
                </TableRow>;
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </PageContainer>
  );
};

export default AttendanceReport;
