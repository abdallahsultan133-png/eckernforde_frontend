import "./public-internal-pages.css";
import { Link } from "react-router";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { PublicMedia, type PUBLIC_MEDIA } from "./public-media";
import { PublicPageMeta } from "./public-page-meta";
import { PublicArrowLink } from "./public-shell";
import { PublicEditorialReveal } from "./public-internal-motion";
import { usePublicReducedMotion } from "./public-motion";
export function PublicBreadcrumb({ label }: { label: string }) {
  const parts = label.split(" / "),
    parent = parts.length > 1 ? parts[0] : undefined;
  const routes: Record<string, string> = {
    About: "/about",
    Learning: "/academics",
    Academics: "/academics",
    Admissions: "/admissions",
    Community: "/community",
    "School life": "/school-life",
    "News & events": "/news-events",
  };
  return (
    <nav className="ref-breadcrumb" aria-label="Breadcrumb">
      <Link to="/">Home</Link>
      <span aria-hidden="true">↗</span>
      {parent && routes[parent] && (
        <>
          <Link to={routes[parent]}>{parent}</Link>
          <span aria-hidden="true">↗</span>
        </>
      )}
      <span aria-current="page">{parts[parts.length - 1]}</span>
    </nav>
  );
}
export function PublicLandscapeHero({
  title,
  intro,
  media,
}: {
  title: string;
  intro: string;
  media: string;
}) {
  return (
    <section className="ref-landscape-hero">
      <PublicPageMeta title={title} description={intro} />
      <PublicMedia name={media} eager />
      <div>
        <PublicBreadcrumb label={title} />
        <h1>{title}</h1>
        <p>{intro}</p>
      </div>
      <a
        href="#landscape-content"
        className="ref-landscape-down"
        aria-label="Discover more"
      >
        ↓
      </a>
    </section>
  );
}
export function PublicPageHero({
  title,
  label,
  intro,
  media,
  image,
  stage,
}: {
  title: string;
  label: string;
  intro: string;
  media: string;
  image?: keyof typeof PUBLIC_MEDIA;
  stage?: string;
}) {
  const target = useRef<HTMLElement>(null),
    reduced = usePublicReducedMotion();
  const { scrollYProgress } = useScroll({
    target,
    offset: ["start start", "end start"],
  });
  const mediaY = useTransform(scrollYProgress, [0, 1], [0, 160]),
    titleY = useTransform(scrollYProgress, [0, 1], [0, -120]);
  return (
    <>
      <PublicPageMeta title={label} description={intro} />
      {stage ? (
        <section
          ref={target}
          className="ref-stage-banner"
          data-stage={stage.toLowerCase()}
        >
          <motion.div
            className="ref-stage-motion-media"
            style={reduced ? undefined : { y: mediaY }}
          >
            <PublicMedia name={media} image={image} eager />
          </motion.div>
          <motion.div
            className="ref-stage-banner-copy"
            style={reduced ? undefined : { y: titleY }}
          >
            <PublicBreadcrumb label={label} />
            <h1>
              Welcome to our<span>{stage}</span>
            </h1>
            <PublicArrowLink to="/admissions">
              Discover your next step
            </PublicArrowLink>
          </motion.div>
          <a
            className="ref-stage-down"
            href="#page-intro"
            aria-label={"Explore " + stage}
          >
            ↓
          </a>
        </section>
      ) : (
        <section ref={target} className="ref-page-banner">
          <PublicMedia name={media} image={image} eager />
        </section>
      )}
      <section id="page-intro" className="ref-page-intro">
        {!stage && (
          <>
            <PublicBreadcrumb label={label} />
            <h1>{title}</h1>
          </>
        )}
        <div className="ref-reading">
          <p className="ref-lead">{intro}</p>
        </div>
      </section>
    </>
  );
}
export type EditorialSection = { title: string; copy: string; href?: string };
export function PublicEditorialSections({
  sections,
  prefix,
  placeholderMedia = false,
}: {
  sections: EditorialSection[];
  prefix: string;
  /** Keep editorial image positions while awaiting approved school photography. */
  placeholderMedia?: boolean;
}) {
  return (
    <div className="ref-editorial-sections">
      {sections.map((s, i) => (
        <section className="ref-editorial-row" key={s.title}>
          <PublicMedia
            name={prefix + "-" + (i + 1)}
            image={placeholderMedia ? undefined : (["creative", "community", "opening"] as const)[i % 3]}
          />
          <div className="ref-editorial-copy">
            <PublicEditorialReveal direction={i % 2 ? -1 : 1}>
              <h2>{s.title}</h2>
            </PublicEditorialReveal>
            <PublicEditorialReveal direction={i % 2 ? -1 : 1} delay={0.14}>
              <p>{s.copy}</p>
              {s.href && (
                <PublicArrowLink to={s.href}>Find out more</PublicArrowLink>
              )}
            </PublicEditorialReveal>
          </div>
        </section>
      ))}
    </div>
  );
}
