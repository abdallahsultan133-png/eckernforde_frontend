import { Link } from "react-router";
import { useGetIdentity } from "@refinedev/core";
import { ClipboardList } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header.tsx";
import { PageContainer } from "@/components/layout/page-container.tsx";
import { Button } from "@/components/ui/button.tsx";
import { AttendanceOverviewChart } from "@/components/dashboard/attendance-overview-chart.tsx";
import { PerformanceChart } from "@/components/dashboard/performance-chart.tsx";
import { ClassActivityChart } from "@/components/dashboard/class-activity-chart.tsx";
import { isStaff } from "@/lib/roles.ts";
import { UserRole, type User } from "@/types";

/**
 * A dedicated home for the analytics that were only ever glimpsed on the
 * dashboard. Every panel is one of the existing dashboard charts given room to
 * breathe; each is fed by a role-scoped `/dashboard/*` endpoint (a teacher sees
 * their classes, a student their own record, an admin the whole school), so
 * nothing here is broader than what the viewer is already allowed to see.
 */
const InsightsPage = () => {
  const { data: identity } = useGetIdentity<User>();
  const staff = isStaff(identity?.role);
  const student = identity?.role === UserRole.STUDENT;

  return (
    <PageContainer>
      <PageHeader
        breadcrumb
        title="Academic insights"
        description={
          staff
            ? "Role-scoped attendance, grade distribution, and subject activity from recorded school data."
            : "Your recorded attendance and published academic performance over time."
        }
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link to="/attendance/report">
                <ClipboardList className="mr-1.5 h-4 w-4" />
                Attendance report
              </Link>
            </Button>
          </>
        }
      />

      <AttendanceOverviewChart personal={student} showExplanation />

      <div className="grid gap-4 lg:grid-cols-2">
        <PerformanceChart personal={student} showClassRanking={staff} />
        <ClassActivityChart personal={student} />
      </div>
    </PageContainer>
  );
};

export default InsightsPage;
