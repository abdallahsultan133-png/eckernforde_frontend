import { Link, useParams } from "react-router";
import { ArrowLeft, BarChart3, ClipboardList, Users } from "lucide-react";

import { Breadcrumb } from "@/components/layout/breadcrumb.tsx";
import { PageContainer } from "@/components/layout/page-container.tsx";
import { PageHeader } from "@/components/layout/page-header.tsx";
import { SectionHeader } from "@/components/layout/section-header.tsx";
import { Button } from "@/components/ui/button.tsx";
import { EmptyState } from "@/components/ui/empty-state.tsx";
import { ErrorState } from "@/components/ui/error-state.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { StatusBadge } from "@/components/ui/status-badge.tsx";
import { useApiQuery } from "@/hooks/use-api-query.ts";

type ReportAssignment = { id: number; title: string; dueAt: string | null; maxScore: number };
type Mark = { assignmentId: number; score: number | null; status: "submitted" | "late" | "graded" | "not_submitted" };
type ReportStudent = { id: string; name: string; email: string; marks: Mark[]; totalScore: number; totalMaxScore: number; averagePercent: number | null };
type AssignmentReportData = {
  selectedAssignment: { id: number; title: string };
  class: { id: number; name: string };
  subject: { id: number; name: string; code: string };
  assignments: ReportAssignment[];
  students: ReportStudent[];
  summary: { studentCount: number; assignmentCount: number; gradedMarks: number; classAveragePercent: number | null };
};

const displayMark = (mark: Mark, assignment: ReportAssignment) => {
  if (mark.score !== null) return `${mark.score}/${assignment.maxScore}`;
  if (mark.status === "submitted" || mark.status === "late") return "Submitted";
  return "—";
};

const markTone = (mark: Mark) => {
  if (mark.score !== null) return "success" as const;
  if (mark.status === "submitted" || mark.status === "late") return "info" as const;
  return "neutral" as const;
};

export default function AssignmentReport() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError, refetch } = useApiQuery<{ data: AssignmentReportData }>(id ? `/assignments/${id}/report` : null);
  const report = data?.data;

  if (isLoading) {
    return <PageContainer className="space-y-6" aria-busy="true"><Breadcrumb /><Skeleton className="h-10 w-72" /><Skeleton className="h-20 w-full" /><Skeleton className="h-96 w-full" /></PageContainer>;
  }
  if (isError || !report) {
    return <PageContainer className="space-y-6"><Breadcrumb /><ErrorState title="Unable to load marks report" description="You may not have access to this class, or the assignment report is unavailable." onRetry={refetch} /></PageContainer>;
  }

  return <PageContainer className="space-y-6">
    <PageHeader
      breadcrumb
      title="Student marks report"
      description={`${report.subject.name} · ${report.class.name}`}
      actions={<Button variant="outline" size="sm" asChild><Link to={`/assignments/${report.selectedAssignment.id}`}><ArrowLeft className="mr-1.5 h-4 w-4" />Back to assignment</Link></Button>}
    />

    <section className="rounded-lg border bg-background p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Selected assignment</p>
          <h2 className="mt-1 text-lg font-semibold">{report.selectedAssignment.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">All assignments for {report.subject.name} in {report.class.name}, with recorded student marks.</p>
        </div>
        <BarChart3 className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
      </div>
      <dl className="mt-5 grid gap-3 border-t pt-4 sm:grid-cols-4">
        <div><dt className="text-xs text-muted-foreground">Students</dt><dd className="mt-1 text-lg font-semibold tabular-nums">{report.summary.studentCount}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Assignments</dt><dd className="mt-1 text-lg font-semibold tabular-nums">{report.summary.assignmentCount}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Graded marks</dt><dd className="mt-1 text-lg font-semibold tabular-nums">{report.summary.gradedMarks}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Class average</dt><dd className="mt-1 text-lg font-semibold tabular-nums">{report.summary.classAveragePercent === null ? "Not recorded" : `${report.summary.classAveragePercent}%`}</dd></div>
      </dl>
    </section>

    <section className="rounded-lg border bg-background">
      <div className="p-5 sm:p-6"><SectionHeader title="Assignments and student marks" description="Scores are shown against each assignment's maximum. A dash means no submission has been recorded." /></div>
      {report.assignments.length === 0 || report.students.length === 0 ? <div className="border-t p-6"><EmptyState icon={ClipboardList} title="No marks to report yet" description="Students and assignment marks will appear here once the class has enrolled students and coursework." /></div> : <div className="overflow-x-auto border-t">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead className="bg-muted/40 text-left">
            <tr>
              <th scope="col" className="sticky left-0 z-10 min-w-52 border-b bg-muted/40 px-4 py-3 font-medium">Student</th>
              {report.assignments.map((assignment) => <th scope="col" key={assignment.id} className="min-w-32 border-b px-4 py-3 font-medium"><span className="block max-w-32 truncate" title={assignment.title}>{assignment.title}</span><span className="mt-1 block text-xs font-normal text-muted-foreground">/{assignment.maxScore} marks</span></th>)}
              <th scope="col" className="min-w-28 border-b px-4 py-3 text-right font-medium">Average</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {report.students.map((student) => <tr key={student.id} className="hover:bg-muted/20">
              <th scope="row" className="sticky left-0 z-10 bg-background px-4 py-3 text-left font-medium"><span className="block truncate">{student.name}</span><span className="block truncate text-xs font-normal text-muted-foreground">{student.email}</span></th>
              {report.assignments.map((assignment, index) => { const mark = student.marks[index]; return <td key={assignment.id} className="px-4 py-3 align-middle"><StatusBadge tone={markTone(mark)}>{displayMark(mark, assignment)}</StatusBadge></td>; })}
              <td className="px-4 py-3 text-right font-medium tabular-nums">{student.averagePercent === null ? "—" : `${student.averagePercent}%`}</td>
            </tr>)}
          </tbody>
        </table>
      </div>}
    </section>

    <p className="flex items-center gap-2 text-xs text-muted-foreground"><Users className="h-3.5 w-3.5" aria-hidden="true" />Only students enrolled in this class are included. Assignment marks do not alter formal term-result divisions.</p>
  </PageContainer>;
}
