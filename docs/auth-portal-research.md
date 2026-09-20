# School portal reference review

Reviewed September 16, 2026. This is a shortlist of ten educational portal references, including universities, not a verified ranking of the world's best school designs. Public content was inspected; authenticated screens and full visual layouts were not verified. These examples expose both returning-user login and new-account entry points.

| Institution | Public portal | Observed feature |
| --- | --- | --- |
| Hotchkiss School | https://apply.hotchkiss.org/apply/ | Login and account creation alongside school navigation and admission resources. |
| Lawrenceville School | https://apply.lawrenceville.org/apply/ | Distinct returning and first-time user links, plus school contact information. |
| Stanford Online High School | https://onlineadmission.stanford.edu/apply/ | Both entry paths, with guidance on applicant identity and email ownership. |
| Harvard College | https://apply.college.harvard.edu/apply/ | Concise returning-user and first-time-user choices. |
| University of Florida | https://my.admissions.ufl.edu/apply/ | Both entry paths and admissions contact details. |
| Queens University of Charlotte | https://admissions.queens.edu/apply/ | Short login and create-account choices under admissions branding. |
| Brandeis University | https://admissions.brandeis.edu/apply/ | Both entry paths, contact information, and return-to-school navigation. |
| Cornell University | https://engage.admissions.cornell.edu/apply/ | Both entry paths with admissions help and accessibility links. |
| Colby College | https://admissions.colby.edu/apply/ | Both entry paths with admissions and financial-aid contacts. |
| University of West Georgia | https://apply.westga.edu/apply/ | Explicit account choices, process guidance, and help information. |

## Application to Eckernforde Academy

Keep school identity prominent and the two account paths clear. Preserve the user's large paired logos, mobile logo-before-name order, minimal login copy, and Google link below the primary action. Use consistent input sizing, visible focus states, restrained backgrounds, and matching action icons. Enable native required/email validation before sending either form, retaining existing password mismatch feedback. These styling decisions are our design recommendations, not claims about uninspected reference screenshots.

## School-only shortlist

The following ten primary/secondary-school references replace the mixed shortlist above for the requested school comparison. Selection favors clear account entry, explicit labels, password visibility and recovery, and school identity; this is a design shortlist, not an objective global ranking. Public pages and indexed form content were reviewed, not private accounts.

1. [Phillips Academy Andover](https://andover.fsenrollment.com/users/sign_up) — named fields, password confirmation, visibility controls and a sign-in alternative.
2. [Hotchkiss School](https://apply.hotchkiss.org/apply/) — returning/new-user choices with school navigation.
3. [Lawrenceville School](https://apply.lawrenceville.org/apply/) — returning/new-user choices and school contact details.
4. [Stanford Online High School](https://onlineadmission.stanford.edu/apply/) — account-entry choices and clear email-ownership guidance.
5. [Groton School](https://groton.campusdolphin.com/) — sign-up instructions and explanation of reusable Gateway credentials.
6. [One School of the Arts & Sciences](https://oneschool.fsenrollment.com/users/sign_up) — registration fields, password visibility, and sign-in alternative.
7. [Besant Hill School](https://besanthill.fsenrollment.com/users/sign_up) — registration with password confirmation and returning-user link.
8. [The Bishop's School](https://bishops.fsenrollment.com/users/sign_up) — name/email/password form with visible sign-in alternative.
9. [Louisville High School](https://louisvillehs.fsenrollment.com/users/sign_up) — labeled registration and password-visibility controls.
10. [Nysmith School](https://nysmith.fsenrollment.com/users/sign_up) — concise account creation with sign-in alternative.

## Verification

Production build passed. Chromium checks covered login and registration at 375px and 1440px: no page errors or horizontal overflow, both logos loaded, and empty forms failed native validation. All four screenshots were inspected and saved under `test-results/auth-layout/`. No live accounts were created and authentication-provider connectivity was not tested as part of this visual update.
