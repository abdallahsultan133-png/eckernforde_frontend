import { useGetIdentity } from "@refinedev/core";
import { useParams } from "react-router";
import { GraduationCap, Loader2, Download } from "lucide-react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { useDownload } from "@/hooks/use-download.ts";

import { PageHeader } from "@/components/layout/page-header.tsx";
import { EmptyState } from "@/components/ui/empty-state.tsx";
import { ErrorState } from "@/components/ui/error-state.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.tsx";
import { ReportCardDocument } from "@/components/pdf/report-card-document.tsx";
import { useApiQuery } from "@/hooks/use-api-query.ts";
import type { User } from "@/types";

// /grades/report-card shows the caller's own; /grades/report-card/:id (used by
// staff/parents from a student's profile) shows that student's instead — same
// backend endpoint enforces students can only ever resolve their own id.
type StudentInfoResponse = {
  data: { name: string; email: string; profile: { registrationNumber: string | null } | null };
};

type GradeRow = {
  id: number;
  classId: number;
  finalGrade: number | null;
  letterGrade: string | null;
  remarks: string | null;
  assignmentAvg: number | null;
  examAvg: number | null;
  class: { id: number; name: string };
};

const gradeBadgeColor = (letter: string | null) => {
  if (!letter) return "";
  if (letter === "A") return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  if (letter === "B") return "bg-blue-500/10 text-blue-700 dark:text-blue-300";
  if (letter === "C") return "bg-amber-500/10 text-amber-700 dark:text-amber-300";
  return "bg-red-500/10 text-red-700 dark:text-red-300";
};

const ReportCard = () => {
  const { id: routeStudentId } = useParams<{ id?: string }>();
  const { narrateDownload } = useDownload();
  const { data: identity, isLoading: identityLoading } = useGetIdentity<User>();
  const targetStudentId = routeStudentId ?? identity?.id;

  const { data, isLoading: loading, isError, refetch } = useApiQuery<{ data: GradeRow[] }>(targetStudentId ? `/grades/student/${targetStudentId}` : null);
  const grades = data?.data ?? [];

  // Same endpoint works whether targetStudentId is the caller's own id or
  // someone else's — the backend only restricts students from resolving an id
  // that isn't their own, which never applies to the "own report card" path.
  const { data: studentInfoData } = useApiQuery<StudentInfoResponse>(targetStudentId ? `/profile/student/${targetStudentId}` : null);
  const studentName = studentInfoData?.data?.name ?? identity?.name ?? "";
  const studentEmail = studentInfoData?.data?.email ?? identity?.email ?? "";
  const registrationNumber = studentInfoData?.data?.profile?.registrationNumber ?? null;

  const passCount = grades.filter((g) => g.letterGrade && g.letterGrade !== "F").length;
  const pdfFileName = `report-card-${studentName.replace(/\s+/g, "-").toLowerCase()}.pdf`;

  if (identityLoading) return <div className="p-6"><Skeleton className="h-8 w-48" /></div>;

  return (
    <div className="report-card space-y-6">
      <PageHeader
        className="print:hidden"
        breadcrumb
        title={
          <span className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-muted-foreground" />
            Report Card
          </span>
        }
        description={studentName ? `${studentName} · ${studentEmail}` : undefined}
        actions={
          !loading && studentName && (
            <PDFDownloadLink
              document={
                <ReportCardDocument
                  studentName={studentName}
                  studentEmail={studentEmail}
                  registrationNumber={registrationNumber}
                  grades={grades}
                  passCount={passCount}
                />
              }
              fileName={pdfFileName}
            >
              {({ loading: pdfLoading }) => (
                <Button
                  size="sm"
                  disabled={pdfLoading}
                  onClick={() => !pdfLoading && narrateDownload(pdfFileName)}
                >
                  {pdfLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                  Download PDF
                </Button>
              )}
            </PDFDownloadLink>
          )
        }
      />

      <div className="hidden print:block">
        <h1 className="text-xl font-bold">Report Card</h1>
        <p className="text-sm text-muted-foreground">
          {studentName} · {studentEmail} · Generated {new Date().toLocaleDateString()}
        </p>
      </div>

      {!loading && grades.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="p-4 text-center">
            <p className="text-3xl font-bold">{grades.length}</p>
            <p className="text-sm text-muted-foreground mt-1">Classes Graded</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-3xl font-bold">{passCount}/{grades.length}</p>
            <p className="text-sm text-muted-foreground mt-1">Classes Passed</p>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader><CardTitle>Grade Summary</CardTitle></CardHeader>
        <Separator />
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : isError ? (
            <div className="p-5">
              <ErrorState
                title="Can't load this report card"
                description="The grades may not exist, or you don't have permission to view them."
                onRetry={refetch}
              />
            </div>
          ) : grades.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon={GraduationCap}
                title="No grades recorded yet"
                description="Grades appear here once a teacher finalises them."
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class</TableHead>
                  <TableHead className="text-center">Assignment Avg</TableHead>
                  <TableHead className="text-center">Exam Avg</TableHead>
                  <TableHead className="text-center">Final</TableHead>
                  <TableHead className="text-center">Grade</TableHead>
                  <TableHead>Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grades.map((g) => (
                  <TableRow key={g.id}>
                    <TableCell className="font-medium">{g.class.name}</TableCell>
                    <TableCell className="text-center">{g.assignmentAvg !== null ? `${g.assignmentAvg}%` : "—"}</TableCell>
                    <TableCell className="text-center">{g.examAvg !== null ? `${g.examAvg}%` : "—"}</TableCell>
                    <TableCell className="text-center font-semibold">{g.finalGrade ?? "—"}</TableCell>
                    <TableCell className="text-center">
                      {g.letterGrade ? <Badge className={gradeBadgeColor(g.letterGrade)}>{g.letterGrade}</Badge> : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{g.remarks ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportCard;
