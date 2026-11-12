import { DETAILS, type Detail } from "./public-page-content";
export type PageLayout =
  | "story"
  | "values"
  | "process"
  | "resources"
  | "enrichment"
  | "split"
  | "editorial"
  | "campus"
  | "stage"
  | "faq"
  | "director"
  | "memberships"
  | "careers"
  | "governance"
  | "safeguarding";
export type PublicPageDefinition = Detail & {
  path: string;
  label: string;
  layout: PageLayout;
  pending?: string;
  stage?: string;
};
const make = (
  eyebrow: string,
  title: string,
  intro: string,
  sections: Detail["sections"],
  back: string
): Detail => ({
  eyebrow,
  title,
  intro,
  sections,
  back,
  image: "/images/kijani-hero.png",
});
const nursery = DETAILS["early-years"],
  primary = DETAILS.primary,
  secondary = DETAILS.secondary;
const EXTRA: Record<string, Detail> = {
  "nursery-learning": make(
    "Learning / Nursery learning",
    "Learning through play",
    "Language, early numeracy, movement and imagination grow through playful exploration.",
    nursery.sections,
    "/academics/early-years"
  ),
  "nursery-enrichment": make(
    "Learning / Nursery creative exploration",
    "A world to explore",
    "Making, movement and stories give young learners many ways to express their ideas.",
    [
      {
        title: "Make and imagine",
        copy: "Creative play gives children space to explore materials, words and ideas.",
      },
      {
        title: "Move and discover",
        copy: "Movement and everyday exploration support confidence and curiosity.",
      },
      {
        title: "Share and listen",
        copy: "Play with others develops communication and caring relationships.",
      },
    ],
    "/academics/early-years"
  ),
  "nursery-wellbeing": make(
    "Learning / Nursery care and routines",
    "A caring beginning",
    "Warm relationships and clear routines help children feel secure as they begin school.",
    nursery.sections,
    "/academics/early-years"
  ),
  "primary-curriculum": make(
    "Learning / Primary curriculum",
    "Foundations that connect",
    "Literacy, mathematics, science, languages and creative learning help children connect knowledge with experience.",
    primary.sections,
    "/academics/primary"
  ),
  "primary-enrichment": make(
    "Learning / Primary beyond the classroom",
    "Discover interests together",
    "Creativity, movement and participation extend learning beyond a single lesson.",
    [
      {
        title: "Create",
        copy: "Making and creative expression help learners communicate ideas.",
      },
      {
        title: "Participate",
        copy: "Shared activities support teamwork, confidence and belonging.",
      },
      {
        title: "Discover",
        copy: "Ask the school for its current, approved activity programme and participation arrangements.",
      },
    ],
    "/academics/primary"
  ),
  "primary-wellbeing": make(
    "Learning / Primary wellbeing",
    "Confidence and belonging",
    "Respectful relationships, healthy routines and opportunities to ask for help support the primary years.",
    [
      {
        title: "Feel connected",
        copy: "Children build confidence through friendships and trusted relationships.",
      },
      {
        title: "Build healthy habits",
        copy: "Movement, rest and thoughtful routines contribute to wellbeing.",
      },
      {
        title: "Ask for support",
        copy: "Contact the school for the current support arrangements and appropriate contact person.",
      },
    ],
    "/academics/primary"
  ),
  "secondary-curriculum": make(
    "Learning / Secondary curriculum",
    "Understanding with depth",
    "Subject knowledge, independent study and thoughtful choices shape the secondary learning journey.",
    secondary.sections,
    "/academics/secondary"
  ),
  "secondary-enrichment": make(
    "Learning / Secondary beyond the classroom",
    "Interests with purpose",
    "Creative work, participation and contribution give learners room to grow.",
    [
      {
        title: "Express ideas",
        copy: "Creative work develops communication and the confidence to share ideas.",
      },
      {
        title: "Work with others",
        copy: "Participation offers opportunities to practise responsibility and collaboration.",
      },
      {
        title: "Plan your participation",
        copy: "The school will confirm current activities, availability and arrangements.",
      },
    ],
    "/academics/secondary"
  ),
  "secondary-wellbeing": make(
    "Learning / Secondary wellbeing",
    "Support for growing independence",
    "Relationships, balanced routines and clear conversations support learners as responsibility grows.",
    [
      {
        title: "Stay connected",
        copy: "Trusted relationships make it easier to discuss challenges and ask questions.",
      },
      {
        title: "Find a balance",
        copy: "Planning, movement, rest and reflection support steady learning habits.",
      },
      {
        title: "Know where to ask",
        copy: "Contact the school for its approved academic and wellbeing support routes.",
      },
    ],
    "/academics/secondary"
  ),
  "nursery-meals": make(
    "Learning / Nursery meals",
    "Meals at Nursery",
    "Information for Nursery families about daily meals and food arrangements will be added here after confirmation.",
    [{ title: "Daily arrangements", copy: "Approved Nursery meal times and arrangements are awaiting confirmation." }, { title: "Dietary requirements", copy: "The school will publish the verified process for discussing dietary needs." }, { title: "Questions about meals", copy: "Contact the school for current meal information while this page is being prepared." }],
    "/academics/early-years"
  ),
  "nursery-transport": make(
    "Learning / Nursery transport",
    "Getting to Nursery",
    "Approved travel and transport information for Nursery families will be added when supplied by the school.",
    [{ title: "Travel arrangements", copy: "Current Nursery travel options and eligibility are awaiting confirmation." }, { title: "Routes and schedules", copy: "Verified routes, stops and schedules will be published here when available." }, { title: "Plan your journey", copy: "Contact the school for confirmed transport information." }],
    "/academics/early-years"
  ),
  "primary-meals": make(
    "Learning / Primary meals",
    "Meals in Primary",
    "Information about meals during the Primary school day will be added once the school confirms current arrangements.",
    [{ title: "Daily arrangements", copy: "Approved meal times and service details are awaiting confirmation." }, { title: "Dietary requirements", copy: "Verified information about dietary needs and meal requests will be provided by the school." }, { title: "Questions about meals", copy: "Contact the school to request current Primary meal information." }],
    "/academics/primary"
  ),
  "primary-transport": make(
    "Learning / Primary transport",
    "Getting to Primary",
    "Verified travel information for Primary families will appear here when current details are supplied.",
    [{ title: "Travel arrangements", copy: "Approved transport options and eligibility are awaiting confirmation." }, { title: "Routes and schedules", copy: "Current route, stop and schedule information will be added after verification." }, { title: "Plan your journey", copy: "Contact the school for accurate transport information." }],
    "/academics/primary"
  ),
  "secondary-meals": make(
    "Learning / Secondary meals",
    "Meals in Secondary",
    "Information about meal arrangements for Secondary students will be added when confirmed by the school.",
    [{ title: "Daily arrangements", copy: "Approved Secondary meal times and options are awaiting confirmation." }, { title: "Dietary requirements", copy: "The school will provide verified information about dietary requests." }, { title: "Questions about meals", copy: "Contact the school for current meal arrangements." }],
    "/academics/secondary"
  ),
  "secondary-transport": make(
    "Learning / Secondary transport",
    "Getting to Secondary",
    "Verified travel and transport information for Secondary families will be added when supplied.",
    [{ title: "Travel arrangements", copy: "Current transport options and eligibility require school confirmation." }, { title: "Routes and schedules", copy: "Approved route and schedule information will be published here when verified." }, { title: "Plan your journey", copy: "Contact the school for accurate transport details." }],
    "/academics/secondary"
  ),
  "secondary-pathways": make(
    "Learning / Secondary next steps",
    "Planning your next steps",
    "Approved information about study choices and pathways beyond Secondary will be added here when supplied.",
    [{ title: "Explore options", copy: "Verified pathways and guidance information are awaiting confirmation." }, { title: "Plan with support", copy: "The school will describe the current guidance and support available to Secondary students." }, { title: "Ask a question", copy: "Contact the school for current information while this page is being prepared." }],
    "/academics/secondary"
  ),
  welcome: make(
    "Community / Community welcome",
    "A place to belong",
    "Students, families, teachers and staff contribute to one connected school experience.",
    [
      {
        title: "Start a conversation",
        copy: "Explore the learning stages and ask the school the questions that matter to your family.",
      },
      {
        title: "Stay connected",
        copy: "Approved public news and events offer a window into school life.",
      },
      {
        title: "Find the right information",
        copy: "Public resources and the secure portal serve different needs. Personal records remain protected.",
      },
    ],
    "/community"
  ),
  policy: make(
    "Admissions / Admissions policy",
    "Clear information before a decision",
    "Approved admissions policy and guidelines will be published here when confirmed by the school.",
    [
      {
        title: "Ask about your stage",
        copy: "Requirements and arrangements should be confirmed for Nursery, Primary or Secondary.",
      },
      {
        title: "Receive current guidance",
        copy: "Use the existing admissions enquiry to request the approved policy and application instructions.",
      },
    ],
    "/admissions"
  ),
  fees: make(
    "Admissions / Fees information",
    "Plan with accurate information",
    "Official school fees, payment arrangements and any additional charges are awaiting confirmation.",
    [
      {
        title: "Request the current fee schedule",
        copy: "Tell the school which learning stage you are considering. Ask for the approved fee schedule before making financial decisions.",
      },
      {
        title: "Know what is included",
        copy: "The school should confirm the scope, terms and any additional charges in its official information.",
      },
    ],
    "/admissions"
  ),
  "term-dates": make(
    "Admissions / Term dates",
    "Dates you can rely on",
    "An approved term-date calendar has not yet been provided for public publication.",
    [
      {
        title: "Request the official calendar",
        copy: "Ask the school for confirmed term dates and holidays.",
      },
      {
        title: "Public events",
        copy: "Published public events are available separately. Event dates are not a substitute for an approved term-date calendar.",
      },
    ],
    "/admissions"
  ),
  publications: make(
    "News & events / Publications",
    "School publications",
    "Approved school publications and accessible downloads will appear here when supplied.",
    [
      {
        title: "Awaiting approved documents",
        copy: "No school publications are currently available through the public website. No sample documents or placeholder downloads are presented.",
      },
      {
        title: "Read published notices",
        copy: "The existing public news feed contains notices approved by the school for public viewing.",
      },
    ],
    "/news-events"
  ),
  "directors-welcome": make(
    "About / Director’s welcome",
    "A welcome from our school director",
    "The approved welcome and profile from the school director will be added here once supplied.",
    [
      {
        title: "A welcome to the community",
        copy: "This section will introduce the director’s perspective on learning and community after the school approves its content.",
      },
      {
        title: "Our shared direction",
        copy: "The school’s approved priorities and message for families will be published here.",
      },
      {
        title: "An invitation",
        copy: "Families can contact the school with questions while this page is being prepared.",
      },
    ],
    "/about"
  ),
  "accreditation-memberships": make(
    "About / Accreditation and memberships",
    "Accreditation and memberships",
    "Verified accreditation and membership information will be published after the school confirms its current affiliations.",
    [
      {
        title: "Accreditation",
        copy: "No accrediting bodies are listed until the school supplies and approves the relevant details.",
      },
      {
        title: "Memberships and partnerships",
        copy: "Approved organisation names and logos will be added here after confirmation.",
      },
      {
        title: "Current information",
        copy: "Contact the school to request verified information about its current memberships.",
      },
    ],
    "/about"
  ),
  "community-spaces": make(
    "About / Community spaces",
    "Spaces for learning and connection",
    "Learn about the spaces that support learning and bring the Eckernforde Schools community together.",
    [
      {
        title: "Learning spaces",
        copy: "Descriptions and photographs of the school’s learning spaces will be added after confirmation.",
      },
      {
        title: "Shared spaces",
        copy: "The school will share approved information about spaces used by students, staff and families.",
      },
      {
        title: "Outdoor learning",
        copy: "Verified details about outdoor learning areas and activities are awaiting confirmation.",
      },
    ],
    "/about/campus-facilities"
  ),
  "work-for-us": make(
    "About / Work for Us",
    "Work for Us",
    "Approved information about working at the school will be published here when available.",
    [
      {
        title: "Working at the school",
        copy: "A description of the school’s working environment and staff community is awaiting approval.",
      },
      {
        title: "Professional learning",
        copy: "Verified information about staff development and benefits will be added after confirmation.",
      },
      {
        title: "Current opportunities",
        copy: "No vacancies are listed here. Contact the school to ask about current recruitment information.",
      },
    ],
    "/about"
  ),
};
const family: Record<string, string> = {
  About: "about",
  Learning: "academics",
  Admissions: "admissions",
  "School life": "school-life",
  Community: "community",
  "News & events": "news-events",
};
const layouts: Record<string, PageLayout> = {
  "our-story": "story",
  "mission-values": "values",
  "directors-welcome": "director",
  "accreditation-memberships": "memberships",
  "work-for-us": "careers",
  leadership: "governance",
  safeguarding: "safeguarding",
  "resources-policies": "resources",
  staff: "resources",
  families: "resources",
  alumni: "resources",
  welcome: "enrichment",
  journey: "process",
  requirements: "resources",
  policy: "resources",
  fees: "resources",
  "term-dates": "resources",
  publications: "resources",
  faqs: "faq",
  "early-years": "stage",
  primary: "stage",
  secondary: "stage",
  curriculum: "split",
  "nursery-learning": "split",
  "primary-curriculum": "split",
  "secondary-curriculum": "split",
  "nursery-wellbeing": "split",
  "nursery-meals": "editorial",
  "nursery-transport": "editorial",
  "primary-wellbeing": "split",
  "primary-meals": "editorial",
  "primary-transport": "editorial",
  "secondary-wellbeing": "split",
  "secondary-meals": "editorial",
  "secondary-transport": "editorial",
  "secondary-pathways": "resources",
  "nursery-enrichment": "enrichment",
  "primary-enrichment": "enrichment",
  "secondary-enrichment": "enrichment",
  "arts-music": "enrichment",
  "sports-wellbeing": "split",
  "clubs-activities": "enrichment",
  "campus-facilities": "campus",
  facilities: "campus",
};
const pending: Record<string, string> = {
  leadership:
    "Approved leadership names, roles, biographies and governance details are awaiting confirmation.",
  safeguarding:
    "The approved safeguarding policy and named school reporting contacts are awaiting confirmation. This page is general information, not the official policy.",
  requirements:
    "Official entry requirements, documents and assessments must be confirmed by the school for your child’s stage.",
  policy:
    "The approved admissions policy and guidelines are awaiting confirmation.",
  fees: "Official fees and payment terms are awaiting confirmation. No fee figures are published here.",
  "term-dates":
    "The official school calendar is awaiting confirmation. No term or holiday dates are published here.",
  "directors-welcome":
    "The director’s approved message, name and profile are awaiting confirmation.",
  "accreditation-memberships":
    "Accreditation and membership details are awaiting confirmation. No affiliations are claimed on this page.",
  "community-spaces":
    "Approved descriptions, photographs and access information for school community spaces are awaiting confirmation.",
  "work-for-us":
    "Approved staff information and vacancies are awaiting confirmation. No job openings or employment terms are represented here.",
  publications:
    "Approved publications are awaiting confirmation. No download links are available yet.",
  alumni:
    "Approved alumni programme details and stories are awaiting confirmation. No association, mentoring programme or alumni directory is claimed.",
  "clubs-activities":
    "Approved clubs, schedules and participation arrangements are awaiting confirmation. The content below describes learning aims.",
  "resources-policies":
    "Approved policy documents and review dates are awaiting confirmation.",
  examinations:
    "Current examination dates, entry requirements and results are awaiting confirmation. No results or examination timetable are published here.",
  "nursery-meals": "Current meal times, menus, dietary procedures and fees need school confirmation before publication.",
  "nursery-transport": "Routes, stops, schedules, eligibility and transport fees need confirmation before publication.",
  "primary-meals": "Current meal times, menus, dietary procedures and fees need school confirmation before publication.",
  "primary-transport": "Routes, stops, schedules, eligibility and transport fees need confirmation before publication.",
  "secondary-meals": "Current meal times, menus, dietary procedures and fees need school confirmation before publication.",
  "secondary-transport": "Routes, stops, schedules, eligibility and transport fees need confirmation before publication.",
  "secondary-pathways": "Approved guidance, pathways and support information are awaiting confirmation.",
};
const all = { ...DETAILS, ...EXTRA };
const labels: Record<string, string> = {
  "our-story": "Our story",
  "mission-values": "Mission and values",
  "directors-welcome": "A welcome from school leadership",
  leadership: "Leadership and governance",
  "accreditation-memberships": "Accreditations and memberships",
  "campus-facilities": "Campus and facilities",
  "community-spaces": "Community spaces",
  "nursery-meals": "Meals in Nursery",
  "nursery-transport": "Transport to Nursery",
  "primary-meals": "Meals in Primary",
  "primary-transport": "Transport to Primary",
  "secondary-meals": "Meals in Secondary",
  "secondary-transport": "Transport to Secondary",
  "secondary-pathways": "Secondary next steps",
  "work-for-us": "Careers at Eckernforde",
  safeguarding: "Safeguarding",
};
export const PUBLIC_PAGE_CATALOG: Record<string, PublicPageDefinition> =
  Object.fromEntries(
    Object.entries(all).map(([slug, content]) => {
      const path = "/" + family[content.eyebrow.split(" / ")[0]] + "/" + slug;
      const stage =
        ({
          "early-years": "Nursery",
          primary: "Primary",
          secondary: "Secondary",
          examinations: "Secondary",
        } as Record<string, string>)[slug] ||
        (slug.startsWith("nursery-")
          ? "Nursery"
          : slug.startsWith("primary-")
          ? "Primary"
          : slug.startsWith("secondary-")
          ? "Secondary"
          : undefined);
      const sections =
        slug === "alumni"
          ? [
              {
                title: "Approved stories",
                copy: "School-approved alumni stories can be published here once supplied.",
              },
              {
                title: "Stay in touch",
                copy: "Contact the school to ask about any current alumni arrangements.",
              },
            ]
          : content.sections;
      const intro =
        slug === "primary"
          ? "Primary learning connects knowledge, creativity and practical problem-solving with growing independence."
          : content.intro;
      return [
        path,
        {
          ...content,
          sections,
          intro,
          path,
          label: labels[slug] || stage || content.eyebrow.split(" / ").pop()!,
          stage,
          layout: layouts[slug] || "editorial",
          pending: pending[slug],
        },
      ];
    })
  );
export function resolvePublicPage(path: string) {
  return PUBLIC_PAGE_CATALOG[path.replace(/\/$/, "")];
}
