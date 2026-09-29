const pages: [string, string, string][] = [
  ["/portal/history", "Academic history", "Previous school years and published records"],
  ["/portal/setup", "Choose school context", "Select the level you are working in"],
  ["/portal", "Dashboard", "Your school day"],
  ["/parent/homework", "Homework", "Review your children's learning tasks and submissions"],
  ["/parent/homework/view", "Homework", "Review your children's learning tasks and submissions"],
  ["/parent/attendance", "Attendance", "Review your children's attendance records"],
  ["/parent/attendance/view", "Attendance", "Review your children's attendance records"],
  ["/parent/reports", "Reports", "Published academic reports"],
  ["/parent/reports/view", "Reports", "Published academic reports"],
  ["/parent", "Family records", "Your children's learning and progress"],
  ["/grades/report-card", "Report cards", "Published academic reports"],
  ["/grades/term-results/record", "Record results", "Midterm and terminal examinations"],
  ["/grades/term-results", "Term results", "Academic progress and divisions"],
  ["/grades/exams", "Examinations", "Assessment schedules and records"],
  ["/grades", "Homework Grade Book", "Homework assessment and feedback"],
  ["/attendance/report", "Attendance reports", "Attendance history and summaries"],
  ["/attendance/qr", "Attendance QR", "Create a secure class attendance session"],
  ["/attendance", "Attendance", "School attendance records"],
  ["/homework/create", "Create homework", "Set learning work for your class"],
  ["/homework", "Homework", "Learning tasks and submissions"],
  ["/classes/create", "Create class", "Organize teaching and enrollment"],
  ["/classes", "Classes", "Your school learning spaces"],
  ["/subjects", "Subjects", "Curriculum and learning"],
  ["/calendar", "Calendar", "Lessons, deadlines and school events"],
  ["/notifications", "Notifications", "Updates that need your attention"],
  ["/announcements", "Announcements", "News from your school community"],
  ["/messages", "Messages", "School conversations"],
  ["/guardians", "Parents & guardians", "Family portal accounts and child relationships"],
  ["/teachers", "Teachers", "Teaching accounts and access"],
  ["/students", "Students", "Student accounts and academic records"],
  ["/users", "Users & access", "School accounts and permissions"],
  ["/profile", "My profile", "Your account and personal information"],
  ["/profile#security", "Settings", "Account preferences and security"],
  ["/admin/audit-logs", "Audit log", "Recorded administrative changes"],
  ["/admin/departments", "Departments", "School academic organization"],
  ["/admin/academic-calendar", "Academic calendar", "School years and terms"],
  ["/admin/publish-results", "Publish results", "Review and release term results"],
  ["/admin/admissions", "Admissions enquiries", "Prospective school families"],
  ["/admin/publications", "Publications", "Manage school news"],
  ["/admin/public-events", "Public events", "Manage school events"],
  ["/admin/report-card-template", "Report card template", "Configure published academic reports"],
  ["/activity", "Activity", "Recent school updates"],
  ["/insights", "Academic insights", "Understand learning progress"],
  ["/ai-assistant", "School assistant", "Authorized school information"],
];

/** Searchable destinations used by the portal search and command palette. */
export const PORTAL_PAGES = pages.map(([path, title, description]) => ({
  path,
  title,
  description,
}));

export function portalPage(pathname: string) {
  if (/^\/students\/[^/]+/.test(pathname)) {
    return { title: "Student profile", description: "A connected academic record" };
  }
  const page = [...pages]
    .sort(([left], [right]) => right.length - left.length)
    .find(([path]) => pathname === path || pathname.startsWith(`${path}/`));
  return { title: page?.[1] ?? "School portal", description: page?.[2] };
}
