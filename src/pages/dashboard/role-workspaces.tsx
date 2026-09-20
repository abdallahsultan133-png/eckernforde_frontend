import { OperationsDashboard } from "@/components/dashboard/operations-dashboard";
import "@/components/dashboard/operations-dashboard.css";

export function StudentWorkspace() {
  return <OperationsDashboard role="student" />;
}

export function TeacherWorkspace() {
  return <OperationsDashboard role="teacher" />;
}

export function AdminWorkspace() {
  return <OperationsDashboard role="admin" />;
}

export function SuperAdminWorkspace() {
  return <OperationsDashboard role="super_admin" />;
}
