import { type ReactNode } from "react";
import { Link } from "react-router";
import {
  AlertTriangle,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FilePlus2,
  GraduationCap,
  Megaphone,
  ShieldCheck,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";

import { AcademicContext } from "./academic-context";
import { AcademicProgress } from "./academic-progress";
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

type Role = "student" | "teacher" | "admin" | "super_admin";

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

const copy: Record<Role, { title: string; subtitle: string; actions: Action[] }> = {
  admin: {
    title: "School operations",
    subtitle: "Keep today’s attendance, people, classes, and communication moving smoothly.",
    actions: [
      { label: "Manage students", to: "/users", icon: UserPlus },
      { label: "Create class", to: "/classes/create", icon: GraduationCap },
      { label: "Post announcement", to: "/announcements/create", icon: Megaphone },
      { label: "Academic calendar", to: "/admin/academic-calendar", icon: CalendarDays },
    ],
  },
  super_admin: {
    title: "Command center",
    subtitle: "See the health of the school platform and move quickly on high-level administration.",
    actions: [
      { label: "Manage accounts", to: "/users", icon: Users },
      { label: "Academic calendar", to: "/admin/academic-calendar", icon: CalendarDays },
      { label: "System settings", to: "/users", icon: CheckCircle2 },
    ],
  },
  teacher: {
    title: "Teaching day",
    subtitle: "Start with attendance and student work, then plan the rest of your day.",
    actions: [
      { label: "Take attendance", to: "/attendance", icon: ClipboardCheck },
      { label: "Create assignment", to: "/assignments/create", icon: FilePlus2 },
      { label: "Enter results", to: "/grades/term-results/record", icon: BookOpenCheck },
      { label: "Review submissions", to: "/assignments?filter=needs-grading", icon: CheckCircle2 },
      { label: "Post announcement", to: "/announcements/create", icon: Megaphone },
    ],
  },
  student: {
    title: "My school day",
    subtitle: "See what is scheduled, what is due, and how your learning is progressing.",
    actions: [
      { label: "View assignments", to: "/assignments", icon: ClipboardCheck },
      { label: "View timetable", to: "/calendar", icon: CalendarDays },
      { label: "View results", to: "/grades/term-results", icon: BookOpenCheck },
      { label: "Report card", to: "/grades/report-card", icon: GraduationCap },
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
  const { data, isLoading, isError, refetch } = useApiQuery<DashboardStats>("/dashboard/stats");
  if (isLoading) return <div className="operations-metrics" aria-busy="true">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-20 rounded-none" />)}</div>;
  if (isError) return <ErrorState description="Unable to load operational summary." onRetry={refetch} />;
  const metrics = role === "student"
    ? [
        ["My classes", data?.classes],
        ["Subjects", data?.subjects],
        ["Attendance · 30 days", data?.attendanceRate == null ? "Not recorded" : `${data.attendanceRate}%`],
        ["Open assignments", data?.pendingAssignments],
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

function AttendanceTodayPanel({ role }: { role: Role }) {
  const { data, isLoading, isError, refetch } = useApiQuery<AttendanceToday>("/dashboard/attendance-today");
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
  const { data: stats, isLoading: statsLoading, isError: statsError, refetch: retryStats } = useApiQuery<DashboardStats>("/dashboard/stats");
  const { data: attendance, isLoading: attendanceLoading, isError: attendanceError, refetch: retryAttendance } = useApiQuery<AttendanceToday>("/dashboard/attendance-today");
  if (statsLoading || attendanceLoading) return <Skeleton className="h-44 w-full" />;
  if (statsError || attendanceError) return <ErrorState description="Unable to load the action queue." onRetry={() => { retryStats(); retryAttendance(); }} />;
  const items = role === "teacher"
    ? [
        ...(attendance?.unrecordedClasses ?? []).map((item) => ({ label: `Attendance not recorded for ${item.name}`, meta: "Record attendance for this class", to: "/attendance", tone: "warning" as const })),
        ...(stats?.pendingGrading ? [{ label: `${stats.pendingGrading} submission${stats.pendingGrading === 1 ? "" : "s"} awaiting grading`, meta: "Review student work", to: "/assignments?filter=needs-grading", tone: "info" as const }] : []),
      ]
    : role === "student"
      ? (stats?.pendingAssignments ? [{ label: `${stats.pendingAssignments} assignment${stats.pendingAssignments === 1 ? "" : "s"} still open`, meta: "Review due dates and submit your work", to: "/assignments", tone: "warning" as const }] : [])
      : [
          ...((attendance?.absent ?? 0) > 0 ? [{ label: `${attendance?.absent} absence${attendance?.absent === 1 ? "" : "s"} recorded today`, meta: "Review attendance records", to: "/attendance", tone: "critical" as const }] : []),
          ...((attendance?.late ?? 0) > 0 ? [{ label: `${attendance?.late} late arrival${attendance?.late === 1 ? "" : "s"} recorded today`, meta: "Review attendance records", to: "/attendance", tone: "warning" as const }] : []),
        ];
  return items.length ? <ul className="attention-list">{items.map((item) => <li key={item.label}><AlertTriangle aria-hidden="true" /><span><strong>{item.label}</strong><small>{item.meta}</small></span><StatusBadge tone={item.tone}>Review</StatusBadge><Link to={item.to} aria-label={`Review: ${item.label}`} /></li>)}</ul> : <div className="operations-empty"><CheckCircle2 aria-hidden="true" /><p><strong>Nothing requires attention right now.</strong><span>{role === "teacher" ? "Your attendance and grading queue are clear." : role === "student" ? "You have no open assignments in your dashboard summary." : "No attendance exceptions are recorded for today."}</span></p></div>;
}

function QuickActions({ actions }: { actions: Action[] }) {
  return <nav className="operations-actions" aria-label="Common actions">{actions.map(({ label, to, icon: Icon }) => <Link key={to} to={to}><Icon aria-hidden="true" /><span>{label}</span></Link>)}</nav>;
}

/* function StudentAcademicLinks() {
  const links: Action[] = [
    { label: "Midterm & terminal results", to: "/grades/term-results", icon: BookOpenCheck },
    { label: "Report card", to: "/grades/report-card", icon: GraduationCap },
    { label: "Academic history", to: "/portal/academic-history", icon: CalendarDays },
  ];
  return <div className="student-academic-links">{links.map(({ label, to, icon: Icon }) => <Link key={to} to={to}><span className="student-academic-links__icon"><Icon className="h-4 w-4" /></span><span>{label}</span><span aria-hidden="true">→</span></Link>)}</div>;
} */

/** A teacher's dashboard is a workboard, not a smaller version of the school office. */
function TeacherWorkboard() {
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

    <Section title="My classes" action={{ label: "All classes", to: "/classes" }}><ClassListPanel max={6} /></Section>

    <div className="teacher-analytics-grid">
      <Section title="Final grade distribution" action={{ label: "Open results", to: "/grades" }}><PerformanceChart showClassRanking /></Section>
      <Section title="Attendance trend" action={{ label: "Attendance", to: "/attendance" }}><AttendanceOverviewChart /></Section>
    </div>

    <Section title="School notices" action={{ label: "All activity", to: "/activity" }} className="teacher-noticeboard"><RecentActivity types={["announcement"]} /></Section>
  </div>;
}

export function OperationsDashboard({ role }: { role: Role }) {
  if (role === "teacher") return <TeacherWorkboard />;
  const current = copy[role];
  const isStudent = role === "student";
  return <div className={`operations-dashboard operations-dashboard--${role}`}>
    <header className={`operations-header operations-header--${role}`}>
      <div><p className="operations-kicker">Dashboard <span aria-hidden="true">/</span> {current.title}</p><DashboardGreeting subtitle={current.subtitle} /><AcademicContext /></div>
      <QuickActions actions={current.actions} />
    </header>
    <Section title={role === "student" ? "My learning snapshot" : role === "super_admin" ? "Platform overview" : "Today’s operations"}><MetricGroup role={role} /></Section>
    {isStudent && <Section title="Classes and subjects studied"><ClassListPanel max={8} /></Section>}
    {role === "super_admin" && <Section title="System health" action={{ label: "System settings", to: "/users" }}><SystemHealthPanel /></Section>}
    <div className="operations-priority-grid">
      <Section title={role === "student" ? "Next actions" : role === "super_admin" ? "Risk signals" : "Attention required"}><AttentionRequired role={role} /></Section>
      <Section title="Attendance today" action={{ label: "Attendance", to: "/attendance" }}><AttendanceTodayPanel role={role} /></Section>
    </div>
    <div className="operations-main-grid">
      <Section title={isStudent ? "Today's schedule" : "Upcoming schedule"} action={{ label: "Calendar", to: "/calendar" }}>{isStudent ? <TodaySchedule /> : <UpcomingEvents />}</Section>
      {!isStudent && <Section title="School calendar" action={{ label: "Open calendar", to: "/calendar" }}><TodaySchedule /></Section>}
    </div>
    <div className="operations-analytics-grid">
      <Section title={isStudent ? "Academic progress" : "Academic performance"} action={{ label: "Results", to: "/grades" }}>{isStudent ? <AcademicProgress /> : <PerformanceChart showClassRanking />}</Section>
      <Section title={isStudent ? "Attendance over time" : "Attendance trend"} action={{ label: "Attendance", to: "/attendance" }}><AttendanceOverviewChart personal={isStudent} /></Section>
    </div>
    <div className="operations-main-grid">
      <Section title={isStudent ? "Recent results" : role === "super_admin" ? "School directory" : "Class directory"} action={{ label: isStudent ? "All grades" : "All classes", to: isStudent ? "/grades" : "/classes" }}>{isStudent ? <RecentResults max={5} /> : <ClassListPanel variant="recent" showTeacher max={5} />}</Section>
      <Section title={role === "super_admin" ? "Administrative activity" : "Recent activity"} action={{ label: role === "super_admin" ? "Full audit log" : "Activity", to: role === "super_admin" ? "/admin/audit-logs" : "/activity" }}>{role === "super_admin" ? <SystemActivity max={6} /> : <RecentActivity types={isStudent ? ["announcement", "assignment"] : undefined} />}</Section>
    </div>
  </div>;
}
