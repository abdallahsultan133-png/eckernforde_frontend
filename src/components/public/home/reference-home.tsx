import { AnimatePresence, motion, useTransform } from "framer-motion";
import { ArrowDown, ArrowRight, MapPin, X } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Link } from "react-router";
import { useApiQuery } from "@/hooks/use-api-query";
import { PublicMedia } from "../public-media";
import { PublicOverlay } from "../public-overlay";
import { usePublicReducedMotion } from "../public-motion";
import { PublicArrowLink } from "../public-shell";
import { clampProgress, usePublicScroll } from "./use-public-scroll";
import "./reference-home.css";

export function ReferenceOpening() {
  const { section, geometry, distance } = usePublicScroll();
  const reduced = usePublicReducedMotion();
  const desktop = geometry.width >= 992 && !reduced;
  const contraction = useTransform(() => clampProgress((distance.get() - geometry.viewport * .298) / (geometry.viewport * 1.298)));
  const scale = useTransform(() => 1 - .4 * (1 - Math.pow(1 - clampProgress(contraction.get() * 1.5), 2)));
  const clipPath = useTransform(() => {
    const p = contraction.get();
    const eased = p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
    const landscapeBottom = Math.max(0, geometry.height * .72 - geometry.viewport);
    return `inset(0% ${50 * eased}% ${landscapeBottom + (geometry.height - landscapeBottom) * eased}px ${50 * eased}%)`;
  });
  const titleY = useTransform(() => geometry.viewport * .75 * clampProgress(distance.get() / (geometry.viewport * .298)));
  const introY = useTransform(() => -titleY.get());
  const imageY = useTransform(() => titleY.get() * .2);
  const stripY = Math.min(geometry.width * .4736, geometry.viewport * .65);
  const landscapeClipTop = stripY + geometry.width * .93456 - geometry.viewport;
  const startupStyle = {
    "--opening-strip-y": `${stripY}px`,
    "--opening-landscape-clip-top": `${landscapeClipTop}px`,
    "--opening-landscape-clip-bottom": `${Math.max(0, Math.max(geometry.viewport, geometry.width * 1.298) - landscapeClipTop - geometry.width * .2207)}px`,
  } as CSSProperties;
  return <><section ref={section} className="ref-opening" style={startupStyle} aria-labelledby="public-home-title">
    <motion.div className="ref-opening-composition" style={desktop ? { scale, clipPath } : { scale: 1, clipPath: "none" }}>
    <div className="ref-opening-startup" aria-hidden="true"><PublicMedia name="nursery-opening-portrait" image="community" eager /><PublicMedia name="primary-opening-portrait" image="creative" eager /><PublicMedia name="secondary-opening-portrait" image="creative" eager /><PublicMedia name="community-opening-portrait" image="community" eager /></div>
    <motion.div className="ref-opening-image" style={desktop ? { y: imageY } : { y: 0 }}><PublicMedia name="school-opening" image="opening" eager /></motion.div>
    <motion.h1 id="public-home-title" style={desktop ? { y: titleY } : { y: 0 }}>A place to learn.<span>A place to grow.</span></motion.h1>
    <motion.div className="ref-opening-image ref-opening-foreground" aria-hidden="true" style={desktop ? { y: imageY } : { y: 0 }}><PublicMedia name="school-opening-foreground" image="opening" eager /></motion.div>
    <motion.div className="ref-opening-intro" style={desktop ? { y: introY } : { y: 0 }}><p>From the first questions in Nursery to new possibilities in Secondary, Eckernforde Schools brings learning, friendship and family together. Explore our school, meet our community and find the next step in your child’s education.</p></motion.div>
    <a href="#school-community" className="ref-opening-scroll" aria-label="Discover Eckernforde Schools"><ArrowDown /></a>
  </motion.div></section><div className="ref-mobile-intro"><p>From the first questions in Nursery to new possibilities in Secondary, Eckernforde Schools brings learning, friendship and family together. Explore our school and find the next step in your child’s education.</p></div></>;
}

export function ReferenceIdentity() {
  const { section, geometry, distance } = usePublicScroll();
  const reduced = usePublicReducedMotion();
  const [quoteOpen, setQuoteOpen] = useState(false);
  const quoteTrigger = useRef<HTMLButtonElement>(null);
  const closeQuote = () => { setQuoteOpen(false); quoteTrigger.current?.focus(); };
  useEffect(() => {
    if (!quoteOpen) return;
    document.querySelector<HTMLElement>("#community-voice button")?.focus();
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { setQuoteOpen(false); quoteTrigger.current?.focus(); } };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [quoteOpen]);
  const galleryX = useTransform(() => {
    const progress = clampProgress((distance.get() + geometry.viewport + 50) / (geometry.height + geometry.viewport + 50));
    return -(geometry.width * .64) * (1 - Math.pow(1 - progress, 2));
  });
  return <section ref={section} className="ref-identity" id="school-community" aria-labelledby="identity-heading"><motion.div className="ref-identity-gallery" aria-hidden="true" style={geometry.width >= 768 && !reduced ? { x: galleryX } : { x: 0 }}><PublicMedia name="nursery-learning" /><PublicMedia name="creative-learning" image="creative" /><PublicMedia name="primary-outdoor-learning" /><PublicMedia name="school-friendships" /><PublicMedia name="school-community" image="community" /><PublicMedia name="sport-and-movement" /></motion.div><div className="ref-identity-panel"><button ref={quoteTrigger} className="ref-quote-toggle" aria-label="Community voices" aria-expanded={quoteOpen} aria-controls="community-voice" onClick={() => setQuoteOpen(true)}>“</button><div id="community-voice" className={quoteOpen ? "ref-quote-panel is-open" : "ref-quote-panel"} inert={!quoteOpen} aria-hidden={!quoteOpen} onKeyDown={e => { if (e.key === "Escape") closeQuote(); }}><button className="ref-quote-toggle" aria-label="Close community voices" onClick={closeQuote}><X size={18} /></button><h3>Community voices</h3><p>An approved student or family perspective will appear here. A quotation and publication consent are still to be supplied.</p></div><h2 id="identity-heading">We are Eckernforde Schools</h2><p>A school journey is made of people, questions and discoveries. Across Nursery, Primary and Secondary, we value curiosity, kindness and the confidence to contribute. Families, students and teachers each have a part to play in a community where learning and belonging grow together.</p><PublicArrowLink to="/about/mission-values">Our mission and values</PublicArrowLink></div></section>;
}

const FACILITIES = [
  { key: "learning", title: "Learning spaces", stage: "NURSERY · PRIMARY · SECONDARY", image: "campus-learning-spaces", copy: "Discover the spaces that support each stage of the Eckernforde Schools learning journey. Approved room descriptions, facilities information and photographs are awaiting publication.", route: "/about/campus-facilities" },
  { key: "outdoor", title: "Life beyond the classroom", stage: "SCHOOL LIFE", image: "campus-outdoor-spaces", copy: "Explore the setting for school life, movement and shared experiences. The school’s outdoor facilities, activity details and location information are awaiting confirmation.", route: "/school-life/facilities" },
];
export function ReferenceCampus({
  standalone = false,
  visitVideo = false,
}: {
  standalone?: boolean;
  visitVideo?: boolean;
}) {
  const [active, setActive] = useState<(typeof FACILITIES)[number] | null>(null);
  return <section className={`ref-campus ${standalone ? "ref-campus-standalone" : ""}`} aria-labelledby="campus-heading"><PublicMedia name="campus-aerial" className="ref-campus-background" /><div className="ref-campus-top"><h2 id="campus-heading">Space to discover.</h2><div className="ref-campus-facts"><p><strong>3</strong><span>stages: Nursery, Primary and Secondary</span></p><p><strong>—</strong><span>campus details awaiting confirmation</span></p><p><strong>—</strong><span>facilities information to follow</span></p></div></div><p className="ref-campus-context">Campus photograph and location plan to follow.<br />Explore the school spaces below.</p><div className="ref-campus-markers">{FACILITIES.map(f => <button key={f.key} className={`ref-campus-marker ref-campus-marker--${f.key}`} onClick={() => setActive(f)}><span>{f.title}</span><MapPin size={54} fill="white" strokeWidth={1} aria-hidden="true" /></button>)}</div><Link className="ref-campus-tour" to="/admissions/visit"><span>{visitVideo && <video className="ref-campus-tour-video" src="/videos/eckernforde-visit-preview.mp4" autoPlay muted loop playsInline preload="metadata" aria-hidden="true" tabIndex={-1} />}<ArrowRight size={35} aria-hidden="true" /></span><b>PLAN A SCHOOL VISIT</b></Link>
    <AnimatePresence>{active && <PublicOverlay key="campus" label={active.title} onClose={() => setActive(null)} className="ref-campus-overlay"><div className="ref-campus-dialog"><button className="ref-close" aria-label="Close campus details" onClick={() => setActive(null)}><X /></button><div className="ref-campus-dialog-copy"><div className="ref-campus-choices" aria-label="Explore school spaces">{FACILITIES.map(f => <button key={f.key} aria-pressed={active.key === f.key} onClick={() => setActive(f)}>{f.title}</button>)}</div><p className="ref-kicker">{active.stage}</p><h2>{active.title}</h2><p>{active.copy}</p><div className="ref-campus-dialog-facts"><span><strong>—</strong> Student numbers to be confirmed</span><span><strong>—</strong> Facility details to be confirmed</span></div><div className="ref-campus-dialog-actions"><PublicArrowLink to={active.route}>Find out more</PublicArrowLink><PublicArrowLink to="/admissions/visit">Plan a visit</PublicArrowLink></div></div><div className="ref-campus-dialog-image"><PublicMedia name={active.image} /><div><p className="ref-kicker">WHERE WE ARE</p><p>Verified school address<br />awaiting confirmation.</p><Link to="/contact">Contact information →</Link></div></div></div></PublicOverlay>}</AnimatePresence>
  </section>;
}

type News = { id: number; title: string; content: string; createdAt: string };
type Event = { id: number; title: string; description: string | null; startAt: string; type: string };
function dateLabel(value: string) { return new Date(value).toLocaleDateString("en", { day: "numeric", month: "short" }); }

export function ReferenceMosaic() {
  const { section, canvas, geometry, distance, visible } = usePublicScroll();
  const reduced = usePublicReducedMotion();
  const [browseAll, setBrowseAll] = useState(false);
  // The chapter must contain the entire pin duration plus the visible viewport.
  // Previously the section clipped away while its counter-transform still ran.
  const range = Math.max(1, geometry.canvasHeight * (geometry.width < 576 ? 1.235 : 1.225) * geometry.canvasEnd);
  const progress = useTransform(() => clampProgress(distance.get() / range) * geometry.canvasEnd);
  const x = useTransform(() => (-160 * progress.get()) + "vw");
  const y = useTransform(() => (-125 * progress.get()) + "%");
  const staticLayout = reduced || browseAll;
  const now = new Date();
  const from = now.toISOString().slice(0, 10), to = new Date(now.getTime() + 90 * 86400000).toISOString().slice(0, 10);
  const news = useApiQuery<{ data: News[] }>("/announcements/public", { staleTime: 60_000 });
  const events = useApiQuery<{ data: Event[] }>(`/calendar/public?from=${from}&to=${to}`, { staleTime: 60_000 });
  const story = news.data?.data[0]; const event = events.data?.data[0];
  return <section ref={section} className={`ref-glance ${staticLayout ? "ref-glance-static" : visible ? "ref-glance-moving" : ""}`} style={staticLayout ? undefined : { height: range + geometry.viewport }} aria-labelledby="glance-heading"><button className="ref-browse-stories" onClick={() => setBrowseAll(!browseAll)}>{browseAll ? "Return to school stories" : "Browse all school stories"}</button><div className="ref-glance-pin"><motion.div ref={canvas} className="ref-mosaic-canvas" style={staticLayout ? { x: 0, y: 0 } : { x, y }} onFocusCapture={e => { if (!staticLayout && e.target instanceof HTMLElement && e.target.matches(":focus-visible")) { setBrowseAll(true); const target = e.target; requestAnimationFrame(() => target.scrollIntoView({ block: "center" })); } }}>
    <div className="ref-mosaic-intro"><h2 id="glance-heading">Eckernforde Schools at a glance</h2><p>Three learning stages. A shared school journey. Discover the people, experiences and published stories that connect our community.</p></div>
    <div className="ref-stat ref-stat-green"><strong>3</strong><span>learning stages,<br />from Nursery<br />to Secondary</span></div>
    <figure className="ref-mosaic-photo ref-mosaic-photo-one"><PublicMedia name="outdoor-discovery" /><figcaption>Learning beyond the classroom</figcaption></figure>
    <article className="ref-mosaic-news"><PublicMedia name="school-news" /><div className="ref-mosaic-caption"><p className="ref-kicker">LATEST NEWS</p>{news.isLoading ? <p role="status">Loading school news…</p> : news.isError ? <div className="ref-feed-error"><h3>School news is temporarily unavailable.</h3><button onClick={() => news.refetch()}>Try again</button></div> : story ? <><h3>{story.title}</h3><p className="ref-story-preview">{story.content}</p><PublicArrowLink to="/news-events">Read school news</PublicArrowLink></> : <><h3>Our next story starts here.</h3><p>No public news has been published yet.</p><PublicArrowLink to="/news-events">School news</PublicArrowLink></>}</div>{story && <time className="ref-date-tab" dateTime={story.createdAt}>{dateLabel(story.createdAt)}</time>}</article>
    <figure className="ref-mosaic-photo ref-mosaic-photo-two"><PublicMedia name="arts-and-performance" /><figcaption>Ideas, creativity and expression</figcaption></figure>
    <Link className="ref-mosaic-connect" to="/community">CONNECT WITH OUR COMMUNITY <ArrowRight size={25} /></Link>
    <div className="ref-stat ref-stat-blue ref-stat-pending"><strong>—</strong><span>School achievement<br />figures awaiting<br />confirmation</span></div>
    <Link className="ref-mosaic-film ref-mosaic-film-one" to="/school-life"><PublicMedia name="outdoor-learning-film" /><div>Discover school life <span>→</span></div></Link>
    <article className="ref-mosaic-event"><PublicMedia name="school-events" /><div className="ref-mosaic-caption"><p className="ref-kicker">COMMUNITY & EVENTS</p>{events.isLoading ? <p role="status">Loading public events…</p> : events.isError ? <div className="ref-feed-error"><h3>Public events are temporarily unavailable.</h3><button onClick={() => events.refetch()}>Try again</button></div> : event ? <><h3>{event.title}</h3>{event.description && <p className="ref-story-preview">{event.description}</p>}<PublicArrowLink to="/news-events">View public events</PublicArrowLink></> : <><h3>More moments to share.</h3><p>No public events have been published yet.</p><PublicArrowLink to="/news-events">News and events</PublicArrowLink></>}</div>{event && <time className="ref-date-tab" dateTime={event.startAt}>{dateLabel(event.startAt)}</time>}</article>
    <figure className="ref-mosaic-photo ref-mosaic-photo-three"><PublicMedia name="first-day-at-school" /><figcaption>New beginnings, shared together</figcaption></figure>
    <div className="ref-stat ref-stat-red ref-stat-pending"><strong>—</strong><span>Clubs and activities<br />details to follow</span></div>
    <Link className="ref-mosaic-film ref-mosaic-film-two" to="/community"><PublicMedia name="community-celebration-film" /><div>Meet our community <span>→</span></div></Link>
  <div className="ref-community-ending"><p>Learning grows through the connections we make. Families, students and staff each bring something to our school community.</p><PublicArrowLink to="/community">Get involved</PublicArrowLink></div></motion.div></div></section>;
}

export const SCHOOL_STAGES = [
  { name: "Nursery", kicker: "FIRST STEPS", image: "nursery-learning", href: "/academics/early-years", copy: "Time to play, ask questions and discover the joy of learning." },
  { name: "Primary", kicker: "GROWING FOUNDATIONS", image: "primary-outdoor-learning", href: "/academics/primary", copy: "Building knowledge, confidence and curiosity through a broad learning journey." },
  { name: "Secondary", kicker: "NEW POSSIBILITIES", image: "secondary-science", href: "/academics/secondary", copy: "Deeper understanding, growing independence and thoughtful choices for the future." },
];
export function ReferenceStages() {
  return <section className="ref-stages" aria-label="Our school stages">{SCHOOL_STAGES.map(s => <article key={s.name}><PublicMedia name={s.image} /><div className="ref-stage-copy"><p className="ref-kicker">{s.kicker}</p><h3><Link to={s.href}>{s.name}</Link></h3><div className="ref-stage-more"><p>{s.copy}</p><PublicArrowLink to={s.href}>Explore {s.name}</PublicArrowLink></div></div></article>)}</section>;
}
