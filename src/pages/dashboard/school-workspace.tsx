import { HeadmasterWorkspace, StudentWorkspace, SuperAdminWorkspace, TeacherWorkspace } from "./role-workspaces";

export default function SchoolWorkspace({ role }: { role: "student" | "teacher" | "primary_headmaster" | "secondary_headmaster" | "super_admin" }) {
  switch (role) {
    case "student": return <StudentWorkspace />;
    case "teacher": return <TeacherWorkspace />;
    case "primary_headmaster": return <HeadmasterWorkspace role="primary_headmaster" />;
    case "secondary_headmaster": return <HeadmasterWorkspace role="secondary_headmaster" />;
    case "super_admin": return <SuperAdminWorkspace />;
  }
}
