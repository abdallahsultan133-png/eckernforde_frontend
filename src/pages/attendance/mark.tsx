import { useEffect, useMemo, useState } from "react";
import { useGetIdentity, useList } from "@refinedev/core";
import { Link, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { BarChart3, Check, CircleSlash, Clock, FileText, Loader2, QrCode, X } from "lucide-react";

import { Breadcrumb } from "@/components/layout/breadcrumb.tsx";
import { PageHeader } from "@/components/layout/page-header.tsx";
import { Card } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { SearchInput } from "@/components/ui/search-input.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { EmptyState } from "@/components/ui/empty-state.tsx";
import { ErrorState } from "@/components/ui/error-state.tsx";
import { cn } from "@/lib/utils.ts";
import { BACKEND_BASE_URL } from "@/constants";
import { fetchJson, useApiQuery } from "@/hooks/use-api-query.ts";
import { UserRole, type ClassDetails, type User } from "@/types";
import { HeadmasterStageSelector, type HeadmasterStage, stageLabel } from "@/components/academic/headmaster-stage-selector.tsx";
import { useSuperAdminSchoolScope } from "@/components/academic/super-admin-school-scope.tsx";
import { SchoolCardSelector } from "@/components/academic/school-level-selector.tsx";

type AttendanceStatus = "present" | "absent" | "late" | "excused";

type RosterRow = {
  studentId: string;
  name: string;
  email: string;
  image: string | null;
  attendanceId: number | null;
  status: AttendanceStatus | null;
  notes: string | null;
};

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; icon: typeof Check; dot: string; active: string }> = {
  present: { label: "Present", icon: Check, dot: "bg-emerald-500", active: "data-[active=true]:bg-emerald-600 data-[active=true]:text-white data-[active=true]:border-emerald-600" },
  absent: { label: "Absent", icon: X, dot: "bg-red-500", active: "data-[active=true]:bg-red-600 data-[active=true]:text-white data-[active=true]:border-red-600" },
  late: { label: "Late", icon: Clock, dot: "bg-amber-500", active: "data-[active=true]:bg-amber-500 data-[active=true]:text-white data-[active=true]:border-amber-500" },
  excused: { label: "Excused", icon: FileText, dot: "bg-blue-500", active: "data-[active=true]:bg-blue-600 data-[active=true]:text-white data-[active=true]:border-blue-600" },
};
const STATUS_KEYS = Object.keys(STATUS_CONFIG) as AttendanceStatus[];

const getInitials = (name = "") =>
  name.trim().split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");

const todayISO = () => new Date().toISOString().slice(0, 10);
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

const MarkAttendance = () => {
  const { data: identity } = useGetIdentity<User>();
  const navigate = useNavigate();
  const headmasterLevel = identity?.role === UserRole.PRIMARY_HEADMASTER
    ? "primary"
    : identity?.role === UserRole.SECONDARY_HEADMASTER
      ? "secondary"
      : null;
  const isSuperAdmin = identity?.role === UserRole.SUPER_ADMIN;
  const superAdminScope = useSuperAdminSchoolScope(isSuperAdmin);
  const [selectedStage, setSelectedStage] = useState<HeadmasterStage | "">("");
  const activeStage = headmasterLevel ? selectedStage : isSuperAdmin ? superAdminScope.stage : "";
  const headmasterLike = Boolean(headmasterLevel || isSuperAdmin);
  // Prefill the class when arriving from a class workspace (/attendance?classId=5).
  const [searchParams] = useSearchParams();
  const [classId, setClassId] = useState<string>(searchParams.get("classId") ?? "");
  const [date, setDate] = useState<string>(todayISO());
  const [pendingStatus, setPendingStatus] = useState<Record<string, AttendanceStatus>>({});
  const [studentSearch, setStudentSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const { query: classesQuery } = useList<ClassDetails>({
    resource: "classes",
    pagination: { pageSize: 100 },
  });
  const classes = useMemo(() => classesQuery?.data?.data ?? [], [classesQuery?.data?.data]);
  const { data: headmasterClassesData, isLoading: headmasterClassesLoading, isError: headmasterClassesError, refetch: refetchHeadmasterClasses } = useApiQuery<{ data: ClassDetails[] }>(
    headmasterLevel ? `/classes?limit=100&schoolLevel=${headmasterLevel}` : isSuperAdmin && superAdminScope.schoolLevel && superAdminScope.yearId && activeStage
      ? `/classes?limit=100&schoolLevel=${superAdminScope.schoolLevel}&academicYearId=${superAdminScope.yearId}&stage=${activeStage}` : null,
  );
  const headmasterClasses = useMemo(
    () => activeStage ? (headmasterClassesData?.data ?? []).filter((item) => matchesStage(item.name, activeStage)) : [],
    [headmasterClassesData, activeStage],
  );
  const availableClasses = headmasterLevel || isSuperAdmin ? headmasterClasses : classes;

  useEffect(() => {
    if (headmasterLevel || isSuperAdmin) {
      if (isSuperAdmin && activeStage && headmasterClassesLoading) setClassId("");
      else if (activeStage && availableClasses.length > 0 && !availableClasses.some((item) => String(item.id) === classId)) setClassId(String(availableClasses[0].id));
      if (!activeStage) setClassId("");
    } else if (!classId && classes.length > 0) setClassId(String(classes[0].id));
  }, [availableClasses, classId, classes, headmasterLevel, isSuperAdmin, activeStage, headmasterClassesLoading]);

  const selectedClassAllowed = !isSuperAdmin || availableClasses.some((item) => String(item.id) === classId);
  const rosterPath = classId && date && selectedClassAllowed ? `/attendance/class/${classId}?date=${date}` : null;
  const { data: rosterData, isLoading, isError, refetch } = useApiQuery<{ data: RosterRow[] }>(rosterPath);
  const roster = useMemo(() => rosterData?.data ?? [], [rosterData]);

  // Drop pending edits whenever a fresh roster arrives (class switch / date change / after save).
  useEffect(() => {
    setPendingStatus({});
  }, [rosterData]);

  const effective = (row: RosterRow): AttendanceStatus | null => pendingStatus[row.studentId] ?? row.status;
  const dirtyCount = roster.filter(
    (r) => pendingStatus[r.studentId] !== undefined && pendingStatus[r.studentId] !== r.status,
  ).length;

  const setStatus = (studentId: string, status: AttendanceStatus) =>
    setPendingStatus((prev) => ({ ...prev, [studentId]: status }));

  const markAll = (status: AttendanceStatus) =>
    setPendingStatus(Object.fromEntries(roster.map((r) => [r.studentId, status])));

  const clearPending = () => setPendingStatus({});

  const summary = useMemo(() => {
    const counts: Record<AttendanceStatus, number> = { present: 0, absent: 0, late: 0, excused: 0 };
    for (const r of roster) {
      const s = pendingStatus[r.studentId] ?? r.status;
      if (s) counts[s] += 1;
    }
    return counts;
  }, [roster, pendingStatus]);

  const marked = summary.present + summary.absent + summary.late + summary.excused;
  const unmarked = roster.length - marked;
  const normalizedStudentSearch = studentSearch.trim().toLowerCase();
  const visibleRoster = roster.filter((row) => !normalizedStudentSearch || `${row.name} ${row.email}`.toLowerCase().includes(normalizedStudentSearch));

  const handleSave = async () => {
    const records = roster
      .map((r) => ({ studentId: r.studentId, status: effective(r) }))
      .filter((r): r is { studentId: string; status: AttendanceStatus } => Boolean(r.status));

    if (records.length === 0) {
      toast.error("Mark at least one student before saving.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/attendance`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId: Number(classId), date, records }),
      });
      if (!res.ok) throw new Error((await res.json())?.message ?? "Failed to save attendance");
      toast.success(`Attendance saved for ${records.length} student${records.length === 1 ? "" : "s"}.`);
      await refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="attendance-mark space-y-6">
      {/* Attendance controls follow the class/form selection. */}
      <Breadcrumb />
      {isSuperAdmin && <SchoolCardSelector
        value={superAdminScope.schoolLevel}
        onChange={(schoolLevel) => { superAdminScope.setSchoolLevel(schoolLevel); superAdminScope.setStage(""); superAdminScope.setYearId(""); setClassId(""); }}
      />}
      {(headmasterLevel || (isSuperAdmin && superAdminScope.schoolLevel)) && (
        <HeadmasterStageSelector
          role={headmasterLevel
            ? identity!.role
            : superAdminScope.schoolLevel === "primary" ? UserRole.PRIMARY_HEADMASTER : UserRole.SECONDARY_HEADMASTER}
          value={activeStage}
          onChange={(stage) => {
            if (headmasterLevel) setSelectedStage(stage);
            else superAdminScope.setStage(stage);
            if (isSuperAdmin) superAdminScope.setYearId("");
            setClassId("");
          }}
          title={isSuperAdmin ? superAdminScope.schoolLevel === "primary" ? "2. Choose a class" : "2. Choose a form" : "Choose a class or form"}
          description={headmasterLevel === "primary" || (isSuperAdmin && superAdminScope.schoolLevel === "primary")
            ? "Choose the class whose students you want to mark attendance for."
            : "Choose the form whose students you want to mark attendance for."}
        />
      )}
      {isSuperAdmin && superAdminScope.schoolLevel && superAdminScope.stage && <div className="max-w-xl space-y-2">
        <label htmlFor="super-admin-attendance-year" className="text-sm font-semibold">3. Academic year</label>
        {superAdminScope.yearsLoading ? <Skeleton className="h-11 w-full" /> : superAdminScope.yearsError ? (
          <ErrorState description="Unable to load academic years." onRetry={superAdminScope.retryYears} />
        ) : (
          <Select value={superAdminScope.yearId} onValueChange={(yearId) => { superAdminScope.setYearId(yearId); setClassId(""); }}>
            <SelectTrigger id="super-admin-attendance-year" className="h-11 w-full"><SelectValue placeholder="Choose an academic year" /></SelectTrigger>
            <SelectContent>{superAdminScope.years.map((year) => <SelectItem key={year.id} value={String(year.id)}>{year.name}{year.active ? " · Current" : ""}</SelectItem>)}</SelectContent>
          </Select>
        )}
      </div>}
      {headmasterLike && activeStage && headmasterClassesError && <ErrorState description="Could not load classes for this selection." onRetry={refetchHeadmasterClasses} />}

      <PageHeader
        breadcrumb={false}
        title="Mark Attendance"
        description="Mark everyone present, then flip the exceptions."
        actions={
          <>
            <Button variant="ghost" size="sm"
              onClick={async () => {
                if (headmasterLike && !activeStage) {
                  toast.error("Select a class or form first to open its attendance report.");
                  return;
                }
                if (headmasterLike && !classId) {
                  toast.error(`The selected ${headmasterLevel === "primary" || (isSuperAdmin && superAdminScope.schoolLevel === "primary") ? "class" : "form"} does not have attendance data.`);
                  return;
                }
                if (headmasterLike && classId) {
                  try {
                    const reportClassIds = availableClasses.length > 0 ? availableClasses.map((item) => String(item.id)) : [classId];
                    const reports = await Promise.all(reportClassIds.map(async (reportClassId) => ({
                      classId: reportClassId,
                      report: await fetchJson<{ period?: { firstDate: string | null } }>(`/attendance/class/${reportClassId}/report`),
                    })));
                    const reportWithData = reports.find(({ report }) => Boolean(report.period?.firstDate));
                    if (!reportWithData) {
                      toast.error(`The selected ${headmasterLevel === "primary" || (isSuperAdmin && superAdminScope.schoolLevel === "primary") ? "class" : "form"} does not have attendance data.`);
                      return;
                    }
                    const reportScope = isSuperAdmin
                      ? `&schoolLevel=${superAdminScope.schoolLevel}&academicYearId=${superAdminScope.yearId}&stage=${activeStage}`
                      : "";
                    navigate(`/attendance/report?classId=${reportWithData.classId}${reportScope}`);
                    return;
                  } catch {
                    toast.error("Couldn't check attendance data. Please try again.");
                    return;
                  }
                }
                navigate(classId ? `/attendance/report?classId=${classId}` : "/attendance/report");
              }}>
                <BarChart3 className="mr-1.5 h-4 w-4" /> Report
              {/* report navigation handled by the button */}
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link to="/attendance/qr">
                <QrCode className="mr-1.5 h-4 w-4" /> QR
              </Link>
            </Button>
            <Select value={classId} onValueChange={setClassId} disabled={headmasterLike ? !activeStage || headmasterClassesLoading : false}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder={(headmasterLevel || isSuperAdmin) && !activeStage ? identity?.role === UserRole.PRIMARY_HEADMASTER || (isSuperAdmin && superAdminScope.schoolLevel === "primary") ? "Choose a class first" : "Choose a form first" : "Select a class"} />
              </SelectTrigger>
              <SelectContent>
                {availableClasses.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.subject?.name ?? c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input
              type="date"
              value={date}
              max={todayISO()}
              onChange={(e) => setDate(e.target.value)}
              aria-label="Attendance date"
              className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-xs"
            />
          </>
        }
      />

      {headmasterLike && activeStage && classId && <p className="text-sm text-muted-foreground">Attendance for {stageLabel(activeStage)}.</p>}

      {!isLoading && !isError && roster.length > 0 && (
        <div className="space-y-3">
          <SearchInput value={studentSearch} onChange={setStudentSearch} placeholder="Find a student..." aria-label="Search students in attendance register" />
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={() => markAll("present")}>
              <Check className="mr-1.5 h-4 w-4" /> Mark all present
            </Button>
            {(dirtyCount > 0 || marked > 0) && (
              <Button size="sm" variant="outline" onClick={clearPending} disabled={dirtyCount === 0}>
                <CircleSlash className="mr-1.5 h-4 w-4" /> Reset changes
              </Button>
            )}

            <span className="ml-auto flex flex-wrap items-center gap-2">
              {STATUS_KEYS.map((s) => (
                <span key={s} className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  <span className={cn("h-2 w-2 rounded-full", STATUS_CONFIG[s].dot)} />
                  {STATUS_CONFIG[s].label} {summary[s]}
                </span>
              ))}
              {unmarked > 0 && (
                <span className="rounded-full border border-dashed px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  Unmarked {unmarked}
                </span>
              )}
            </span>
          </div>
        </div>
      )}

      {isLoading ? (
        <Card className="attendance-register gap-0 divide-y py-0">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-2">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-28" />
              </div>
              <Skeleton className="h-8 w-64" />
            </div>
          ))}
        </Card>
      ) : isError ? (
        <ErrorState description="Couldn't load the class roster." onRetry={refetch} />
      ) : !classId ? (
        <EmptyState icon={FileText} title="Pick a class" description="Choose a class above to start marking attendance." />
      ) : roster.length === 0 ? (
        <EmptyState icon={FileText} title="No students enrolled" description="This class has no students to mark yet." />
      ) : (
        <Card className="!gap-0 divide-y !py-0">
          {visibleRoster.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">No students match “{studentSearch}”.</div>
          ) : visibleRoster.map((row) => {
            const active = effective(row);
            const isDirty = pendingStatus[row.studentId] !== undefined && pendingStatus[row.studentId] !== row.status;
            return (
              <div key={row.studentId} className="attendance-register-row flex flex-wrap items-center gap-x-4 gap-y-0 px-4 !py-0">
                <Avatar className="h-10 w-10">
                  {row.image && <AvatarImage src={row.image} alt={row.name} />}
                  <AvatarFallback>{getInitials(row.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-[160px] flex-1">
                  <p className="text-sm font-medium leading-none">
                    {row.name}
                    {isDirty && <span className="ml-2 text-xs font-normal text-amber-600 dark:text-amber-400">unsaved</span>}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2" role="group" aria-label={`Attendance status for ${row.name}`}>
                  {STATUS_KEYS.map((s) => {
                    const { label, icon: Icon, active: activeCls } = STATUS_CONFIG[s];
                    return (
                      <button
                        key={s}
                        type="button"
                        data-active={active === s}
                        aria-pressed={active === s}
                        onClick={() => setStatus(row.studentId, s)}
                        className={cn(
                          "inline-flex min-h-9 items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent",
                          activeCls,
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </Card>
      )}

      {!isLoading && !isError && roster.length > 0 && (
        <div className="flex items-center justify-end gap-3">
          {dirtyCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {dirtyCount} unsaved change{dirtyCount === 1 ? "" : "s"}
            </span>
          )}
          <Button onClick={handleSave} disabled={saving || (dirtyCount === 0 && marked === 0)}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save attendance
          </Button>
        </div>
      )}
    </div>
  );
};

export default MarkAttendance;
