import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowDown, ArrowRight, MapPin, X } from "lucide-react";
import { useRef, useState } from "react";
import { Link } from "react-router";
import { useApiQuery } from "@/hooks/use-api-query";
import { PublicMedia } from "../public-media";
import { PublicOverlay } from "../public-overlay";
import { PublicArrowLink } from "../public-shell";
import "./reference-home.css";

export function ReferenceOpening() {
  const section = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end start"] });
  const scale = useTransform(scrollYProgress, [0, .65], [1, .33]);
  const opacity = useTransform(scrollYProgress, [0, .35], [1, 0]);
  // A derived value keeps this tied to the section, including browsers whose
  // native scroll-timeline interpolation normalises opacity against the page.
  const introOpacity = useTransform(() => Math.max(0, Math.min(1, (.48 - scrollYProgress.get()) / .16)));
  return <><section ref={section} className="ref-opening" aria-labelledby="public-home-title">
    <div className="ref-opening-startup" aria-hidden="true"><PublicMedia name="nursery-opening-portrait" /><PublicMedia name="primary-opening-portrait" /><PublicMedia name="secondary-opening-portrait" /><PublicMedia name="community-opening-portrait" /></div>
    <motion.div className="ref-opening-image" style={reduced ? undefined : { scale }}><PublicMedia name="school-opening" image="opening" eager /></motion.div>
    <motion.h1 id="public-home-title" style={reduced ? undefined : { opacity }}>A place to learn.<span>A place to grow.</span></motion.h1>
    <motion.div className="ref-opening-intro" style={reduced ? undefined : { opacity: introOpacity }}><p>From the first questions in Nursery to new possibilities in Secondary, ACADEMIX brings learning, friendship and family together. Explore our school, meet our community and find the next step in your child’s education.</p></motion.div>
    <a href="#school-community" className="ref-opening-scroll" aria-label="Discover ACADEMIX"><ArrowDown /></a>
  </section><div className="ref-mobile-intro"><p>From the first questions in Nursery to new possibilities in Secondary, ACADEMIX brings learning, friendship and family together. Explore our school and find the next step in your child’s education.</p></div></>;
}

export function ReferenceIdentity() {
  return <section className="ref-identity" id="school-community" aria-labelledby="identity-heading"><div className="ref-identity-gallery" aria-hidden="true"><PublicMedia name="nursery-learning" /><PublicMedia name="creative-learning" image="creative" /><PublicMedia name="primary-outdoor-learning" /><PublicMedia name="school-friendships" /><PublicMedia name="school-community" image="community" /><PublicMedia name="sport-and-movement" /></div><div className="ref-identity-panel"><details className="ref-identity-quote"><summary aria-label="Community voices">“</summary><div><h3>Community voices</h3><p>An approved student or family perspective will appear here. A quotation and publication consent are still to be supplied.</p></div></details><h2 id="identity-heading">We are ACADEMIX</h2><p>A school journey is made of people, questions and discoveries. Across Nursery, Primary and Secondary, we value curiosity, kindness and the confidence to contribute. Families, students and teachers each have a part to play in a community where learning and belonging grow together.</p><PublicArrowLink to="/about/mission-values">Our mission and values</PublicArrowLink></div></section>;
}

const FACILITIES = [
  { key: "learning", title: "Learning spaces", stage: "NURSERY · PRIMARY · SECONDARY", image: "campus-learning-spaces", copy: "Discover the spaces that support each stage of the ACADEMIX learning journey. Approved room descriptions, facilities information and photographs are awaiting publication.", route: "/about/campus-facilities" },
  { key: "outdoor", title: "Life beyond the classroom", stage: "SCHOOL LIFE", image: "campus-outdoor-spaces", copy: "Explore the setting for school life, movement and shared experiences. The school’s outdoor facilities, activity details and location information are awaiting confirmation.", route: "/school-life/facilities" },
];
export function ReferenceCampus({ standalone = false }: { standalone?: boolean }) {
  const [active, setActive] = useState<(typeof FACILITIES)[number] | null>(null);
  return <section className={`ref-campus ${standalone ? "ref-campus-standalone" : ""}`} aria-labelledby="campus-heading"><PublicMedia name="campus-aerial" className="ref-campus-background" /><div className="ref-campus-top"><h2 id="campus-heading">Space to discover.</h2><div className="ref-campus-facts"><p><strong>3</strong><span>stages: Nursery, Primary and Secondary</span></p><p><strong>—</strong><span>campus details awaiting confirmation</span></p><p><strong>—</strong><span>facilities information to follow</span></p></div></div><p className="ref-campus-context">Campus photograph and location plan to follow.<br />Explore the school spaces below.</p><div className="ref-campus-markers">{FACILITIES.map(f => <button key={f.key} className={`ref-campus-marker ref-campus-marker--${f.key}`} onClick={() => setActive(f)}><span>{f.title}</span><MapPin size={54} fill="white" strokeWidth={1} aria-hidden="true" /></button>)}</div><Link className="ref-campus-tour" to="/admissions/visit"><span><ArrowRight size={35} aria-hidden="true" /></span><b>PLAN A SCHOOL VISIT</b></Link>
    {active && <PublicOverlay label={active.title} onClose={() => setActive(null)} className="ref-campus-overlay"><div className="ref-campus-dialog"><button className="ref-close" aria-label="Close campus details" onClick={() => setActive(null)}><X /></button><div className="ref-campus-dialog-copy"><p className="ref-kicker">{active.stage}</p><h2>{active.title}</h2><p>{active.copy}</p><div className="ref-campus-dialog-facts"><span><strong>—</strong> Student numbers to be confirmed</span><span><strong>—</strong> Facility details to be confirmed</span></div><div className="ref-campus-dialog-actions"><PublicArrowLink to={active.route}>Find out more</PublicArrowLink><PublicArrowLink to="/admissions/visit">Plan a visit</PublicArrowLink></div></div><div className="ref-campus-dialog-image"><PublicMedia name={active.image} /><div><p className="ref-kicker">WHERE WE ARE</p><p>Verified school address<br />awaiting confirmation.</p><Link to="/contact">Contact information →</Link></div></div></div></PublicOverlay>}
  </section>;
}

type News = { id: number; title: string; content: string; createdAt: string };
type Event = { id: number; title: string; description: string | null; startAt: string; type: string };
function dateLabel(value: string) { return new Date(value).toLocaleDateString("en", { day: "numeric", month: "short" }); }

export function ReferenceMosaic() {
  const section = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0, 1], ["0vw", "-95vw"]);
  const now = new Date();
  const from = now.toISOString().slice(0, 10), to = new Date(now.getTime() + 90 * 86400000).toISOString().slice(0, 10);
  const news = useApiQuery<{ data: News[] }>("/announcements/public", { staleTime: 60_000 });
  const events = useApiQuery<{ data: Event[] }>(`/calendar/public?from=${from}&to=${to}`, { staleTime: 60_000 });
  const story = news.data?.data[0]; const event = events.data?.data[0];
  return <section ref={section} className={`ref-glance ${reduced ? "ref-glance-static" : ""}`} aria-labelledby="glance-heading"><motion.div className="ref-mosaic-canvas" style={reduced ? undefined : { x }}>
    <div className="ref-mosaic-intro"><h2 id="glance-heading">ACADEMIX at a glance</h2><p>Three learning stages. A shared school journey. Discover the people, experiences and published stories that connect our community.</p></div>
    <div className="ref-stat ref-stat-green"><strong>3</strong><span>learning stages,<br />from Nursery<br />to Secondary</span></div>
    <figure className="ref-mosaic-photo ref-mosaic-photo-one"><PublicMedia name="outdoor-discovery" /><figcaption>Learning beyond the classroom</figcaption></figure>
    <article className="ref-mosaic-news"><PublicMedia name="school-news" /><div className="ref-mosaic-caption"><p className="ref-kicker">LATEST NEWS</p>{news.isLoading ? <p role="status">Loading school news…</p> : news.isError ? <div className="ref-feed-error"><h3>School news is temporarily unavailable.</h3><button onClick={() => news.refetch()}>Try again</button></div> : story ? <><h3>{story.title}</h3><p className="ref-story-preview">{story.content}</p><PublicArrowLink to="/news-events">Read school news</PublicArrowLink></> : <><h3>Our next story starts here.</h3><p>No public news has been published yet.</p><PublicArrowLink to="/news-events">School news</PublicArrowLink></>}</div>{story && <time className="ref-date-tab" dateTime={story.createdAt}>{dateLabel(story.createdAt)}</time>}</article>
    <figure className="ref-mosaic-photo ref-mosaic-photo-two"><PublicMedia name="arts-and-performance" /><figcaption>Ideas, creativity and expression</figcaption></figure>
    <Link className="ref-mosaic-connect" to="/community">CONNECT WITH OUR COMMUNITY <ArrowRight size={25} /></Link>
    <div className="ref-stat ref-stat-blue"><strong>—</strong><span>School achievement<br />figures awaiting<br />confirmation</span></div>
    <Link className="ref-mosaic-film ref-mosaic-film-one" to="/school-life"><PublicMedia name="outdoor-learning-film" /><div>Discover school life <span>→</span></div></Link>
    <article className="ref-mosaic-event"><PublicMedia name="school-events" /><div className="ref-mosaic-caption"><p className="ref-kicker">COMMUNITY & EVENTS</p>{events.isLoading ? <p role="status">Loading public events…</p> : events.isError ? <div className="ref-feed-error"><h3>Public events are temporarily unavailable.</h3><button onClick={() => events.refetch()}>Try again</button></div> : event ? <><h3>{event.title}</h3>{event.description && <p className="ref-story-preview">{event.description}</p>}<PublicArrowLink to="/news-events">View public events</PublicArrowLink></> : <><h3>More moments to share.</h3><p>No public events have been published yet.</p><PublicArrowLink to="/news-events">News and events</PublicArrowLink></>}</div>{event && <time className="ref-date-tab" dateTime={event.startAt}>{dateLabel(event.startAt)}</time>}</article>
    <figure className="ref-mosaic-photo ref-mosaic-photo-three"><PublicMedia name="first-day-at-school" /><figcaption>New beginnings, shared together</figcaption></figure>
    <div className="ref-stat ref-stat-red"><strong>—</strong><span>Clubs and activities<br />details to follow</span></div>
    <Link className="ref-mosaic-film ref-mosaic-film-two" to="/community"><PublicMedia name="community-celebration-film" /><div>Meet our community <span>→</span></div></Link>
  <div className="ref-community-ending"><p>Learning grows through the connections we make. Families, students and staff each bring something to our school community.</p><PublicArrowLink to="/community">Get involved</PublicArrowLink></div></motion.div></section>;
}

export const SCHOOL_STAGES = [
  { name: "Nursery", kicker: "FIRST STEPS", image: "nursery-learning", href: "/academics/early-years", copy: "Time to play, ask questions and discover the joy of learning." },
  { name: "Primary", kicker: "GROWING FOUNDATIONS", image: "primary-outdoor-learning", href: "/academics/primary", copy: "Building knowledge, confidence and curiosity through a broad learning journey." },
  { name: "Secondary", kicker: "NEW POSSIBILITIES", image: "secondary-science", href: "/academics/secondary", copy: "Deeper understanding, growing independence and thoughtful choices for the future." },
];
export function ReferenceStages() {
  return <section className="ref-stages" aria-label="Our school stages">{SCHOOL_STAGES.map(s => <article key={s.name}><PublicMedia name={s.image} /><div className="ref-stage-copy"><p className="ref-kicker">{s.kicker}</p><h3><Link to={s.href}>{s.name}</Link></h3><div className="ref-stage-more"><p>{s.copy}</p><PublicArrowLink to={s.href}>Explore {s.name}</PublicArrowLink></div></div></article>)}</section>;
}
