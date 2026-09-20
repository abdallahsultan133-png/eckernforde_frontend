import { AdminWorkspace, StudentWorkspace, SuperAdminWorkspace, TeacherWorkspace } from "./role-workspaces";

export default function SchoolWorkspace({ role }: { role: "student" | "teacher" | "admin" | "super_admin" }) {
  switch (role) {
    case "student": return <StudentWorkspace />;
    case "teacher": return <TeacherWorkspace />;
    case "admin": return <AdminWorkspace />;
    case "super_admin": return <SuperAdminWorkspace />;
  }
}
