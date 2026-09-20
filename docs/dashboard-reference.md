# ACADEMIX dashboard reference

Reviewed 13 September 2026. This is a fit assessment based on public product documentation, not an independently measured global ranking or authenticated product usability test.

| Candidate | Evidence | Useful principle | Fit |
| --- | --- | --- | --- |
| Schoolbox | https://help.schoolbox.com.au/homepage/470 and https://help.schoolbox.com.au/homepage/2821 | Different dashboard compositions for junior/senior students, teachers and families; calendar, news and learning work together | Selected |
| ManageBac+ | https://www.managebac.com/my-workspace | Prioritized daily tasks and contextual shortcuts | Strong academic workflow reference |
| Blackbaud SIS | https://webfiles-sc1.blackbaud.com/files/support/helpfiles/education/k12/full-help/content/sis-academics-dashboard.html | Operational review tasks and attendance/schedule access | Strong school office reference |
| Veracross | https://www.veracross.com/academics-student-life/ | Connected family, student and teacher records | Strong family-record reference |
| PowerSchool | https://help.powerschool.com/t5/Families/ct-p/Families | Family access to grades, attendance and multiple students | Useful record-access reference; limited current visual evidence |

The three strongest references for this product are PowerSchool for family/SIS record access, Blackbaud for operational review and attendance workflows, and ManageBac+ for task-first academic workspaces. Schoolbox supplied an additional useful reference for age- and role-specific dashboard composition. ACADEMIX translates these principles into a connected board using its own colors, labels and existing endpoints. No proprietary assets or source code are copied. No claims about competitor frontend frameworks are made.

## Implemented

- One connected board with shared borders, restrained headings and compact toolbar links.
- Student: calendar, classes, pending work, deadlines, feedback and activity.
- Teacher: calendar, classes, grading queue, deadlines and classroom indicators.
- Parent: linked-child selection, attendance sessions, classes and academic records; school notices remain school-level rather than falsely child-specific.
- Admin: enrollment summary, classes, academic follow-up and audit activity.
- Super Admin: account/audit shortcuts and audit activity first, with school-wide academic and community context.
- Optional attendance/performance charts mount only when expanded.
- Explicit role selection; unknown identities do not fall back to administration.

## Limits and verification

Existing data contracts do not provide every requested timetable room, term, incomplete-register count or system-health metric. The dashboard does not fabricate them. Calendar content is labeled upcoming rather than claiming to be a complete daily timetable. Attendance summary is labeled 30 days, not today.

The prior dashboard files remain available in the repository but are no longer selected by the dashboard route. Shared feature widgets, API hooks and server authorization are retained.

Automated coverage includes all five dashboard role branches, missing identity and parent child switching. Authenticated visual review and browser network/console checks remain necessary before claiming complete responsive or WCAG conformance.
