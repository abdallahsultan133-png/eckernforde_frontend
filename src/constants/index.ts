// Demo school profile. Replace these editable values with the school's
// approved identity before launch. The `.example` email addresses are
// intentionally non-deliverable and are not deployment credentials.
export const SCHOOL_PROFILE = {
    name: "Kijani International School",
    shortName: "Kijani",
    tagline: "Learning with purpose",
    address: "Plot 18, Mlimani Road, Dar es Salaam, Tanzania",
    phone: "+255 700 123 456",
    generalEmail: "hello@kijanischool.example",
    admissionsEmail: "admissions@kijanischool.example",
    hours: "Monday–Friday, 7:30–16:30",
} as const;

export const APP_NAME = SCHOOL_PROFILE.name;
export const APP_TAGLINE = SCHOOL_PROFILE.tagline;

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
    grades: "Assignment grade book, exams, and report cards.",
    calendar: "Classes, exams, and deadlines on one timeline.",
    insights: "Attendance, performance, and activity trends.",
    messages: "Direct messages with your school community.",
};
