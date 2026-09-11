import {
    Users,
    UserRoundCheck,
    Building2,
    ClipboardCheck,
    UserPlus,
    School,
    BookOpen,
    Megaphone,
    Shield,
    Sparkles,
    Inbox,
    CalendarDays,
    Globe2,
    CheckCircle2,
} from "lucide-react";
import { AttendanceOverviewChart } from "@/components/dashboard/attendance-overview-chart";
import { PerformanceChart } from "@/components/dashboard/performance-chart";
import { ClassActivityChart } from "@/components/dashboard/class-activity-chart";
import { UpcomingEvents } from "@/components/dashboard/upcoming-events";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { SystemActivity } from "@/components/dashboard/system-activity";
import { ClassListPanel } from "@/components/dashboard/class-list-panel";
import { StatCard } from "@/components/dashboard/stat-card";
import { QuickActions, type QuickAction } from "@/components/dashboard/quick-actions";
import { DashboardGreeting } from "@/components/dashboard/dashboard-greeting";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiQuery } from "@/hooks/use-api-query.ts";

type AdminStats = {
    students: number;
    teachers: number;
    classes: number;
    subjects: number;
    attendanceRate: number | null;
    pendingGrading: number;
    departments?: number;
    trends: {
        students?: number | null;
        teachers?: number | null;
        classes?: number | null;
        subjects?: number | null;
        attendanceRate?: number | null;
        departments?: number | null;
    };
};

const QUICK_ACTIONS: QuickAction[] = [
    { label: "Manage Users", href: "/users", icon: UserPlus },
    { label: "Create Class", href: "/classes/create", icon: School },
    { label: "Add Subject", href: "/subjects/create", icon: BookOpen },
    { label: "Departments", href: "/admin/departments", icon: Building2 },
    { label: "Admissions Enquiries", href: "/admin/admissions", icon: Inbox },
    { label: "Academic Calendar", href: "/admin/academic-calendar", icon: CalendarDays },
    { label: "Publications", href: "/admin/publications", icon: Globe2 },
    { label: "Public Events", href: "/admin/public-events", icon: CalendarDays },
    { label: "Publish Results", href: "/admin/publish-results", icon: CheckCircle2 },
    { label: "Send Announcement", href: "/announcements/create", icon: Megaphone },
    { label: "Audit Logs", href: "/admin/audit-logs", icon: Shield },
    { label: "AI Student Assistant", href: "/ai-assistant", icon: Sparkles },
];

const AdminDashboard = () => {
    const { data: stats, isLoading } = useApiQuery<AdminStats>("/dashboard/stats");

    const hasAttendanceRate = stats?.attendanceRate !== null && stats?.attendanceRate !== undefined;

    const statCards = [
        { title: "Students", value: stats?.students ?? 0, icon: Users, color: "blue" as const, description: "Total enrolled", trendValue: stats?.trends.students },
        { title: "Teachers", value: stats?.teachers ?? 0, icon: UserRoundCheck, color: "green" as const, description: "Active staff", trendValue: stats?.trends.teachers },
        { title: "Classes", value: stats?.classes ?? 0, icon: Building2, color: "purple" as const, description: "Running classes", trendValue: stats?.trends.classes },
        { title: "Departments", value: stats?.departments ?? 0, icon: School, color: "amber" as const, description: "Academic departments", trendValue: stats?.trends.departments },
        {
            title: "Attendance (30d)",
            value: hasAttendanceRate ? `${stats!.attendanceRate}%` : "—",
            icon: ClipboardCheck,
            color: (hasAttendanceRate && (stats?.attendanceRate ?? 0) >= 75 ? "green" : "amber") as "green" | "amber",
            description: "Average across all classes",
            percent: hasAttendanceRate ? stats!.attendanceRate! : undefined,
            trendValue: stats?.trends.attendanceRate,
        },
    ];

    return (
        <div className="space-y-6">
            <DashboardGreeting subtitle="Enrolment, attendance, performance, and activity across your school." />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-[92px] w-full rounded-xl" />
                    ))
                ) : (
                    statCards.map((item, index) => (
                        <StatCard
                            key={item.title}
                            title={item.title}
                            value={String(item.value)}
                            icon={item.icon}
                            color={item.color}
                            description={item.description}
                            index={index}
                            percent={"percent" in item ? item.percent : undefined}
                            trendValue={item.trendValue}
                        />
                    ))
                )}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <AttendanceOverviewChart />
                <PerformanceChart showClassRanking />
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <ClassActivityChart />
                </div>
                <SystemActivity />
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                <RecentActivity />
                <ClassListPanel variant="recent" showTeacher />
                <UpcomingEvents />
            </div>

            <QuickActions
                actions={QUICK_ACTIONS}
                description="Create classes, manage users, and oversee your school."
                highlight={
                    !isLoading && stats && stats.pendingGrading > 0
                        ? { message: `${stats.pendingGrading} submission${stats.pendingGrading === 1 ? "" : "s"} waiting to be graded`, href: "/assignments" }
                        : undefined
                }
            />
        </div>
    );
};

export default AdminDashboard;
