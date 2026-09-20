import { Link, useParams } from "react-router";
import { ArrowLeft, BookOpenCheck, CalendarDays, ClipboardCheck, FileText } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { PageContainer } from "@/components/layout/page-container";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApiQuery } from "@/hooks/use-api-query";
import { letterForScore } from "@/lib/grading/grade-bands";

type Archive = {
  academicYear: { id: number; name: string; startsOn: string; endsOn: string };
  context: { schoolBand: string; stage: string };
  classes: Array<{ id: number; name: string; subject: { id: number; name: string } | null }>;
  termResults: Array<{ id: number; termId: number; termName: string; termType: string; subjectName: string; className: string; score: number }>;
  attendance: Array<{ id: number; date: string; status: string; className: string }>;
  assignments: Array<{ id: number; title: string; className: string; submittedAt: string; status: string; score: number | null; maxScore: number }>;
  exams: Array<{ id: number; title: string; className: string; scheduledAt: string | null; recordedAt: string; score: number; maxScore: number }>;
};

const stageLabel = (stage: string) => stage.split("_").map((part) => /^(i|ii|iii|iv|v|vi|vii)$/.test(part) ? part.toUpperCase() : `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`).join(" ");
const dateLabel = (value: string) => new Intl.DateTimeFormat("en-TZ", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Dar_es_Salaam" }).format(new Date(value));

export default function AcademicArchive() {
  const { academicYearId } = useParams();
  const { data, isLoading, isError, refetch } = useApiQuery<{ data: Archive }>(academicYearId ? `/portal-context/history/${encodeURIComponent(academicYearId)}` : null);
  if (isLoading) return <PageContainer><Skeleton className="h-24 w-full" /><Skeleton className="h-64 w-full" /></PageContainer>;
  if (isError || !data?.data) return <PageContainer><ErrorState title="Unable to open academic archive" description="Check that this year belongs to your academic history, then try again." onRetry={refetch} /></PageContainer>;

  const archive = data.data;
  const attendanceCounts = archive.attendance.reduce<Record<string, number>>((counts, item) => {
    counts[item.status] = (counts[item.status] ?? 0) + 1;
    return counts;
  }, {});

  return <PageContainer>
    <PageHeader breadcrumb title={`${archive.academicYear.name} academic archive`} description={`${stageLabel(archive.context.stage)} · ${archive.context.schoolBand === "primary" ? "Primary" : "Secondary"} school · ${archive.academicYear.startsOn} to ${archive.academicYear.endsOn}`} />
    <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-5">
      <p className="text-sm text-muted-foreground">This is a read-only record of the work and results saved for your previous year.</p>
      <Link to="/portal/history" className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><ArrowLeft className="h-4 w-4" /> All academic years</Link>
    </div>

    {archive.classes.length > 0 && <section aria-labelledby="archive-classes" className="space-y-3"><h2 id="archive-classes" className="text-lg font-semibold">Classes and subjects</h2><div className="grid gap-px border bg-border sm:grid-cols-2 xl:grid-cols-3">{archive.classes.map((item) => <div key={item.id} className="bg-background px-4 py-3"><p className="font-medium">{item.subject?.name ?? item.name}</p><p className="text-sm text-muted-foreground">{item.name}</p></div>)}</div></section>}

    <section aria-labelledby="archive-results" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 id="archive-results" className="text-lg font-semibold">Published term results</h2><Link to={`/grades/term-results?academicYearId=${archive.academicYear.id}`} className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-primary hover:underline"><BookOpenCheck className="h-4 w-4" /> Full results and division</Link></div>
      {archive.termResults.length === 0 ? <EmptyState icon={BookOpenCheck} title="No published results" description="No term results have been published for this year." /> : <div className="overflow-x-auto border"><Table><TableHeader><TableRow><TableHead>Term</TableHead><TableHead>Subject</TableHead><TableHead>Class</TableHead><TableHead className="text-right">Score</TableHead><TableHead className="text-right">Grade</TableHead></TableRow></TableHeader><TableBody>{archive.termResults.map((item) => <TableRow key={item.id}><TableCell>{item.termName} · {item.termType}</TableCell><TableCell className="font-medium">{item.subjectName}</TableCell><TableCell>{item.className}</TableCell><TableCell className="text-right tabular-nums">{item.score}%</TableCell><TableCell className="text-right font-medium">{letterForScore(item.score) ?? "—"}</TableCell></TableRow>)}</TableBody></Table></div>}
    </section>

    <section aria-labelledby="archive-attendance" className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2"><h2 id="archive-attendance" className="text-lg font-semibold">Attendance</h2><p className="text-sm text-muted-foreground">{archive.attendance.length} records · {attendanceCounts.present ?? 0} present · {attendanceCounts.absent ?? 0} absent · {attendanceCounts.late ?? 0} late · {attendanceCounts.excused ?? 0} excused</p></div>
      {archive.attendance.length === 0 ? <EmptyState icon={ClipboardCheck} title="No attendance records" description="There are no attendance records for this year." /> : <div className="max-h-80 overflow-auto border"><Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Class</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{archive.attendance.map((item) => <TableRow key={item.id}><TableCell className="tabular-nums">{item.date}</TableCell><TableCell>{item.className}</TableCell><TableCell className="capitalize">{item.status}</TableCell></TableRow>)}</TableBody></Table></div>}
    </section>

    <div className="grid gap-7 xl:grid-cols-2">
      <section aria-labelledby="archive-assignments" className="space-y-3"><h2 id="archive-assignments" className="text-lg font-semibold">Assignment submissions</h2>{archive.assignments.length === 0 ? <EmptyState icon={FileText} title="No submissions" description="No assignment submissions were recorded for this year." /> : <div className="overflow-x-auto border"><Table><TableHeader><TableRow><TableHead>Assignment</TableHead><TableHead>Submitted</TableHead><TableHead className="text-right">Score</TableHead></TableRow></TableHeader><TableBody>{archive.assignments.map((item) => <TableRow key={item.id}><TableCell><span className="block font-medium">{item.title}</span><span className="text-xs text-muted-foreground">{item.className}</span></TableCell><TableCell className="whitespace-nowrap">{dateLabel(item.submittedAt)}</TableCell><TableCell className="text-right tabular-nums">{item.score === null ? "Not graded" : `${item.score}/${item.maxScore}`}</TableCell></TableRow>)}</TableBody></Table></div>}</section>
      <section aria-labelledby="archive-exams" className="space-y-3"><h2 id="archive-exams" className="text-lg font-semibold">Exam results</h2>{archive.exams.length === 0 ? <EmptyState icon={CalendarDays} title="No exam results" description="No exam results were recorded for this year." /> : <div className="overflow-x-auto border"><Table><TableHeader><TableRow><TableHead>Exam</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Score</TableHead></TableRow></TableHeader><TableBody>{archive.exams.map((item) => <TableRow key={item.id}><TableCell><span className="block font-medium">{item.title}</span><span className="text-xs text-muted-foreground">{item.className}</span></TableCell><TableCell className="whitespace-nowrap">{dateLabel(item.scheduledAt ?? item.recordedAt)}</TableCell><TableCell className="text-right tabular-nums">{item.score}/{item.maxScore}</TableCell></TableRow>)}</TableBody></Table></div>}</section>
    </div>
  </PageContainer>;
}
