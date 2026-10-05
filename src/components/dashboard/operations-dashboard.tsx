import { type ReactNode } from "react";
import { Link } from "react-router";
import {
  AlertTriangle,
  BookOpen,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  FilePlus2,
  GraduationCap,
  Inbox,
  Megaphone,
  ShieldCheck,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";

import { AcademicContext } from "./academic-context";
import { AttendanceOverviewChart } from "./attendance-overview-chart";
import { DashboardGreeting } from "./dashboard-greeting";
import { PerformanceChart } from "./performance-chart";
import { RecentActivity } from "./recent-activity";
import { RecentResults } from "./recent-results";
import { SystemActivity } from "./system-activity";
import { TodaySchedule } from "./today-schedule";
import { UpcomingEvents } from "./upcoming-events";
import { ClassListPanel } from "./class-list-panel";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { useApiQuery } from "@/hooks/use-api-query";
import { AdminDashboardYearSelector, useAdminDashboardYear } from "./admin-dashboard-year";
import { useHistoricalPortal, stageLabel, type HistoricalPortalContext } from "@/components/layout/historical-portal-banner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Role = "student" | "teacher" | "primary_headmaster" | "secondary_headmaster" | "super_admin";

type DashboardStats = {
  students?: number;
  teachers?: number;
  departments?: number;
  classes?: number;
  subjects?: number;
  attendanceRate?: number | null;
  pendingGrading?: number;
  pendingAssignments?: number;
  assignmentCompletionRate?: number | null;
  trends?: {
    students?: number | null;
    teachers?: number | null;
    classes?: number | null;
    departments?: number | null;
    subjects?: number | null;
    attendanceRate?: number | null;
  };
};

type AttendanceToday = {
  date: string;
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  unrecordedClasses: { id: number; name: string }[];
};

type SystemStatus = { data: { enabled: boolean } };

type Action = { label: string; to: string; icon: LucideIcon };

type HistoricalTeacherArchive = {
  classes: Array<{ id: number; name: string; studentCount: number; subject: { id: number; name: string; code: string } | null }>;
  subjects: Array<{ id: number; name: string; code: string }>;
  students: Array<{ studentId: string }>;
  homework: Array<{ id: number; title: string; className: string; submissionCount: number; gradedCount: number; averageScore: number | null; maxScore: number }>;
  attendance: Array<{ id: number; status: "present" | "absent" | "late" | "excused" }>;
  exams: Array<{ id: number; title: string; className: string; resultCount: number; averageScore: number | null; maxScore: number }>;
  formalResults: Array<{ termId: number; classId: number; subjectId: number; termName: string; className: string; subjectName: string; resultCount: number; averageScore: number | null }>;
  announcements: Array<{ id: number; title: string; className: string }>;
  events: Array<{ id: number; title: string; className: string; startAt: string }>;
};

const copy: Record<Role, { title: string; subtitle: string; actions: Action[] }> = {
  primary_headmaster: {
    title: "Primary school workspace",
    subtitle: "Keep today’s attendance, people, classes, and communication moving smoothly.",
    actions: [
      { label: "Manage students", to: "/students", icon: UserPlus },
      { label: "Admission enquiries", to: "/admin/admissions", icon: Inbox },
      { label: "View audit log", to: "/admin/audit-logs", icon: ShieldCheck },
    ],
  },
  secondary_headmaster: {
    title: "Secondary school workspace",
    subtitle: "Monitor secondary-school attendance, people, classes, and communication.",
    actions: [
      { label: "Manage students", to: "/students", icon: UserPlus },
      { label: "Admission enquiries", to: "/admin/admissions", icon: Inbox },
      { label: "View audit log", to: "/admin/audit-logs", icon: ShieldCheck },
    ],
  },
  super_admin: {
    title: "Platform command center",
    subtitle: "See the health of the school platform and move quickly on high-level administration.",
    actions: [
      { label: "Academic calendar", to: "/admin/academic-calendar", icon: CalendarDays },
      { label: "System settings", to: "/users", icon: CheckCircle2 },
    ],
  },
  teacher: {
    title: "Teaching day",
    subtitle: "Start with attendance and student work, then plan the rest of your day.",
    actions: [
      { label: "Take attendance", to: "/attendance", icon: ClipboardCheck },
      { label: "Create homework", to: "/homework/create", icon: FilePlus2 },
      { label: "Enter results", to: "/portal/exams", icon: BookOpenCheck },
      { label: "Review submissions", to: "/homework?filter=needs-grading", icon: CheckCircle2 },
      { label: "Post announcement", to: "/announcements/create", icon: Megaphone },
    ],
  },
  student: {
    title: "My school day",
    subtitle: "See what is scheduled, what is due, and how your learning is progressing.",
    actions: [
      { label: "View homework", to: "/homework", icon: ClipboardCheck },
      { label: "View timetable", to: "/calendar", icon: CalendarDays },
      { label: "View reports", to: "/reports", icon: GraduationCap },
    ],
  },
};

function Section({ title, action, children, className = "" }: { title: string; action?: { label: string; to: string }; children: ReactNode; className?: string }) {
  return (
    <section className={`operations-section ${className}`} aria-label={title}>
      <header className="operations-section-heading">
        <h2>{title}</h2>
        {action && <Link to={action.to}>{action.label} <span aria-hidden="true">→</span></Link>}
      </header>
      {children}
    </section>
  );
}

function MetricGroup({ role }: { role: Role }) {
  const { withYear } = useAdminDashboardYear();
  const { data, isLoading, isError, refetch } = useApiQuery<DashboardStats>(withYear("/dashboard/stats"));
  if (isLoading) return <div className="operations-metrics" aria-busy="true">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-20 rounded-none" />)}</div>;
  if (isError) return <ErrorState description="Unable to load operational summary." onRetry={refetch} />;
  const metrics = role === "student"
    ? [
        ["Subjects", data?.subjects],
        ["Attendance · 30 days", data?.attendanceRate == null ? "Not recorded" : `${data.attendanceRate}%`],
        ["Open homework", data?.pendingAssignments],
      ]
    : role === "teacher"
      ? [
          ["My students", data?.students],
          ["My classes", data?.classes],
          ["Attendance · 30 days", data?.attendanceRate == null ? "Not recorded" : `${data.attendanceRate}%`],
          ["Awaiting grading", data?.pendingGrading],
        ]
      : role === "super_admin"
        ? [
            ["Students", data?.students],
            ["Teachers", data?.teachers],
            ["Active classes", data?.classes],
            ["Departments", data?.departments],
          ]
        : [
          ["Students", data?.students],
          ["Teachers", data?.teachers],
          ["Active classes", data?.classes],
          ["Attendance · 30 days", data?.attendanceRate == null ? "Not recorded" : `${data.attendanceRate}%`],
        ];
  return <dl className={`operations-metrics operations-metrics--${role}`}>{metrics.map(([label, value]) => <div key={String(label)}><dt>{label}</dt><dd>{value ?? "Not recorded"}</dd></div>)}</dl>;
}

function AdminOverviewStrip() {
  const { data, isLoading, isError, refetch } = useApiQuery<SystemStatus>("/system/status");
  const { selectedYearId, years } = useAdminDashboardYear();
  const selectedYear = years.find((year) => String(year.id) === selectedYearId);

  if (isLoading) return <Skeleton className="admin-overview-strip" />;
  if (isError) return <ErrorState description="Unable to load school overview status." onRetry={refetch} />;

  const enabled = data?.data?.enabled ?? true;
  return <div className="admin-overview-strip" aria-label="School overview status">
    <div className="admin-overview-copy">
      <span className="admin-overview-eyebrow">Live school overview</span>
      <strong>{selectedYear?.name ?? "Current academic year"}</strong>
      <small>Attendance, classes, people, and activity are scoped to this year.</small>
    </div>
    <div className={`admin-sync-status ${enabled ? "admin-sync-status--online" : "admin-sync-status--offline"}`}>
      <span aria-hidden="true" />
      <span><strong>{enabled ? "Live sync" : "Access paused"}</strong><small>{enabled ? "School services are operational" : "Review platform access"}</small></span>
    </div>
    <Link to="/admin/academic-calendar" className="admin-overview-link">Open academic setup <span aria-hidden="true">→</span></Link>
  </div>;
}

function AttendanceTodayPanel({ role }: { role: Role }) {
  const { withYear } = useAdminDashboardYear();
  const { data, isLoading, isError, refetch } = useApiQuery<AttendanceToday>(withYear("/dashboard/attendance-today"));
  if (isLoading) return <Skeleton className="h-48 w-full" />;
  if (isError) return <ErrorState description="Unable to load today's attendance." onRetry={refetch} />;
  const total = data?.total ?? 0;
  const rate = total ? Math.round(((data?.present ?? 0) / total) * 1000) / 10 : null;
  return <div className="attendance-snapshot">
    <div className="attendance-snapshot-total"><span>{role === "student" ? "Your recorded attendance" : "Recorded attendance"}</span><strong>{rate == null ? "Not recorded" : `${rate}%`}</strong><small>{total ? `${data?.present} of ${total} marked present` : "No attendance has been recorded today."}</small></div>
    <dl>
      <div><dt><i className="status-dot status-dot--success" />Present</dt><dd>{data?.present ?? 0}</dd></div>
      <div><dt><i className="status-dot status-dot--critical" />Absent</dt><dd>{data?.absent ?? 0}</dd></div>
      <div><dt><i className="status-dot status-dot--warning" />Late</dt><dd>{data?.late ?? 0}</dd></div>
      <div><dt><i className="status-dot status-dot--neutral" />Excused</dt><dd>{data?.excused ?? 0}</dd></div>
    </dl>
    <Link to="/attendance" className="operations-inline-link">View attendance →</Link>
  </div>;
}

function SystemHealthPanel() {
  const { data, isLoading, isError, refetch } = useApiQuery<SystemStatus>("/system/status");
  if (isLoading) return <Skeleton className="h-24 w-full" />;
  if (isError) return <ErrorState description="Unable to load system status." onRetry={refetch} />;
  const enabled = data?.data?.enabled ?? true;
  return <div className="system-health-panel">
    <div className={`system-health-indicator ${enabled ? "system-health-indicator--online" : "system-health-indicator--offline"}`}><span aria-hidden="true" /><ShieldCheck className="h-5 w-5" /></div>
    <div><strong>{enabled ? "Platform operational" : "Platform access is paused"}</strong><p>{enabled ? "Authentication and school services are available." : "Only super administrators can access the platform while it is paused."}</p></div>
    <Link to="/users" className="operations-inline-link">Manage settings →</Link>
  </div>;
}

function AttentionRequired({ role }: { role: Role }) {
  const { withYear } = useAdminDashboardYear();
  const { data: stats, isLoading: statsLoading, isError: statsError, refetch: retryStats } = useApiQuery<DashboardStats>(withYear("/dashboard/stats"));
  const { data: attendance, isLoading: attendanceLoading, isError: attendanceError, refetch: retryAttendance } = useApiQuery<AttendanceToday>(withYear("/dashboard/attendance-today"));
  if (statsLoading || attendanceLoading) return <Skeleton className="h-44 w-full" />;
  if (statsError || attendanceError) return <ErrorState description="Unable to load the action queue." onRetry={() => { retryStats(); retryAttendance(); }} />;
  const items = role === "teacher"
    ? [
        ...(attendance?.unrecordedClasses ?? []).map((item) => ({ label: `Attendance not recorded for ${item.name}`, meta: "Record attendance for this class", to: "/attendance", tone: "warning" as const })),
        ...(stats?.pendingGrading ? [{ label: `${stats.pendingGrading} submission${stats.pendingGrading === 1 ? "" : "s"} awaiting grading`, meta: "Review student work", to: "/homework?filter=needs-grading", tone: "info" as const }] : []),
      ]
    : role === "student"
      ? (stats?.pendingAssignments ? [{ label: `${stats.pendingAssignments} homework item${stats.pendingAssignments === 1 ? "" : "s"} still open`, meta: "Review due dates and submit your work", to: "/homework", tone: "warning" as const }] : [])
      : [
          ...((attendance?.absent ?? 0) > 0 ? [{ label: `${attendance?.absent} absence${attendance?.absent === 1 ? "" : "s"} recorded today`, meta: "Review attendance records", to: "/attendance", tone: "critical" as const }] : []),
          ...((attendance?.late ?? 0) > 0 ? [{ label: `${attendance?.late} late arrival${attendance?.late === 1 ? "" : "s"} recorded today`, meta: "Review attendance records", to: "/attendance", tone: "warning" as const }] : []),
        ];
  return items.length ? <ul className="attention-list">{items.map((item) => <li key={item.label}><AlertTriangle aria-hidden="true" /><span><strong>{item.label}</strong><small>{item.meta}</small></span><StatusBadge tone={item.tone}>Review</StatusBadge><Link to={item.to} aria-label={`Review: ${item.label}`} /></li>)}</ul> : <div className="operations-empty"><CheckCircle2 aria-hidden="true" /><p><strong>Nothing requires attention right now.</strong><span>{role === "teacher" ? "Your attendance and grading queue are clear." : role === "student" ? "You have no open homework in your dashboard summary." : "No attendance exceptions are recorded for today."}</span></p></div>;
}

function QuickActions({ actions }: { actions: Action[] }) {
  return <nav className="operations-actions" aria-label="Common actions">{actions.map(({ label, to, icon: Icon }) => <Link key={to} to={to}><Icon aria-hidden="true" /><span>{label}</span></Link>)}</nav>;
}

/* function StudentAcademicLinks() {
  const links: Action[] = [
    { label: "Midterm & terminal results", to: "/grades/term-results", icon: BookOpenCheck },
    { label: "View reports", to: "/grades/term-results", icon: GraduationCap },
    { label: "Academic history", to: "/portal/academic-history", icon: CalendarDays },
  ];
  return <div className="student-academic-links">{links.map(({ label, to, icon: Icon }) => <Link key={to} to={to}><span className="student-academic-links__icon"><Icon className="h-4 w-4" /></span><span>{label}</span><span aria-hidden="true">→</span></Link>)}</div>;
} */

function HistoricalTeacherWorkboard({ context }: { context: HistoricalPortalContext }) {
  const path = `/portal-context/teacher-history/${context.academicYearId}?schoolBand=${encodeURIComponent(context.schoolBand)}&stage=${encodeURIComponent(context.stage)}`;
  const { data, isLoading, isError, refetch } = useApiQuery<{ data: HistoricalTeacherArchive }>(path, { staleTime: 0 });
  if (isLoading) return <div className="space-y-4"><Skeleton className="h-28 w-full" /><Skeleton className="h-48 w-full" /><Skeleton className="h-64 w-full" /></div>;
  if (isError || !data?.data) return <ErrorState title="Unable to load the previous-year dashboard" description="Please retry, or return to the current academic year." onRetry={refetch} />;
  const archive = data.data;
  const students = new Set(archive.students.map((item) => item.studentId)).size;
  const present = archive.attendance.filter((item) => item.status === "present").length;
  const attendanceRate = archive.attendance.length ? Math.round((present / archive.attendance.length) * 1000) / 10 : null;
  const links: Action[] = [
    { label: "Classes", to: "/classes", icon: GraduationCap },
    { label: "Subjects", to: "/subjects", icon: BookOpen },
    { label: "Homework", to: "/homework", icon: FileText },
    { label: "Attendance", to: "/attendance", icon: ClipboardCheck },
    { label: "Results", to: "/grades", icon: BookOpenCheck },
    { label: "Calendar", to: "/calendar", icon: CalendarDays },
  ];
  const metrics = [
    { label: "Classes", value: archive.classes.length, icon: GraduationCap },
    { label: "Subjects", value: archive.subjects.length, icon: BookOpen },
    { label: "Students", value: students, icon: Users },
    { label: "Homework", value: archive.homework.length, icon: FileText },
    { label: "Attendance", value: attendanceRate === null ? "—" : `${attendanceRate}%`, icon: ClipboardCheck },
    { label: "Exams", value: archive.exams.length, icon: BookOpenCheck },
  ];
  return <div className="operations-dashboard teacher-workboard">
    <header className="operations-header teacher-workboard-header">
      <div><p className="operations-kicker">Previous teaching year <span aria-hidden="true">/</span> Read only</p><h1 className="text-2xl font-semibold tracking-tight">{context.academicYear.name} teaching dashboard</h1><p className="mt-2 text-sm text-muted-foreground">{stageLabel(context.stage)} · Review the records saved for this completed academic year.</p></div>
      <QuickActions actions={links} />
    </header>
    <Section title="Year overview" className="teacher-summary"><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{metrics.map(({ label, value, icon: Icon }) => <Card key={label} className="gap-1"><CardContent className="flex items-center justify-between py-2"><div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p></div><Icon className="h-5 w-5 text-muted-foreground" /></CardContent></Card>)}</div></Section>
    <div className="operations-main-grid">
      <Section title="Classes and subjects" action={{ label: "Open classes", to: "/classes" }}><div className="divide-y rounded-md border">{archive.classes.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 p-4"><div><p className="font-medium">{item.name}</p><p className="text-sm text-muted-foreground">{item.subject?.name ?? "Subject unavailable"}</p></div><Badge variant="outline">{item.studentCount} students</Badge></div>)}</div></Section>
      <Section title="Homework summary" action={{ label: "Open homework", to: "/homework" }}><div className="divide-y rounded-md border">{archive.homework.slice(0, 6).map((item) => <div key={item.id} className="p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-medium">{item.title}</p><p className="text-sm text-muted-foreground">{item.className}</p></div><Badge variant="secondary">{item.averageScore === null ? "Not graded" : `${item.averageScore}/${item.maxScore}`}</Badge></div><p className="mt-2 text-xs text-muted-foreground">{item.submissionCount} submitted · {item.gradedCount} graded</p></div>)}</div></Section>
    </div>
    <div className="operations-main-grid">
      <Section title="Academic results" action={{ label: "Open results", to: "/grades" }}><div className="divide-y rounded-md border">{archive.formalResults.slice(0, 6).map((item) => <div key={`${item.termId}-${item.classId}-${item.subjectId}`} className="flex items-start justify-between gap-3 p-4"><div><p className="font-medium">{item.subjectName}</p><p className="text-sm text-muted-foreground">{item.termName} · {item.className}</p></div><Badge variant="secondary">{item.averageScore === null ? "No average" : `${item.averageScore}%`}</Badge></div>)}</div></Section>
      <Section title="Saved activity" action={{ label: "Open activity", to: "/activity" }}><div className="space-y-3 rounded-md border p-4 text-sm"><p><strong>{archive.attendance.length}</strong> attendance records</p><p><strong>{archive.announcements.length}</strong> class announcements</p><p><strong>{archive.events.length}</strong> calendar events</p><p><strong>{archive.exams.reduce((total, item) => total + item.resultCount, 0)}</strong> exam results recorded</p></div></Section>
    </div>
  </div>;
}

/** A teacher's dashboard is a workboard, not a smaller version of the school office. */
function TeacherWorkboard() {
  const { data: portal } = useHistoricalPortal();
  if (portal?.data.archiveContext) return <HistoricalTeacherWorkboard context={portal.data.archiveContext} />;
  const current = copy.teacher;
  return <div className="operations-dashboard teacher-workboard">
    <header className="operations-header teacher-workboard-header">
      <div>
        <p className="operations-kicker">Teaching workspace <span aria-hidden="true">/</span> Today</p>
        <DashboardGreeting subtitle={current.subtitle} />
        <AcademicContext />
      </div>
      <QuickActions actions={current.actions} />
    </header>

    <Section title="Teaching at a glance" className="teacher-summary"><MetricGroup role="teacher" /></Section>

    <div className="teacher-focus-grid">
      <Section title="Start here" className="teacher-task-stack">
        <p className="teacher-section-intro">Finish these items before moving on to planning and reporting.</p>
        <AttentionRequired role="teacher" />
      </Section>
      <Section title="Today's timetable" action={{ label: "Open calendar", to: "/calendar" }} className="teacher-timetable">
        <TodaySchedule />
      </Section>
    </div>

    <Section title="My classes" action={{ label: "All classes", to: "/classes" }}><ClassListPanel title="My classes" max={6} /></Section>

    <div className="teacher-analytics-grid">
      <Section title="Final grade distribution" action={{ label: "Open results", to: "/grades" }}><PerformanceChart showSubjectRanking /></Section>
      <Section title="Attendance trend" action={{ label: "Attendance", to: "/attendance" }}><AttendanceOverviewChart /></Section>
    </div>

    <Section title="School notices" action={{ label: "All activity", to: "/activity" }} className="teacher-noticeboard"><RecentActivity types={["announcement"]} /></Section>
  </div>;
}

export function OperationsDashboard({ role }: { role: Role }) {
  if (role === "teacher") return <TeacherWorkboard />;
  const current = copy[role];
  const isStudent = role === "student";
  const isHeadmaster = role === "primary_headmaster" || role === "secondary_headmaster";
  const isAdminDashboard = role === "primary_headmaster" || role === "secondary_headmaster" || role === "super_admin";
  const dashboardActions = current.actions.map((action) => action.label === "Create class"
    ? { ...action, label: role === "secondary_headmaster" ? "Generate form" : "Generate class" }
    : action);
  const classDirectoryLabel = role === "secondary_headmaster" ? "All forms" : "All classes";
  return <div className={`operations-dashboard operations-dashboard--${role}`}>
    <header className={`operations-header operations-header--${role}`}>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p className="operations-kicker">Dashboard <span aria-hidden="true">/</span> {current.title}</p>
        </div>
        <DashboardGreeting subtitle={current.subtitle} />
        <AcademicContext />
      </div>
      <div className="flex w-full flex-wrap items-center justify-end gap-3 min-[1025px]:w-auto">
        <QuickActions actions={dashboardActions} />
        {/* Headmaster class/form selection is available on the Attendance and Homework pages. */}
      </div>
    </header>
    {isAdminDashboard && <div className="admin-dashboard-context"><AdminDashboardYearSelector variant="family" /></div>}
    {isAdminDashboard && <AdminOverviewStrip />}
    <Section title={role === "student" ? "My learning snapshot" : role === "super_admin" ? "Platform overview" : "Today’s operations"}><MetricGroup role={role} /></Section>
    {isStudent && <Section title="Class & Subjects"><ClassListPanel title="Class & Subjects" max={8} studentView hideViewAll /></Section>}
    {role === "super_admin" && <Section title="System health" action={{ label: "System settings", to: "/users" }}><SystemHealthPanel /></Section>}
    <div className="operations-priority-grid">
      <Section title={role === "student" ? "Next actions" : role === "super_admin" ? "Risk signals" : "Attention required"}><AttentionRequired role={role} /></Section>
      <Section title="Attendance today" action={{ label: "Attendance", to: "/attendance" }}><AttendanceTodayPanel role={role} /></Section>
    </div>
    <div className="operations-main-grid">
      <Section title={isStudent ? "Today's schedule" : "Upcoming schedule"} action={{ label: "Calendar", to: "/calendar" }} className={isStudent ? "student-schedule-section" : ""}>{isStudent ? <TodaySchedule /> : <UpcomingEvents />}</Section>
      {!isStudent && <Section title="School calendar" action={{ label: "Open calendar", to: "/calendar" }}><TodaySchedule /></Section>}
    </div>
    {role !== "super_admin" && <div className="operations-analytics-grid">
      {isStudent ? <>
        <Section title="Attendance over time" action={{ label: "Attendance", to: "/attendance" }}><AttendanceOverviewChart personal /></Section>
        <Section title="Student performance" action={{ label: "Results", to: "/reports" }}><PerformanceChart personal /></Section>
      </> : <>
        <Section title="Academic performance" action={{ label: "Results", to: "/grades" }}><PerformanceChart showSubjectRanking /></Section>
        <Section title="Attendance trend" action={{ label: "Attendance", to: "/attendance" }}><AttendanceOverviewChart /></Section>
      </>}
    </div>}
    {!isHeadmaster && <div className="operations-main-grid">
      {role !== "super_admin" && <Section title={isStudent ? "Recent results" : role === "secondary_headmaster" ? "Form directory" : "Class directory"} action={{ label: isStudent ? "View report" : classDirectoryLabel, to: isStudent ? "/reports" : "/classes" }}>{isStudent ? <RecentResults max={5} /> : <ClassListPanel variant="recent" showTeacher max={5} />}</Section>}
      <Section title={role === "super_admin" ? "Administrative activity" : "Recent activity"} action={{ label: role === "super_admin" ? "Full audit log" : "Activity", to: role === "super_admin" ? "/admin/audit-logs" : "/activity" }}>{role === "super_admin" ? <SystemActivity max={6} /> : <RecentActivity types={isStudent ? ["announcement", "assignment"] : undefined} />}</Section>
    </div>}
  </div>;
}
