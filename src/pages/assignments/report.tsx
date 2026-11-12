import { useParams } from "react-router";
import { BarChart3, ClipboardList } from "lucide-react";

import { Breadcrumb } from "@/components/layout/breadcrumb.tsx";
import { PageContainer } from "@/components/layout/page-container.tsx";
import { PageHeader } from "@/components/layout/page-header.tsx";
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
  const { data, isLoading, isError, refetch } = useApiQuery<{ data: AssignmentReportData }>(id ? `/homework/${id}/report` : null);
  const report = data?.data;

  if (isLoading) {
    return <PageContainer className="space-y-6" aria-busy="true"><Breadcrumb /><Skeleton className="h-10 w-72" /><Skeleton className="h-20 w-full" /><Skeleton className="h-96 w-full" /></PageContainer>;
  }
  if (isError || !report) {
    return <PageContainer className="space-y-6"><Breadcrumb /><ErrorState title="Unable to load marks report" description="You may not have access to this class, or the homework report is unavailable." onRetry={refetch} /></PageContainer>;
  }

  return <PageContainer className="space-y-6">
    <PageHeader
      breadcrumb
      showBackLink={false}
      title="Student marks report"
      description={`${report.subject.name} · ${report.class.name}`}
    />

    <section className="rounded-lg border bg-background p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Selected homework</p>
          <h2 className="mt-1 text-lg font-semibold">{report.selectedAssignment.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">All homework for {report.subject.name} in {report.class.name}, with recorded student marks.</p>
        </div>
        <BarChart3 className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
      </div>
    </section>

    <section className="rounded-lg border bg-background">
      {report.assignments.length === 0 || report.students.length === 0 ? <div className="border-t p-6"><EmptyState icon={ClipboardList} title="No marks to report yet" description="Students and homework marks will appear here once the class has enrolled students and posted work." /></div> : <div className="border-t">
        <table className="w-full table-fixed border-collapse text-sm">
          <thead className="bg-muted/40 text-left">
            <tr>
              <th scope="col" className="w-[58%] border-b px-3 py-3 font-medium sm:px-4">Student</th>
              <th scope="col" className="w-[42%] border-b px-3 py-3 pr-6 text-left font-medium sm:px-4 sm:pr-8">Marks</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {report.students.map((student) => <tr key={student.id} className="hover:bg-muted/20">
              <th scope="row" className="align-top px-3 py-3 text-left font-medium sm:px-4"><span className="block break-words">{student.name}</span><span className="mt-1 block break-words text-xs font-normal text-muted-foreground">{student.email}</span></th>
              <td className="px-3 py-2 pr-6 align-top text-left sm:px-4 sm:pr-8">
                <div className="flex flex-wrap justify-start gap-1.5">
                  {report.assignments.map((assignment, index) => { const mark = student.marks[index]; return <StatusBadge key={assignment.id} tone={markTone(mark)}>{displayMark(mark, assignment)}</StatusBadge>; })}
                </div>
              </td>
            </tr>)}
          </tbody>
        </table>
      </div>}
    </section>

  </PageContainer>;
}
