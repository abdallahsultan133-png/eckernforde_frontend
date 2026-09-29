import { useGetIdentity } from "@refinedev/core";
import type { ComponentType } from "react";
import { useParams } from "react-router";
import { GraduationCap } from "lucide-react";
import { useDownload } from "@/hooks/use-download.ts";
import { DeferredPdfDownload, type PdfModule } from "@/components/pdf/deferred-pdf-download.tsx";
import type { FormalTermResult } from "@/components/pdf/report-card-document.tsx";

import { PageHeader } from "@/components/layout/page-header.tsx";
import { EmptyState } from "@/components/ui/empty-state.tsx";
import { ErrorState } from "@/components/ui/error-state.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.tsx";
import { useApiQuery } from "@/hooks/use-api-query.ts";
import { UserRole, type User } from "@/types";
import { letterForScore } from "@/lib/grading/grade-bands";
import { portalSchoolName, schoolBandFromResults } from "@/lib/school-brand";

// /grades/report-card shows the caller's own; /grades/report-card/:id (used by
// staff/parents from a student's profile) shows that student's instead — same
// backend endpoint enforces students can only ever resolve their own id.
type StudentInfoResponse = {
  data: { name: string; profile: { registrationNumber: string | null } | null; schoolBand?: "primary" | "secondary" | null; enrolledClasses?: Array<{ schoolLevel?: "nursery" | "primary" | "secondary" | null }> };
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

type ReportTemplate = {
  schoolName: string;
  schoolAddress: string | null;
  headmasterName: string | null;
  headmasterSignature: string | null;
  logoUrl: string | null;
  accentColor: string;
  showAttendance: boolean;
  showRemarks: boolean;
  showDivision: boolean;
};
type AcademicTerm = { id: number; name: string; type: "midterm" | "terminal"; academicYear: { name: string } };
type FormalResult = { id: number; score: number; subject: { id: number; name: string; code: string }; class: { id: number; name: string }; schoolLevel: "nursery" | "primary" | "secondary" | null; applicable: boolean };
type Position = { position: number; totalStudents: number; averageScore: number; divisionPoints: number | null };
type FormalResultsResponse = { data: FormalResult[]; term: { id: number; name: string; type: "midterm" | "terminal" }; division: { division: string | null; totalPoints: number | null } | null; position: Position | null };
type AttendanceRow = { status: "present" | "absent" | "late" | "excused" };

const secondaryPoints = (score: number) => score >= 75 ? 1 : score >= 65 ? 2 : score >= 45 ? 3 : score >= 30 ? 4 : 5;
const divisionForPoints = (points: number) => points <= 17 ? "I" : points <= 21 ? "II" : points <= 25 ? "III" : points <= 34 ? "IV" : "0";
const calculatedDivision = (result?: FormalResultsResponse) => {
  const points = (result?.data ?? []).filter((row) => row.schoolLevel !== "primary" && row.schoolLevel !== "nursery" && row.applicable).map((row) => secondaryPoints(row.score)).sort((a, b) => a - b).slice(0, 7);
  if (!points.length) return null;
  const raw = points.reduce((sum, value) => sum + value, 0);
  const total = points.length < 7 ? raw + ((7 - points.length) * 5) : raw;
  return { division: divisionForPoints(total), totalPoints: total };
};

const gradeBadgeColor = (letter: string | null) => {
  if (!letter) return "";
  if (letter === "A") return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  if (letter === "B") return "bg-blue-500/10 text-blue-700 dark:text-blue-300";
  if (letter === "C") return "bg-amber-500/10 text-amber-700 dark:text-amber-300";
  return "bg-red-500/10 text-red-700 dark:text-red-300";
};

const gradeColor = (letter: string | null) => letter === "A" || letter === "B" ? "#047857" : letter === "C" ? "#b45309" : "#b91c1c";

const loadReportCardPdf = async () => {
  const [{ pdf }, { FormalReportCardDocument }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("@/components/pdf/report-card-document.tsx"),
  ]);
  return { pdf: pdf as unknown as PdfModule["pdf"], DocumentComponent: FormalReportCardDocument as unknown as ComponentType<Record<string, unknown>> };
};

const ReportCard = () => {
  const { id: routeStudentId } = useParams<{ id?: string }>();
  const { narrateDownload } = useDownload();
  const { data: identity, isLoading: identityLoading } = useGetIdentity<User>();
  const targetStudentId = routeStudentId ?? identity?.id;
  const isSchoolStaff = identity?.role === UserRole.STUDENT || identity?.role === UserRole.TEACHER;
  const { data: portal } = useApiQuery<{ data: { context: { schoolBand: "primary" | "secondary" } | null } }>(isSchoolStaff ? "/portal-context" : null);

  const { data, isLoading: loading, isError, refetch } = useApiQuery<{ data: GradeRow[] }>(targetStudentId ? `/grades/student/${targetStudentId}` : null);
  const grades = data?.data ?? [];

  // Same endpoint works whether targetStudentId is the caller's own id or
  // someone else's — the backend only restricts students from resolving an id
  // that isn't their own, which never applies to the "own report card" path.
  const { data: studentInfoData } = useApiQuery<StudentInfoResponse>(targetStudentId ? `/profile/student/${targetStudentId}` : null);
  const studentName = studentInfoData?.data?.name ?? identity?.name ?? "";
  const registrationNumber = studentInfoData?.data?.profile?.registrationNumber ?? null;
  const { data: templateData } = useApiQuery<{ data: ReportTemplate }>("/report-card-template");
  const { data: termsData } = useApiQuery<{ data: AcademicTerm[] }>("/grades/academic-terms");
  const terms = termsData?.data ?? [];
  const midterm = terms.find((term) => term.type === "midterm");
  const annual = terms.find((term) => term.type === "terminal");
  const { data: midtermData, isLoading: midtermLoading } = useApiQuery<FormalResultsResponse>(targetStudentId && midterm ? `/grades/term-results/${targetStudentId}?academicTermId=${midterm.id}` : null);
  const { data: annualData, isLoading: annualLoading } = useApiQuery<FormalResultsResponse>(targetStudentId && annual ? `/grades/term-results/${targetStudentId}?academicTermId=${annual.id}` : null);
  const reportSchoolBand = isSchoolStaff ? portal?.data.context?.schoolBand : studentInfoData?.data.schoolBand ?? schoolBandFromResults([...(midtermData?.data ?? []), ...(annualData?.data ?? []), ...(studentInfoData?.data.enrolledClasses ?? [])], Boolean(midtermData?.division?.division || annualData?.division?.division));
  const portalReportSchoolName = portalSchoolName(reportSchoolBand);
  const { data: attendanceData } = useApiQuery<{ data: AttendanceRow[] }>(targetStudentId ? `/attendance/student/${targetStudentId}?limit=200` : null);
  const template = templateData?.data;

  const formalPdfTerms: FormalTermResult[] = [
    ...(midtermData?.data.length ? [{ title: "Midterm", termName: midtermData.term.name, rows: midtermData.data, division: midtermData.division?.division ?? calculatedDivision(midtermData)?.division ?? null, totalPoints: midtermData.division?.totalPoints ?? calculatedDivision(midtermData)?.totalPoints ?? null, position: midtermData.position }] : []),
    ...(annualData?.data.length ? [{ title: "Terminal", termName: annualData.term.name, rows: annualData.data, division: annualData.division?.division ?? calculatedDivision(annualData)?.division ?? null, totalPoints: annualData.division?.totalPoints ?? calculatedDivision(annualData)?.totalPoints ?? null, position: annualData.position }] : []),
  ];
  const attendanceSummary = (attendanceData?.data ?? []).reduce((summary, row) => ({ ...summary, [row.status]: summary[row.status] + 1, total: summary.total + 1 }), { present: 0, absent: 0, late: 0, excused: 0, total: 0 });
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
        description={studentName || undefined}
        actions={
          !midtermLoading && !annualLoading && formalPdfTerms.length > 0 && studentName && (
            <DeferredPdfDownload
              fileName={pdfFileName}
              load={loadReportCardPdf}
              documentProps={{ studentName, schoolName: portalReportSchoolName, registrationNumber, template, termResults: formalPdfTerms, academicYearName: terms[0]?.academicYear.name, attendance: attendanceSummary }}
              onDownload={() => narrateDownload(pdfFileName)}
            />
          )
        }
      />

      <div className="hidden print:block">
        <h1 className="text-xl font-bold">Report Card</h1>
        <p className="text-sm text-muted-foreground">
          {studentName} · Generated {new Date().toLocaleDateString()}
        </p>
      </div>

      {!loading && grades.length > 0 && (
        <div className="report-card-summary grid gap-4 sm:grid-cols-3">
          <Card className="report-card-summary-card p-4 text-center">
            <p className="text-3xl font-bold">{grades.length}</p>
            <p className="text-sm text-muted-foreground mt-1">Classes Graded</p>
          </Card>
          <Card className="report-card-summary-card p-4 text-center">
            <p className="text-3xl font-bold">{passCount}/{grades.length}</p>
            <p className="text-sm text-muted-foreground mt-1">Classes Passed</p>
          </Card>
        </div>
      )}

      <OfficialReportCard
        template={template}
        studentName={studentName}
        registrationNumber={registrationNumber}
        academicYearName={terms[0]?.academicYear.name}
        midterm={midtermData}
        annual={annualData}
        midtermLoading={midtermLoading}
        annualLoading={annualLoading}
        attendance={attendanceData?.data ?? []}
      />

      <Card className="border-border/70 bg-muted/20 print:hidden">
        <CardContent className="flex flex-wrap items-start gap-3 p-4">
          <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium">Official secondary divisions are shown in Term Results.</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">Division is calculated from the best seven terminal subjects. Homework does not contribute to the final division, and the school does not use GPA for secondary results.</p>
          </div>
        </CardContent>
      </Card>

      <Card className="report-card-results overflow-hidden">
        <CardHeader className="bg-secondary/25">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary/75">Academic record</p>
          <CardTitle className="mt-1">Grade Summary</CardTitle>
        </CardHeader>
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
                  <TableHead className="text-center">Homework Avg</TableHead>
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

function OfficialReportCard({
  template,
  studentName,
  registrationNumber,
  academicYearName,
  midterm,
  annual,
  midtermLoading,
  annualLoading,
  attendance,
}: {
  template?: ReportTemplate;
  studentName: string;
  registrationNumber: string | null;
  academicYearName?: string;
  midterm?: FormalResultsResponse;
  annual?: FormalResultsResponse;
  midtermLoading: boolean;
  annualLoading: boolean;
  attendance: AttendanceRow[];
}) {
  const accent = template?.accentColor ?? "#0f4c5c";
  const { data: identity } = useGetIdentity<User>();
  const isSchoolStaff = identity?.role === "student" || identity?.role === "teacher";
  const { data: portal } = useApiQuery<{ data: { context: { schoolBand: "primary" | "secondary" } | null } }>(isSchoolStaff ? "/portal-context" : null);
  const reportSchoolBand = isSchoolStaff ? portal?.data.context?.schoolBand : schoolBandFromResults([...(midterm?.data ?? []), ...(annual?.data ?? [])], Boolean(midterm?.division?.division || annual?.division?.division));
  const reportSchoolName = portalSchoolName(reportSchoolBand);
  const reportSchoolLogo = reportSchoolBand === "primary" ? "/eckernforde-english-medium-primary-badge.png" : "/eckernforde-cambridge-badge.png";
  const present = attendance.filter((row) => row.status === "present").length;
  const absent = attendance.filter((row) => row.status === "absent").length;
  const late = attendance.filter((row) => row.status === "late").length;
  const midtermHasResults = (midterm?.data.length ?? 0) > 0;
  const annualHasResults = (annual?.data.length ?? 0) > 0;
  const hasAnyResults = midtermHasResults || annualHasResults;
  const showMidterm = midtermLoading || midtermHasResults;
  const showAnnual = annualLoading || annualHasResults;
  const className = midterm?.data[0]?.class.name ?? annual?.data[0]?.class.name;

  return <Card className="overflow-hidden border-2" style={{ borderTopColor: accent }}>
    <CardHeader className="border-b" style={{ borderBottomColor: `${accent}35` }}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3"><img src={reportSchoolLogo} alt="School logo" className="h-12 w-12 object-contain" /><div><CardTitle className="underline decoration-2 underline-offset-4" style={{ color: accent }}>{reportSchoolName}</CardTitle>{template?.schoolAddress ? <p className="mt-1 text-xs text-muted-foreground">{template.schoolAddress}</p> : null}</div></div>
        <div className="text-right text-xs text-muted-foreground"><p className="font-semibold uppercase tracking-wide" style={{ color: accent }}>Student report card</p><p>Academic year: {academicYearName || "—"}</p><p>Student: {studentName || "—"}</p><p>Class / Form: {className || "—"}</p><p>{registrationNumber ? `Registration: ${registrationNumber}` : ""}</p><p className="mt-1 font-semibold" style={{ color: accent }}>Midterm: {midterm?.division?.division ? `Division ${midterm.division.division}` : midterm && midterm.data.some((row) => row.schoolLevel === "secondary") ? "Division pending" : "—"}</p><p className="font-semibold" style={{ color: accent }}>Terminal: {annual?.division?.division ? `Division ${annual.division.division}` : annual && annual.data.some((row) => row.schoolLevel === "secondary") ? "Division pending" : "—"}</p></div>
      </div>
    </CardHeader>
    <CardContent className="space-y-4 p-4 sm:p-6">
      <div className="space-y-4">
        {showMidterm && <FormalTermSection title="Midterm" result={midterm} accent={accent} loading={midtermLoading} division={template?.showDivision !== false} />}
        {showAnnual && <FormalTermSection title="Terminal" result={annual} accent={accent} loading={annualLoading} division={template?.showDivision !== false} />}
        {!midtermLoading && !annualLoading && !hasAnyResults && (
          <div className="border p-5 text-center text-sm text-muted-foreground">
            No published term results yet.
          </div>
        )}
      </div>
      {template?.showAttendance !== false && <div className="border p-3 text-sm"><p className="font-semibold" style={{ color: accent }}>Attendance</p><p className="mt-1 text-muted-foreground">Present {present} · Absent {absent} · Late {late} · Excused {attendance.filter((row) => row.status === "excused").length}</p></div>}
      {template?.showRemarks !== false && <div className="border p-3 text-sm"><p className="font-semibold" style={{ color: accent }}>Teacher remarks</p><p className="mt-1 text-muted-foreground">Published teacher remarks appear with the assessment results.</p></div>}
      <div className="grid gap-8 border-t pt-5 text-center text-xs sm:grid-cols-2"><div className="border-b pb-2 text-muted-foreground">Class teacher signature</div><div className="border-b pb-2 text-muted-foreground">{template?.headmasterSignature || "Headmaster signature"}<br />{template?.headmasterName || "Headmaster"}</div></div>
    </CardContent>
  </Card>;
}

function FormalTermSection({ title, result, accent, division, loading }: { title: string; result?: FormalResultsResponse; accent: string; division?: boolean; loading?: boolean }) {
  const rows = result?.data ?? [];
  const termDivision = result?.division?.division ? result.division : calculatedDivision(result);
  return <section><div className="mb-2 flex items-center justify-between"><div><h3 className="font-semibold" style={{ color: accent }}>{title}</h3><p className="text-xs text-muted-foreground">{result?.term.name ?? "Loading results"}</p></div>{division && <Badge style={{ backgroundColor: accent }}>{termDivision?.division ? `Division ${termDivision.division} · ${termDivision.totalPoints} points` : "Division pending"}</Badge>}</div>{result?.position && <div className="mb-3 border-l-4 px-3 py-2 text-sm" style={{ borderColor: accent, backgroundColor: `${accent}0d` }}><span className="font-semibold" style={{ color: accent }}>Position: {result.position.position} of {result.position.totalStudents}</span><span className="ml-2 text-muted-foreground">{result.position.divisionPoints !== null ? `${result.position.divisionPoints} division points` : `Overall average ${result.position.averageScore}%`}</span></div>}<div className="overflow-x-auto border"><Table><TableHeader><TableRow><TableHead>Subject</TableHead><TableHead className="text-right">Marks</TableHead><TableHead className="text-right">Grade</TableHead></TableRow></TableHeader><TableBody>{loading ? <TableRow><TableCell colSpan={3} className="py-5 text-center text-sm text-muted-foreground">Loading {title.toLowerCase()} results…</TableCell></TableRow> : rows.map((row) => { const letter = row.applicable ? letterForScore(row.score) : null; return <TableRow key={row.id}><TableCell className="font-medium">{row.subject.name}</TableCell><TableCell className="text-right font-semibold">{row.score}</TableCell><TableCell className="text-right font-semibold" style={{ color: gradeColor(letter) }}>{letter ?? "Excluded"}</TableCell></TableRow>; })}</TableBody></Table></div></section>;
}

export default ReportCard;
