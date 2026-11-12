"use client";

import {
  Breadcrumb as ShadcnBreadcrumb,
  BreadcrumbItem as ShadcnBreadcrumbItem,
  BreadcrumbList as ShadcnBreadcrumbList,
  BreadcrumbPage as ShadcnBreadcrumbPage,
  BreadcrumbSeparator as ShadcnBreadcrumbSeparator,
} from "@/components/ui/breadcrumb.tsx";
import { portalPage } from "@/lib/portal-page.ts";
import { stageLabel } from "@/components/academic/headmaster-stage-selector.tsx";
import { Home } from "lucide-react";
import { createContext, useContext, type PropsWithChildren } from "react";
import { Link, useLocation } from "react-router";

const GlobalBreadcrumbContext = createContext(false);

// These labels mirror sidebar destinations. They keep the trail wording the
// same as the navigation item the person selected, rather than a page-internal
// heading such as "Attendance reports".
const sidebarDestinations: Array<[string, string]> = [
  ["/homework/grades", "Grades"],
  ["/admin/report-card-template", "Report Card Template"],
  ["/admin/publish-results", "Publish Results"],
  ["/admin/academic-calendar", "Academic Calendar"],
  ["/admin/audit-logs", "Audit Log"],
  ["/admin/admissions", "Admissions Enquiries"],
  ["/admin/password-recovery", "Password Recovery"],
  ["/admin/publications", "Publications"],
  ["/admin/public-events", "Public Events"],
  ["/parent/homework", "Homework"],
  ["/parent/attendance", "Attendance"],
  ["/parent/reports", "Reports"],
  ["/portal", "Dashboard"],
  ["/classes", "Classes"],
  ["/subjects", "Subjects"],
  ["/students", "Students"],
  ["/teachers", "Teachers"],
  ["/guardians", "Parents & Guardians"],
  ["/homework", "Homework"],
  ["/attendance", "Attendance"],
  ["/reports", "Reports"],
  ["/insights", "Insights"],
  ["/calendar", "Calendar"],
  ["/announcements", "Announcements"],
  ["/notifications", "Notifications"],
  ["/messages", "Messages"],
  ["/ai-assistant", "AI Assistant"],
  ["/activity", "Activity"],
];

sidebarDestinations.sort(([left], [right]) => right.length - left.length);

/** Places one consistent breadcrumb at the top of the authenticated portal. */
export function PortalBreadcrumbProvider({ children }: PropsWithChildren) {
  return <GlobalBreadcrumbContext.Provider value={true}>{children}</GlobalBreadcrumbContext.Provider>;
}

export function Breadcrumb({ global = false }: { global?: boolean }) {
  const hasGlobalBreadcrumb = useContext(GlobalBreadcrumbContext);
  const { pathname, search } = useLocation();

  // Authenticated portal routes get exactly one breadcrumb from Layout. Keep
  // the page-level breadcrumb only for setup, which is intentionally outside
  // that shell. The route check also prevents duplicate trails if a page-level
  // call is rendered without inheriting the layout context.
  if (!global && (hasGlobalBreadcrumb || pathname !== "/portal/setup")) return null;
  if (global && (pathname === "/portal" || pathname === "/profile" || pathname === "/portal/history")) return null;

  const { title: pageTitle } = portalPage(pathname);
  const title = sidebarDestinations.find(([path]) => pathname === path || (path !== "/portal" && pathname.startsWith(`${path}/`)))?.[1] ?? pageTitle;
  const isHomeworkCreate = pathname === "/homework/create";
  const isHomeworkGrades = pathname === "/homework/grades";
  const isHomeworkCreated = /^\/homework\/[^/]+$/.test(pathname);
  const homeworkReport = pathname.match(/^\/homework\/([^/]+)\/report$/);
  const isQrAttendance = pathname === "/attendance/qr" || pathname.startsWith("/attendance/qr/");
  const isAttendanceReport = pathname === "/attendance/report";
  const isClassesCreate = pathname === "/classes/create";
  const isAnnouncementCreate = pathname === "/announcements/create";
  const isClassesEdit = /^\/classes\/edit\/[^/]+$/.test(pathname);
  const isSubjectsCreate = pathname === "/subjects/create";
  const isSubjectsEdit = /^\/subjects\/edit\/[^/]+\/?$/.test(pathname);
  const isClassShow = /^\/classes\/show\/[^/]+$/.test(pathname);
  const isManageStudents = /^\/classes\/[^/]+\/enroll$/.test(pathname);
  const homeworkSearch = new URLSearchParams(search);
  const hasParentHomeworkContext = Boolean(homeworkSearch.get("childId") && homeworkSearch.get("academicYearId"));
  const parentHomeworkQuery = hasParentHomeworkContext
    ? `?${new URLSearchParams({ childId: homeworkSearch.get("childId")!, academicYearId: homeworkSearch.get("academicYearId")! }).toString()}`
    : "";
  const homeworkHref = hasParentHomeworkContext ? `/parent/homework/view${parentHomeworkQuery}` : "/homework";
  const breadcrumbSearch = new URLSearchParams(search);
  const isPasswordRecovery = pathname === "/admin/password-recovery";
  const isSelectedStudents = pathname === "/students/selected";
  const foundRoute = pathname.match(/^\/(classes|subjects|students|teachers|guardians)\/found$/);
  const foundStageLabel = stageLabel(breadcrumbSearch.get("stage") ?? "");
  const foundDirectory = foundRoute ? {
    href: `/${foundRoute[1]}`,
    parent: foundRoute[1] === "guardians" ? "Parents" : foundRoute[1][0].toUpperCase() + foundRoute[1].slice(1),
    page: foundRoute[1] === "classes" ? `${foundStageLabel || "Class or form selected"} Classes`
      : foundRoute[1] === "subjects" ? `${foundStageLabel || "Class or form selected"} Subjects`
        : foundRoute[1] === "students" ? `${foundStageLabel || "Class or form selected"} Students`
        : foundRoute[1] === "guardians" ? "Parents found" : "Teachers found",
  } : null;
  const isStudentReport = pathname === "/grades/term-results" && breadcrumbSearch.get("reportSource") === "student-directory";
  const studentProfileTermResults = pathname === "/grades/term-results"
    && Boolean(breadcrumbSearch.get("studentId"))
    && !isStudentReport;
  const selectedStudentsParams = new URLSearchParams();
  for (const key of ["schoolLevel", "stage", "academicYearId", "page"] as const) {
    const value = breadcrumbSearch.get(key);
    if (value) selectedStudentsParams.set(key, value);
  }
  const selectedStudentsHref = `/students/selected?${selectedStudentsParams.toString()}`;
  const selectedStudentsLabel = `${stageLabel(breadcrumbSearch.get("stage") ?? "")} Students`;

  return (
    <ShadcnBreadcrumb>
      <ShadcnBreadcrumbList>
        <ShadcnBreadcrumbItem>
          <Link to="/portal" aria-label="Home" title="Home">
            <Home className="h-4 w-4" />
          </Link>
        </ShadcnBreadcrumbItem>
        <ShadcnBreadcrumbSeparator>{">"}</ShadcnBreadcrumbSeparator>
        {foundDirectory ? <>
          <ShadcnBreadcrumbItem><Link to={foundDirectory.href}>{foundDirectory.parent}</Link></ShadcnBreadcrumbItem>
          <ShadcnBreadcrumbSeparator>{">"}</ShadcnBreadcrumbSeparator>
          <ShadcnBreadcrumbPage>{foundDirectory.page}</ShadcnBreadcrumbPage>
        </> : isPasswordRecovery ? <ShadcnBreadcrumbPage>Password Recovery</ShadcnBreadcrumbPage> : studentProfileTermResults ? <>
          <ShadcnBreadcrumbItem><Link to={`/students/${encodeURIComponent(breadcrumbSearch.get("studentId")!)}`}>Student profile</Link></ShadcnBreadcrumbItem>
          <ShadcnBreadcrumbSeparator>{">"}</ShadcnBreadcrumbSeparator>
          <ShadcnBreadcrumbPage>Term results</ShadcnBreadcrumbPage>
        </> : isStudentReport ? <>
          <ShadcnBreadcrumbItem><Link to="/students">Students</Link></ShadcnBreadcrumbItem>
          <ShadcnBreadcrumbSeparator>{">"}</ShadcnBreadcrumbSeparator>
          <ShadcnBreadcrumbItem><Link to={selectedStudentsHref}>{selectedStudentsLabel}</Link></ShadcnBreadcrumbItem>
          <ShadcnBreadcrumbSeparator>{">"}</ShadcnBreadcrumbSeparator>
          <ShadcnBreadcrumbPage>Report</ShadcnBreadcrumbPage>
        </> : isSelectedStudents ? <>
          <ShadcnBreadcrumbItem><Link to="/students">Students</Link></ShadcnBreadcrumbItem>
          <ShadcnBreadcrumbSeparator>{">"}</ShadcnBreadcrumbSeparator>
          <ShadcnBreadcrumbPage>{selectedStudentsLabel}</ShadcnBreadcrumbPage>
        </> : isHomeworkCreate ? <>
          <ShadcnBreadcrumbItem><Link to={homeworkHref}>Homework</Link></ShadcnBreadcrumbItem>
          <ShadcnBreadcrumbSeparator>{">"}</ShadcnBreadcrumbSeparator>
          <ShadcnBreadcrumbPage>Create</ShadcnBreadcrumbPage>
        </> : isHomeworkGrades ? <>
          <ShadcnBreadcrumbItem><Link to={homeworkHref}>Homework</Link></ShadcnBreadcrumbItem>
          <ShadcnBreadcrumbSeparator>{">"}</ShadcnBreadcrumbSeparator>
          <ShadcnBreadcrumbPage>Grades</ShadcnBreadcrumbPage>
        </> : homeworkReport ? <>
          <ShadcnBreadcrumbItem><Link to={homeworkHref}>Homework</Link></ShadcnBreadcrumbItem>
          <ShadcnBreadcrumbSeparator>{">"}</ShadcnBreadcrumbSeparator>
          <ShadcnBreadcrumbItem><Link to={`/homework/${homeworkReport[1]}${parentHomeworkQuery}`}>Created</Link></ShadcnBreadcrumbItem>
          <ShadcnBreadcrumbSeparator>{">"}</ShadcnBreadcrumbSeparator>
          <ShadcnBreadcrumbPage>Marks</ShadcnBreadcrumbPage>
        </> : isHomeworkCreated ? <>
          <ShadcnBreadcrumbItem><Link to={homeworkHref}>Homework</Link></ShadcnBreadcrumbItem>
          <ShadcnBreadcrumbSeparator>{">"}</ShadcnBreadcrumbSeparator>
          <ShadcnBreadcrumbPage>Created</ShadcnBreadcrumbPage>
        </> : isQrAttendance ? <>
          <ShadcnBreadcrumbItem><Link to="/attendance">Attendance</Link></ShadcnBreadcrumbItem>
          <ShadcnBreadcrumbSeparator>{">"}</ShadcnBreadcrumbSeparator>
          <ShadcnBreadcrumbPage>QR Attendance</ShadcnBreadcrumbPage>
        </> : isAttendanceReport ? <>
          <ShadcnBreadcrumbItem><Link to="/attendance">Attendance</Link></ShadcnBreadcrumbItem>
          <ShadcnBreadcrumbSeparator>{">"}</ShadcnBreadcrumbSeparator>
          <ShadcnBreadcrumbPage>Report</ShadcnBreadcrumbPage>
        </> : isAnnouncementCreate ? <>
          <ShadcnBreadcrumbItem><Link to="/announcements">Announcements</Link></ShadcnBreadcrumbItem>
          <ShadcnBreadcrumbSeparator>{">"}</ShadcnBreadcrumbSeparator>
          <ShadcnBreadcrumbPage>New Announcement</ShadcnBreadcrumbPage>
        </> : isClassesCreate ? <>
          <ShadcnBreadcrumbItem><Link to="/classes">Classes</Link></ShadcnBreadcrumbItem>
          <ShadcnBreadcrumbSeparator>{">"}</ShadcnBreadcrumbSeparator>
          <ShadcnBreadcrumbPage>Create</ShadcnBreadcrumbPage>
        </> : isClassesEdit ? <>
          <ShadcnBreadcrumbItem><Link to="/classes">Classes</Link></ShadcnBreadcrumbItem>
          <ShadcnBreadcrumbSeparator>{">"}</ShadcnBreadcrumbSeparator>
          <ShadcnBreadcrumbPage>Edit</ShadcnBreadcrumbPage>
        </> : isSubjectsCreate ? <>
          <ShadcnBreadcrumbItem><Link to="/subjects">Subjects</Link></ShadcnBreadcrumbItem>
          <ShadcnBreadcrumbSeparator>{">"}</ShadcnBreadcrumbSeparator>
          <ShadcnBreadcrumbPage>Create</ShadcnBreadcrumbPage>
        </> : isSubjectsEdit ? <>
          <ShadcnBreadcrumbItem><Link to="/subjects">Subjects</Link></ShadcnBreadcrumbItem>
          <ShadcnBreadcrumbSeparator>{">"}</ShadcnBreadcrumbSeparator>
          <ShadcnBreadcrumbPage>Edit</ShadcnBreadcrumbPage>
        </> : isClassShow ? <>
          <ShadcnBreadcrumbItem><Link to="/classes">Classes</Link></ShadcnBreadcrumbItem>
          <ShadcnBreadcrumbSeparator>{">"}</ShadcnBreadcrumbSeparator>
          <ShadcnBreadcrumbPage>Show</ShadcnBreadcrumbPage>
        </> : isManageStudents ? <>
          <ShadcnBreadcrumbItem><Link to="/classes">Classes</Link></ShadcnBreadcrumbItem>
          <ShadcnBreadcrumbSeparator>{">"}</ShadcnBreadcrumbSeparator>
          <ShadcnBreadcrumbPage>Manage students</ShadcnBreadcrumbPage>
        </> : <ShadcnBreadcrumbPage>{title}</ShadcnBreadcrumbPage>}
      </ShadcnBreadcrumbList>
    </ShadcnBreadcrumb>
  );
}

Breadcrumb.displayName = "Breadcrumb";
