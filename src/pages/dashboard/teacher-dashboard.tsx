import {
    Users,
    Building2,
    ClipboardCheck,
    CheckCircle2,
    FileText,
    Megaphone,
    BarChart3,
    Sparkles,
    ClipboardList,
} from "lucide-react";
import { AttendanceOverviewChart } from "@/components/dashboard/attendance-overview-chart";
import { PerformanceChart } from "@/components/dashboard/performance-chart";
import { ClassActivityChart } from "@/components/dashboard/class-activity-chart";
import { UpcomingEvents } from "@/components/dashboard/upcoming-events";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { StatCard } from "@/components/dashboard/stat-card";
import { QuickActions, type QuickAction } from "@/components/dashboard/quick-actions";
import { DashboardGreeting } from "@/components/dashboard/dashboard-greeting";
import { UpcomingAssignments } from "@/components/dashboard/upcoming-assignments";
import { ClassListPanel } from "@/components/dashboard/class-list-panel";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiQuery } from "@/hooks/use-api-query.ts";

type TeacherStats = {
    students: number;
    classes: number;
    subjects: number;
    attendanceRate: number | null;
    pendingGrading: number;
    assignmentCompletionRate: number | null;
    trends: {
        classes?: number | null;
        subjects?: number | null;
        attendanceRate?: number | null;
    };
};

const QUICK_ACTIONS: QuickAction[] = [
    { label: "Mark Attendance", href: "/attendance", icon: ClipboardCheck },
    { label: "Create Assignment", href: "/assignments/create", icon: FileText },
    { label: "Record Term Results", href: "/grades/term-results/record", icon: BarChart3 },
    { label: "Post Announcement", href: "/announcements/create", icon: Megaphone },
    { label: "AI Student Assistant", href: "/ai-assistant", icon: Sparkles },
];

const TeacherDashboard = () => {
    const { data: stats, isLoading } = useApiQuery<TeacherStats>("/dashboard/stats");

    const hasAttendanceRate = stats?.attendanceRate !== null && stats?.attendanceRate !== undefined;
    const hasCompletionRate = stats?.assignmentCompletionRate !== null && stats?.assignmentCompletionRate !== undefined;
    const pendingGrading = stats?.pendingGrading ?? 0;

    const statCards = [
        { title: "My Classes", value: stats?.classes ?? 0, icon: Building2, color: "purple" as const, description: "You teach", trendValue: stats?.trends.classes },
        { title: "My Students", value: stats?.students ?? 0, icon: Users, color: "blue" as const, description: "Enrolled in your classes" },
        {
            title: "Assignment Completion",
            value: hasCompletionRate ? `${stats!.assignmentCompletionRate}%` : "—",
            icon: CheckCircle2,
            color: "green" as const,
            description: "Submitted vs. expected",
            percent: hasCompletionRate ? stats!.assignmentCompletionRate! : undefined,
        },
        {
            title: "Attendance (30d)",
            value: hasAttendanceRate ? `${stats!.attendanceRate}%` : "—",
            icon: ClipboardCheck,
            color: (hasAttendanceRate && (stats?.attendanceRate ?? 0) >= 75 ? "green" : "amber") as "green" | "amber",
            description: "Average across your classes",
            percent: hasAttendanceRate ? stats!.attendanceRate! : undefined,
            trendValue: stats?.trends.attendanceRate,
        },
        {
            title: "Awaiting Grading",
            value: pendingGrading,
            icon: ClipboardList,
            color: (pendingGrading > 0 ? "red" : "green") as "red" | "green",
            description: pendingGrading > 0 ? "Submissions to review" : "You're all caught up",
        },
    ];

    return (
        <div className="space-y-6">
            <DashboardGreeting subtitle="Your classes, your grading queue, and what's due." />

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
                            trendValue={"trendValue" in item ? item.trendValue : undefined}
                        />
                    ))
                )}
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <UpcomingAssignments />
                </div>
                <ClassListPanel />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <AttendanceOverviewChart />
                <PerformanceChart showClassRanking />
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <ClassActivityChart />
                </div>
                <RecentActivity />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <UpcomingEvents />
                <QuickActions
                    actions={QUICK_ACTIONS}
                    description="Mark attendance, create assignments, and keep your classes moving."
                    highlight={
                        !isLoading && pendingGrading > 0
                            ? { message: `${pendingGrading} submission${pendingGrading === 1 ? "" : "s"} waiting to be graded`, href: "/assignments" }
                            : undefined
                    }
                />
            </div>
        </div>
    );
};

export default TeacherDashboard;
