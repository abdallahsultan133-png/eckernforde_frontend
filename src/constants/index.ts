// Product name. The rest of the app (auth screens, PDFs, QR page, command
// palette) already says "Academix"; App.tsx and the sidebar were the two
// hold-outs still saying "ClassroomMS" / "Classroom Management".
// Deliberately neutral until the school supplies its approved name, crest and
// brand guide.  This prevents the public site from inventing an identity.
export const APP_NAME = "Your School";
export const APP_TAGLINE = "Learning with purpose";

// NOTE: this fixed list predates the `departments` DB table and is still used
// as the department filter on the subjects list. It should eventually be
// replaced by a fetch of the real departments — see subjects/list.tsx.
export const DEPARTMENTS = [
    "Early Years",
    "Languages",
    "Mathematics",
    "Sciences",
    "Humanities",
    "History",
    "Geography",
    "Creative Arts",
    "Physical Education",
    "ICT & Digital Learning",
    "Student Support",
] as const;

export const DEPARTMENT_OPTIONS = DEPARTMENTS.map((dept) => ({
    value: dept,
    label: dept,
}));

export const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
export const CLOUDINARY_API_KEY = import.meta.env.VITE_CLOUDINARY_API_KEY;
export const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;

// One-line context shown under the page title in the global header, keyed by
// Refine resource name (see the `resources` list in App.tsx). Routes with no
// matching resource (e.g. /profile) simply render without a description.
export const PAGE_META: Record<string, string> = {
    dashboard: "Your school at a glance.",
    subjects: "Manage the subjects taught across your school.",
    classes: "Browse and manage classes.",
    attendance: "Record and review attendance.",
    assignments: "Create and track assignments.",
    announcements: "Post and read school announcements.",
    grades: "Gradebook, exams, and report cards.",
    calendar: "Classes, exams, and deadlines on one timeline.",
    insights: "Attendance, performance, and activity trends.",
    messages: "Direct messages with your school community.",
};
