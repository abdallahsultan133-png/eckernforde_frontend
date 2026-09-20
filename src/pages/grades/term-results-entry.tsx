import { useEffect, useMemo, useState } from "react";
import { useList } from "@refinedev/core";
import { useQueryClient } from "@tanstack/react-query";
import { FilePenLine, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { PageContainer } from "@/components/layout/page-container";
import { SectionHeader } from "@/components/layout/section-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BACKEND_BASE_URL } from "@/constants";
import { useApiQuery } from "@/hooks/use-api-query";
import { letterForScore } from "@/lib/grading/grade-bands";
import type { ClassDetails, User } from "@/types";

type Term = { id: number; name: string; type: "midterm" | "terminal"; academicYear: { name: string } };
type ExistingResult = { studentId: string; score: number; applicable: boolean; published: boolean };
type Entry = { score: string; applicable: boolean };

const levelLabel = (level?: ClassDetails["schoolLevel"]) => level ? `${level[0].toUpperCase()}${level.slice(1)}` : "Not classified";

export default function TermResultsEntry() {
  const queryClient = useQueryClient();
  const { query: classesQuery } = useList<ClassDetails>({ resource: "classes", pagination: { pageSize: 100 } });
  const classes = useMemo(() => classesQuery?.data?.data ?? [], [classesQuery?.data?.data]);
  const [classId, setClassId] = useState("");
  const [termId, setTermId] = useState("");
  const [entries, setEntries] = useState<Record<string, Entry>>({});
  const [saving, setSaving] = useState(false);
  const selectedClass = classes.find((course) => String(course.id) === classId);

  const { data: termData, isLoading: termsLoading, isError: termsError, refetch: refetchTerms } = useApiQuery<{ data: Term[] }>("/grades/academic-terms");
  const terms = useMemo(() => termData?.data ?? [], [termData?.data]);
  const { data: rosterData, isLoading: rosterLoading, isError: rosterError, refetch: refetchRoster } = useApiQuery<{ data: User[] }>(classId ? `/classes/${classId}/students` : null);
  const students = useMemo(() => rosterData?.data ?? [], [rosterData?.data]);
  const resultsPath = classId && termId ? `/grades/term-results/class/${classId}?academicTermId=${termId}` : null;
  const { data: existingData, isLoading: existingLoading, isError: existingError, refetch: refetchExisting } = useApiQuery<{ data: ExistingResult[] }>(resultsPath);

  useEffect(() => { if (!classId && classes.length) setClassId(String(classes[0].id)); }, [classId, classes]);
  useEffect(() => { if (!termId && terms.length) setTermId(String(terms[0].id)); }, [termId, terms]);
  useEffect(() => { if (!classId) setEntries({}); }, [classId]);
  useEffect(() => {
    const existing = new Map((existingData?.data ?? []).map((result) => [result.studentId, result]));
    setEntries(Object.fromEntries(students.map((student) => {
      const result = existing.get(student.id);
      return [student.id, { score: result ? String(result.score) : "", applicable: result?.applicable ?? true }];
    })));
  }, [students, existingData]);

  const enteredCount = useMemo(() => Object.values(entries).filter((entry) => entry.score.trim() !== "").length, [entries]);
  const invalidCount = useMemo(() => Object.values(entries).filter((entry) => {
    if (!entry.score.trim()) return false;
    const score = Number(entry.score);
    return !Number.isFinite(score) || score < 0 || score > 100;
  }).length, [entries]);
  const publishedState = existingData?.data?.length
    ? existingData.data.every((result) => result.published) ? "Published" : "Not published"
    : "Not recorded";

  const save = async () => {
    const records = students.flatMap((student) => {
      const entry = entries[student.id];
      if (!entry || entry.score.trim() === "") return [];
      const score = Number(entry.score);
      return Number.isFinite(score) && score >= 0 && score <= 100 ? [{ studentId: student.id, score, applicable: entry.applicable }] : [];
    });
    if (!classId || !termId) return toast.error("Choose a class and academic term.");
    if (!selectedClass?.schoolLevel) return toast.error("This class must be classified by an administrator before results can be saved.");
    if (records.length === 0) return toast.error("Enter at least one valid score from 0 to 100.");
    if (invalidCount > 0) return toast.error("Every entered score must be a number from 0 to 100.");
    setSaving(true);
    try {
      const response = await fetch(`${BACKEND_BASE_URL}/grades/term-results`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ academicTermId: Number(termId), classId: Number(classId), records }),
      });
      if (!response.ok) throw new Error((await response.json().catch(() => ({})))?.error ?? "Could not save term results.");
      toast.success("Term results saved.");
      await queryClient.invalidateQueries({ queryKey: [resultsPath] });
      await refetchExisting();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save term results.");
    } finally {
      setSaving(false);
    }
  };

  const loading = termsLoading || classesQuery?.isLoading || rosterLoading || existingLoading;
  const error = termsError || classesQuery?.isError || rosterError || existingError;

  return (
    <PageContainer>
      <PageHeader
        breadcrumb
        title="Record term results"
        description="Enter Midterm or Terminal subject scores for an assigned class. Grades are calculated from the stored grading rules."
        actions={students.length > 0 && selectedClass?.schoolLevel && !loading && !error ? (
          <Button onClick={save} disabled={saving || invalidCount > 0 || enteredCount === 0}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save {enteredCount} result{enteredCount === 1 ? "" : "s"}
          </Button>
        ) : undefined}
      />

      <section aria-labelledby="assessment-context-title" className="border-y border-border bg-card px-4 py-5 sm:px-5">
        <SectionHeader
          title={<span id="assessment-context-title">Assessment context</span>}
          description="A score belongs to the selected class subject. Publishing remains a separate authorized administrative action."
          action={<StatusBadge tone={publishedState === "Published" ? "success" : "neutral"}>{publishedState}</StatusBadge>}
        />
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Select value={classId} onValueChange={setClassId}>
            <SelectTrigger aria-label="Select class"><SelectValue placeholder="Choose class" /></SelectTrigger>
            <SelectContent>{classes.map((course) => <SelectItem key={course.id} value={String(course.id)}>{course.name} · {levelLabel(course.schoolLevel)}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={termId} onValueChange={setTermId}>
            <SelectTrigger aria-label="Select academic term"><SelectValue placeholder="Choose term" /></SelectTrigger>
            <SelectContent>{terms.map((term) => <SelectItem key={term.id} value={String(term.id)}>{term.academicYear.name} · {term.name} ({term.type === "terminal" ? "Terminal" : "Midterm"})</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </section>

      {loading ? (
        <div className="space-y-2 border-y border-border p-4" aria-busy="true">{Array.from({ length: 7 }).map((_, index) => <Skeleton key={index} className="h-12 w-full" />)}</div>
      ) : error ? (
        <ErrorState title="Can't load result entry" description="Check your connection and permissions, then retry." onRetry={() => { refetchTerms(); refetchRoster(); refetchExisting(); }} />
      ) : !selectedClass ? (
        <EmptyState icon={FilePenLine} title="No assigned classes" description="Results can be entered only for classes assigned to you." />
      ) : !selectedClass.schoolLevel ? (
        <EmptyState icon={FilePenLine} title="Class classification needed" description="Ask an administrator to classify this class as Nursery, Primary, or Secondary before recording results." />
      ) : students.length === 0 ? (
        <EmptyState icon={FilePenLine} title="No enrolled students" description="Enroll students in this class before recording results." />
      ) : (
        <section aria-labelledby="score-entry-title" className="space-y-4">
          <SectionHeader
            title={<span id="score-entry-title">Score entry</span>}
            description={`${enteredCount} of ${students.length} students have a score. Use Tab to move through the register.`}
            action={invalidCount > 0 ? <StatusBadge tone="critical">{invalidCount} invalid {invalidCount === 1 ? "score" : "scores"}</StatusBadge> : undefined}
          />
          <div className="overflow-x-auto border-y border-border bg-card sm:rounded-lg sm:border">
            <Table aria-label="Term result score entry">
              <TableHeader><TableRow><TableHead className="min-w-56">Student</TableHead><TableHead className="w-40">Score / 100</TableHead><TableHead className="w-24 text-center">Grade</TableHead><TableHead className="w-32 text-center">Applicable</TableHead></TableRow></TableHeader>
              <TableBody>{students.map((student) => {
                const entry = entries[student.id] ?? { score: "", applicable: true };
                const score = Number(entry.score);
                const validScore = entry.score.trim() !== "" && Number.isFinite(score) && score >= 0 && score <= 100;
                return (
                  <TableRow key={student.id}>
                    <TableCell><p className="font-medium">{student.name}</p><p className="text-xs text-muted-foreground">{student.email}</p></TableCell>
                    <TableCell><Input aria-label={`Score for ${student.name}`} aria-invalid={entry.score.trim() !== "" && !validScore} type="number" min={0} max={100} inputMode="decimal" value={entry.score} onChange={(event) => setEntries((current) => ({ ...current, [student.id]: { ...entry, score: event.target.value } }))} /></TableCell>
                    <TableCell className="text-center font-semibold">{validScore ? letterForScore(score) : "—"}</TableCell>
                    <TableCell className="text-center"><input aria-label={`${student.name} subject applicable`} className="h-4 w-4 accent-primary" type="checkbox" checked={entry.applicable} onChange={(event) => setEntries((current) => ({ ...current, [student.id]: { ...entry, applicable: event.target.checked } }))} /></TableCell>
                  </TableRow>
                );
              })}</TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between gap-4 border-t border-border pt-4">
            <p className="text-sm text-muted-foreground">Scores save as a draft record. Publication is controlled separately.</p>
            <Button onClick={save} disabled={saving || invalidCount > 0 || enteredCount === 0}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save results
            </Button>
          </div>
        </section>
      )}
    </PageContainer>
  );
}
