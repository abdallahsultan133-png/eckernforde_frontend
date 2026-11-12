import { useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import { useGetIdentity, useList } from "@refinedev/core";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router";
import { BookOpenCheck, ChevronDown, Loader2, Printer, Save } from "lucide-react";
import { toast } from "sonner";
import { useDownload } from "@/hooks/use-download.ts";
import { DeferredPdfDownload, type PdfModule } from "@/components/pdf/deferred-pdf-download.tsx";

import { PageHeader } from "@/components/layout/page-header.tsx";
import { PageContainer } from "@/components/layout/page-container.tsx";
import { Card } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { EmptyState } from "@/components/ui/empty-state.tsx";
import { ErrorState } from "@/components/ui/error-state.tsx";
import { StatusBadge, type StatusTone } from "@/components/ui/status-badge.tsx";
import { SummaryBar, type SummaryItem } from "@/components/ui/summary-bar.tsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.tsx";
import { useApiQuery } from "@/hooks/use-api-query.ts";
import { cn } from "@/lib/utils.ts";
import { UserRole, type User, type ClassDetails } from "@/types";
import { letterForScore } from "@/lib/grading/grade-bands";
import { BACKEND_BASE_URL } from "@/constants";
import { portalSchoolName, schoolBandFromResults, type PortalSchoolBand } from "@/lib/school-brand";
import { useHistoricalPortal } from "@/components/layout/historical-portal-banner";
import { ParentAcademicSelector } from "@/pages/parent/academic-selector";

type GradebookRow = {
  studentId: string;
  name: string;
  email: string;
  assignmentAvg: number | null;
  examAvg: number | null;
  missingAssignmentSubmission: boolean;
  finalGrade: number | null;
  letterGrade: string | null;
  remarks: string | null;
  isOverridden: boolean;
};

type AssignmentQuestion = {
  id: number;
  title: string;
  description: string | null;
  dueAt?: string | null;
  maxScore: number;
  subjectName?: string;
  subjectAssignmentIndex?: number;
};

type AssignmentSubmission = {
  assignmentId: number;
  studentId: string;
  status: "submitted" | "graded";
  score: number | null;
  feedback?: string | null;
};

type GradebookResponse = {
  data: GradebookRow[];
  assignments: AssignmentQuestion[];
  submissions: AssignmentSubmission[];
};

type SubjectHomeworkSummary = {
  classId: number;
  className: string;
  subjectName: string;
  assignmentCount: number;
  gradedAssignmentCount: number;
  assignmentAvg: number | null;
  examAvg: number | null;
  letterGrade: string | null;
  assignments: AssignmentQuestion[];
  submissions: AssignmentSubmission[];
};

type AllSubjectsGradebookResponse = {
  data: SubjectHomeworkSummary[];
  student: { id: string; name: string; email?: string | null };
  overallAverage: number | null;
};

type ParentChild = {
  id: string;
  name: string;
  enrolledClasses: ClassDetails[];
};

const loadGradebookPdf = async () => {
  const [{ pdf }, { GradebookDocument }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("@/components/pdf/gradebook-document.tsx"),
  ]);
  return { pdf: pdf as unknown as PdfModule["pdf"], DocumentComponent: GradebookDocument as unknown as ComponentType<Record<string, unknown>> };
};

const letterTone = (letter: string | null): StatusTone =>
  letter === "A" || letter === "B" ? "success" : letter === "C" ? "warning" : letter === "D" || letter === "F" ? "critical" : "neutral";

const gradeColor = (grade: number | null) => {
  if (grade === null) return "text-muted-foreground";
  if (grade >= 75) return "text-emerald-600 dark:text-emerald-400";
  if (grade >= 65) return "text-blue-600 dark:text-blue-400";
  if (grade >= 45) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
};

const classLabel = (course: ClassDetails) =>
  course.subject?.name ? `${course.name} · ${course.subject.name}` : course.name;

const Gradebook = () => {
  const { data: identity } = useGetIdentity<User>();
  const { data: historicalPortal } = useHistoricalPortal();
  const historical = !!historicalPortal?.data.archiveContext;
  const isSchoolStaff = identity?.role === UserRole.STUDENT || identity?.role === UserRole.TEACHER;
  const { data: portal } = useApiQuery<{ data: { context: { schoolBand: "primary" | "secondary" } | null } }>(isSchoolStaff ? "/portal-context" : null);
  const queryClient = useQueryClient();
  const isTeacherOrAdmin = identity?.role === UserRole.TEACHER || identity?.role === UserRole.PRIMARY_HEADMASTER || identity?.role === UserRole.SECONDARY_HEADMASTER || identity?.role === UserRole.SUPER_ADMIN;
  const isTeacher = identity?.role === UserRole.TEACHER;
  const usesExpandedHomeworkReportRules = isTeacher
    || identity?.role === UserRole.PRIMARY_HEADMASTER
    || identity?.role === UserRole.SECONDARY_HEADMASTER
    || identity?.role === UserRole.SUPER_ADMIN;
  const usesStaffSummaryLayout = isTeacher || identity?.role === UserRole.PRIMARY_HEADMASTER || identity?.role === UserRole.SECONDARY_HEADMASTER || identity?.role === UserRole.SUPER_ADMIN;
  const isStudent = identity?.role === UserRole.STUDENT;
  const isParent = identity?.role === UserRole.PARENT;
  const isStudentView = isStudent || isParent;

  const { narrateDownload } = useDownload();
  // Prefill the class when arriving from a class workspace (/grades?classId=5).
  const [searchParams] = useSearchParams();
  const selectedChildId = searchParams.get("childId") ?? "";
  const selectedAcademicYearId = searchParams.get("academicYearId") ?? "";
  const hasParentContext = Boolean(selectedChildId && selectedAcademicYearId);
  const parentContextQuery = hasParentContext
    ? `?childId=${encodeURIComponent(selectedChildId)}&academicYearId=${encodeURIComponent(selectedAcademicYearId)}`
    : "";
  const [classId, setClassId] = useState(searchParams.get("classId") ?? "");
  const [pdfReportMode, setPdfReportMode] = useState<"full" | "summary">("full");
  const [expandedAssignmentId, setExpandedAssignmentId] = useState<number | null>(null);
  const [overrides, setOverrides] = useState<Record<string, { remarks: string }>>({});
  const [saving, setSaving] = useState(false);

  const { query: classesQuery } = useList<ClassDetails>({
    resource: "classes",
    pagination: { pageSize: 100 },
    queryOptions: { enabled: !isParent },
  });
  const { data: parentChildrenData, isLoading: parentChildrenLoading, isError: parentChildrenError, refetch: refetchParentChildren } = useApiQuery<{ data: ParentChild[] }>(
    isParent && hasParentContext
      ? `/profile/my-children?academicYearId=${encodeURIComponent(selectedAcademicYearId)}`
      : null,
  );
  const selectedChild = parentChildrenData?.data.find((child) => child.id === selectedChildId);
  const allClasses = useMemo(
    () => isParent ? selectedChild?.enrolledClasses ?? [] : classesQuery?.data?.data ?? [],
    [classesQuery?.data?.data, isParent, selectedChild?.enrolledClasses],
  );

  // A student can only ever view their own gradebook row, and only for a class
  // they're enrolled in — so the picker only offers those.
  const { data: enrolledIdsData } = useApiQuery<{ data: number[] }>(isStudent ? "/classes/enrolled-ids" : null);
  const enrolledIds = enrolledIdsData?.data ?? [];
  const classes = isStudent ? allClasses.filter((c) => enrolledIds.includes(c.id)) : allClasses;

  useEffect(() => {
    if (classId && classId !== "all" && !classes.some((course) => String(course.id) === classId)) {
      setClassId("");
    } else if (!isStudentView && classes.length > 0 && !classId) {
      setClassId(String(classes[0].id));
    }
  }, [classes, classId, isStudentView]);

  const allSubjectsSelected = isStudentView && classId === "all";
  const classIsReady = classes.some((course) => String(course.id) === classId);
  const gradebookPath = classIsReady
    ? `/grades/gradebook/${classId}${isParent ? parentContextQuery : ""}`
    : null;
  const { data: singleGradebookData, isLoading: singleLoading, isError: singleIsError, error: singleGradebookError, refetch: refetchSingle } = useApiQuery<GradebookResponse>(gradebookPath);
  const allSubjectsPath = allSubjectsSelected
    ? `/grades/gradebook/all-subjects${isParent ? parentContextQuery : ""}`
    : null;
  const { data: allSubjectsData, isLoading: allSubjectsLoading, isError: allSubjectsIsError, error: allSubjectsError, refetch: refetchAllSubjects } = useApiQuery<AllSubjectsGradebookResponse>(
    allSubjectsPath,
  );
  const subjectSummaries = useMemo(() => allSubjectsData?.data ?? [], [allSubjectsData?.data]);
  const gradebookData = useMemo<GradebookResponse | undefined>(() => {
    if (!allSubjectsSelected) return singleGradebookData;
    if (!allSubjectsData) return undefined;
    const assignments = subjectSummaries.flatMap((subject) => subject.assignments.map((assignment, index) => ({
      ...assignment,
      subjectName: subject.subjectName,
      subjectAssignmentIndex: index + 1,
    })));
    return {
      data: subjectSummaries.length ? [{
        studentId: isParent ? selectedChild?.id ?? allSubjectsData.student.id : allSubjectsData.student.id,
        name: isParent ? selectedChild?.name ?? allSubjectsData.student.name : allSubjectsData.student.name,
        email: allSubjectsData.student.email ?? "",
        assignmentAvg: allSubjectsData.overallAverage,
        examAvg: null,
        missingAssignmentSubmission: false,
        finalGrade: allSubjectsData.overallAverage,
        letterGrade: letterForScore(allSubjectsData.overallAverage),
        remarks: null,
        isOverridden: false,
      }] : [],
      assignments,
      submissions: subjectSummaries.flatMap((subject) => subject.submissions),
    };
  }, [allSubjectsData, allSubjectsSelected, isParent, selectedChild?.id, selectedChild?.name, singleGradebookData, subjectSummaries]);
  const loading = allSubjectsSelected ? allSubjectsLoading : singleLoading;
  const isError = allSubjectsSelected ? allSubjectsIsError : singleIsError;
  const gradebookError = allSubjectsSelected ? allSubjectsError : singleGradebookError;
  const refetch = allSubjectsSelected ? refetchAllSubjects : refetchSingle;
  const rows = useMemo(() => gradebookData?.data ?? [], [gradebookData]);
  const assignmentQuestions = useMemo(
    () => (gradebookData?.assignments ?? []).map((assignment) => ({
      id: assignment.id,
      title: assignment.title,
      question: assignment.description?.trim() || "No written question was provided for this homework task.",
      dueAt: assignment.dueAt,
      maxScore: assignment.maxScore,
      subjectName: assignment.subjectName,
      subjectAssignmentIndex: assignment.subjectAssignmentIndex,
    })),
    [gradebookData],
  );
  const showPdfReportMode = usesExpandedHomeworkReportRules
    ? assignmentQuestions.length > 0
    : assignmentQuestions.length > 1;
  const submissionsByAssignment = useMemo(() => {
    const index = new Map<number, Map<string, AssignmentSubmission>>();
    for (const submission of gradebookData?.submissions ?? []) {
      const assignment = index.get(submission.assignmentId) ?? new Map<string, AssignmentSubmission>();
      assignment.set(submission.studentId, submission);
      index.set(submission.assignmentId, assignment);
    }
    return index;
  }, [gradebookData]);
  const selectedClass = classes.find((c) => String(c.id) === classId);
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
  const parentSchoolBand = schoolBandFromResults((selectedChild?.enrolledClasses ?? []).map((course) => ({
    schoolLevel: course.schoolLevel,
    class: { name: course.name },
  })));
  const schoolBand: PortalSchoolBand = roleSchoolBand ?? (isSchoolStaff
    ? portal?.data.context?.schoolBand
    : isParent ? classSchoolBand ?? parentSchoolBand : classSchoolBand);
  const schoolName = portalSchoolName(schoolBand);
  const schoolLogo = schoolBand === "primary" ? "/eckernforde-english-medium-primary-badge.png" : "/eckernforde-cambridge-badge.png";
  const allSubjectClassNames = [...new Set(subjectSummaries.map((subject) => subject.className).filter(Boolean))];
  const selectedClassLabel = allSubjectsSelected
    ? `${allSubjectClassNames.join(" / ") || "Current class"} · All Subjects`
    : selectedClass ? classLabel(selectedClass) : "";
  const pdfFileName = `homework-grade-book-${selectedClassLabel.replace(/\s+/g, "-").toLowerCase() || classId}.pdf`;
  const studentPdfFileName = `my-grade-report-${selectedClassLabel.replace(/\s+/g, "-").toLowerCase() || classId}.pdf`;
  const effectivePdfReportMode = usesExpandedHomeworkReportRules && assignmentQuestions.length === 0 ? "summary" : pdfReportMode;
  const selectedPdfFileName = `${(isStudentView ? studentPdfFileName : pdfFileName).replace(/\.pdf$/, "")}-${effectivePdfReportMode === "summary" ? "overall-homework" : "all-homework"}.pdf`;
  const pdfDocumentProps = {
    className: allSubjectsSelected ? (allSubjectClassNames.join(" / ") || "Current class") : (selectedClass?.name ?? selectedClassLabel),
    subjectName: allSubjectsSelected ? "All Subjects" : (selectedClass?.subject?.name ?? selectedClass?.courseName ?? ""),
    schoolName,
    schoolBand,
    studentReport: isStudentView,
    studentName: rows[0]?.name,
    allSubjectsReport: allSubjectsSelected,
    subjectSummaries,
    compactReport: false,
    reportMode: effectivePdfReportMode,
    rows,
    questions: assignmentQuestions,
    submissions: gradebookData?.submissions ?? [],
  };

  useEffect(() => {
    setOverrides(Object.fromEntries(rows.map((row) => [row.studentId, { remarks: row.remarks ?? "" }])));
  }, [rows]);

  const effectiveFinal = (row: GradebookRow): number | null => row.finalGrade;

  const saveRemarks = async () => {
    if (!classId) return;
    const records = rows.flatMap((row) => row.finalGrade === null ? [] : [{
      studentId: row.studentId,
      finalGrade: row.finalGrade,
      remarks: overrides[row.studentId]?.remarks.trim() || null,
    }]);
    if (!records.length) return toast.error("There are no calculated results to save.");
    setSaving(true);
    try {
      const response = await fetch(`${BACKEND_BASE_URL}/grades/gradebook/${classId}/save`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records }),
      });
      if (!response.ok) throw new Error((await response.json().catch(() => ({})))?.error ?? "Unable to save gradebook remarks.");
      toast.success("Gradebook remarks saved.");
      await queryClient.invalidateQueries({ queryKey: [gradebookPath] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save gradebook remarks.");
    } finally {
      setSaving(false);
    }
  };

  // Class-level summary from the recorded final grades.
  const graded = rows.map(effectiveFinal).filter((g): g is number => g !== null && !Number.isNaN(g));
  const dist = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  for (const row of rows) {
    const l = row.missingAssignmentSubmission ? "F" : (row.letterGrade ?? letterForScore(row.finalGrade));
    if (l) dist[l as keyof typeof dist] += 1;
  }
  const atRisk = dist.D + dist.F;
  const homeworkValues = rows
    .map((row) => row.assignmentAvg)
    .filter((value): value is number => value !== null && !Number.isNaN(value));
  const homeworkAverage = homeworkValues.length
    ? Math.round(homeworkValues.reduce((total, value) => total + value, 0) / homeworkValues.length)
    : null;

  const summaryItems: SummaryItem[] = isStudentView
    ? [
        { label: "Your homework average", value: homeworkAverage !== null ? `${homeworkAverage}%` : "—", tone: homeworkAverage === null ? "default" : homeworkAverage >= 60 ? "success" : "critical" },
        { label: "Grade", value: letterForScore(homeworkAverage) ?? "—" },
      ]
    : [
        { label: "Homework average", value: homeworkAverage !== null ? `${homeworkAverage}%` : "—", tone: homeworkAverage === null ? "default" : homeworkAverage >= 70 ? "success" : "warning" },
        { label: "Graded", value: graded.length, hint: `${rows.length} students` },
        { label: "A / B / C / D / F", value: `${dist.A}·${dist.B}·${dist.C}·${dist.D}·${dist.F}` },
        { label: "At risk (D or F)", value: atRisk, tone: atRisk > 0 ? "critical" : "success" },
      ];

  if (isParent && !hasParentContext) return <ParentAcademicSelector mode="homework" />;
  if (isParent && parentChildrenLoading) return <PageContainer className="gradebook"><Skeleton className="h-20 w-full" /><Skeleton className="mt-4 h-64 w-full" /></PageContainer>;
  if (isParent && (parentChildrenError || !selectedChild)) return <PageContainer className="gradebook"><ErrorState title="Unable to load this student's homework grades" description="The selected child or academic year is unavailable." onRetry={refetchParentChildren} /></PageContainer>;

  return (
    <PageContainer className="gradebook">
      <PageHeader
        className="print:hidden"
        breadcrumb
        title="Homework Grade Book"
        description="Homework and examination tracking for this class. This workspace does not calculate formal Midterm or Terminal Division."
        actions={
          <>
            <Select value={classId} onValueChange={(value) => {
              setClassId(value);
            }}>
              <SelectTrigger className="w-[200px]" aria-label="Select a subject"><SelectValue placeholder="Select a subject" /></SelectTrigger>
              <SelectContent>
                {isStudentView && <SelectItem value="all">All Subjects</SelectItem>}
                {classes.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.subject?.name ?? c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {showPdfReportMode && <Select value={pdfReportMode} onValueChange={(value: "full" | "summary") => setPdfReportMode(value)}>
              <SelectTrigger className="w-[190px]" aria-label="Select homework report"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="full">All homework</SelectItem>
                <SelectItem value="summary">Overall homework</SelectItem>
              </SelectContent>
            </Select>}
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="mr-1.5 h-4 w-4" /> Print
            </Button>
            {!loading && rows.length > 0 && (
              <DeferredPdfDownload
                fileName={selectedPdfFileName}
                load={loadGradebookPdf}
                documentProps={pdfDocumentProps}
                onDownload={() => narrateDownload(selectedPdfFileName)}
              />
            )}
          </>
        }
      />

      <div className="hidden print:block">
        <div className="flex items-center gap-4">
          <img src={schoolLogo} alt={schoolName} className="h-20 w-20 object-contain" />
          <div><h1 className="text-xl font-bold">{schoolName}</h1><p className="text-sm font-semibold">Homework Grade Book</p></div>
        </div>
        <p className="text-sm text-muted-foreground">
          {selectedClassLabel} · Generated {new Date().toLocaleDateString()}
        </p>
        {assignmentQuestions.length > 0 && <div className="mt-4 border p-3"><p className="font-semibold">{allSubjectsSelected ? "All homework for all subjects" : "All homework for this subject"}</p>{assignmentQuestions.map((item, index) => <p key={`${item.title}-${index}`} className="mt-1 text-sm"><strong>{allSubjectsSelected && item.subjectName ? `${item.subjectName} · ` : ""}{item.subjectAssignmentIndex ?? index + 1}. {item.title}:</strong> {item.question}{item.dueAt ? ` (Due ${new Date(item.dueAt).toLocaleDateString()})` : ""}</p>)}</div>}
      </div>

      {classId && <Card className="print:hidden">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
          <img src={schoolLogo} alt={schoolName} className="h-24 w-24 shrink-0 self-center object-contain sm:self-start" />
          <div className="min-w-0 flex-1 break-words text-center sm:text-left">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">{schoolName}</p>
            <h2 className="mt-1 text-xl font-bold">Homework Grade Book</h2>
            <p className="mt-1 text-sm text-muted-foreground">{selectedClassLabel}</p>
            {assignmentQuestions.length > 0 ? <div className="mt-4 border-l-2 border-primary pl-3"><p className="text-sm font-semibold">{allSubjectsSelected ? `All homework across ${subjectSummaries.length} subjects` : `All homework for this subject (${assignmentQuestions.length})`}</p>{assignmentQuestions.map((item, index) => <p key={`${item.title}-${index}`} className="mt-1 text-sm leading-6"><strong>{allSubjectsSelected && item.subjectName ? `${item.subjectName} · ` : ""}{item.subjectAssignmentIndex ?? index + 1}. {item.title}:</strong> {item.question}{item.dueAt ? <span className="text-muted-foreground"> · Due {new Date(item.dueAt).toLocaleDateString()}</span> : null}</p>)}</div> : <p className="mt-4 text-sm text-muted-foreground">No homework has been added for this class yet.</p>}
          </div>
        </div>
      </Card>}

      {allSubjectsSelected && !loading && !isError && subjectSummaries.length > 0 && (
        <Card className="overflow-hidden print:hidden">
          <div className="border-b px-5 py-4">
            <h2 className="font-semibold">Subject homework summary</h2>
            <p className="mt-1 text-sm text-muted-foreground">Subjects with more than one homework show the weighted average mark.</p>
          </div>
          <Table>
            <TableHeader><TableRow><TableHead>Subject</TableHead><TableHead className="text-center">Homework</TableHead><TableHead className="text-center">Mark / average</TableHead><TableHead className="text-center">Grade</TableHead></TableRow></TableHeader>
            <TableBody>{subjectSummaries.map((subject) => (
              <TableRow key={subject.classId}>
                <TableCell className="font-medium">{subject.subjectName}</TableCell>
                <TableCell className="text-center tabular-nums">{subject.assignmentCount}</TableCell>
                <TableCell className={`text-center font-medium ${gradeColor(subject.assignmentAvg)}`}>
                  {subject.assignmentAvg === null ? "—" : subject.assignmentCount > 1 ? `${subject.assignmentAvg}% average` : `${subject.assignmentAvg}%`}
                </TableCell>
                <TableCell className="text-center">{subject.letterGrade ? <StatusBadge tone={letterTone(subject.letterGrade)}>{subject.letterGrade}</StatusBadge> : "—"}</TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        </Card>
      )}

      {!loading && !isError && rows.length > 0 && assignmentQuestions.length > 0 && <section className="space-y-5">
        <div><h2 className="text-xl font-bold">Homework marks</h2><p className="mt-1 text-sm text-muted-foreground">Each homework task is shown with its own question and student marks.</p></div>
        {assignmentQuestions.map((assignment, assignmentIndex) => {
          const results = submissionsByAssignment.get(assignment.id);
          const expanded = expandedAssignmentId === assignment.id;
          return <Card key={assignment.id} className="overflow-x-auto">
            <button type="button" onClick={() => setExpandedAssignmentId(expanded ? null : assignment.id)} aria-expanded={expanded} className="flex w-full items-center gap-4 border-b bg-muted/30 p-4 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset">
              <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-primary">{allSubjectsSelected && assignment.subjectName ? `${assignment.subjectName} · ` : ""}Homework {assignment.subjectAssignmentIndex ?? assignmentIndex + 1}</p>
              <h3 className="mt-1 text-lg font-bold">{assignment.title}</h3>
              <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">{assignment.question}</p>
              <p className="mt-2 text-xs font-medium text-muted-foreground">{assignment.dueAt ? `Due ${new Date(assignment.dueAt).toLocaleDateString()} · ` : ""}Out of {assignment.maxScore}</p>
              </div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-background text-muted-foreground" aria-label={expanded ? "Hide homework results" : "Show homework results"}><ChevronDown className={cn("h-5 w-5 transition-transform", expanded && "rotate-180")} /></span>
            </button>
            {expanded && <Table>
              <TableHeader><TableRow><TableHead>Student</TableHead><TableHead className="text-center">Marks</TableHead><TableHead className="text-center">Status</TableHead></TableRow></TableHeader>
              <TableBody>{rows.map((student) => {
                const submission = results?.get(student.studentId);
                const graded = submission?.status === "graded" && submission.score !== null;
                const missing = !submission;
                const percent = graded ? Math.round((submission.score! / assignment.maxScore) * 100) : null;
                return <TableRow key={student.studentId} className={cn(missing && "bg-red-500/5 print:bg-transparent")}>
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell className={`text-center font-medium ${graded ? gradeColor(percent) : "text-muted-foreground"}`}>{graded ? `${submission.score}/${assignment.maxScore} (${percent}%)` : "—"}</TableCell>
                  <TableCell className="text-center">{missing ? <StatusBadge tone="critical">F · Not submitted</StatusBadge> : graded ? <StatusBadge tone="success">Graded</StatusBadge> : <StatusBadge tone="warning">Awaiting grading</StatusBadge>}</TableCell>
                </TableRow>;
              })}</TableBody>
            </Table>}
            {expanded && isTeacherOrAdmin && <div className="flex justify-end border-t p-3"><Button asChild size="sm" variant={historical ? "outline" : "default"}><Link to={`/homework/${assignment.id}`}>{historical ? "View homework" : "Open grading"}</Link></Button></div>}
          </Card>;
        })}
      </section>}

      {!isStudentView && !loading && !isError && rows.length > 0 && (
        usesStaffSummaryLayout ? (
          <div className="space-y-1 px-1 py-3 text-sm print:hidden">
            <p>
              Homework average: <span className="font-semibold tabular-nums">{homeworkAverage !== null ? `${homeworkAverage}%` : "—"}</span>
              <span className="mx-2 text-muted-foreground">||</span>
              Graded: <span className="font-semibold tabular-nums">{graded.length}</span>
            </p>
            <p>
              A / B / C / D / F: <span className="font-semibold tabular-nums">{dist.A}·{dist.B}·{dist.C}·{dist.D}·{dist.F}</span>
              <span className="mx-2 text-muted-foreground">||</span>
              At risk (D or F): <span className="font-semibold tabular-nums">{atRisk}</span>
            </p>
          </div>
        ) : <SummaryBar items={summaryItems} className="print:hidden" />
      )}

      {loading ? (
        <Card className="space-y-3 p-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</Card>
      ) : isError ? (
        <ErrorState description={gradebookError?.message ?? "Couldn't load the homework grade book."} onRetry={refetch} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={BookOpenCheck}
          title={isStudentView ? "No grades yet" : "Nothing to grade"}
          description={
            isStudentView
              ? classes.length === 0
                ? "You're not enrolled in any classes yet."
                : "No grades have been recorded for you in this class yet."
              : "No students are enrolled in this class yet."
          }
        />
      ) : allSubjectsSelected ? null : (
        <Card className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead className="text-center">Homework average</TableHead>
                <TableHead className="text-center">Exam average</TableHead>
                <TableHead className="text-center">Grade</TableHead>
                <TableHead>Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const displayGrade = effectiveFinal(row);
                const letter = row.missingAssignmentSubmission ? "F" : (row.letterGrade ?? letterForScore(displayGrade));
                const risky = isTeacherOrAdmin && (letter === "D" || letter === "F");
                const ov = overrides[row.studentId] ?? { remarks: "" };

                return (
                  <TableRow key={row.studentId} className={cn(risky && "bg-red-500/5 print:bg-transparent")}>
                    <TableCell>
                      <div className="font-medium">{row.name}</div>
                    </TableCell>
                    <TableCell className={`text-center font-medium ${gradeColor(row.assignmentAvg)}`}>
                      {row.assignmentAvg !== null ? `${row.assignmentAvg}%` : "—"}
                    </TableCell>
                    <TableCell className={`text-center font-medium ${gradeColor(row.examAvg)}`}>
                      {row.examAvg !== null ? `${row.examAvg}%` : "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      {letter ? <StatusBadge tone={letterTone(letter)}>{letter}</StatusBadge> : "—"}
                    </TableCell>
                    <TableCell>
                      {isTeacherOrAdmin && !historical ? (
                        <Input
                          className="w-40"
                          placeholder="Optional remarks"
                          value={ov.remarks}
                          onChange={(e) => setOverrides((prev) => ({ ...prev, [row.studentId]: { ...prev[row.studentId], remarks: e.target.value } }))}
                        />
                      ) : (
                        <span className="text-sm text-muted-foreground">{row.remarks ?? "—"}</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {isTeacherOrAdmin && !historical && (
            <div className="flex justify-end border-t border-border p-3 print:hidden">
              <Button size="sm" onClick={saveRemarks} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save remarks
              </Button>
            </div>
          )}
        </Card>
      )}

    </PageContainer>
  );
};

export default Gradebook;
