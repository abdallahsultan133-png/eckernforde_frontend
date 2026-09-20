import { useGetIdentity } from "@refinedev/core";
import { UserRole, type User } from "@/types";
import MarkAttendance from "@/pages/attendance/mark.tsx";
import AttendanceReport from "@/pages/attendance/report.tsx";
import { ParentAcademicSelector } from "@/pages/parent/academic-selector";
import { PageContainer } from "@/components/layout/page-container";
import { Skeleton } from "@/components/ui/skeleton";

// Teachers/admins mark attendance here; everyone else (students, parents) only
// has read access on the backend, so they get the report view instead of a
// form they can't submit.
const AttendanceIndex = () => {
    const { data: identity, isLoading } = useGetIdentity<User>();

    if (isLoading) {
        return (
            <PageContainer aria-busy="true" aria-label="Loading attendance workspace">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-12 w-full" />
                <div className="space-y-2">{Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-14 w-full" />)}</div>
            </PageContainer>
        );
    }

    const isStaff = identity?.role === UserRole.TEACHER || identity?.role === UserRole.ADMIN || identity?.role === UserRole.SUPER_ADMIN;

    if (identity?.role === UserRole.PARENT) return <ParentAcademicSelector mode="attendance" />;
    return isStaff ? <MarkAttendance /> : <AttendanceReport />;
};

export default AttendanceIndex;
