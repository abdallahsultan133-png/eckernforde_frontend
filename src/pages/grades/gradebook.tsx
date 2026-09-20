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
};

type AssignmentSubmission = {
  assignmentId: number;
  studentId: string;
  status: "submitted" | "graded";
  score: number | null;
};

type GradebookResponse = {
  data: GradebookRow[];
  assignments: AssignmentQuestion[];
  submissions: AssignmentSubmission[];
};

const loadGradebookPdf = async () => {
  const [{ PDFDownloadLink }, { GradebookDocument }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("@/components/pdf/gradebook-document.tsx"),
  ]);
  return { PDFDownloadLink: PDFDownloadLink as unknown as PdfModule["PDFDownloadLink"], DocumentComponent: GradebookDocument as unknown as ComponentType<Record<string, unknown>> };
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
  const queryClient = useQueryClient();
  const isTeacherOrAdmin = identity?.role === UserRole.TEACHER || identity?.role === UserRole.ADMIN || identity?.role === UserRole.SUPER_ADMIN;
  const isStudent = identity?.role === UserRole.STUDENT;

  const { narrateDownload } = useDownload();
  // Prefill the class when arriving from a class workspace (/grades?classId=5).
  const [searchParams] = useSearchParams();
  const [classId, setClassId] = useState(searchParams.get("classId") ?? "");
  const [expandedAssignmentId, setExpandedAssignmentId] = useState<number | null>(null);
  const [overrides, setOverrides] = useState<Record<string, { remarks: string }>>({});
  const [saving, setSaving] = useState(false);

  const { query: classesQuery } = useList<ClassDetails>({ resource: "classes", pagination: { pageSize: 100 } });
  const allClasses = useMemo(() => classesQuery?.data?.data ?? [], [classesQuery?.data?.data]);

  // A student can only ever view their own gradebook row, and only for a class
  // they're enrolled in — so the picker only offers those.
  const { data: enrolledIdsData } = useApiQuery<{ data: number[] }>(isStudent ? "/classes/enrolled-ids" : null);
  const enrolledIds = enrolledIdsData?.data ?? [];
  const classes = isStudent ? allClasses.filter((c) => enrolledIds.includes(c.id)) : allClasses;

  useEffect(() => {
    if (classes.length > 0 && (!classId || !classes.some((course) => String(course.id) === classId))) {
      setClassId(String(classes[0].id));
    }
  }, [classes, classId]);

  const classIsReady = classes.some((course) => String(course.id) === classId);
  const gradebookPath = classIsReady ? `/grades/gradebook/${classId}` : null;
  const { data: gradebookData, isLoading: loading, isError, error: gradebookError, refetch } = useApiQuery<GradebookResponse>(gradebookPath);
  const rows = useMemo(() => gradebookData?.data ?? [], [gradebookData]);
  const assignmentQuestions = useMemo(
    () => (gradebookData?.assignments ?? []).map((assignment) => ({
      id: assignment.id,
      title: assignment.title,
      question: assignment.description?.trim() || "No written question was provided for this assignment.",
      dueAt: assignment.dueAt,
      maxScore: assignment.maxScore,
    })),
    [gradebookData],
  );
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
  const selectedClassLabel = selectedClass ? classLabel(selectedClass) : "";
  const pdfFileName = `assignment-grade-book-${selectedClassLabel.replace(/\s+/g, "-").toLowerCase() || classId}.pdf`;

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
  const classAvg = graded.length > 0 ? Math.round(graded.reduce((s, g) => s + g, 0) / graded.length) : null;
  const dist = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  for (const row of rows) {
    const l = row.missingAssignmentSubmission ? "F" : (row.letterGrade ?? letterForScore(row.finalGrade));
    if (l) dist[l as keyof typeof dist] += 1;
  }
  const atRisk = dist.D + dist.F;

  const summaryItems: SummaryItem[] = isStudent
    ? [
        { label: "Your coursework result", value: classAvg !== null ? `${classAvg}%` : "—", tone: classAvg === null ? "default" : classAvg >= 60 ? "success" : "critical" },
        { label: "Letter", value: letterForScore(classAvg) ?? "—" },
      ]
    : [
        { label: "Class average", value: classAvg !== null ? `${classAvg}%` : "—", tone: classAvg === null ? "default" : classAvg >= 70 ? "success" : "warning" },
        { label: "Graded", value: graded.length, hint: `${rows.length} students` },
        { label: "A / B / C / D / F", value: `${dist.A}·${dist.B}·${dist.C}·${dist.D}·${dist.F}` },
        { label: "At risk (D or F)", value: atRisk, tone: atRisk > 0 ? "critical" : "success" },
      ];

  return (
    <PageContainer className="gradebook">
      <PageHeader
        className="print:hidden"
        breadcrumb
        title="Assignment Grade Book"
        description="Coursework and examination tracking for this class. This workspace does not calculate formal Midterm or Terminal Division."
        actions={
          <>
            {isTeacherOrAdmin && (
              <Button asChild variant="ghost" size="sm">
                <Link to={classId ? `/grades/exams?classId=${classId}` : "/grades/exams"}>
                  <BookOpenCheck className="mr-1.5 h-4 w-4" /> Exams
                </Link>
              </Button>
            )}
            <Select value={classId} onValueChange={setClassId}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Select class" /></SelectTrigger>
              <SelectContent>
                {classes.map((c) => <SelectItem key={c.id} value={String(c.id)}>{classLabel(c)}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="mr-1.5 h-4 w-4" /> Print
            </Button>
            {!loading && rows.length > 0 && (
              <DeferredPdfDownload
                fileName={pdfFileName}
                load={loadGradebookPdf}
                documentProps={{
                  className: selectedClassLabel,
                  rows,
                  questions: assignmentQuestions,
                  submissions: gradebookData?.submissions ?? [],
                }}
                onDownload={() => narrateDownload(pdfFileName)}
              />
            )}
          </>
        }
      />

      <div className="hidden print:block">
        <div className="flex items-center gap-4">
          <img src="/eckernforde-cambridge-badge.png" alt="Eckernforde Cambridge Secondary School" className="h-20 w-20 object-contain" />
          <div><h1 className="text-xl font-bold">Eckernforde Cambridge Secondary School</h1><p className="text-sm font-semibold">Assignment Grade Book</p></div>
        </div>
        <p className="text-sm text-muted-foreground">
          {selectedClassLabel} · Generated {new Date().toLocaleDateString()}
        </p>
        {assignmentQuestions.length > 0 && <div className="mt-4 border p-3"><p className="font-semibold">All assignments for this subject</p>{assignmentQuestions.map((item, index) => <p key={`${item.title}-${index}`} className="mt-1 text-sm"><strong>{index + 1}. {item.title}:</strong> {item.question}{item.dueAt ? ` (Due ${new Date(item.dueAt).toLocaleDateString()})` : ""}</p>)}</div>}
      </div>

      {classId && <Card className="print:hidden">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
          <img src="/eckernforde-cambridge-badge.png" alt="Eckernforde Cambridge Secondary School" className="h-24 w-24 shrink-0 self-center object-contain sm:self-start" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">Eckernforde Cambridge Secondary School</p>
            <h2 className="mt-1 text-xl font-bold">Assignment Grade Book</h2>
            <p className="mt-1 text-sm text-muted-foreground">{selectedClassLabel}</p>
            {assignmentQuestions.length > 0 ? <div className="mt-4 border-l-2 border-primary pl-3"><p className="text-sm font-semibold">All assignments for this subject ({assignmentQuestions.length})</p>{assignmentQuestions.map((item, index) => <p key={`${item.title}-${index}`} className="mt-1 text-sm leading-6"><strong>{index + 1}. {item.title}:</strong> {item.question}{item.dueAt ? <span className="text-muted-foreground"> · Due {new Date(item.dueAt).toLocaleDateString()}</span> : null}</p>)}</div> : <p className="mt-4 text-sm text-muted-foreground">No assignments have been added for this class yet.</p>}
          </div>
        </div>
      </Card>}

      {!loading && !isError && rows.length > 0 && assignmentQuestions.length > 0 && <section className="space-y-5">
        <div><h2 className="text-xl font-bold">Assignment results</h2><p className="mt-1 text-sm text-muted-foreground">Each assignment is shown with its own question and student results.</p></div>
        {assignmentQuestions.map((assignment, assignmentIndex) => {
          const results = submissionsByAssignment.get(assignment.id);
          const expanded = expandedAssignmentId === assignment.id;
          return <Card key={assignment.id} className="overflow-x-auto">
            <button type="button" onClick={() => setExpandedAssignmentId(expanded ? null : assignment.id)} aria-expanded={expanded} className="flex w-full items-center gap-4 border-b bg-muted/30 p-4 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset">
              <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-primary">Assignment {assignmentIndex + 1}</p>
              <h3 className="mt-1 text-lg font-bold">{assignment.title}</h3>
              <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">{assignment.question}</p>
              <p className="mt-2 text-xs font-medium text-muted-foreground">{assignment.dueAt ? `Due ${new Date(assignment.dueAt).toLocaleDateString()} · ` : ""}Out of {assignment.maxScore}</p>
              </div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-background text-muted-foreground" aria-label={expanded ? "Hide assignment results" : "Show assignment results"}><ChevronDown className={cn("h-5 w-5 transition-transform", expanded && "rotate-180")} /></span>
            </button>
            {expanded && <Table>
              <TableHeader><TableRow><TableHead>Student</TableHead><TableHead className="text-center">Result</TableHead><TableHead className="text-center">Status</TableHead></TableRow></TableHeader>
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
            {expanded && isTeacherOrAdmin && <div className="flex justify-end border-t p-3"><Button asChild size="sm"><Link to={`/assignments/${assignment.id}`}>Open grading</Link></Button></div>}
          </Card>;
        })}
      </section>}

      {!loading && !isError && rows.length > 0 && <SummaryBar items={summaryItems} className="print:hidden" />}

      {loading ? (
        <Card className="space-y-3 p-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</Card>
      ) : isError ? (
        <ErrorState description={gradebookError?.message ?? "Couldn't load the assignment grade book."} onRetry={refetch} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={BookOpenCheck}
          title={isStudent ? "No grades yet" : "Nothing to grade"}
          description={
            isStudent
              ? classes.length === 0
                ? "You're not enrolled in any classes yet."
                : "No grades have been recorded for you in this class yet."
              : "No students are enrolled in this class yet."
          }
        />
      ) : (
        <Card className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead className="text-center">Assignment average</TableHead>
                <TableHead className="text-center">Exam average</TableHead>
                <TableHead className="text-center">Coursework result</TableHead>
                <TableHead className="text-center">Letter</TableHead>
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
                    <TableCell className={`text-center font-medium ${gradeColor(displayGrade)}`}>
                      {displayGrade !== null ? `${displayGrade}%` : "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      {letter ? <StatusBadge tone={letterTone(letter)}>{letter}</StatusBadge> : "—"}
                    </TableCell>
                    <TableCell>
                      {isTeacherOrAdmin ? (
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
          {isTeacherOrAdmin && (
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
