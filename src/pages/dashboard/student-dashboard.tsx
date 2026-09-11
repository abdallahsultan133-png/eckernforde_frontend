import {
    Building2,
    FileText,
    ClipboardCheck,
    BarChart3,
    Megaphone,
} from "lucide-react";
import { AttendanceOverviewChart } from "@/components/dashboard/attendance-overview-chart";
import { PerformanceChart } from "@/components/dashboard/performance-chart";
import { ClassActivityChart } from "@/components/dashboard/class-activity-chart";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { StatCard } from "@/components/dashboard/stat-card";
import { QuickActions, type QuickAction } from "@/components/dashboard/quick-actions";
import { DashboardGreeting } from "@/components/dashboard/dashboard-greeting";
import { UpcomingAssignments } from "@/components/dashboard/upcoming-assignments";
import { RecentResults } from "@/components/dashboard/recent-results";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiQuery } from "@/hooks/use-api-query.ts";

type StudentStats = {
    classes: number;
    attendanceRate: number | null;
    pendingAssignments?: number;
    trends: {
        attendanceRate?: number | null;
    };
};

const QUICK_ACTIONS: QuickAction[] = [
    { label: "View Assignments", href: "/assignments", icon: FileText },
    { label: "Term Results", href: "/grades/term-results", icon: BarChart3 },
    { label: "Attendance", href: "/attendance", icon: ClipboardCheck },
    { label: "Announcements", href: "/announcements", icon: Megaphone },
];

const StudentDashboard = () => {
    const { data: stats, isLoading } = useApiQuery<StudentStats>("/dashboard/stats");

    const hasAttendanceRate = stats?.attendanceRate !== null && stats?.attendanceRate !== undefined;
    const pending = stats?.pendingAssignments ?? 0;

    const statCards = [
        {
            title: "Assignments Due",
            value: pending,
            icon: FileText,
            color: (pending > 0 ? "amber" : "green") as "amber" | "green",
            description: pending > 0 ? "Not yet submitted" : "Nothing outstanding",
        },
        {
            title: "Attendance (30d)",
            value: hasAttendanceRate ? `${stats!.attendanceRate}%` : "—",
            icon: ClipboardCheck,
            color: (hasAttendanceRate && (stats?.attendanceRate ?? 0) >= 75 ? "green" : "amber") as "green" | "amber",
            description: "Your attendance",
            percent: hasAttendanceRate ? stats!.attendanceRate! : undefined,
            trendValue: stats?.trends.attendanceRate,
        },
        { title: "Report Cards", value: "—", icon: BarChart3, color: "blue" as const, description: "Open Grades to view results" },
        { title: "My Classes", value: stats?.classes ?? 0, icon: Building2, color: "purple" as const, description: "Currently enrolled" },
    ];

    return (
        <div className="space-y-6">
            <DashboardGreeting subtitle="What's due, your latest results, and how you're tracking." />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
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

            {/* Every endpoint below is scoped to this student server-side. */}
            <div className="grid gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <UpcomingAssignments personal />
                </div>
                <RecentResults />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <AttendanceOverviewChart personal />
                <PerformanceChart personal />
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <ClassActivityChart personal />
                </div>
                <RecentActivity />
            </div>

            <QuickActions actions={QUICK_ACTIONS} description="Get to your classwork faster." />
        </div>
    );
};

export default StudentDashboard;
