import { useMemo, useState } from "react";
import { Link } from "react-router";
import { useGetIdentity, useList } from "@refinedev/core";
import { FileText, Plus } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header.tsx";
import { DeadlineCountdown } from "@/components/deadline-countdown.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { EmptyState } from "@/components/ui/empty-state.tsx";
import { ErrorState } from "@/components/ui/error-state.tsx";
import { StatusBadge } from "@/components/ui/status-badge.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { useApiQuery } from "@/hooks/use-api-query.ts";
import { isStaff } from "@/lib/roles.ts";
import { cn } from "@/lib/utils.ts";
import type { ClassDetails, User } from "@/types";

type AssignmentItem = {
  id: number;
  title: string;
  description: string | null;
  dueAt: string | null;
  maxScore: number;
  class: { id: number; name: string };
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

const ALL_CLASSES = "all";

const AssignmentsList = () => {
  const { data: identity } = useGetIdentity<User>();
  const staff = isStaff(identity?.role);

  const { data, isLoading, isError, refetch } = useApiQuery<{ data: AssignmentItem[] }>(
    "/assignments?limit=100",
  );
  const assignments = useMemo(() => data?.data ?? [], [data]);

  // Staff pick from the classes they teach; a student's options are derived from
  // whatever classes their assignments belong to.
  const { query: classesQuery } = useList<ClassDetails>({
    resource: "classes",
    pagination: { pageSize: 100 },
    queryOptions: { enabled: staff },
  });
  const classOptions = useMemo(() => {
    if (staff) {
      return (classesQuery?.data?.data ?? []).map((c) => ({ id: String(c.id), name: c.name }));
    }
    const seen = new Map<string, string>();
    for (const a of assignments) seen.set(String(a.class.id), a.class.name);
    return [...seen.entries()].map(([id, name]) => ({ id, name }));
  }, [staff, classesQuery?.data?.data, assignments]);

  const filters = staff ? STAFF_FILTERS : STUDENT_FILTERS;
  const [filterKey, setFilterKey] = useState("all");
  const [classId, setClassId] = useState(ALL_CLASSES);

  const now = Date.now();
  const byClass = classId === ALL_CLASSES
    ? assignments
    : assignments.filter((a) => String(a.class.id) === classId);

  const activeFilter = filters.find((f) => f.key === filterKey) ?? ALL_FILTER;
  const visible = byClass
    .filter((a) => activeFilter.match(a, now))
    .sort((a, b) => {
      // Undated last; otherwise soonest due first.
      const at = a.dueAt ? new Date(a.dueAt).getTime() : Infinity;
      const bt = b.dueAt ? new Date(b.dueAt).getTime() : Infinity;
      return at - bt;
    });

  const filterCounts = Object.fromEntries(
    filters.map((f) => [f.key, byClass.filter((a) => f.match(a, now)).length]),
  ) as Record<string, number>;

  return (
    <div className="space-y-5">
      <PageHeader
        breadcrumb
        title="Assignments"
        description={
          staff
            ? "Track submissions and grading across your classes."
            : "Everything assigned across your classes, and where each one stands."
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {classOptions.length > 1 && (
              <Select value={classId} onValueChange={setClassId}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_CLASSES}>All classes</SelectItem>
                  {classOptions.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {staff && (
              <Button asChild>
                <Link to="/assignments/create">
                  <Plus className="mr-1.5 h-4 w-4" />
                  New assignment
                </Link>
              </Button>
            )}
          </div>
        }
      />

      {!isLoading && !isError && assignments.length > 0 && (
        <div role="group" aria-label="Filter assignments" className="flex flex-wrap gap-1.5">
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilterKey(f.key)}
              aria-pressed={filterKey === f.key}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors",
                filterKey === f.key
                  ? "border-transparent bg-foreground text-background"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              {f.label}
              <span
                className={cn(
                  "rounded-full px-1.5 text-xs font-semibold tabular-nums",
                  filterKey === f.key ? "bg-background/20" : "bg-muted",
                )}
              >
                {filterCounts[f.key] ?? 0}
              </span>
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="divide-y rounded-xl border">
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
          description={`No assignments match "${activeFilter.label}".`}
        />
      ) : (
        <ul className="divide-y rounded-xl border">
          {visible.map((a) => (
            <li key={a.id}>
              <Link
                to={`/assignments/${a.id}`}
                className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted/50"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
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
    </div>
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
