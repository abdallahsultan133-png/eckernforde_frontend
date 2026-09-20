const pages: [string, string, string][] = [
  ["/portal/history", "Academic history", "Previous school years and published records"],
  ["/portal/setup", "Choose school context", "Select the level you are working in"],
  ["/portal", "Dashboard", "Your school day"],
  ["/parent", "Family records", "Your children's learning and progress"],
  ["/grades/report-card", "Report cards", "Published academic reports"],
  ["/grades/term-results/record", "Record results", "Midterm and terminal examinations"],
  ["/grades/term-results", "Term results", "Academic progress and divisions"],
  ["/grades/exams", "Examinations", "Assessment schedules and records"],
  ["/grades", "Assignment Grade Book", "Assignment assessment and feedback"],
  ["/attendance/report", "Attendance reports", "Attendance history and summaries"],
  ["/attendance/qr", "Attendance QR", "Create a secure class attendance session"],
  ["/attendance/scan", "Scan attendance", "Record attendance from a class session"],
  ["/attendance", "Attendance", "School attendance records"],
  ["/assignments/create", "Create assignment", "Set learning work for your class"],
  ["/assignments", "Assignments", "Learning tasks and submissions"],
  ["/classes/create", "Create class", "Organize teaching and enrollment"],
  ["/classes/enroll", "Class enrollment", "Manage the class roster"],
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
  ["/admin/audit-logs", "Audit log", "Recorded administrative changes"],
  ["/admin/departments", "Departments", "School academic organization"],
  ["/admin/academic-calendar", "Academic calendar", "School years and terms"],
  ["/admin/publish-results", "Publish results", "Review and release term results"],
  ["/admin/admissions", "Admissions enquiries", "Prospective school families"],
  ["/admin/publications", "Publications", "Manage school news"],
  ["/admin/public-events", "Public events", "Manage school events"],
  ["/activity", "Activity", "Recent school updates"],
  ["/insights", "Academic insights", "Understand learning progress"],
  ["/ai-assistant", "School assistant", "Authorized school information"],
];

export function portalPage(pathname: string) {
  if (/^\/students\/[^/]+/.test(pathname)) {
    return { title: "Student profile", description: "A connected academic record" };
  }
  const page = [...pages]
    .sort(([left], [right]) => right.length - left.length)
    .find(([path]) => pathname === path || pathname.startsWith(`${path}/`));
  return { title: page?.[1] ?? "School portal", description: page?.[2] };
}
