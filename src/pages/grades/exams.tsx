import { useEffect, useMemo, useState } from "react";
import { useGetIdentity, useList } from "@refinedev/core";
import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import { BookOpenCheck, CalendarClock, ChevronDown, ChevronUp, Clock3, Loader2, MapPin, Plus, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header.tsx";
import { PageContainer } from "@/components/layout/page-container.tsx";
import { SectionHeader } from "@/components/layout/section-header.tsx";
import { StatusBadge } from "@/components/ui/status-badge.tsx";
import { EmptyState } from "@/components/ui/empty-state.tsx";
import { ErrorState } from "@/components/ui/error-state.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Field } from "@/components/ui/field.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.tsx";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog.tsx";
import { BACKEND_BASE_URL } from "@/constants";
import { useApiQuery } from "@/hooks/use-api-query.ts";
import { UserRole, type User, type ClassDetails } from "@/types";

type Exam = {
  id: number;
  title: string;
  examType: "midterm" | "annual";
  description: string | null;
  scheduledAt: string | null;
  durationMinutes: number | null;
  maxScore: number;
  venue: string | null;
  class: { id: number; name: string };
};

type ExamResult = {
  id: number;
  studentId: string;
  score: number;
  remarks: string | null;
  student: { id: string; name: string; email: string };
};

type EnrolledStudent = { studentId: string; name: string; email: string; image: string | null };

const examClassLabel = (classItem: ClassDetails) =>
  classItem.subject?.name ? `${classItem.subject.name} — ${classItem.name}` : classItem.name;

const ExamsPage = () => {
  const { data: identity } = useGetIdentity<User>();
  const isTeacherOrAdmin = identity?.role === UserRole.TEACHER || identity?.role === UserRole.ADMIN || identity?.role === UserRole.SUPER_ADMIN;

  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [classId, setClassId] = useState(searchParams.get("classId") ?? "");
  const [expandedExamId, setExpandedExamId] = useState<number | null>(null);
  const [scoreDrafts, setScoreDrafts] = useState<Record<string, string>>({});
  const [savingResults, setSavingResults] = useState<number | null>(null);

  // Create form
  const [title, setTitle] = useState("");
  const [examType, setExamType] = useState<"" | "midterm" | "annual">("");
  const [description, setDescription] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [maxScore, setMaxScore] = useState("100");
  const [venue, setVenue] = useState("");
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const { query: classesQuery } = useList<ClassDetails>({ resource: "classes", pagination: { pageSize: 100 } });
  const classes = useMemo(() => classesQuery?.data?.data ?? [], [classesQuery?.data?.data]);

  useEffect(() => {
    if (classes.length > 0 && (!classId || !classes.some((course) => String(course.id) === classId))) {
      setClassId(String(classes[0].id));
    }
  }, [classes, classId]);

  const classIsReady = classes.some((course) => String(course.id) === classId);
  const examsPath = classIsReady ? `/grades/exams?classId=${classId}` : null;
  const { data: examsData, isLoading: loading, isError, refetch } = useApiQuery<{ data: Exam[] }>(examsPath);
  const exams = examsData?.data ?? [];

  // Needed for grading, so fetched once a class is picked rather than lazily on first exam expand —
  // react-query caches it, so switching between exams within the same class costs nothing extra.
  const rosterPath = classIsReady ? `/attendance/class/${classId}?date=${new Date().toISOString().slice(0, 10)}` : null;
  const { data: rosterData } = useApiQuery<{ data: EnrolledStudent[] }>(rosterPath);
  const roster = rosterData?.data ?? [];

  const resultsPath = expandedExamId ? `/grades/exams/${expandedExamId}/results` : null;
  const { data: resultsData } = useApiQuery<{ data: ExamResult[] }>(resultsPath);
  const examResults = resultsData?.data ?? [];

  // Seeds the editable score inputs from the currently-expanded exam's saved results.
  useEffect(() => {
    if (!resultsData) return;
    const drafts: Record<string, string> = {};
    resultsData.data.forEach((r) => { drafts[r.studentId] = String(r.score); });
    setScoreDrafts(drafts);
  }, [resultsData]);

  const toggleExpand = (examId: number) => {
    setExpandedExamId((prev) => (prev === examId ? null : examId));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classId) return toast.error("Select a class.");
    if (!title.trim()) return toast.error("Title is required.");
    if (!examType) return toast.error("Select whether this is a midterm or terminal/annual exam.");
    setCreating(true);
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/grades/exams`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId: Number(classId), title: title.trim(), examType, description: description || undefined, scheduledAt: scheduledAt || undefined, durationMinutes: durationMinutes ? Number(durationMinutes) : undefined, maxScore: Number(maxScore) || 100, venue: venue || undefined }),
      });
      if (!res.ok) throw new Error((await res.json())?.error ?? "Failed");
      toast.success("Exam created.");
      setTitle(""); setExamType(""); setDescription(""); setScheduledAt(""); setDurationMinutes(""); setMaxScore("100"); setVenue("");
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: [examsPath] });
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed to create exam"); }
    finally { setCreating(false); }
  };

  const handleSaveResults = async (examId: number) => {
    const exam = exams.find((item) => item.id === examId);
    if (!exam) return toast.error("Exam is no longer available. Refresh and try again.");

    // Blank inputs mean that a mark has not been entered yet. Do not silently
    // turn those blanks into zeroes: that both loses information and makes a
    // failed/empty roster request look like a save failure.
    const entered = roster.filter((student) => (scoreDrafts[student.studentId] ?? "").trim() !== "");
    if (entered.length === 0) return toast.error("Enter at least one score before saving.");

    const invalid = entered.find((student) => {
      const value = Number(scoreDrafts[student.studentId]);
      return !Number.isFinite(value) || !Number.isInteger(value) || value < 0 || value > exam.maxScore;
    });
    if (invalid) return toast.error(`Enter a whole-number score from 0 to ${exam.maxScore} for ${invalid.name}.`);

    const records = entered.map((student) => ({ studentId: student.studentId, score: Number(scoreDrafts[student.studentId]) }));
    setSavingResults(examId);
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/grades/exams/${examId}/results`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null) as { error?: string; message?: string } | null;
        throw new Error(body?.error ?? body?.message ?? `Could not save results (${res.status}).`);
      }
      toast.success("Results saved.");
      queryClient.invalidateQueries({ queryKey: [`/grades/exams/${examId}/results`] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save results");
    }
    finally { setSavingResults(null); }
  };

  const handleDeleteExam = async (examId: number) => {
    const res = await fetch(`${BACKEND_BASE_URL}/grades/exams/${examId}`, { method: "DELETE", credentials: "include" });
    if (res.ok) { queryClient.invalidateQueries({ queryKey: [examsPath] }); toast.success("Exam deleted."); }
    else toast.error("Failed to delete exam.");
  };

  return (
    <PageContainer className="exams-page">
      <PageHeader
        breadcrumb
        title="Examinations"
        description="Schedule Midterm and Terminal examinations, then record results accurately for the selected class."
        actions={
          <>
            <Select value={classId} onValueChange={(v) => { setClassId(v); setExpandedExamId(null); }}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Select class" /></SelectTrigger>
              <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={String(c.id)}>{examClassLabel(c)}</SelectItem>)}</SelectContent>
            </Select>
            {isTeacherOrAdmin && (
              <Button onClick={() => setShowForm((v) => !v)}>
                <Plus className="mr-1.5 h-4 w-4" />{showForm ? "Close form" : "Create examination"}
              </Button>
            )}
          </>
        }
      />

      {showForm && isTeacherOrAdmin && (
        <section aria-labelledby="create-exam-title" className="max-w-4xl border-y border-border bg-card px-4 py-5 sm:px-5">
          <SectionHeader title={<span id="create-exam-title">Create examination</span>} description="Define the assessment type, schedule, scoring limit, and supported venue details." />
            <form onSubmit={handleCreate} className="mt-5 space-y-4">
              <Field label="Title" required><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Midterm Examination" /></Field>
              <Field label="Exam type" required>
                <Select value={examType} onValueChange={(value) => setExamType(value as "midterm" | "annual")}>
                  <SelectTrigger><SelectValue placeholder="Select exam type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="midterm">Midterm</SelectItem>
                    <SelectItem value="annual">Terminal/Annual</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Description"><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} /></Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Date & Time"><Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} /></Field>
                <Field label="Duration (minutes)"><Input type="number" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} placeholder="120" /></Field>
                <Field label="Max Score"><Input type="number" value={maxScore} onChange={(e) => setMaxScore(e.target.value)} /></Field>
                <Field label="Venue"><Input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Room 101" /></Field>
              </div>
              <div className="flex justify-end border-t border-border pt-4"><Button type="submit" disabled={creating}>
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create examination
              </Button></div>
            </form>
        </section>
      )}

      <section aria-labelledby="exam-register-title" className="space-y-4">
        <SectionHeader title={<span id="exam-register-title">Examination register</span>} description="Open an examination to review or enter its results." />
      <div className="divide-y divide-border border-y border-border bg-card">
        {loading ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />) :
          isError ? (
            <ErrorState description="Couldn't load exams for this class." onRetry={refetch} />
          ) : exams.length === 0 ? (
            <EmptyState
              icon={BookOpenCheck}
              title="No exams scheduled"
              description={isTeacherOrAdmin ? "Create an exam to schedule it and enter scores." : "No exams have been scheduled for this class yet."}
            />
          ) : exams.map((exam) => (
            <article key={exam.id}>
              <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{exam.title}</p><StatusBadge tone="neutral">{exam.examType === "annual" ? "Terminal" : "Midterm"}</StatusBadge></div>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-1">
                    {exam.scheduledAt && <span className="flex items-center gap-1"><CalendarClock className="h-3 w-3" />{new Date(exam.scheduledAt).toLocaleString()}</span>}
                    {exam.venue && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" aria-hidden="true" />{exam.venue}</span>}
                    <span>Max: {exam.maxScore} pts</span>
                    {exam.durationMinutes && <span className="flex items-center gap-1"><Clock3 className="h-3 w-3" aria-hidden="true" />{exam.durationMinutes} min</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isTeacherOrAdmin && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label={`Delete exam: ${exam.title}`}><Trash2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Delete exam?</AlertDialogTitle><AlertDialogDescription>This also deletes all results. Cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteExam(exam.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                  <Button variant="outline" size="sm" onClick={() => toggleExpand(exam.id)}>
                    {expandedExamId === exam.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    {isTeacherOrAdmin ? "Enter results" : "My result"}
                  </Button>
                </div>
              </div>

              {expandedExamId === exam.id && (
                <div className="border-t px-4 pb-4 pt-3">
                  {isTeacherOrAdmin ? (
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Student</TableHead>
                            <TableHead className="w-32">Score / {exam.maxScore}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {roster.map((s) => (
                            <TableRow key={s.studentId}>
                              <TableCell><div className="font-medium">{s.name}</div></TableCell>
                              <TableCell>
                                <Input type="number" min={0} max={exam.maxScore} step={1} className="w-24"
                                  aria-label={`Score for ${s.name} out of ${exam.maxScore}`}
                                  value={scoreDrafts[s.studentId] ?? ""}
                                  placeholder="—"
                                  onChange={(e) => setScoreDrafts((prev) => ({ ...prev, [s.studentId]: e.target.value }))}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      <Button className="mt-3" size="sm" onClick={() => handleSaveResults(exam.id)} disabled={savingResults === exam.id}>
                        {savingResults === exam.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save Results
                      </Button>
                    </>
                  ) : (
                    <div className="py-2 text-sm">
                      {examResults.length === 0 ? (
                        <p className="text-muted-foreground">Results not yet entered for you.</p>
                      ) : (
                        examResults.map((r) => (
                          <p key={r.id} className="font-medium">Your score: {r.score} / {exam.maxScore} {r.remarks && `— ${r.remarks}`}</p>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </article>
          ))}
      </div>
      </section>
    </PageContainer>
  );
};

export default ExamsPage;
