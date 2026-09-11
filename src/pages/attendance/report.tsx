import { useEffect, useMemo, useState } from "react";
import { useGetIdentity, useList } from "@refinedev/core";
import { Download, Loader2, Printer } from "lucide-react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { useDownload } from "@/hooks/use-download.ts";

import { PageHeader } from "@/components/layout/page-header.tsx";
import { Card } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Progress } from "@/components/ui/progress.tsx";
import { EmptyState } from "@/components/ui/empty-state.tsx";
import { ErrorState } from "@/components/ui/error-state.tsx";
import { SummaryBar, type SummaryItem } from "@/components/ui/summary-bar.tsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.tsx";
import { AttendanceReportDocument } from "@/components/pdf/attendance-report-document.tsx";
import { useApiQuery } from "@/hooks/use-api-query.ts";
import { UserRole, type ClassDetails, type User } from "@/types";

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

const rateColor = (rate: number | null) => {
  if (rate === null) return "text-muted-foreground";
  if (rate >= 90) return "text-emerald-600 dark:text-emerald-400";
  if (rate >= 75) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
};

const AttendanceReport = () => {
  const { data: identity } = useGetIdentity<User>();
  const isStudent = identity?.role === UserRole.STUDENT;
  const { narrateDownload } = useDownload();

  const [classId, setClassId] = useState<string>("");

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

  const { data, isLoading, isError, refetch } = useApiQuery<{ data: ReportRow[] }>(
    classId ? `/attendance/class/${classId}/report` : null,
  );
  const rows = data?.data ?? [];

  const selectedClassName = classes.find((c) => String(c.id) === classId)?.name ?? "";
  const pdfFileName = `attendance-report-${selectedClassName.replace(/\s+/g, "-").toLowerCase() || classId}.pdf`;

  const withData = rows.filter((r) => r.totalMarked > 0);
  const classAvg =
    withData.length > 0
      ? Math.round(withData.reduce((s, r) => s + (r.attendanceRate ?? 0), 0) / withData.length)
      : null;
  const belowThreshold = withData.filter((r) => (r.attendanceRate ?? 0) < 75).length;

  const summaryItems: SummaryItem[] = isStudent
    ? [
        { label: "Your attendance rate", value: classAvg !== null ? `${classAvg}%` : "—", tone: classAvg === null ? "default" : classAvg >= 75 ? "success" : "critical" },
        { label: "Sessions recorded", value: withData[0]?.totalMarked ?? 0 },
        { label: "Absences", value: withData[0]?.absentCount ?? 0, tone: (withData[0]?.absentCount ?? 0) > 0 ? "warning" : "default" },
      ]
    : [
        { label: "Class average", value: classAvg !== null ? `${classAvg}%` : "—", tone: classAvg === null ? "default" : classAvg >= 75 ? "success" : "warning" },
        { label: "Students tracked", value: withData.length, hint: `${rows.length} enrolled` },
        { label: "Below 75%", value: belowThreshold, tone: belowThreshold > 0 ? "critical" : "success" },
      ];

  return (
    <div className="attendance-report space-y-6">
      <PageHeader
        className="print:hidden"
        breadcrumb
        title="Attendance Report"
        description={
          isStudent
            ? "Your attendance rate for the selected class."
            : "Per-student attendance rate for the selected class."
        }
        actions={
          <>
            <Select value={classId} onValueChange={setClassId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select a class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="mr-1.5 h-4 w-4" /> Print
            </Button>
            {!isLoading && rows.length > 0 && (
              <PDFDownloadLink
                document={<AttendanceReportDocument className={selectedClassName} rows={rows} />}
                fileName={pdfFileName}
              >
                {({ loading: pdfLoading }) => (
                  <Button
                    size="sm"
                    disabled={pdfLoading}
                    onClick={() => !pdfLoading && narrateDownload(pdfFileName)}
                  >
                    {pdfLoading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Download className="mr-1.5 h-4 w-4" />}
                    Download PDF
                  </Button>
                )}
              </PDFDownloadLink>
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

      {!isLoading && !isError && rows.length > 0 && <SummaryBar items={summaryItems} />}

      {isLoading ? (
        <Card className="space-y-3 p-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
        </Card>
      ) : isError ? (
        <ErrorState description="Couldn't load the attendance report." onRetry={refetch} />
      ) : rows.length === 0 ? (
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
        <Card className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead className="text-center">Present</TableHead>
                <TableHead className="text-center">Absent</TableHead>
                <TableHead className="text-center">Late</TableHead>
                <TableHead className="text-center">Excused</TableHead>
                <TableHead className="w-[220px]">Attendance Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.studentId}>
                  <TableCell>
                    <div className="font-medium">{row.name}</div>
                    <div className="text-xs text-muted-foreground">{row.email}</div>
                  </TableCell>
                  <TableCell className="text-center">{row.presentCount}</TableCell>
                  <TableCell className="text-center">{row.absentCount}</TableCell>
                  <TableCell className="text-center">{row.lateCount}</TableCell>
                  <TableCell className="text-center">{row.excusedCount}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={row.attendanceRate ?? 0} className="h-2 min-w-0 flex-1" />
                      <span className={`w-12 text-right text-xs font-medium ${rateColor(row.attendanceRate)}`}>
                        {row.attendanceRate === null ? "—" : `${row.attendanceRate}%`}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
};

export default AttendanceReport;
