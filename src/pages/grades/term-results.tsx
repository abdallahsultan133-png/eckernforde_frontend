import { useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import { useGetIdentity } from "@refinedev/core";
import { useSearchParams } from "react-router";
import { Award, FileText, Printer } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiQuery } from "@/hooks/use-api-query";
import { useDownload } from "@/hooks/use-download";
import { DeferredPdfDownload, type PdfModule } from "@/components/pdf/deferred-pdf-download";
import type { FormalTermResult } from "@/components/pdf/report-card-document";
import { UserRole, type User } from "@/types";
import { letterForScore } from "@/lib/grading/grade-bands";
import { portalSchoolName, schoolBandFromResults } from "@/lib/school-brand";

type Term = { id: number; name: string; type: "midterm" | "terminal"; academicYear: { name: string } };
type Result = { id: number; score: number; schoolLevel: "nursery" | "primary" | "secondary" | null; applicable: boolean; subject: { name: string; code: string }; class: { id: number; name: string } };
type Division = { totalPoints: number | null; division: "I" | "II" | "III" | "IV" | "0" | null; bestSeven: Array<{ subjectId: number; grade: string; points: number }> } | null;
type Position = { position: number; totalStudents: number; averageScore: number; divisionPoints: number | null };
type TermResultsResponse = { data: Result[]; term: { id: number; name: string; type: "midterm" | "terminal" }; division: Division; position: Position | null };
type Child = { id: string; name: string; email: string };
type StudentInfoResponse = { data: { name: string; profile: { registrationNumber: string | null } | null; schoolBand?: "primary" | "secondary" | null; enrolledClasses?: Array<{ schoolLevel?: "nursery" | "primary" | "secondary" | null }> } };
type ReportTemplate = {
  name: string;
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
type AttendanceRecord = { classId: number; status: "present" | "absent" | "late" | "excused" };
type AttendanceSummary = { present: number; absent: number; late: number; excused: number; total: number };

const secondaryPoints = (score: number) => score >= 75 ? 1 : score >= 65 ? 2 : score >= 45 ? 3 : score >= 30 ? 4 : 5;
const divisionForPoints = (points: number) => points <= 17 ? "I" : points <= 21 ? "II" : points <= 25 ? "III" : points <= 34 ? "IV" : "0";
function calculatedDivision(result?: TermResultsResponse) {
  if (!result) return null;
  const rows = result.data.filter((row) => row.schoolLevel !== "primary" && row.schoolLevel !== "nursery" && row.applicable && Number.isFinite(row.score));
  if (!rows.length) return null;
  const points = rows.map((row) => secondaryPoints(row.score)).sort((a, b) => a - b).slice(0, 7);
  const raw = points.reduce((sum, value) => sum + value, 0);
  const total = points.length < 7 ? raw + ((7 - points.length) * 5) : raw;
  return { division: divisionForPoints(total), totalPoints: total };
}

const loadFormalReportCardPdf = async () => {
  const [{ pdf }, { FormalReportCardDocument }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("@/components/pdf/report-card-document"),
  ]);
  return {
    pdf: pdf as unknown as PdfModule["pdf"],
    DocumentComponent: FormalReportCardDocument as unknown as ComponentType<Record<string, unknown>>,
  };
};

const colorForLetter = (letter: string | null) => {
  if (letter === "A" || letter === "B") return "#047857";
  if (letter === "C") return "#b45309";
  return "#b91c1c";
};

export default function TermResults() {
  const [searchParams] = useSearchParams();
  const historyYearId = searchParams.get("academicYearId");
  const requestedStudentId = searchParams.get("childId") ?? "";
  const { narrateDownload } = useDownload();
  const { data: identity } = useGetIdentity<User>();
  const isParent = identity?.role === UserRole.PARENT;
  const { data: childrenData, isLoading: childrenLoading, isError: childrenError, refetch: refetchChildren } = useApiQuery<{ data: Child[] }>(isParent ? "/profile/my-children" : null);
  const children = useMemo(() => childrenData?.data ?? [], [childrenData?.data]);
  const { data: termsData, isLoading: termsLoading, isError: termsError, refetch: refetchTerms } = useApiQuery<{ data: Term[] }>(`/grades/academic-terms${historyYearId ? `?academicYearId=${encodeURIComponent(historyYearId)}` : ""}`);
  const terms = useMemo(() => termsData?.data ?? [], [termsData?.data]);
  const [termId, setTermId] = useState("");
  const [studentId, setStudentId] = useState(requestedStudentId);
  useEffect(() => { if (!termId && terms.length) setTermId(String(terms[0].id)); }, [termId, terms]);
  useEffect(() => { if (isParent && !studentId && children.length) setStudentId(children[0].id); }, [children, isParent, studentId]);
  const resultStudentId = isParent ? studentId : identity?.id;
  const isStudent = identity?.role === UserRole.STUDENT;
  const isSchoolStaff = isStudent || identity?.role === UserRole.TEACHER;
  const { data: portal } = useApiQuery<{ data: { context: { schoolBand: "primary" | "secondary" } | null } }>(isSchoolStaff ? "/portal-context" : null);
  const showCombinedResults = isStudent || isParent;
  const combinedTerms = useMemo(() => {
    if (historyYearId || terms.length === 0) return terms;
    const currentYearName = terms[0]?.academicYear.name;
    return terms.filter((term) => term.academicYear.name === currentYearName);
  }, [historyYearId, terms]);
  const combinedMidterm = combinedTerms.find((term) => term.type === "midterm");
  const combinedAnnual = combinedTerms.find((term) => term.type === "terminal");
  const { data: midtermData, isLoading: midtermLoading, isError: midtermError, refetch: refetchMidterm } = useApiQuery<TermResultsResponse>(showCombinedResults && resultStudentId && combinedMidterm ? `/grades/term-results/${resultStudentId}?academicTermId=${combinedMidterm.id}` : null);
  const { data: annualData, isLoading: annualLoading, isError: annualError, refetch: refetchAnnual } = useApiQuery<TermResultsResponse>(showCombinedResults && resultStudentId && combinedAnnual ? `/grades/term-results/${resultStudentId}?academicTermId=${combinedAnnual.id}` : null);
  const { data, isLoading, isError, refetch } = useApiQuery<TermResultsResponse>(!showCombinedResults && resultStudentId && termId ? `/grades/term-results/${resultStudentId}?academicTermId=${termId}` : null);
  const { data: studentInfoData } = useApiQuery<StudentInfoResponse>(resultStudentId ? `/profile/student/${resultStudentId}` : null);
  const reportSchoolBand = isSchoolStaff ? portal?.data.context?.schoolBand : studentInfoData?.data.schoolBand ?? schoolBandFromResults([...(midtermData?.data ?? []), ...(annualData?.data ?? []), ...(studentInfoData?.data.enrolledClasses ?? [])], Boolean(midtermData?.division?.division || annualData?.division?.division));
  const portalReportSchoolName = portalSchoolName(reportSchoolBand);
  const { data: templateData } = useApiQuery<{ data: ReportTemplate }>(showCombinedResults ? "/report-card-template" : null);
  const { data: attendanceData } = useApiQuery<{ data: AttendanceRecord[] }>(showCombinedResults && resultStudentId ? `/attendance/student/${resultStudentId}?limit=200` : null);
  const results = data?.data ?? [];
  const division = data?.division?.division ? data.division : calculatedDivision(data);
  const selected = terms.find((term) => String(term.id) === termId);
  const hasSecondaryResults = results.some((result) => result.schoolLevel === "secondary");
  const reportStudentName = studentInfoData?.data?.name ?? (isParent ? children.find((child) => child.id === resultStudentId)?.name : identity?.name) ?? "student";
  const reportRegistrationNumber = studentInfoData?.data?.profile?.registrationNumber ?? null;
  const formalTerms: FormalTermResult[] = [
      ...(midtermData?.data.length ? [{ title: "Midterm", termName: midtermData.term.name, rows: midtermData.data, division: midtermData.division?.division ?? calculatedDivision(midtermData)?.division ?? null, totalPoints: midtermData.division?.totalPoints ?? calculatedDivision(midtermData)?.totalPoints ?? null, position: midtermData.position }] : []),
      ...(annualData?.data.length ? [{ title: "Terminal", termName: annualData.term.name, rows: annualData.data, division: annualData.division?.division ?? calculatedDivision(annualData)?.division ?? null, totalPoints: annualData.division?.totalPoints ?? calculatedDivision(annualData)?.totalPoints ?? null, position: annualData.position }] : []),
  ];
  const reportClassIds = useMemo(() => new Set([...(midtermData?.data ?? []), ...(annualData?.data ?? [])].map((row) => row.class.id)), [midtermData?.data, annualData?.data]);
  const attendanceSummary = useMemo<AttendanceSummary>(() => {
    const summary: AttendanceSummary = { present: 0, absent: 0, late: 0, excused: 0, total: 0 };
    for (const record of attendanceData?.data ?? []) {
      if (!reportClassIds.has(record.classId)) continue;
      summary[record.status] += 1;
      summary.total += 1;
    }
    return summary;
  }, [attendanceData?.data, reportClassIds]);
  const reportFileName = `report-card-${reportStudentName.replace(/\s+/g, "-").toLowerCase()}.pdf`;
  const reportDownloadReady = showCombinedResults && !midtermLoading && !annualLoading && formalTerms.length > 0 && !!templateData?.data;
  const reportDownload = reportDownloadReady ? <DeferredPdfDownload fileName={reportFileName} load={loadFormalReportCardPdf} documentProps={{ studentName: reportStudentName, schoolName: portalReportSchoolName, registrationNumber: reportRegistrationNumber, template: templateData.data, termResults: formalTerms, academicYearName: combinedTerms[0]?.academicYear.name, attendance: attendanceSummary }} onDownload={() => narrateDownload(reportFileName)} /> : null;
  const pageTitle = isParent ? "Report" : historyYearId ? "Previous Report" : showCombinedResults ? "Report" : "Term Results";
  const pageDescription = isParent
    ? "Published results for the selected child and academic year."
    : historyYearId
      ? "Read-only results from the selected academic year."
      : showCombinedResults
        ? "Your published Midterm and Annual subject results."
        : "Approved Midterm and Annual subject results.";

  return <div className="space-y-6">
    <PageHeader className="print:hidden" breadcrumb title={pageTitle} description={pageDescription} actions={<div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="mr-1.5 h-4 w-4" aria-hidden="true" />Print report</Button>{reportDownload}</div>} />
    {termsLoading || childrenLoading ? <Skeleton className="h-10 w-64" /> : termsError || childrenError ? <ErrorState title="Can't load academic terms" description="Try again shortly." onRetry={() => { refetchTerms(); refetchChildren(); }} /> : isParent && children.length === 0 ? <EmptyState icon={FileText} title="No linked children" description="Ask the school administrator to link your parent account to a student profile." /> : terms.length === 0 ? <EmptyState icon={FileText} title="No academic terms yet" description="Results will appear after the school creates an academic year and term." /> : <>
      <div className="flex flex-wrap items-center gap-3">
        {isParent && <Select value={studentId} onValueChange={setStudentId}><SelectTrigger className="w-full sm:w-[240px]"><SelectValue placeholder="Choose child" /></SelectTrigger><SelectContent>{children.map((child) => <SelectItem key={child.id} value={child.id}>{child.name}</SelectItem>)}</SelectContent></Select>}
        {!showCombinedResults && <><Select value={termId} onValueChange={setTermId}><SelectTrigger className="w-full sm:w-[280px]"><SelectValue placeholder="Choose a term" /></SelectTrigger><SelectContent>{terms.map((term) => <SelectItem key={term.id} value={String(term.id)}>{term.academicYear.name} · {term.name} ({term.type === "terminal" ? "Terminal" : "Midterm"})</SelectItem>)}</SelectContent></Select>{selected && <span className="text-sm text-muted-foreground">{selected.type === "terminal" ? "Terminal results" : "Midterm results"}</span>}</>}
        {showCombinedResults && combinedTerms[0] && <span className="text-sm text-muted-foreground">{combinedTerms[0].academicYear.name} · published results</span>}
      </div>
      {showCombinedResults ? <CombinedTermResults template={templateData?.data} studentName={reportStudentName} registrationNumber={reportRegistrationNumber} academicYearName={combinedTerms[0]?.academicYear.name} attendance={attendanceSummary} midterm={midtermData} annual={annualData} midtermLoading={midtermLoading} annualLoading={annualLoading} hasError={midtermError || annualError} onRetry={() => { refetchMidterm(); refetchAnnual(); }} /> : isLoading ? <Card className="p-5"><Skeleton className="h-48 w-full" /></Card> : isError ? <ErrorState title="Can't load term results" description="Results may not be published yet, or you may not have access." onRetry={refetch} /> : <>
        {division?.division && <Card className="border-[#ba4a32]/30 bg-[#ba4a32]/5"><CardContent className="flex flex-wrap items-center gap-5 p-6"><Award className="h-9 w-9 text-[#ba4a32]" aria-hidden="true" /><div><p className="text-sm font-medium text-muted-foreground">Secondary {selected?.type === "terminal" ? "Terminal" : "Midterm"} Division</p><p className="font-serif text-4xl font-semibold">Division {division.division}</p></div><div className="border-l border-border pl-5"><p className="text-sm font-medium text-muted-foreground">Best Seven points</p><p className="text-2xl font-bold">{division.totalPoints}</p></div></CardContent></Card>}
        {hasSecondaryResults && <Card className="border-border/70 bg-muted/20"><CardHeader className="pb-3"><CardTitle className="text-sm">Secondary grading reference</CardTitle></CardHeader><CardContent className="space-y-3 pt-0"><p className="text-xs leading-5 text-muted-foreground">A: 75–100 = 1 point · B: 65–74 = 2 · C: 45–64 = 3 · D: 30–44 = 4 · F: 0–29 = 5. The {selected?.type === "terminal" ? "Terminal" : "Midterm"} Division uses the seven strongest subjects; missing subjects count as F (5 points).</p></CardContent></Card>}
        <Card><CardHeader><CardTitle>Subject results</CardTitle></CardHeader><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b"><th className="p-3 text-left">Subject</th><th className="p-3 text-left">Class</th><th className="p-3 text-center">Score</th><th className="p-3 text-center">Grade</th></tr></thead><tbody>{results.length === 0 ? <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No results published for this term.</td></tr> : results.map((result) => { const letter = letterForScore(result.score); return <tr key={result.id} className="border-b last:border-0"><td className="p-3 font-medium">{result.subject.name}</td><td className="p-3 text-muted-foreground">{result.class.name}</td><td className="p-3 text-center font-semibold">{result.score}%</td><td className="p-3 text-center font-semibold" style={{ color: colorForLetter(letter) }}>{letter ?? "—"}</td></tr>; })}</tbody></table></div></CardContent></Card>
      </>}
    </>}
  </div>;
}

function CombinedTermResults({ template, studentName, registrationNumber, academicYearName, attendance, midterm, annual, midtermLoading, annualLoading, hasError, onRetry }: {
  template?: ReportTemplate;
  studentName: string;
  registrationNumber: string | null;
  academicYearName?: string;
  attendance: AttendanceSummary;
  midterm?: TermResultsResponse;
  annual?: TermResultsResponse;
  midtermLoading: boolean;
  annualLoading: boolean;
  hasError: boolean;
  onRetry: () => void;
}) {
  if (hasError) return <ErrorState title="Can't load term results" description="Results may not be published yet, or you may not have access." onRetry={onRetry} />;
  const showMidterm = midtermLoading || (midterm?.data.length ?? 0) > 0;
  const showAnnual = annualLoading || (annual?.data.length ?? 0) > 0;
  if (!showMidterm && !showAnnual) return <EmptyState icon={FileText} title="No results published" description="Your school has not published Midterm or Annual results yet." />;
  const accent = template?.accentColor ?? "#0f4c5c";
  const { data: identity } = useGetIdentity<User>();
  const isSchoolStaff = identity?.role === UserRole.STUDENT || identity?.role === UserRole.TEACHER;
  const { data: portal } = useApiQuery<{ data: { context: { schoolBand: "primary" | "secondary" } | null } }>(isSchoolStaff ? "/portal-context" : null);
  const schoolBand = isSchoolStaff ? portal?.data.context?.schoolBand : schoolBandFromResults([...(midterm?.data ?? []), ...(annual?.data ?? [])], Boolean(midterm?.division?.division || annual?.division?.division));
  const schoolName = portalSchoolName(schoolBand).toUpperCase();
  const schoolLogo = template?.logoUrl || (schoolBand === "primary" ? "/eckernforde-english-medium-primary-badge.png" : "/eckernforde-cambridge-badge.png");
  const firstRow = midterm?.data[0] ?? annual?.data[0];
  return <div className="mx-auto max-w-4xl overflow-hidden border border-slate-200 bg-white text-slate-900 shadow-sm print:shadow-none" style={{ borderTop: `5px solid ${accent}` }}>
    <header className="flex flex-col items-center gap-5 border-b p-5 text-center sm:p-8">
      <div className="flex flex-col items-center gap-3"><img src={schoolLogo} alt={`${schoolName} logo`} className="h-24 w-24 object-contain" /><div><h2 className="text-2xl font-bold uppercase underline decoration-2 underline-offset-4 sm:text-3xl" style={{ color: accent }}>{schoolName}</h2>{template?.schoolAddress ? <p className="text-xs text-slate-500">{template.schoolAddress}</p> : null}</div></div>
      <div><p className="text-xs font-semibold uppercase tracking-widest" style={{ color: accent }}>Student report card</p><p className="mt-1 text-xs text-slate-500">Academic year {academicYearName ?? "—"}</p></div>
    </header>
    <div className="grid gap-3 border-b px-5 py-4 text-sm sm:grid-cols-7 sm:px-8"><p><span className="text-slate-500">Student</span><br /><strong>{studentName}</strong></p><p><span className="text-slate-500">Class / Form</span><br /><strong>{firstRow?.class.name ?? "—"}</strong></p><p><span className="text-slate-500">Registration no.</span><br /><strong>{registrationNumber ?? "—"}</strong></p><p><span className="text-slate-500">Midterm result</span><br /><strong>{(midterm?.division?.division ?? calculatedDivision(midterm)?.division) ? `Division ${midterm?.division?.division ?? calculatedDivision(midterm)?.division} · ${midterm?.division?.totalPoints ?? calculatedDivision(midterm)?.totalPoints} points` : "—"}</strong></p><p><span className="text-slate-500">Midterm position</span><br /><strong>{midterm?.position ? `${midterm.position.position} of ${midterm.position.totalStudents}${midterm.position.divisionPoints !== null ? ` · ${midterm.position.divisionPoints} pts` : ""}` : "—"}</strong></p><p><span className="text-slate-500">Terminal result</span><br /><strong>{(annual?.division?.division ?? calculatedDivision(annual)?.division) ? `Division ${annual?.division?.division ?? calculatedDivision(annual)?.division} · ${annual?.division?.totalPoints ?? calculatedDivision(annual)?.totalPoints} points` : "—"}</strong></p><p><span className="text-slate-500">Terminal position</span><br /><strong>{annual?.position ? `${annual.position.position} of ${annual.position.totalStudents}${annual.position.divisionPoints !== null ? ` · ${annual.position.divisionPoints} pts` : ""}` : "—"}</strong></p></div>
    <div className="p-5 sm:p-8">
      {showMidterm && <section className="border border-slate-200 p-4 sm:p-5"><p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: accent }}>Part 1 · Midterm</p><ReportTermSection title="Midterm" subtitle={midterm?.term.name ?? "Midterm assessment"} result={midterm} loading={midtermLoading} accent={accent} showDivision={template?.showDivision !== false} /></section>}
      {showAnnual && <section className="mt-6 border border-slate-200 p-4 sm:p-5"><p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: accent }}>Part 2 · Terminal</p><ReportTermSection title="Terminal" subtitle={annual?.term.name ?? "Terminal / annual assessment"} result={annual} loading={annualLoading} accent={accent} showDivision={template?.showDivision !== false} /></section>}
      {template?.showAttendance && <section className="mt-6 border p-3 text-sm"><strong style={{ color: accent }}>Attendance</strong>{attendance.total > 0 ? <span className="ml-4 text-slate-600">Present {attendance.present} · Absent {attendance.absent} · Late {attendance.late} · Excused {attendance.excused}</span> : <p className="mt-2 text-slate-500">No attendance records are available for this report.</p>}</section>}
      {template?.showRemarks && <section className="mt-6 border p-3 text-sm"><strong style={{ color: accent }}>Teacher remarks</strong><p className="mt-2 text-slate-500">No teacher remarks have been recorded for this report.</p></section>}
      <footer className="mt-12 grid gap-8 border-t pt-4 text-center text-xs sm:grid-cols-2"><div><div className="mx-auto mb-2 h-8 border-b border-slate-400">Class teacher</div><span>Class teacher signature</span></div><div><div className="mx-auto mb-2 flex h-8 items-end justify-center border-b border-slate-400">{template?.headmasterSignature ?? "Headmaster signature"}</div><span>{template?.headmasterName ?? "Headmaster"}</span></div></footer>
    </div>
  </div>;
}

function ReportTermSection({ title, subtitle, result, loading, accent, showDivision = false }: { title: string; subtitle: string; result?: TermResultsResponse; loading: boolean; accent: string; showDivision?: boolean }) {
  const rows = result?.data ?? [];
  const hasSecondaryResults = rows.some((row) => row.schoolLevel === "secondary");
  const termDivision = result?.division?.division ? result.division : calculatedDivision(result);
  return <section className="mt-6 first:mt-0"><div className="mb-2 flex items-end justify-between gap-3"><div><h3 className="font-semibold" style={{ color: accent }}>{title}</h3><p className="text-xs text-slate-500">{subtitle}</p></div>{showDivision && rows.length > 0 && <span className="text-sm font-semibold" style={{ color: accent }}>{termDivision?.division ? `Division ${termDivision.division} · ${termDivision.totalPoints} points` : "Division pending"}</span>}</div>{result?.position && <p className="mb-3 border-l-4 px-3 py-2 text-sm text-slate-600" style={{ borderColor: accent, backgroundColor: `${accent}0d` }}><strong style={{ color: accent }}>Position: {result.position.position} of {result.position.totalStudents}</strong><span className="ml-2">{result.position.divisionPoints !== null ? `${result.position.divisionPoints} division points` : `Overall average ${result.position.averageScore}%`}</span></p>}{loading ? <Skeleton className="h-32 w-full" /> : <div className="overflow-x-auto"><table className="w-full border-collapse text-sm"><thead><tr style={{ backgroundColor: `${accent}18`, color: accent }}><th className="border p-2 text-left">Subject</th><th className="border p-2 text-center">Marks</th><th className="border p-2 text-center">Grade</th></tr></thead><tbody>{rows.map((row) => { const letter = letterForScore(row.score); return <tr key={row.id}><td className="border p-2">{row.subject.name}</td><td className="border p-2 text-center">{row.score}</td><td className="border p-2 text-center font-semibold" style={{ color: colorForLetter(letter) }}>{letter ?? "—"}</td></tr>; })}</tbody></table></div>}{!loading && hasSecondaryResults && <p className="mt-2 text-xs text-slate-500">Secondary division uses the best seven applicable subjects in this paper. Homework does not contribute to division.</p>}</section>;
}
