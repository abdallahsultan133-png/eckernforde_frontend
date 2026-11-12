import { OperationsDashboard } from "@/components/dashboard/operations-dashboard";
import { AdminDashboardYearProvider } from "@/components/dashboard/admin-dashboard-year";
import "@/components/dashboard/operations-dashboard.css";

export function StudentWorkspace() {
  return <OperationsDashboard role="student" />;
}

export function TeacherWorkspace() {
  return <OperationsDashboard role="teacher" />;
}

export function HeadmasterWorkspace({ role }: { role: "primary_headmaster" | "secondary_headmaster" }) {
  return <AdminDashboardYearProvider role={role}><OperationsDashboard role={role} /></AdminDashboardYearProvider>;
}

export function SuperAdminWorkspace() {
  return <AdminDashboardYearProvider><OperationsDashboard role="super_admin" /></AdminDashboardYearProvider>;
}
