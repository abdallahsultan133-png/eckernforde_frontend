import { useGetIdentity } from "@refinedev/core";
import { Skeleton } from "@/components/ui/skeleton";
import { UserRole, type User } from "@/types";
import AdminDashboard from "@/pages/dashboard/admin-dashboard";
import TeacherDashboard from "@/pages/dashboard/teacher-dashboard";
import StudentDashboard from "@/pages/dashboard/student-dashboard";
import ParentDashboard from "@/pages/dashboard/parent-dashboard";

const Dashboard = () => {
    const { data: identity, isLoading } = useGetIdentity<User>();

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-64" />
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-[92px] w-full rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    switch (identity?.role) {
        case UserRole.TEACHER:
            return <TeacherDashboard />;
        case UserRole.STUDENT:
            return <StudentDashboard />;
        case UserRole.PARENT:
            return <ParentDashboard />;
        default:
            return <AdminDashboard />;
    }
};

export default Dashboard;
