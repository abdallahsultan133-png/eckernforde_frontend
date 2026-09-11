import { useGetIdentity } from "@refinedev/core";
import { Loader2 } from "lucide-react";
import { UserRole, type User } from "@/types";
import MarkAttendance from "@/pages/attendance/mark.tsx";
import AttendanceReport from "@/pages/attendance/report.tsx";

// Teachers/admins mark attendance here; everyone else (students, parents) only
// has read access on the backend, so they get the report view instead of a
// form they can't submit.
const AttendanceIndex = () => {
    const { data: identity, isLoading } = useGetIdentity<User>();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const isStaff = identity?.role === UserRole.TEACHER || identity?.role === UserRole.ADMIN || identity?.role === UserRole.SUPER_ADMIN;

    return isStaff ? <MarkAttendance /> : <AttendanceReport />;
};

export default AttendanceIndex;
