import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { useGetIdentity } from "@refinedev/core";
import { FileText, Plus } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header.tsx";
import { PageContainer } from "@/components/layout/page-container.tsx";
import { SectionHeader } from "@/components/layout/section-header.tsx";
import { FilterBar } from "@/components/ui/filter-bar.tsx";
import { DeadlineCountdown } from "@/components/deadline-countdown.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { EmptyState } from "@/components/ui/empty-state.tsx";
import { ErrorState } from "@/components/ui/error-state.tsx";
import { StatusBadge } from "@/components/ui/status-badge.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { SearchInput } from "@/components/ui/search-input.tsx";
import { useApiQuery } from "@/hooks/use-api-query.ts";
import { isStaff } from "@/lib/roles.ts";
import { cn } from "@/lib/utils.ts";
import { UserRole, type User } from "@/types";
import { ParentAcademicSelector } from "@/pages/parent/academic-selector";

type AssignmentItem = {
  id: number;
  title: string;
  description: string | null;
  dueAt: string | null;
  maxScore: number;
  class: { id: number; name: string };
  subject: { id: number; name: string } | null;
  creator: { id: string; name: string };
  submissionCount: number;
  gradedCount: number;
  mySubmission: { status: "submitted" | "late" | "graded"; score: number | null } | null;
};

type Filter = { key: string; label: string; match: (a: AssignmentItem, now: number) => boolean };

const ALL_FILTER: Filter = { key: "all", label: "All", match: () => true };

const STAFF_FILTERS: Filter[] = [
  ALL_FILTER,
  {
    key: "needs-grading",
    label: "Needs grading",
    match: (a) => a.submissionCount > a.gradedCount,
  },
  {
    key: "upcoming",
    label: "Upcoming",
    match: (a, now) => !a.dueAt || new Date(a.dueAt).getTime() > now,
  },
  {
    key: "overdue",
    label: "Past due",
    match: (a, now) => !!a.dueAt && new Date(a.dueAt).getTime() <= now,
  },
];

const STUDENT_FILTERS: Filter[] = [
  ALL_FILTER,
  {
    key: "todo",
    label: "To do",
    match: (a, now) => !a.mySubmission && (!a.dueAt || new Date(a.dueAt).getTime() > now),
  },
  {
    key: "submitted",
    label: "Submitted",
    match: (a) => a.mySubmission?.status === "submitted" || a.mySubmission?.status === "late",
  },
  {
    key: "graded",
    label: "Graded",
    match: (a) => a.mySubmission?.status === "graded",
  },
  {
    key: "missed",
    label: "Missed",
    match: (a, now) => !a.mySubmission && !!a.dueAt && new Date(a.dueAt).getTime() <= now,
  },
];

const ALL_SUBJECTS = "all";

const AssignmentsList = () => {
  const { data: identity } = useGetIdentity<User>();
  const staff = isStaff(identity?.role);
  const isParent = identity?.role === UserRole.PARENT;
  const [searchParams] = useSearchParams();
  const selectedChildId = searchParams.get("childId");
  const selectedAcademicYearId = searchParams.get("academicYearId");
  const hasParentContext = Boolean(selectedChildId && selectedAcademicYearId);
  const assignmentsPath = isParent && hasParentContext
    ? `/assignments?limit=100&childId=${encodeURIComponent(selectedChildId!)}&academicYearId=${encodeURIComponent(selectedAcademicYearId!)}`
    : isParent ? null : "/assignments?limit=100";

  const { data, isLoading, isError, refetch } = useApiQuery<{ data: AssignmentItem[] }>(
    assignmentsPath,
  );
  const assignments = useMemo(() => data?.data ?? [], [data]);

  const subjectOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const a of assignments) {
      if (a.subject) seen.set(String(a.subject.id), a.subject.name);
    }
    return [...seen.entries()].map(([id, name]) => ({ id, name }));
  }, [assignments]);

  const filters = staff ? STAFF_FILTERS : STUDENT_FILTERS;
  const [filterKey, setFilterKey] = useState(searchParams.get("filter") ?? "all");
  const [subjectId, setSubjectId] = useState(searchParams.get("subjectId") ?? ALL_SUBJECTS);
  const [search, setSearch] = useState("");

  const now = Date.now();
  const bySubject = subjectId === ALL_SUBJECTS
    ? assignments
    : assignments.filter((a) => String(a.subject?.id) === subjectId);

  const activeFilter = filters.find((f) => f.key === filterKey) ?? ALL_FILTER;
  const normalizedSearch = search.trim().toLowerCase();
  const visible = bySubject
    .filter((a) => !normalizedSearch || `${a.title} ${a.description ?? ""} ${a.class.name} ${a.subject?.name ?? ""} ${a.creator.name}`.toLowerCase().includes(normalizedSearch))
    .filter((a) => activeFilter.match(a, now))
    .sort((a, b) => {
      // Undated last; otherwise soonest due first.
      const at = a.dueAt ? new Date(a.dueAt).getTime() : Infinity;
      const bt = b.dueAt ? new Date(b.dueAt).getTime() : Infinity;
      return at - bt;
    });

  const filterCounts = Object.fromEntries(
    filters.map((f) => [f.key, bySubject.filter((a) => f.match(a, now)).length]),
  ) as Record<string, number>;

  if (isParent && !hasParentContext) return <ParentAcademicSelector mode="assignments" />;

  return (
    <PageContainer className="assignment-list">
      <PageHeader
        breadcrumb
        title={isParent ? "Assignments" : "Assignments"}
        description={
          staff
            ? "Track submissions and grading across your classes."
            : isParent
              ? "Coursework for the selected child and academic year."
              : "Everything assigned across your classes, and where each one stands."
        }
        actions={
          staff ? (
              <Button asChild>
                <Link to="/assignments/create">
                  <Plus className="mr-1.5 h-4 w-4" />
                  New assignment
                </Link>
              </Button>
          ) : undefined
        }
      />

      {!isLoading && !isError && assignments.length > 0 && (
        <section aria-labelledby="assignment-worklist-title" className="space-y-4">
          <SectionHeader
            title={<span id="assignment-worklist-title">{staff ? "Assignment worklist" : "Coursework"}</span>}
            description={staff ? "Prioritized by due date, with submission and grading progress." : "Prioritized by due date and your submission status."}
          />
          <FilterBar
            search={<SearchInput value={search} onChange={setSearch} placeholder="Search assignments" aria-label="Search assignments" />}
            active={Boolean(search || filterKey !== "all" || subjectId !== ALL_SUBJECTS)}
            onClear={() => { setSearch(""); setFilterKey("all"); setSubjectId(ALL_SUBJECTS); }}
            resultLabel={`${visible.length.toLocaleString()} ${visible.length === 1 ? "assignment" : "assignments"} in this view`}
          >
            {subjectOptions.length > 1 && (
              <Select value={subjectId} onValueChange={setSubjectId}>
                <SelectTrigger className="h-10 w-full sm:w-[200px]" aria-label="Filter assignments by subject">
                  <SelectValue placeholder="All subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_SUBJECTS}>All subjects</SelectItem>
                  {subjectOptions.map((subject) => <SelectItem key={subject.id} value={subject.id}>{subject.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </FilterBar>
          <div role="group" aria-label="Filter assignments by workflow state" className="flex gap-1 overflow-x-auto border-b border-border">
            {filters.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilterKey(f.key)}
                aria-pressed={filterKey === f.key}
                className={cn(
                  "inline-flex min-h-10 shrink-0 items-center gap-1.5 border-b-2 border-transparent px-3 text-sm font-medium transition-colors",
                  filterKey === f.key
                    ? "border-primary text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {f.label}
                <span
                  className={cn(
                    "rounded-md bg-muted px-1.5 text-xs font-semibold tabular-nums",
                  )}
                >
                  {filterCounts[f.key] ?? 0}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {isLoading ? (
        <div className="divide-y border-y border-border">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-4">
              <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <ErrorState description="Couldn't load assignments." onRetry={refetch} />
      ) : assignments.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No assignments yet"
          description={
            staff
              ? "Create your first assignment to start collecting and grading student work."
              : "Once your teachers post assignments, they'll show up here."
          }
          action={staff ? { label: "Create assignment", to: "/assignments/create" } : undefined}
        />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Nothing here"
          description={normalizedSearch ? `No assignments match "${search}" with the ${activeFilter.label.toLowerCase()} filter.` : `No assignments match "${activeFilter.label}".`}
        />
      ) : (
        <ul className="assignment-list-items divide-y border-y border-border bg-card">
          {visible.map((a) => (
            <li key={a.id}>
              <Link
                to={`/assignments/${a.id}`}
                className="flex items-center gap-4 px-4 py-4 transition-colors hover:bg-secondary/35 sm:px-5"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center text-muted-foreground">
                  <FileText className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{a.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {a.class.name} · {a.maxScore} pts
                  </span>
                </span>
                <span className="hidden sm:block">
                  <DeadlineCountdown dueAt={a.dueAt} variant="inline" />
                </span>
                {staff ? <StaffStatus a={a} /> : <StudentStatus a={a} />}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  );
};

function StaffStatus({ a }: { a: AssignmentItem }) {
  if (a.submissionCount === 0) {
    return <StatusBadge tone="neutral">No submissions</StatusBadge>;
  }
  const pending = a.submissionCount - a.gradedCount;
  return (
    <StatusBadge tone={pending > 0 ? "warning" : "success"}>
      {pending > 0 ? `${pending} to grade` : `All ${a.submissionCount} graded`}
    </StatusBadge>
  );
}

function StudentStatus({ a }: { a: AssignmentItem }) {
  const now = Date.now();
  if (a.mySubmission?.status === "graded") {
    return (
      <StatusBadge tone="success">
        {a.mySubmission.score !== null ? `${a.mySubmission.score}/${a.maxScore}` : "Graded"}
      </StatusBadge>
    );
  }
  if (a.mySubmission) {
    return <StatusBadge tone="info">Submitted</StatusBadge>;
  }
  if (a.dueAt && new Date(a.dueAt).getTime() <= now) {
    return <StatusBadge tone="critical">Missed</StatusBadge>;
  }
  return <StatusBadge tone="warning">To do</StatusBadge>;
}

export default AssignmentsList;
