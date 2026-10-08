import { AnimatePresence, MotionConfig } from "framer-motion";
import { ArrowRight, Menu, Search, X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { PublicPageMeta } from "./public-page-meta";
import { PublicOverlay } from "./public-overlay";
import { PUBLIC_BRAND } from "./public-brand";
import { PublicMedia } from "./public-media";
import { setPublicMotionPreference, usePublicReducedMotion } from "./public-motion";
import "./public-foundation.css";

export const PUBLIC_NAVIGATION = [
  { label: "About us", href: "/about", items: [["Our story", "/about/our-story"], ["Mission and values", "/about/mission-values"], ["Leadership", "/about/leadership"], ["Campus and facilities", "/about/campus-facilities"], ["Safeguarding", "/about/safeguarding"]] },
  { label: "Admissions", href: "/admissions", items: [["Admissions enquiry", "/admissions"], ["Our admissions journey", "/admissions/journey"], ["Book a visit", "/admissions/visit"], ["Entry requirements", "/admissions/requirements"], ["Frequently asked questions", "/admissions/faqs"]] },
  { label: "Our community", href: "/community", items: [["Community welcome", "/community"], ["Families", "/community/families"], ["Teachers and staff", "/community/staff"], ["Alumni", "/community/alumni"]] },
  { label: "School life", href: "/school-life", items: [["Life at ACADEMIX", "/school-life"], ["Sports and wellbeing", "/school-life/sports-wellbeing"], ["Arts and music", "/school-life/arts-music"], ["Clubs and activities", "/school-life/clubs-activities"], ["Gallery", "/gallery"]] },
  { label: "News and events", href: "/news-events", items: [["Latest news", "/news-events"], ["Events calendar", "/news-events/calendar"], ["Announcements", "/news-events/announcements"]] },
];

export function PublicWordmark() {
  return <Link to="/" className="ref-wordmark" aria-label="ACADEMIX home"><span aria-hidden="true" className="ref-monogram">A</span><span>ACADEMIX<small>NURSERY · PRIMARY · SECONDARY</small></span></Link>;
}
export function PublicArrowLink({ to, children, className = "" }: { to: string; children: ReactNode; className?: string }) {
  return <Link className={`ref-pill ${className}`} to={to}>{children}<span className="ref-arrow"><ArrowRight size={15} aria-hidden="true" /></span></Link>;
}
function SearchForm({ onSubmit }: { onSubmit?: () => void }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const submit = (e: FormEvent) => { e.preventDefault(); navigate(`/news-events${query.trim() ? `?search=${encodeURIComponent(query.trim())}` : ""}`); onSubmit?.(); };
  return <form className="ref-search" role="search" onSubmit={submit}><input type="search" aria-label="Search news and events" placeholder="Search …" value={query} onChange={e => setQuery(e.target.value)} /><button aria-label="Submit search"><Search size={17} /></button></form>;
}
function Curve({ children }: { children: ReactNode }) {
  return <><svg className="ref-curve" viewBox="0 0 420 60" preserveAspectRatio="none" aria-hidden="true"><path d="M0 0 C100 0 146 59 210 59 C274 59 320 0 420 0 Z" /></svg>{children}</>;
}
export function PublicShell() {
  const reduced = usePublicReducedMotion();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [section, setSection] = useState<number | null>(null);
  const [stage, setStage] = useState<string | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const ctas = useRef<HTMLElement>(null);
  useEffect(() => {
    const center = () => { if (ctas.current && window.innerWidth < 1280) ctas.current.scrollLeft = (ctas.current.scrollWidth - ctas.current.clientWidth) / 2; };
    center();
    window.addEventListener("resize", center);
    return () => window.removeEventListener("resize", center);
  }, [pathname]);
  const submenu = useRef<HTMLElement>(null);
  const lastSectionTrigger = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    if (section !== null || stage) submenu.current?.querySelector<HTMLElement>("a")?.focus();
  }, [section, stage]);
  useEffect(() => { setMenuOpen(false); setSearchOpen(false); setSection(null); setStage(null); window.scrollTo(0, 0); }, [pathname]);
  const close = () => { setMenuOpen(false); setSection(null); setStage(null); };
  const selected = section === null ? undefined : PUBLIC_NAVIGATION[section];
  const pageTitle = pathname === "/" ? "Home" : pathname.split("/").filter(Boolean).pop()!.replaceAll("-", " ");
  return <MotionConfig reducedMotion={reduced ? "always" : "never"}><div data-motion={reduced ? "reduced" : "full"} className={`public-site site-shell ${pathname === "/" ? "ref-is-home" : "ref-is-inner"}`}>
    <PublicPageMeta title={pageTitle} description="Discover ACADEMIX: Nursery, Primary and Secondary learning, school life and admissions." />
    <a className="public-skip-link" href="#public-content">Skip to content</a>
    {reduced && <button className="ref-motion-choice" onClick={() => setPublicMotionPreference("full")}>Play animations <ArrowRight size={15} aria-hidden="true" /></button>}
    <header className="ref-header"><PublicWordmark /><div className="ref-header-tools"><div className="ref-desktop-search"><SearchForm /></div><button className="ref-mobile-search" aria-label="Search news and events" onClick={() => setSearchOpen(true)}><Search size={19} /></button><Link className="ref-portal" to="/portal">GO TO PORTAL <ArrowRight size={16} aria-hidden="true" /></Link></div></header>
    <div className="ref-menu-dock"><button ref={trigger} className="ref-menu-trigger" aria-label="Open navigation" aria-expanded={menuOpen} aria-controls="school-navigation" onClick={() => setMenuOpen(true)}><Curve><Menu size={42} strokeWidth={1.2} /></Curve></button></div>
    <AnimatePresence>{menuOpen && <PublicOverlay key="navigation" label="School navigation" onClose={close} className="ref-navigation-overlay" id="school-navigation" restoreFocus={trigger}>
      <div className="ref-navigation-top"><PublicWordmark /><PublicArrowLink to="/admissions/visit">Book a visit</PublicArrowLink></div>
      <div className={`ref-navigation-body ${selected || stage ? "has-submenu" : ""} ${stage ? "has-stage-submenu" : ""}`}>
        <div className="ref-navigation-stages" aria-label="School stages">{PUBLIC_BRAND.stages.map((s, i) => <div className="ref-navigation-stage" key={s.label}><Link className={`stage-accent--${s.tone}`} to={s.href}><small>{["FIRST STEPS", "FOUNDATIONS", "NEXT CHAPTER"][i]}</small><span>{s.label}</span></Link><button aria-label={`Explore ${s.label} navigation`} onClick={e => { lastSectionTrigger.current = e.currentTarget; setStage(s.label); setSection(null); }}><ArrowRight size={17} /></button></div>)}<Link className="ref-menu-learning" to="/academics">Explore learning at ACADEMIX <ArrowRight size={18} /></Link></div>
        <nav className="ref-navigation-links" aria-label="Main navigation">{PUBLIC_NAVIGATION.map((item, i) => <div key={item.label}><button className={section === i ? "is-selected" : ""} aria-expanded={section === i} onClick={e => { lastSectionTrigger.current = e.currentTarget; setSection(section === i ? null : i); setStage(null); }}>{item.label}</button></div>)}<Link to="/contact">Contact</Link><div className="ref-navigation-utilities"><Link to="/admissions/visit">Contact / visit</Link><Link to="/community/families">Families</Link><Link to="/portal">GO TO PORTAL</Link></div></nav>
        {(selected || stage) && <nav key={selected?.label ?? stage} ref={submenu} className="ref-navigation-submenu" aria-label={`${selected?.label ?? stage} navigation`}><button className="ref-menu-back" onClick={() => { setSection(null); setStage(null); requestAnimationFrame(() => lastSectionTrigger.current?.focus()); }}>← Back to main menu</button><h2>{selected?.label ?? stage}</h2>{selected ? <><Link className="ref-submenu-overview" to={selected.href}>{selected.label} overview <ArrowRight size={18} /></Link>{selected.items.map(([label, href]) => <Link key={href} to={href}>{label}</Link>)}</> : <><Link to={PUBLIC_BRAND.stages.find(s => s.label === stage)!.href}>Welcome to {stage}</Link><Link to="/academics/curriculum">Curriculum and subjects</Link><Link to="/academics/learning-support">Learning support</Link><Link to="/school-life">School life</Link><Link to="/admissions">Admissions</Link></>}</nav>}
      </div>
      <button className="ref-menu-close" aria-label="Close navigation" onClick={close}><Curve><X size={40} strokeWidth={1.2} /></Curve></button>
    </PublicOverlay>}</AnimatePresence>
    <AnimatePresence>{searchOpen && <PublicOverlay key="search" label="Search the public website" onClose={() => setSearchOpen(false)} className="ref-search-overlay"><button className="ref-close" onClick={() => setSearchOpen(false)} aria-label="Close search"><X /></button><h2>Search news and events</h2><SearchForm onSubmit={() => setSearchOpen(false)} /></PublicOverlay>}</AnimatePresence>
    <main id="public-content" tabIndex={-1} className="site-content"><Outlet /></main>
    <section ref={ctas} className="ref-public-ctas" aria-label="Explore more"><Link to="/admissions">Admissions <span>↗</span><div className="ref-cta-photo" aria-hidden="true"><PublicMedia name="admissions-life" image="opening" /></div></Link><Link to="/admissions/visit">Visit us <span>↗</span><div className="ref-cta-photo" aria-hidden="true"><PublicMedia name="visit-learning" image="creative" /></div></Link><Link to="/community">Our community <span>↗</span><div className="ref-cta-photo" aria-hidden="true"><PublicMedia name="family-life" image="community" /></div></Link></section>
    <footer className="ref-footer"><div className="ref-footer-grid"><div className="ref-footer-brand"><PublicWordmark /><SearchForm /></div><nav className="ref-footer-links" aria-label="Useful links"><h2>Useful links</h2><Link to="/admissions">Admissions</Link><Link to="/admissions/visit">Book a visit</Link><Link to="/news-events/calendar">School events</Link><Link to="/contact">Contact us</Link><Link to="/gallery">Gallery</Link><Link to="/portal">GO TO PORTAL</Link></nav><div className="ref-footer-contact"><h2>Get in touch</h2><div className="ref-footer-contacts"><div><p className="ref-kicker">NURSERY · PRIMARY · SECONDARY</p><h3>ACADEMIX</h3><p>School address and direct contact details<br />awaiting confirmation.</p><PublicArrowLink to="/contact">Contact information</PublicArrowLink></div><div><p className="ref-kicker">PROSPECTIVE FAMILIES</p><h3>Admissions enquiries</h3><p>Tell us about your family and the learning stage you are considering.</p><PublicArrowLink to="/admissions">Make an enquiry</PublicArrowLink></div></div></div></div><div className="ref-footer-bottom"><span>© {new Date().getFullYear()} ACADEMIX</span><nav aria-label="School policies"><Link to="/about/safeguarding">Safeguarding</Link><Link to="/community/resources-policies">Resources and policies</Link></nav><button className="ref-motion-preference" onClick={() => setPublicMotionPreference(reduced ? "full" : "reduced")}>{reduced ? "Play animations" : "Reduce motion"}</button><button className="ref-motion-preference" onClick={() => setPublicMotionPreference("system")}>Use device motion setting</button><span>Nursery · Primary · Secondary</span></div></footer>
  </div></MotionConfig>;
}
