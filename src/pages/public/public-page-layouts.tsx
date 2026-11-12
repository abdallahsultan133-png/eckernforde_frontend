import { Link } from "react-router";
import {
  PublicPageHero,
  PublicLandscapeHero,
  PublicEditorialSections,
} from "@/components/public/public-editorial";
import {
  PublicEditorialReveal,
  PublicScrollChapters,
} from "@/components/public/public-internal-motion";
import { PublicArrowLink } from "@/components/public/public-shell";
import { PublicMedia } from "@/components/public/public-media";
import { PUBLIC_BRAND } from "@/components/public/public-brand";
import {
  PUBLIC_NAVIGATION,
  PUBLIC_STAGE_NAVIGATION,
} from "@/components/public/public-navigation";
import { ReferenceCampus } from "@/components/public/home/reference-home";
import {
  PUBLIC_PAGE_CATALOG,
  type PublicPageDefinition,
} from "./public-page-catalog";
export function PendingInformation({ children }: { children: string }) {
  return (
    <aside className="ref-pending-note">
      <strong>Awaiting school confirmation</strong>
      <p>{children}</p>
    </aside>
  );
}
export function RelatedPublicPages({
  path,
  back,
}: {
  path: string;
  back?: string;
}) {
  const category = PUBLIC_NAVIGATION.find(
    (g) => path === g.href || path.startsWith(g.href + "/")
  );
  const stage =
    path.includes("/nursery-") || path.endsWith("/early-years")
      ? "Nursery"
      : path.includes("/primary-") || path.endsWith("/primary")
      ? "Primary"
      : path.includes("/secondary-") || path.endsWith("/secondary")
      ? "Secondary"
      : undefined;
  const all = stage
    ? PUBLIC_STAGE_NAVIGATION[stage]
    : category?.items || [
        ["Explore learning", "/academics"],
        ["Admissions", "/admissions"],
        ["Contact the school", "/contact"],
      ];
  const links = all.filter(([, href]) => href !== path).slice(0, 3);
  return (
    <section className="ref-detail-links" aria-label="Related public pages">
      <h2>Continue exploring</h2>
      <div className="ref-related-list">
        {links.map(([label, href]) => (
          <Link key={href} to={href}>
            {label}
            <span aria-hidden="true">↗</span>
          </Link>
        ))}
      </div>
      {back && (
        <p style={{ marginTop: 35 }}>
          <Link className="public-text-link" to={back}>
            ← Back to {back.split("/").pop()!.replaceAll("-", " ")}
          </Link>
        </p>
      )}
    </section>
  );
}
function StoryJourney({ placeholderMedia = false }: { placeholderMedia?: boolean }) {
  return (
    <section className="ref-story-journey">
      <PublicEditorialReveal direction={-1}>
        <h2>One connected learning journey</h2>
      </PublicEditorialReveal>
      <ol>
        {PUBLIC_BRAND.stages.map((stage, i) => {
          const page = PUBLIC_PAGE_CATALOG[stage.href];
          return (
            <li key={stage.label}>
              <span aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
              <PublicEditorialReveal direction={i % 2 ? -1 : 1}>
                <h3>{stage.label}</h3>
                <p>{page.intro}</p>
                <PublicArrowLink to={stage.href}>
                  Explore {stage.label}
                </PublicArrowLink>
              </PublicEditorialReveal>
              <PublicMedia
                name={"story-" + stage.label}
                image={placeholderMedia ? undefined : (["community", "creative", "opening"] as const)[i]}
              />
            </li>
          );
        })}
      </ol>
    </section>
  );
}
function Statement({ title, copy }: { title: string; copy: string }) {
  return (
    <section className="ref-statement">
      <PublicEditorialReveal direction={-1}>
        <h2>{title}</h2>
      </PublicEditorialReveal>
      <PublicEditorialReveal direction={-1} delay={0.15}>
        <p>{copy}</p>
      </PublicEditorialReveal>
    </section>
  );
}
export function PublicFAQContent() {
  const groups = [
    [
      "Your first conversation",
      [
        [
          "What happens after I enquire?",
          "The school can respond using the contact details you provide in the existing admissions enquiry.",
        ],
        [
          "Which stages can I ask about?",
          "Eckernforde Schools serves Nursery, Primary and Secondary. The school can confirm the appropriate entry point for your child.",
        ],
      ],
    ],
    [
      "Visits and requirements",
      [
        [
          "Can I visit the school?",
          "Visit availability, dates and arrangements are confirmed directly by the school. Use Book a Visit to send a request.",
        ],
        [
          "Where can I find entry requirements?",
          "The school will provide current, verified requirements for the stage you select.",
        ],
      ],
    ],
    [
      "Fees and dates",
      [
        [
          "Where are school fees published?",
          "The official fee schedule is awaiting confirmation. Request the current approved information through the admissions enquiry.",
        ],
        [
          "Where can I find term dates?",
          "The approved term-date calendar is awaiting confirmation. Published public events are available in the events section.",
        ],
      ],
    ],
  ] as const;
  return (
    <section className="ref-faq-page">
      {groups.map(([title, items]) => (
        <section className="ref-faq-group" key={title}>
          <PublicEditorialReveal direction={-1}>
            <h2>{title}</h2>
          </PublicEditorialReveal>
          {items.map(([q, a]) => (
            <details key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </section>
      ))}
      <PublicArrowLink to="/admissions/visit">
        Ask about a visit
      </PublicArrowLink>
    </section>
  );
}

function GovernanceProfiles({
  title,
  intro,
  profiles,
  id,
}: {
  title: string;
  intro: string;
  profiles: Array<{ label: string; role: string }>;
  id: string;
}) {
  return (
    <section className="ref-governance-profiles ref-governance-sections" aria-labelledby={id}>
      <PublicEditorialReveal direction={-1}>
        <p className="ref-kicker">ECKERNFORDE SCHOOLS · {title}</p>
        <h2 id={id}>{title}</h2>
        <p className="ref-governance-profiles-intro">{intro}</p>
      </PublicEditorialReveal>
      <div className="ref-governance-profile-grid">
        {profiles.map((profile, index) => (
          <article className="ref-governance-profile" key={`${id}-${index}`}>
            <PublicMedia name={`leadership-${id}-${index + 1}`} />
            <div className="ref-governance-profile-copy">
              <span className="ref-kicker">{profile.role}</span>
              <h3>{profile.label}</h3>
              <details>
                <summary>Profile details</summary>
                <p>
                  Approved names, responsibilities, biographies, and profile
                  photography will be added here after confirmation by the
                  school.
                </p>
              </details>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function GovernancePage({ page }: { page: PublicPageDefinition }) {
  return (
    <>
      <section className="ref-governance-overview">
        <PublicEditorialReveal direction={-1}>
          <p className="ref-kicker">How the school is guided</p>
          <h2>Leadership and governance</h2>
          <p>
            This page will introduce Eckernforde Schools’ approved governance structure
            and school leadership. Names, roles, decision-making arrangements,
            and formal responsibilities are awaiting confirmation.
          </p>
        </PublicEditorialReveal>
      </section>

      <section className="ref-governance-principles" aria-label="Governance overview">
        <div className="ref-governance-principles-heading">
          <p className="ref-kicker">Governance overview · details to be confirmed</p>
          <h2>Clear stewardship. Shared purpose.</h2>
          <p>
            The school will publish its approved governance model here. Until
            then, these themes provide the page structure without claiming a
            particular board, legal status, committee, or reporting line.
          </p>
        </div>
        <div className="ref-governance-principles-list">
          {page.sections.map((section, index) => (
            <article key={section.title}>
              <span aria-hidden="true">0{index + 1}</span>
              <h3>{section.title}</h3>
              <p>{section.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <GovernanceProfiles
        id="governance-body-profiles"
        title="Governance profiles"
        intro="The governing structure and its members will be introduced here when the school confirms the details for publication."
        profiles={[
          { label: "Profile to be confirmed", role: "Governance" },
          { label: "Profile to be confirmed", role: "Governance" },
          { label: "Profile to be confirmed", role: "Governance" },
          { label: "Profile to be confirmed", role: "Governance" },
          { label: "Profile to be confirmed", role: "Governance" },
          { label: "Profile to be confirmed", role: "Governance" },
        ]}
      />

      <GovernanceProfiles
        id="school-leadership-profiles"
        title="School leadership"
        intro="Meet the people guiding Nursery, Primary, and Secondary once approved names and responsibilities are available."
        profiles={[
          { label: "Profile to be confirmed", role: "Nursery" },
          { label: "Profile to be confirmed", role: "Primary" },
          { label: "Profile to be confirmed", role: "Secondary" },
        ]}
      />

      <PendingInformation>
        Eckernforde Schools’ official governance structure, leadership names and roles,
        biographies, and approved photographs are required before these
        placeholders can be replaced.
      </PendingInformation>
    </>
  );
}

export function PublicPageLayout({ page }: { page: PublicPageDefinition }) {
  const image = page.path.startsWith("/about/") || page.path.startsWith("/academics/")
    ? undefined
    : page.path.includes("arts") || page.path.includes("primary")
      ? "creative"
      : page.path.includes("community") ||
        page.path.includes("nursery") ||
        page.path.endsWith("early-years")
      ? "community"
      : "opening";
  return (
    <>
      {page.layout === "campus" ? (
        <PublicLandscapeHero
          title={page.label}
          intro="Approved campus descriptions, photographs and location information are awaiting confirmation."
          media="campus-landscape"
        />
      ) : (
        <PublicPageHero
          title={page.label}
          label={page.eyebrow}
          intro={page.intro}
          media={page.path + "-hero"}
          image={image}
          stage={page.layout === "stage" ? page.stage : undefined}
        />
      )}
      {page.pending && page.layout !== "governance" && (
        <PendingInformation>{page.pending}</PendingInformation>
      )}
      {page.layout === "story" ? (
        <>
          <PublicEditorialSections
            sections={page.sections.slice(0, 1)}
            prefix="school-story"
            placeholderMedia
          />
          <Statement
            title="Learning with purpose"
            copy={page.sections[1].copy}
          />
          <StoryJourney placeholderMedia />
          <PendingInformation>
            Confirmed school history and historical dates are awaiting approval.
            The journey above describes the Nursery, Primary and Secondary
            stages.
          </PendingInformation>
        </>
      ) : page.layout === "values" ? (
        <>
          <Statement title={page.title} copy={page.intro} />
          <section className="ref-values-grid">
            <div className="ref-values-heading"><span className="ref-kicker">Our values</span><h2>Purpose in everyday learning</h2></div>
            <div className="ref-values-cards">
              {page.sections.map((section, i) => <article key={section.title}><span>0{i + 1}</span><h3>{section.title}</h3><p>{section.copy}</p></article>)}
            </div>
          </section>
          <section className="ref-values-community">
            <PublicMedia name="mission-community" />
            <div><span className="ref-kicker">A shared community</span><h2>Learning belongs to all of us.</h2><p>Approved school language and photography for this community story will be added here.</p></div>
          </section>
          <section className="ref-learning-principles">
            <span className="ref-kicker">How we learn</span><h2>Learning principles</h2>
            <p>The school’s approved learning principles will be introduced here.</p>
            <div>{Array.from({ length: 6 }, (_, i) => <article key={i}><span>0{i + 1}</span><h3>Principle to be confirmed</h3><p>Approved description to follow.</p></article>)}</div>
          </section>
        </>
      ) : page.layout === "process" ? (
        <ol className="ref-process">
          {page.sections.map((s, i) => (
            <li key={s.title}>
              <span className="ref-process-number" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <PublicEditorialReveal direction={i % 2 ? -1 : 1}>
                  <h2>{s.title}</h2>
                </PublicEditorialReveal>
                <PublicEditorialReveal direction={i % 2 ? -1 : 1} delay={0.14}>
                  <p>{s.copy}</p>
                  <PublicArrowLink
                    to={i === 1 ? "/admissions/visit" : "/admissions"}
                  >
                    {i === 1 ? "Ask about a visit" : "Make an enquiry"}
                  </PublicArrowLink>
                </PublicEditorialReveal>
              </div>
            </li>
          ))}
        </ol>
      ) : page.layout === "governance" ? (
        <GovernancePage page={page} />
      ) : page.layout === "safeguarding" ? (
        <>
          <nav className="ref-safeguarding-index" aria-label="Safeguarding page sections">
            {page.sections.map((section, i) => <a key={section.title} href={"#safeguarding-" + (i + 1)}>{section.title}<span aria-hidden="true">↘</span></a>)}
          </nav>
          <div className="ref-safeguarding-sections">
            {page.sections.map((section, i) => (
              <section key={section.title} id={"safeguarding-" + (i + 1)}>
                <span className="ref-kicker">Safeguarding · 0{i + 1}</span><h2>{section.title}</h2><p>{section.copy}</p>
              </section>
            ))}
          </div>
          <PendingInformation>The school’s approved safeguarding policy, reporting contacts and emergency procedures must be added before this page is treated as official guidance.</PendingInformation>
        </>
      ) : page.layout === "resources" ? (
        <section className="ref-resource-sections">
          {page.sections.map((s, i) => (
            <section key={s.title}>
              <PublicEditorialReveal direction={i % 2 ? -1 : 1}>
                <h2>{s.title}</h2>
              </PublicEditorialReveal>
              <PublicEditorialReveal direction={i % 2 ? -1 : 1} delay={0.14}>
                <p>{s.copy}</p>
              </PublicEditorialReveal>
            </section>
          ))}
          <section>
            <h2>
              {page.path.includes("admissions")
                ? "Ask the admissions team"
                : "Find the right next step"}
            </h2>
            <p>
              {page.path.includes("families")
                ? "Personal learning records and family tools remain in the secure school portal."
                : "Ask the school for the current, approved information appropriate to your question."}
            </p>
            <PublicArrowLink
              to={
                page.path.includes("families")
                  ? "/portal"
                  : page.path.includes("admissions")
                  ? "/admissions"
                  : "/contact"
              }
            >
              {page.path.includes("families")
                ? "GO TO PORTAL"
                : "Contact the school"}
            </PublicArrowLink>
          </section>
        </section>
      ) : page.layout === "enrichment" ? (
        <div className="ref-enrichment">
          {page.sections.map((s, i) => (
            <section key={s.title}>
              <PublicMedia
                name={page.path + "-" + i}
                image={page.path.startsWith("/academics/") ? undefined : (["creative", "community", "opening"] as const)[i % 3]}
              />
              <div className="ref-enrichment-panel">
                <PublicEditorialReveal direction={i % 2 ? -1 : 1}>
                  <h2>{s.title}</h2>
                </PublicEditorialReveal>
                <PublicEditorialReveal direction={i % 2 ? -1 : 1} delay={0.14}>
                  <p>{s.copy}</p>
                </PublicEditorialReveal>
              </div>
            </section>
          ))}
        </div>
      ) : page.layout === "split" ? (
        <PublicScrollChapters chapters={page.sections} label={page.label} placeholderMedia={page.path.startsWith("/academics/")} />
      ) : page.layout === "faq" ? (
        <PublicFAQContent />
      ) : page.layout === "campus" ? (
        <div id="landscape-content">
          <ReferenceCampus standalone />
          <PublicEditorialSections
            sections={[
              {
                title: "Learning spaces",
                copy: "Approved classroom and specialist-room descriptions and accessibility details are awaiting confirmation.",
              },
              {
                title: "Outdoor spaces",
                copy: "A verified account of the school’s outdoor facilities will be published alongside approved photography.",
              },
            ]}
            prefix="campus"
            placeholderMedia
          />
        </div>
      ) : page.layout === "director" ? (
        <>
          <section className="ref-director-intro">
            <div className="ref-director-intro-copy">
              <span className="ref-kicker">A message from the school</span>
              <h2>Welcome to our learning community</h2>
              <p>{page.sections[0]?.copy ?? page.intro}</p>
            </div>
            <PublicMedia name="directors-welcome-portrait" />
          </section>
          <PublicEditorialSections
            sections={page.sections.slice(1)}
            prefix="directors-welcome"
            placeholderMedia
          />
          <section className="ref-welcome-film">
            <PublicMedia name="director-welcome-film" />
            <p className="ref-kicker">Welcome film · media to follow</p>
          </section>
        </>
      ) : page.layout === "memberships" ? (
        <>
          <PublicEditorialSections
            sections={page.sections}
            prefix="accreditation-memberships"
            placeholderMedia
          />
          <section className="ref-membership-placeholders" aria-label="Accreditations and memberships">
            <span className="ref-kicker">School affiliations</span>
            <h2>Accreditations and memberships</h2>
            <div className="ref-membership-grid">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="ref-membership-tile">
                  <span aria-hidden="true">—</span>
                  <strong>Details to be confirmed</strong>
                  <small>No affiliation is claimed here.</small>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : page.layout === "careers" ? (
        <>
          <section className="ref-careers-lead">
            <PublicEditorialReveal>
              <h2>Work with our school community</h2>
              <p>{page.sections[0]?.copy ?? page.intro}</p>
            </PublicEditorialReveal>
          </section>
          <PublicEditorialSections
            sections={page.sections.slice(1)}
            prefix="work-for-us"
            placeholderMedia
          />
          <PendingInformation>
            No vacancies are listed until the school provides and approves current recruitment information.
          </PendingInformation>
        </>
      ) : (
        <>
          <PublicEditorialSections
            sections={page.sections}
            prefix={page.path}
            placeholderMedia={
              page.path.startsWith("/academics/") ||
              page.path === "/about/community-spaces"
            }
          />
          {page.layout === "stage" && (
            <Statement
              title="Your next chapter"
              copy="Explore the learning stage, ask questions and receive current information directly from the school."
            />
          )}
        </>
      )}
      <RelatedPublicPages path={page.path} back={page.back} />
    </>
  );
}
