import { useGetIdentity } from "@refinedev/core";

import { PageHeader } from "@/components/layout/page-header.tsx";
import { PageContainer } from "@/components/layout/page-container.tsx";
import { AttendanceOverviewChart } from "@/components/dashboard/attendance-overview-chart.tsx";
import { PerformanceChart } from "@/components/dashboard/performance-chart.tsx";
import { ClassActivityChart } from "@/components/dashboard/class-activity-chart.tsx";
import { isStaff } from "@/lib/roles.ts";
import { UserRole, type User } from "@/types";
import { AdminDashboardYearProvider, AdminDashboardYearSelector, HeadmasterDashboardClassFormSelector } from "@/components/dashboard/admin-dashboard-year";

/**
 * A dedicated home for the analytics that were only ever glimpsed on the
 * dashboard. Every panel is one of the existing dashboard charts given room to
 * breathe; each is fed by a role-scoped `/dashboard/*` endpoint (a teacher sees
 * their classes, a student their own record, an admin the whole school), so
 * nothing here is broader than what the viewer is already allowed to see.
 */
const InsightsPage = () => {
  const { data: identity } = useGetIdentity<User>();
  const isHeadmaster = identity?.role === UserRole.PRIMARY_HEADMASTER || identity?.role === UserRole.SECONDARY_HEADMASTER;
  const isSuperAdmin = identity?.role === UserRole.SUPER_ADMIN;
  const dashboardRole = isHeadmaster ? identity?.role as "primary_headmaster" | "secondary_headmaster" : isSuperAdmin ? "super_admin" : undefined;
  return <AdminDashboardYearProvider role={dashboardRole}><InsightsContent identity={identity} /></AdminDashboardYearProvider>;
};

const InsightsContent = ({ identity }: { identity?: User }) => {
  const staff = isStaff(identity?.role);
  const student = identity?.role === UserRole.STUDENT;
  const isHeadmaster = identity?.role === UserRole.PRIMARY_HEADMASTER || identity?.role === UserRole.SECONDARY_HEADMASTER;
  const isSuperAdmin = identity?.role === UserRole.SUPER_ADMIN;
  const scopedAdmin = isHeadmaster || isSuperAdmin;

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
            {isSuperAdmin && <AdminDashboardYearSelector />}
            {isHeadmaster && <HeadmasterDashboardClassFormSelector role={identity!.role as "primary_headmaster" | "secondary_headmaster"} />}
            {isSuperAdmin && <HeadmasterDashboardClassFormSelector role="super_admin" />}
          </>
        }
      />

      <AttendanceOverviewChart personal={student} showExplanation scopeByStage={scopedAdmin} />

      <div className="grid gap-4 lg:grid-cols-2">
        <PerformanceChart personal={student} showSubjectRanking={scopedAdmin} requireClassOrForm={scopedAdmin} />
        <ClassActivityChart personal={student} scopeByStage={scopedAdmin} />
      </div>
    </PageContainer>
  );
};

export default InsightsPage;
