import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { useGetIdentity } from "@refinedev/core";
import { toast } from "sonner";
import { BarChart3, FileText, Plus } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header.tsx";
import { PageContainer } from "@/components/layout/page-container.tsx";
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
import { useHistoricalPortal } from "@/components/layout/historical-portal-banner";
import { isStaff } from "@/lib/roles.ts";
import { cn } from "@/lib/utils.ts";
import { UserRole, type User } from "@/types";
import { ParentAcademicSelector } from "@/pages/parent/academic-selector";
import { HeadmasterStageSelector, type HeadmasterStage, stageLabel } from "@/components/academic/headmaster-stage-selector.tsx";
import { useSuperAdminSchoolScope } from "@/components/academic/super-admin-school-scope.tsx";
import { SchoolCardSelector } from "@/components/academic/school-level-selector.tsx";

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

type HeadmasterClass = {
  id: number;
  name: string;
  schoolLevel: "primary" | "secondary" | null;
  academicYearId: number | null;
  subject: { id: number; name: string } | null;
};

type GradeAvailability = { classId: number; hasGrades: boolean };

const matchesStage = (name: string, stage: HeadmasterStage) => {
  const value = name.trim().toLowerCase().replace(/[.\s-]+/g, "_");
  if (stage === "nursery") return value.startsWith("nursery");
  if (stage.startsWith("kindergarten_")) {
    const roman = stage.replace("kindergarten_", "");
    return value.startsWith(`kg_${roman}`) || value.startsWith(`kindergarten_${roman}`);
  }
  if (stage.startsWith("standard_")) {
    const roman = stage.replace("standard_", "");
    return value.startsWith(`standard_${roman}`) || value.startsWith(`class_${roman}`);
  }
  return value.startsWith(stage);
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

// Parents are viewing the selected student's work, so keep the same workflow
// labels and states as the student homework page.
const PARENT_FILTERS: Filter[] = STUDENT_FILTERS;

const ALL_SUBJECTS = "all";

const AssignmentsList = () => {
  const { data: identity } = useGetIdentity<User>();
  const { data: portal } = useHistoricalPortal();
  const staff = isStaff(identity?.role);
  const canManage = staff && !portal?.data.archiveContext;
  const isStudent = identity?.role === UserRole.STUDENT;
  const isTeacher = identity?.role === UserRole.TEACHER;
  const isParent = identity?.role === UserRole.PARENT;
  const isSuperAdmin = identity?.role === UserRole.SUPER_ADMIN;
  const superAdminScope = useSuperAdminSchoolScope(isSuperAdmin);
  const headmasterLevel = identity?.role === UserRole.PRIMARY_HEADMASTER
    ? "primary"
    : identity?.role === UserRole.SECONDARY_HEADMASTER
      ? "secondary"
      : null;
  const [selectedStage, setSelectedStage] = useState<HeadmasterStage | "">("");
  const activeStage = headmasterLevel ? selectedStage : isSuperAdmin ? superAdminScope.stage : "";
  const headmasterLike = Boolean(headmasterLevel || isSuperAdmin);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [searchParams] = useSearchParams();
  const selectedChildId = searchParams.get("childId");
  const selectedAcademicYearId = searchParams.get("academicYearId");
  const hasParentContext = Boolean(selectedChildId && selectedAcademicYearId);
  const parentContextQuery = hasParentContext
    ? `?childId=${encodeURIComponent(selectedChildId!)}&academicYearId=${encodeURIComponent(selectedAcademicYearId!)}`
    : "";
  const gradesHref = isParent
    ? hasParentContext ? `/homework/grades${parentContextQuery}` : "/parent/homework"
    : isTeacher || isStudent
      ? "/homework/grades"
      : "/grades";
  const gradesLabel = "Grades";
  const showGradesLink = true;
  const { data: parentChildrenData } = useApiQuery<{ data: { id: string; name: string }[] }>(isParent && hasParentContext ? "/profile/my-children" : null);
  const { data: parentYearsData } = useApiQuery<{ data: { id: number; name: string }[] }>(isParent && hasParentContext ? "/grades/academic-years" : null);
  const selectedChildName = parentChildrenData?.data.find((child) => child.id === selectedChildId)?.name;
  const selectedYearName = parentYearsData?.data.find((year) => String(year.id) === selectedAcademicYearId)?.name;
  const { data: headmasterClassesData, isLoading: headmasterClassesLoading, isError: headmasterClassesError, refetch: refetchHeadmasterClasses } = useApiQuery<{ data: HeadmasterClass[] }>(
    headmasterLevel ? `/classes?limit=100&schoolLevel=${headmasterLevel}` : isSuperAdmin && superAdminScope.schoolLevel && superAdminScope.yearId && activeStage
      ? `/classes?limit=100&schoolLevel=${superAdminScope.schoolLevel}&academicYearId=${superAdminScope.yearId}&stage=${activeStage}` : null,
  );
  const headmasterClasses = useMemo(() => {
    if (!(headmasterLevel || isSuperAdmin) || !activeStage) return [];
    return (headmasterClassesData?.data ?? []).filter((item) => matchesStage(item.name, activeStage));
  }, [headmasterClassesData, headmasterLevel, isSuperAdmin, activeStage]);
  const headmasterSubjects = useMemo(() => {
    const seen = new Map<string, string>();
    for (const item of headmasterClasses) if (item.subject) seen.set(String(item.subject.id), item.subject.name);
    return [...seen.entries()].map(([id, name]) => ({ id, name }));
  }, [headmasterClasses]);
  const selectedHeadmasterClass = headmasterClasses.find((item) => String(item.subject?.id) === selectedSubjectId) ?? null;
  const gradeAvailabilityPath = headmasterLike && headmasterClasses.length
    ? `/grades/grade-availability?classIds=${headmasterClasses.map((item) => item.id).join(",")}`
    : null;
  const { data: gradeAvailabilityData, isLoading: headmasterGradesLoading } = useApiQuery<{ data: GradeAvailability[] }>(gradeAvailabilityPath);
  const gradeAvailability = gradeAvailabilityData?.data ?? [];
  const hasGradesByClassId = new Map(gradeAvailability.map((item) => [item.classId, item.hasGrades]));
  const selectedStageHasGrades = gradeAvailability.some((item) => item.hasGrades);
  const selectedStageGradeClass = headmasterClasses.find((item) => hasGradesByClassId.get(item.id) === true) ?? null;
  const selectedSubjectHasGrades = selectedHeadmasterClass
    ? hasGradesByClassId.get(selectedHeadmasterClass.id) === true
    : false;

  // The selected class is resolved above so grade availability can use it too.
  const assignmentsPath = !identity ? null : headmasterLike
    ? selectedHeadmasterClass ? `/homework?limit=100&classId=${selectedHeadmasterClass.id}` : null
    : isParent && hasParentContext
    ? `/homework?limit=100&childId=${encodeURIComponent(selectedChildId!)}&academicYearId=${encodeURIComponent(selectedAcademicYearId!)}`
    : isParent ? null : "/homework?limit=100";

  const { data, isLoading, isError, refetch } = useApiQuery<{ data: AssignmentItem[] }>(
    assignmentsPath,
  );
  const assignments = useMemo(() => {
    const unique = new Map<string, AssignmentItem>();
    for (const item of data?.data ?? []) {
      const contentKey = `${item.title.trim().toLowerCase()}|${(item.description ?? "").trim().toLowerCase()}|${item.class.id}`;
      unique.set(contentKey, unique.get(contentKey) ?? item);
    }
    return [...unique.values()];
  }, [data]);

  useEffect(() => {
    if (selectedSubjectId && !headmasterSubjects.some((subject) => subject.id === selectedSubjectId)) setSelectedSubjectId("");
  }, [headmasterSubjects, selectedSubjectId]);

  const subjectOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const a of assignments) {
      if (a.subject) seen.set(String(a.subject.id), a.subject.name);
    }
    return [...seen.entries()].map(([id, name]) => ({ id, name }));
  }, [assignments]);

  const filters = staff ? STAFF_FILTERS : isParent ? PARENT_FILTERS : STUDENT_FILTERS;
  const [filterKey, setFilterKey] = useState(searchParams.get("filter") ?? "all");
  const [subjectId, setSubjectId] = useState(
    isStudent ? ALL_SUBJECTS : (searchParams.get("subjectId") ?? ALL_SUBJECTS),
  );
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

  if (isParent && !hasParentContext) return <ParentAcademicSelector mode="homework" />;

  return (
    <PageContainer className="assignment-list">
      <PageHeader
        breadcrumb
        showBackLink={!isParent}
        title="Homework"
        description={
          staff
            ? "Track homework submissions and grading across your classes."
            : isParent
              ? selectedChildName && selectedYearName ? `${selectedChildName} · ${selectedYearName}` : "Homework for the selected child and academic year."
              : "Everything assigned across your classes, and where each one stands."
        }
        actions={isParent ? <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild><Link to={gradesHref}><BarChart3 className="mr-1.5 h-4 w-4" />Grades</Link></Button>
        </div> : !staff && showGradesLink ? <Button variant="outline" asChild>
            <Link to={gradesHref}>
              <BarChart3 className="mr-1.5 h-4 w-4" />
              {gradesLabel}
            </Link>
          </Button> : undefined}
      />

      {headmasterLike && (
        <div className="space-y-4">
          {isSuperAdmin && <SchoolCardSelector
            value={superAdminScope.schoolLevel}
            onChange={(schoolLevel) => { superAdminScope.setSchoolLevel(schoolLevel); superAdminScope.setStage(""); superAdminScope.setYearId(""); setSelectedSubjectId(""); }}
          />}
          {(headmasterLevel || (isSuperAdmin && superAdminScope.schoolLevel)) && <HeadmasterStageSelector
            role={headmasterLevel
              ? identity!.role
              : superAdminScope.schoolLevel === "primary" ? UserRole.PRIMARY_HEADMASTER : UserRole.SECONDARY_HEADMASTER}
            value={activeStage}
            onChange={(stage) => {
              if (headmasterLevel) setSelectedStage(stage);
              else superAdminScope.setStage(stage);
              if (isSuperAdmin) superAdminScope.setYearId("");
              setSelectedSubjectId("");
            }}
            title={isSuperAdmin ? superAdminScope.schoolLevel === "primary" ? "2. Choose a class" : "2. Choose a form" : "Choose a class or form"}
            description="Choose a class or form first, then select one of its subjects to view homework."
          />}
          {isSuperAdmin && superAdminScope.schoolLevel && superAdminScope.stage && <div className="max-w-xl space-y-2">
            <label htmlFor="super-admin-homework-year" className="text-sm font-semibold">3. Academic year</label>
            {superAdminScope.yearsLoading ? <Skeleton className="h-11 w-full" /> : superAdminScope.yearsError ? (
              <ErrorState description="Unable to load academic years." onRetry={superAdminScope.retryYears} />
            ) : (
              <Select value={superAdminScope.yearId} onValueChange={(yearId) => { superAdminScope.setYearId(yearId); setSelectedSubjectId(""); }}>
                <SelectTrigger id="super-admin-homework-year" className="h-11 w-full"><SelectValue placeholder="Choose an academic year" /></SelectTrigger>
                <SelectContent>{superAdminScope.years.map((year) => <SelectItem key={year.id} value={String(year.id)}>{year.name}{year.active ? " · Current" : ""}</SelectItem>)}</SelectContent>
              </Select>
            )}
          </div>}
          {activeStage && (
            <div className="max-w-xl space-y-2">
              <label htmlFor="headmaster-homework-subject" className="text-sm font-medium">Subject in {stageLabel(activeStage)}</label>
              {headmasterClassesLoading ? <Skeleton className="h-11 w-full" /> : headmasterClassesError ? (
                <ErrorState description="Couldn&apos;t load subjects for this class." onRetry={refetchHeadmasterClasses} />
              ) : (
                <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId} disabled={headmasterSubjects.length === 0}>
                  <SelectTrigger id="headmaster-homework-subject" className="h-11 w-full"><SelectValue placeholder="Choose a subject" /></SelectTrigger>
                  <SelectContent>{headmasterSubjects.map((subject) => <SelectItem key={subject.id} value={subject.id}>{subject.name}</SelectItem>)}</SelectContent>
                </Select>
              )}
              {!headmasterClassesLoading && !headmasterClassesError && headmasterSubjects.length === 0 && <p className="text-sm text-muted-foreground">No subjects have been added to this class yet.</p>}
            </div>
          )}
      {activeStage && !headmasterGradesLoading && gradeAvailabilityData && !selectedStageHasGrades && (
        <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">The selected {stageLabel(activeStage)} has no grades at the moment.</p>
      )}
      {activeStage && selectedHeadmasterClass && !headmasterGradesLoading && gradeAvailabilityData && selectedStageHasGrades && !selectedSubjectHasGrades && (
        <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">This subject has no marked homework yet. Grades are available elsewhere in the selected {stageLabel(activeStage)}.</p>
      )}

          {/* Grade availability status is shown above. */}
        </div>
      )}

      {!isLoading && !isError && assignments.length > 0 && (
        <section aria-labelledby={isParent ? undefined : "assignment-worklist-title"} aria-label={isParent ? "Homework filters" : undefined} className="space-y-4">
          <FilterBar
            search={<SearchInput value={search} onChange={setSearch} placeholder="Search homework" aria-label="Search homework" />}
            active={Boolean(search || filterKey !== "all" || subjectId !== ALL_SUBJECTS)}
            onClear={() => { setSearch(""); setFilterKey("all"); setSubjectId(ALL_SUBJECTS); }}
            resultLabel={`${visible.length.toLocaleString()} homework item${visible.length === 1 ? "" : "s"} in this view`}
          >
            {subjectOptions.length > 1 && (
              <Select value={subjectId} onValueChange={setSubjectId}>
                <SelectTrigger className="h-10 w-full sm:w-[200px]" aria-label="Filter homework by subject">
                  <SelectValue placeholder="All subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_SUBJECTS}>All subjects</SelectItem>
                  {subjectOptions.map((subject) => <SelectItem key={subject.id} value={subject.id}>{subject.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </FilterBar>
          <div role="group" aria-label="Filter homework by workflow state" className="flex gap-1 overflow-x-auto border-b border-border">
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
        <ErrorState description="Couldn't load homework." onRetry={refetch} />
      ) : assignments.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No homework yet"
          description={
            canManage
              ? "Create your first homework task to start collecting and grading student work."
              : staff ? "No homework was saved for this previous-year selection." : "Once your teachers post homework, it will show up here."
          }
          action={canManage ? { label: "Create homework", to: "/homework/create" } : undefined}
        />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Nothing here"
          description={normalizedSearch ? `No homework matches "${search}" with the ${activeFilter.label.toLowerCase()} filter.` : `No homework matches "${activeFilter.label}".`}
        />
      ) : (
        <ul className="assignment-list-items divide-y border-y border-border bg-card">
          {visible.map((a) => (
            <li key={a.id}>
              <Link
                to={`/homework/${a.id}${isParent ? parentContextQuery : ""}`}
                className="flex items-center gap-4 px-4 py-4 transition-colors hover:bg-secondary/35 sm:px-5"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center text-muted-foreground">
                  <FileText className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{a.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {a.subject?.name ?? "Subject not recorded"} · {a.maxScore} pts
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

      <div className="flex flex-wrap justify-end gap-2 border-t pt-6">
        {staff && showGradesLink && (!headmasterLike || (Boolean(activeStage && selectedHeadmasterClass) && !headmasterGradesLoading && selectedStageHasGrades)) && <Button variant="outline" asChild>
          <Link
            to={headmasterLike && selectedStageGradeClass ? `/grades?classId=${selectedStageGradeClass.id}` : gradesHref}
            onClick={(event) => {
              if (headmasterLike && (!activeStage || !selectedHeadmasterClass)) {
                event.preventDefault();
                toast.error("Select a class or form first to open its report.");
              }
            }}
          >
            <BarChart3 className="mr-1.5 h-4 w-4" />
            {gradesLabel}
          </Link>
        </Button>}
        {canManage && <Button asChild>
          <Link to="/homework/create">
            <Plus className="mr-1.5 h-4 w-4" />
            New homework
          </Link>
        </Button>}
      </div>
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
