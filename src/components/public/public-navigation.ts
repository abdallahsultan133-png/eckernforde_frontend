export const PUBLIC_NAVIGATION = [
  {
    label: "About us",
    href: "/about",
    items: [
      ["Our story", "/about/our-story"],
      ["Mission and values", "/about/mission-values"],
      ["A welcome from school leadership", "/about/directors-welcome"],
      ["Leadership and governance", "/about/leadership"],
      ["Accreditations and memberships", "/about/accreditation-memberships"],
      ["Campus and facilities", "/about/campus-facilities"],
      ["Community spaces", "/about/community-spaces"],
      ["Careers at Eckernforde", "/about/work-for-us"],
      ["Safeguarding", "/about/safeguarding"],
    ],
  },
  {
    label: "Admissions",
    href: "/admissions",
    items: [
      ["Admissions process", "/admissions/journey"],
      ["Book a visit", "/admissions/visit"],
      ["Entry requirements", "/admissions/requirements"],
      ["Admissions policy", "/admissions/policy"],
      ["Fees information", "/admissions/fees"],
      ["Term dates", "/admissions/term-dates"],
      ["Frequently asked questions", "/admissions/faqs"],
    ],
  },
  {
    label: "Our community",
    href: "/community",
    items: [
      ["Community welcome", "/community/welcome"],
      ["Families", "/community/families"],
      ["Teachers and staff", "/community/staff"],
      ["Alumni connections", "/community/alumni"],
      ["Resources and policies", "/community/resources-policies"],
    ],
  },
  {
    label: "School life",
    href: "/school-life",
    items: [
      ["Student life", "/school-life/student-life"],
      ["Sports and wellbeing", "/school-life/sports-wellbeing"],
      ["Arts and music", "/school-life/arts-music"],
      ["Clubs and activities", "/school-life/clubs-activities"],
      ["Gallery", "/gallery"],
    ],
  },
  {
    label: "News and events",
    href: "/news-events",
    items: [
      ["News", "/news-events/latest"],
      ["Events calendar", "/news-events/calendar"],
      ["School announcements", "/news-events/announcements"],
      ["Publications", "/news-events/publications"],
    ],
  },
] as const;

export const PUBLIC_STAGE_NAVIGATION = {
  Nursery: [
    ["Welcome to Nursery", "/academics/early-years"],
    ["Academic", "/academics/nursery-learning"],
    ["Enrichment", "/academics/nursery-enrichment"],
    ["Wellbeing", "/academics/nursery-wellbeing"],
    ["Meals", "/academics/nursery-meals"],
    ["Transport", "/academics/nursery-transport"],
  ],
  Primary: [
    ["Welcome to Primary School", "/academics/primary"],
    ["Academic", "/academics/primary-curriculum"],
    ["Enrichment", "/academics/primary-enrichment"],
    ["Wellbeing", "/academics/primary-wellbeing"],
    ["Meals", "/academics/primary-meals"],
    ["Transport", "/academics/primary-transport"],
  ],
  Secondary: [
    ["Welcome to Secondary School", "/academics/secondary"],
    ["Academic", "/academics/secondary-curriculum"],
    ["Enrichment", "/academics/secondary-enrichment"],
    ["Wellbeing", "/academics/secondary-wellbeing"],
    ["Assessments", "/academics/examinations"],
    ["Next steps", "/academics/secondary-pathways"],
  ],
} as const;
