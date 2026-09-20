# ACADEMIX portal architecture

## Design reference

The primary UX reference is [Schoolbox](https://help.schoolbox.com.au/homepage/470), selected for its documented separation of daily dashboards by audience, its combination of learning work with calendar/news, and its school-community orientation. ACADEMIX does not copy Schoolbox branding, source code, wording, or proprietary assets.

## Product shape

ACADEMIX is a role-aware digital campus for Nursery, Kindergarten, Primary (Standard I-VII), and Secondary (Form I-IV). The portal keeps one visual language while changing the information priority for each audience:

| Role | Primary question | Dashboard emphasis |
| --- | --- | --- |
| Student | What do I need to do today? | Lessons, due work, progress, attendance, feedback |
| Teacher | What requires my attention next? | Teaching schedule, classes, grading queue, attendance, deadlines |
| Parent | How is my child doing? | Child switcher, attendance, results, assignments, notices |
| Admin | What needs school-office action? | Enrollment, classes, attendance, academic follow-up, activity |
| Super admin | What changed and who has access? | Accounts, roles, audit log, departments, school-wide oversight |

## Frontend composition

The dashboard route selects an explicit role workspace. Each workspace composes shared, data-backed modules rather than a generic collection of metric cards:

```text
Dashboard
|-- StudentWorkspace
|-- TeacherWorkspace
|-- FamilyWorkspace
|-- AdminWorkspace
`-- SuperAdminWorkspace
```

The shared workspace board provides the page rhythm, while modules remain independently loadable and resilient:

- `TodaySchedule` - school-local schedule and lesson state
- `UpcomingAssignments` - due-soon work scoped by the server
- `ActionQueue` - prioritized work instead of decorative card grids
- `AcademicProgress` - published academic results
- `WorkspaceStatistics` - role-appropriate indicators
- `SystemActivity` - administrative audit activity
- `WorkspaceDirectory` - clear continuation paths into deeper records

## Technology translation

- React + TypeScript preserve the existing application and route model.
- Vite keeps the current build and deployment workflow.
- Tailwind CSS, Radix UI, and existing Shadcn primitives provide the component foundation.
- Refine remains responsible for resource navigation, identity, notifications, and auth integration.
- Better Auth remains the authentication authority; no client-side role escalation was introduced.
- Existing Node.js, Express, PostgreSQL, Drizzle, and role-scoped endpoints remain the data boundary.
- Lazy-loaded charts are used only when the user expands insights, reducing dashboard startup cost.

## Security boundary

The frontend changes presentation and navigation only. Server authorization remains authoritative for students, parents, teachers, admins, and super admins. Parent views use linked children from the existing profile endpoint; dashboards do not fabricate records or grant access by hiding/showing a menu item.

## Responsive and accessibility rules

- The workspace changes from three columns to two and then one as the available container narrows.
- Authentication hides the visual panel through 767px so mobile users reach the form immediately.
- Loading and error states are local to each dashboard module.
- Action queues expose `aria-busy` while loading and announce dynamic content politely.
- Focus-visible styling, semantic headings, keyboard links, and reduced-motion support remain part of the shared shell.

## Verification record

The current implementation has passed the frontend TypeScript check, frontend production build, 61 frontend tests, and lint. Authenticated browser QA remains a deployment-environment concern because local headless Chromium capture is restricted in the current Windows workspace.
