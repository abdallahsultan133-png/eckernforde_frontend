import { useState, type ReactNode } from "react";
import { Link } from "react-router";
import { BookOpenCheck, CalendarDays, ClipboardCheck, FileText, GraduationCap } from "lucide-react";

import { AcademicProgress } from "@/components/dashboard/academic-progress";
import { ChildAssignments } from "@/components/dashboard/child-assignments";
import { DashboardGreeting } from "@/components/dashboard/dashboard-greeting";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiQuery } from "@/hooks/use-api-query";
import "@/components/dashboard/operations-dashboard.css";

type Child = {
  id: string;
  name: string;
  profile: { registrationNumber: string | null } | null;
  enrolledClasses: { id: number; name: string; subject?: { id: number | null; name: string | null } | null }[];
  grades: { classId: number; finalGrade: number | null; letterGrade: string | null }[];
  attendanceSummary: { total: number; present: number; rate: number | null };
};

function Section({ title, action, children }: { title: string; action?: { label: string; to: string }; children: ReactNode }) {
  return <section className="operations-section" aria-label={title}><header className="operations-section-heading"><h2>{title}</h2>{action && <Link to={action.to}>{action.label} <span aria-hidden="true">→</span></Link>}</header>{children}</section>;
}

export default function FamilyWorkspace() {
  const { data, isLoading, isError, refetch } = useApiQuery<{ data: Child[] }>("/profile/my-children");
  const [selectedId, setSelectedId] = useState("");
  const children = data?.data ?? [];
  const child = children.find((item) => item.id === selectedId) ?? children[0];

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-28 w-full" /><Skeleton className="h-44 w-full" /><div className="grid gap-4 md:grid-cols-2"><Skeleton className="h-72" /><Skeleton className="h-72" /></div></div>;
  if (isError) return <ErrorState description="Unable to load your family records." onRetry={refetch} />;
  if (!child) return <EmptyState icon={GraduationCap} title="No children linked yet" description="Contact the school office to check your family account." />;

  const attendance = child.attendanceSummary.rate == null ? "Not recorded" : `${child.attendanceSummary.rate}%`;
  const recordedResults = child.grades.filter((grade) => grade.finalGrade !== null).length;
  const failing = child.grades.filter((grade) => grade.letterGrade === "F").length;
  return <div className="operations-dashboard family-workspace">
    <header className="operations-header"><div><p className="operations-kicker">Family workspace <span aria-hidden="true">/</span> My children</p><DashboardGreeting subtitle="Review each child's attendance, coursework, classes and published academic record." /></div><nav className="operations-actions" aria-label="Parent actions"><Link to="/calendar"><CalendarDays aria-hidden="true" />School calendar</Link><Link to="/parent/attendance"><ClipboardCheck aria-hidden="true" />Attendance</Link><Link to="/parent/assignments"><FileText aria-hidden="true" />Assignments</Link></nav></header>
    <section className="operations-section"><div className="family-selector"><label htmlFor="dashboard-child">Viewing records for</label><select id="dashboard-child" value={child.id} onChange={(event) => setSelectedId(event.target.value)}>{children.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><Link to={`/students/${child.id}`}>Open student profile →</Link></div><div className="family-student-heading"><h2>{child.name}</h2><p>{child.profile?.registrationNumber ? `Student ID: ${child.profile.registrationNumber}` : "Linked student"}</p></div><dl className="operations-metrics"><div><dt>Attendance</dt><dd>{attendance}</dd></div><div><dt>Recorded sessions</dt><dd>{child.attendanceSummary.total}</dd></div><div><dt>Published results</dt><dd>{recordedResults}</dd></div><div><dt>Current classes</dt><dd>{child.enrolledClasses.length}</dd></div></dl></section>
    <div className="operations-priority-grid"><Section title="Attention required">{failing ? <div className="operations-empty"><GraduationCap aria-hidden="true" /><p><strong>{failing} result{failing === 1 ? "" : "s"} at grade F.</strong><span>Open the report card to review the published record.</span></p></div> : <div className="operations-empty"><BookOpenCheck aria-hidden="true" /><p><strong>No recorded result needs attention.</strong><span>This reflects published final grades only.</span></p></div>}</Section><Section title="Attendance" action={{ label: "Review record", to: "/parent/attendance" }}><div className="attendance-snapshot"><div className="attendance-snapshot-total"><span>Recorded attendance</span><strong>{attendance}</strong><small>{child.attendanceSummary.present} present from {child.attendanceSummary.total} recorded sessions</small></div><Link to="/parent/attendance" className="operations-inline-link">Choose child and year →</Link></div></Section></div>
    <div className="operations-main-grid"><Section title="Classes and subjects studied"><div className="divide-y border-y">{child.enrolledClasses.length === 0 ? <p className="p-4 text-sm text-muted-foreground">No classes recorded for this child.</p> : child.enrolledClasses.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 px-3 py-3"><div><p className="text-sm font-medium">{item.name}</p><p className="text-xs text-muted-foreground">{item.subject?.name ?? "Subject not recorded"}</p></div><GraduationCap className="h-4 w-4 text-muted-foreground" aria-hidden="true" /></div>)}</div></Section><Section title="Assignments" action={{ label: "Review coursework", to: "/parent/assignments" }}><ChildAssignments classes={child.enrolledClasses} /></Section></div>
    <div className="operations-main-grid"><Section title="Academic progress" action={{ label: "Open report card", to: `/grades/report-card/${child.id}` }}><AcademicProgress studentId={child.id} /></Section><Section title="Student profile"><div className="student-academic-links"><Link to={`/students/${child.id}`}><span className="student-academic-links__icon"><GraduationCap className="h-4 w-4" /></span><span>Open student profile</span><span aria-hidden="true">→</span></Link></div></Section></div>
  </div>;
}
