import { useGetIdentity } from "@refinedev/core";
import { Skeleton } from "@/components/ui/skeleton";
import { UserRole, type User } from "@/types";
import SchoolWorkspace from "@/pages/dashboard/school-workspace";
import FamilyWorkspace from "@/pages/dashboard/family-workspace";

const Dashboard = () => {
    const { data: identity, isLoading } = useGetIdentity<User>();

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-8 w-64" />
                <div className="grid gap-px border md:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-64 w-full rounded-none" />
                    ))}
                </div>
            </div>
        );
    }

    switch (identity?.role) {
        case UserRole.TEACHER:
            return <SchoolWorkspace role="teacher" />;
        case UserRole.STUDENT:
            return <SchoolWorkspace role="student" />;
        case UserRole.PARENT:
            return <FamilyWorkspace />;
        case UserRole.ADMIN:
            return <SchoolWorkspace role="admin" />;
        case UserRole.SUPER_ADMIN:
            return <SchoolWorkspace role="super_admin" />;
        default:
            return <p>Your dashboard is unavailable. Please sign in again.</p>;
    }
};

export default Dashboard;
