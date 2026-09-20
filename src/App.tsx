import { Refine, Authenticated } from "@refinedev/core";
import { RefineKbarProvider } from "@refinedev/kbar";
import { CommandPalette } from "@/components/layout/command-palette.tsx";
import {Layout} from "@/components/layout/layout.tsx";
import { PortalSetupShell } from "@/pages/portal/setup-shell.tsx";
import routerProvider, {
  DocumentTitleHandler,
  UnsavedChangesNotifier,
} from "@refinedev/react-router";

import { lazy, Suspense, type ReactNode } from "react";
import { MotionConfig } from "framer-motion";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router";
import "./App.css";
import { Toaster } from "./components/refine-ui/notification/toaster";
import { useNotificationProvider } from "./components/refine-ui/notification/use-notification-provider";
import { ThemeProvider } from "./components/refine-ui/theme/theme-provider";
import { dataProvider } from "./providers/data";
import {BookOpen, GraduationCap, Home, School, ClipboardCheck, FileText, Megaphone, BarChart3, Calendar, MessageSquare, LineChart} from "lucide-react";
import { NotFoundPage, UnauthorizedPage } from "@/pages/errors/index.tsx";
import { authProvider } from "@/providers/auth";
import { RequireRole } from "@/components/layout/require-role.tsx";
import { ErrorBoundary } from "@/components/layout/error-boundary.tsx";
import { PageLoader } from "@/components/layout/page-loader.tsx";
import { DownloadDialogProvider } from "@/components/download-dialog.tsx";
import { UserRole } from "@/types";
import { APP_NAME } from "@/constants";
import { STAFF_ROLES, ADMIN_ROLES } from "@/lib/roles";
import { PublicShell } from "@/components/public/public-shell";
import PublicHome from "@/pages/public/home";
import AdmissionsPage from "@/pages/public/admissions";
import NewsEventsPage from "@/pages/public/news-events";
import AcademicsPage from "@/pages/public/academics";
import SchoolLifePage from "@/pages/public/school-life";
import ContactPage from "@/pages/public/contact";
import GalleryPage from "@/pages/public/gallery";
import PublicNotFoundPage from "@/pages/public/not-found";
import { ContentPage, pages as publicPages } from "@/pages/public/content-page";
import PublicDetailPage from "@/pages/public/detail-page";

// Route-level code splitting: each page is fetched only when its route is
// visited instead of all ~30 pages shipping in a single bundle up front.
const PortalEntry = lazy(() => import("@/pages/portal/entry.tsx"));
const PortalSetup = lazy(() => import("@/pages/portal/setup.tsx"));
const AcademicHistory = lazy(() => import("@/pages/portal/academic-history.tsx"));
const AcademicArchive = lazy(() => import("@/pages/portal/academic-archive.tsx"));
const ActivityPage = lazy(() => import("@/pages/activity.tsx"));
const SubjectsList = lazy(() => import("@/pages/subjects/list.tsx"));
const SubjectsCreate = lazy(() => import("@/pages/subjects/create.tsx"));
const SubjectsEdit = lazy(() => import("@/pages/subjects/edit.tsx"));
const ClassesList = lazy(() => import("@/pages/classes/list.tsx"));
const ClassesCreate = lazy(() => import("@/pages/classes/create.tsx"));
const ClassesEdit = lazy(() => import("@/pages/classes/edit.tsx"));
const ClassesShow = lazy(() => import("@/pages/classes/show.tsx"));
const DepartmentsPage = lazy(() => import("@/pages/admin/departments.tsx"));
const AcademicCalendarAdmin = lazy(() => import("@/pages/admin/academic-calendar.tsx"));
const AdmissionsEnquiries = lazy(() => import("@/pages/admin/admissions-enquiries.tsx"));
const Publications = lazy(() => import("@/pages/admin/publications.tsx"));
const PublicEvents = lazy(() => import("@/pages/admin/public-events.tsx"));
const TermResultsPublishing = lazy(() => import("@/pages/admin/term-results-publishing.tsx"));
const ReportCardTemplate = lazy(() => import("@/pages/admin/report-card-template.tsx"));
const AttendanceIndex = lazy(() => import("@/pages/attendance/index.tsx"));
const AttendanceReport = lazy(() => import("@/pages/attendance/report.tsx"));
const QrAttendancePage = lazy(() => import("@/pages/attendance/qr.tsx"));
const AssignmentsList = lazy(() => import("@/pages/assignments/list.tsx"));
const AssignmentsCreate = lazy(() => import("@/pages/assignments/create.tsx"));
const AssignmentShow = lazy(() => import("@/pages/assignments/show.tsx"));
const AssignmentReport = lazy(() => import("@/pages/assignments/report.tsx"));
const AnnouncementsList = lazy(() => import("@/pages/announcements/list.tsx"));
const AnnouncementsCreate = lazy(() => import("@/pages/announcements/create.tsx"));
const UsersList = lazy(() => import("@/pages/users/list.tsx"));
const Gradebook = lazy(() => import("@/pages/grades/gradebook.tsx"));
const ExamsPage = lazy(() => import("@/pages/grades/exams.tsx"));
const ReportCard = lazy(() => import("@/pages/grades/report-card.tsx"));
const TermResults = lazy(() => import("@/pages/grades/term-results.tsx"));
const TermResultsEntry = lazy(() => import("@/pages/grades/term-results-entry.tsx"));
const CalendarPage = lazy(() => import("@/pages/calendar/index.tsx"));
const InsightsPage = lazy(() => import("@/pages/insights/index.tsx"));
const ProfilePage = lazy(() => import("@/pages/profile/index.tsx"));
const StudentProfilePage = lazy(() => import("@/pages/profile/student.tsx"));
const ParentDashboard = lazy(() => import("@/pages/parent/dashboard.tsx"));
const ParentAcademicSelector = lazy(() => import("@/pages/parent/academic-selector.tsx").then((module) => ({ default: module.ParentAcademicSelector })));
const ParentAttendance = lazy(() => import("@/pages/parent/attendance.tsx"));
const MessagesPage = lazy(() => import("@/pages/messages/index.tsx"));
const NotificationsPage = lazy(() => import("@/pages/notifications/index.tsx"));
const AiAssistantPage = lazy(() => import("@/pages/ai-assistant/index.tsx"));
const EnrollStudents = lazy(() => import("@/pages/classes/enroll.tsx"));
const AuditLogsPage = lazy(() => import("@/pages/admin/audit-logs.tsx"));
const Login = lazy(() => import("@/pages/auth/login"));
const Register = lazy(() => import("@/pages/auth/register"));
const ForgotPassword = lazy(() => import("@/pages/auth/forgot-password.tsx"));
const ResetPassword = lazy(() => import("@/pages/auth/reset-password.tsx"));

// Refine's devtools are a development-only aid. In a production build
// `import.meta.env.DEV` is statically false, so this collapses to a plain
// pass-through and the `@refinedev/devtools` chunk is never bundled or run.
const Devtools = import.meta.env.DEV
  ? lazy(() => import("@/components/devtools-provider.tsx"))
  : ({ children }: { children: ReactNode }) => <>{children}</>;

function App() {
  return (
    <ErrorBoundary>
    <MotionConfig reducedMotion="user">
    <BrowserRouter>
      <RefineKbarProvider>
        <ThemeProvider>
          <DownloadDialogProvider>
          <Suspense fallback={<PageLoader />}>
          <Devtools>
              <Refine
                  dataProvider={dataProvider}
                  authProvider={authProvider}
                  notificationProvider={useNotificationProvider()}
                  routerProvider={routerProvider}

                  options={{
                  syncWithLocation: true,
                  warnWhenUnsavedChanges: true,
                  projectId: "9sZQll-ZrhvSP-k4lkA8",
                  title: {
                      text: APP_NAME,
                      icon: <School />,
                  },
                  // Shared by every Refine useList/useOne AND the custom
                  // useApiQuery hook (same QueryClient). Without this, react-query
                  // v5 defaults to staleTime 0 + refetchOnWindowFocus, so every
                  // navigation back to a page re-hits the API and flashes
                  // skeletons even though the data is milliseconds old. These
                  // defaults serve cached data instantly and refetch in the
                  // background; mutations still invalidate + refetch immediately.
                  reactQuery: {
                      clientConfig: {
                          defaultOptions: {
                              queries: {
                                  staleTime: 60_000,
                                  gcTime: 10 * 60_000,
                                  refetchOnWindowFocus: false,
                                  retry: 1,
                              },
                          },
                      },
                  },
              }}
              resources={[
                      { name: 'dashboard',
                          list: '/portal',
                          meta: { label: 'Home', icon: <Home />}
                      }, {
                      name: 'subjects',
                      list: '/subjects',
                      create: '/subjects/create',
                      edit: '/subjects/edit/:id',
                      meta: { label: 'Subjects', icon: <BookOpen />}
                  }, {
                      name: 'classes',
                      list: '/classes',
                      create: '/classes/create',
                      show: '/classes/show/:id',
                      edit: '/classes/edit/:id',
                      meta: { label: 'Classes', icon: <GraduationCap />}
                  }, {
                      name: 'attendance',
                      list: '/attendance',
                      meta: { label: 'Attendance', icon: <ClipboardCheck />}
                  }, {
                      name: 'assignments',
                      list: '/assignments',
                      create: '/assignments/create',
                      show: '/assignments/:id',
                      meta: { label: 'Assignments', icon: <FileText />}
                  }, {
                      name: 'announcements',
                      list: '/announcements',
                      create: '/announcements/create',
                      meta: { label: 'Announcements', icon: <Megaphone />}
                  }, {
                      name: 'grades',
                      list: '/grades',
                      meta: { label: 'Grades', icon: <BarChart3 />}
                  }, {
                      name: 'calendar',
                      list: '/calendar',
                      meta: { label: 'Calendar', icon: <Calendar />}
                  }, {
                      name: 'insights',
                      list: '/insights',
                      meta: { label: 'Insights', icon: <LineChart />}
                  }, {
                      name: 'messages',
                      list: '/messages',
                      meta: { label: 'Messages', icon: <MessageSquare />}
                  }
              ]}
            >
                  <Suspense fallback={<PageLoader />}>
                  <Routes>

                      {/* Public website and secure portal are deliberately
                          separate products.  Public routes stay outside the
                          authenticated application shell so they can later be
                          rendered/prerendered for search engines. */}
                      <Route element={<PublicShell />}>
                          <Route path="/" element={<PublicHome />} />
                          <Route path="about" element={<ContentPage {...publicPages.about} />} />
                          <Route path="academics" element={<AcademicsPage />} />
                          <Route path="admissions" element={<AdmissionsPage />} />
                          <Route path="school-life" element={<SchoolLifePage />} />
                          <Route path="news-events" element={<NewsEventsPage />} />
                          <Route path="community" element={<ContentPage {...publicPages.community} />} />
                          <Route path="contact" element={<ContactPage />} />
                          <Route path="gallery" element={<GalleryPage />} />
                          <Route path="about/:slug" element={<PublicDetailPage />} />
                          <Route path="academics/:slug" element={<PublicDetailPage />} />
                          <Route path="admissions/:slug" element={<PublicDetailPage />} />
                          <Route path="school-life/:slug" element={<PublicDetailPage />} />
                          <Route path="community/:slug" element={<PublicDetailPage />} />
                          <Route path="news-events/:slug" element={<PublicDetailPage />} />
                          <Route path="*" element={<PublicNotFoundPage />} />
                      </Route>

                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />
                      <Route path="/forgot-password" element={<ForgotPassword />} />
                      <Route path="/reset-password" element={<ResetPassword />} />

                      {/* The first post-login decision is outside the portal shell.
                          The dashboard shell mounts only after context is saved. */}
                      <Route path="/portal" element={<Authenticated key="portal-entry" fallback={<Navigate to="/login" />}><PortalEntry /></Authenticated>} />
                      <Route path="/portal/setup" element={<Authenticated key="portal-setup" fallback={<Navigate to="/login" />}><PortalSetupShell><PortalSetup /></PortalSetupShell></Authenticated>} />

                      <Route
                          element={
                              <Authenticated
                                  key="authenticated-layout"
                                  fallback={<Navigate to="/login" />}
                              >
                                  <Layout>
                                      <Outlet />
                                  </Layout>
                              </Authenticated>
                          }
                      >

                          <Route path="/portal/history" element={<RequireRole roles={[UserRole.STUDENT]}><AcademicHistory /></RequireRole>} />
                          <Route path="/portal/history/:academicYearId" element={<RequireRole roles={[UserRole.STUDENT]}><AcademicArchive /></RequireRole>} />
                          <Route path="activity" element={<ActivityPage />} />
                          <Route path="notifications" element={<NotificationsPage />} />

                          <Route path="subjects">
                              <Route index element={<SubjectsList />} />
                              <Route path="create" element={<RequireRole roles={STAFF_ROLES}><SubjectsCreate /></RequireRole>} />
                              <Route path="edit/:id" element={<RequireRole roles={STAFF_ROLES}><SubjectsEdit /></RequireRole>} />
                          </Route>

                          <Route path="classes">
                              <Route index element={<ClassesList />} />
                              <Route path="create" element={<RequireRole roles={STAFF_ROLES}><ClassesCreate /></RequireRole>} />
                              <Route path="show/:id" element={<ClassesShow />} />
                              <Route path="edit/:id" element={<RequireRole roles={STAFF_ROLES}><ClassesEdit /></RequireRole>} />
                              <Route path=":id/enroll" element={<RequireRole roles={STAFF_ROLES}><EnrollStudents /></RequireRole>} />
                          </Route>

                          <Route path="attendance">
                              <Route index element={<AttendanceIndex />} />
                              <Route path="report" element={<AttendanceReport />} />
                              <Route path="qr" element={<QrAttendancePage />} />
                              <Route path="qr/scan/:token" element={<QrAttendancePage />} />
                          </Route>

                          <Route path="assignments">
                              <Route index element={<AssignmentsList />} />
                              <Route path="create" element={<RequireRole roles={STAFF_ROLES}><AssignmentsCreate /></RequireRole>} />
                              <Route path=":id/report" element={<RequireRole roles={STAFF_ROLES}><AssignmentReport /></RequireRole>} />
                              <Route path=":id" element={<AssignmentShow />} />
                          </Route>

                          <Route path="parent/assignments" element={<RequireRole roles={[UserRole.PARENT]}><ParentAcademicSelector mode="assignments" /></RequireRole>} />
                          <Route path="parent/assignments/view" element={<RequireRole roles={[UserRole.PARENT]}><AssignmentsList /></RequireRole>} />
                          <Route path="parent/attendance" element={<RequireRole roles={[UserRole.PARENT]}><ParentAcademicSelector mode="attendance" /></RequireRole>} />
                          <Route path="parent/attendance/view" element={<RequireRole roles={[UserRole.PARENT]}><ParentAttendance /></RequireRole>} />

                          <Route path="announcements">
                              <Route index element={<AnnouncementsList />} />
                              <Route path="create" element={<RequireRole roles={STAFF_ROLES}><AnnouncementsCreate /></RequireRole>} />
                          </Route>

                          <Route path="users" element={<RequireRole roles={ADMIN_ROLES}><UsersList /></RequireRole>} />
                          <Route path="students" element={<RequireRole roles={ADMIN_ROLES}><UsersList /></RequireRole>} />
                          <Route path="teachers" element={<RequireRole roles={ADMIN_ROLES}><UsersList /></RequireRole>} />
                          <Route path="guardians" element={<RequireRole roles={ADMIN_ROLES}><UsersList /></RequireRole>} />

                          <Route path="grades">
                              <Route index element={<Gradebook />} />
                              <Route path="exams" element={<ExamsPage />} />
                              <Route path="report-card" element={<ReportCard />} />
                              <Route path="report-card/:id" element={<ReportCard />} />
                              <Route path="term-results" element={<TermResults />} />
                              <Route path="term-results/record" element={<RequireRole roles={STAFF_ROLES}><TermResultsEntry /></RequireRole>} />
                          </Route>

                          <Route path="calendar" element={<CalendarPage />} />
                          <Route path="insights" element={<RequireRole roles={[UserRole.STUDENT, ...STAFF_ROLES]}><InsightsPage /></RequireRole>} />
                          <Route path="profile" element={<ProfilePage />} />
                          <Route path="students/:id" element={<StudentProfilePage />} />
                          <Route path="parent" element={<RequireRole roles={[UserRole.PARENT, ...ADMIN_ROLES]}><ParentDashboard /></RequireRole>} />
                          <Route path="messages" element={<MessagesPage />} />
                          <Route path="ai-assistant" element={<RequireRole roles={ADMIN_ROLES}><AiAssistantPage /></RequireRole>} />
                          <Route path="unauthorized" element={<UnauthorizedPage />} />
                          <Route path="admin/audit-logs" element={<RequireRole roles={ADMIN_ROLES}><AuditLogsPage /></RequireRole>} />
                          <Route path="admin/departments" element={<RequireRole roles={ADMIN_ROLES}><DepartmentsPage /></RequireRole>} />
                          <Route path="admin/academic-calendar" element={<RequireRole roles={ADMIN_ROLES}><AcademicCalendarAdmin /></RequireRole>} />
                          <Route path="admin/admissions" element={<RequireRole roles={ADMIN_ROLES}><AdmissionsEnquiries /></RequireRole>} />
                          <Route path="admin/publications" element={<RequireRole roles={ADMIN_ROLES}><Publications /></RequireRole>} />
                          <Route path="admin/public-events" element={<RequireRole roles={ADMIN_ROLES}><PublicEvents /></RequireRole>} />
                          <Route path="admin/publish-results" element={<RequireRole roles={ADMIN_ROLES}><TermResultsPublishing /></RequireRole>} />
                          <Route path="admin/report-card-template" element={<RequireRole roles={ADMIN_ROLES}><ReportCardTemplate /></RequireRole>} />
                          <Route path="*" element={<NotFoundPage />} />

                      </Route>

                  </Routes>
                  </Suspense>
              <Toaster />
              <CommandPalette />
              <UnsavedChangesNotifier />
              <DocumentTitleHandler
                  handler={({ autoGeneratedTitle }) =>
                      autoGeneratedTitle.replace("Refine", APP_NAME)
                  }
              />
            </Refine>
          </Devtools>
          </Suspense>
          </DownloadDialogProvider>
        </ThemeProvider>
      </RefineKbarProvider>
    </BrowserRouter>
    </MotionConfig>
    </ErrorBoundary>
  );
}

export default App;
