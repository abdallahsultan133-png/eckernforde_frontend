import { ArrowDown, ArrowRight, ArrowUp, ChevronDown, Home, Menu, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { APP_NAME, SCHOOL_PROFILE } from "@/constants";
import { PublicPageMeta } from "@/components/public/public-page-meta";

type NavSection = { label: string; href: string; intro: string; featured: string; image: string; items: Array<{ label: string; href: string }> };

const NAVIGATION: NavSection[] = [
  { label: "About", href: "/about", intro: "The people, purpose and place behind the school.", featured: "A school shaped by care, curiosity and participation.", image: "/images/kijani-community-voice.png", items: [{ label: "Our story", href: "/about/our-story" }, { label: "Mission and values", href: "/about/mission-values" }, { label: "Leadership", href: "/about/leadership" }, { label: "Campus and facilities", href: "/about/campus-facilities" }, { label: "Safeguarding", href: "/about/safeguarding" }] },
  { label: "Learning", href: "/academics", intro: "A connected journey from Nursery to Form IV.", featured: "Learning grows when children are known, challenged and inspired.", image: "/images/kijani-creative-learning.png", items: [{ label: "Early Years", href: "/academics/early-years" }, { label: "Primary School", href: "/academics/primary" }, { label: "Secondary School", href: "/academics/secondary" }, { label: "Curriculum and subjects", href: "/academics/curriculum" }, { label: "Learning support", href: "/academics/learning-support" }, { label: "Examinations", href: "/academics/examinations" }] },
  { label: "Admissions", href: "/admissions", intro: "Everything families need to take the next step.", featured: "Start with a conversation. We will help you find your way.", image: "/images/kijani-hero.png", items: [{ label: "Why choose us", href: "/admissions/why-choose-us" }, { label: "The admissions journey", href: "/admissions/journey" }, { label: "Entry requirements", href: "/admissions/requirements" }, { label: "Book a visit", href: "/admissions/visit" }, { label: "Request information", href: "/admissions/request-information" }, { label: "Frequently asked questions", href: "/admissions/faqs" }] },
  { label: "School life", href: "/school-life", intro: "The experiences, relationships and passions that shape a school day.", featured: "There is more than one way to learn, contribute and belong.", image: "/images/kijani-community-voice.png", items: [{ label: "Student life", href: "/school-life/student-life" }, { label: "Sports and wellbeing", href: "/school-life/sports-wellbeing" }, { label: "Arts and music", href: "/school-life/arts-music" }, { label: "Clubs and activities", href: "/school-life/clubs-activities" }, { label: "Trips and service", href: "/school-life/trips-service" }, { label: "Our facilities", href: "/school-life/facilities" }] },
  { label: "Community", href: "/community", intro: "A school community is built by everyone in it.", featured: "Families, students, teachers and alumni all have a part to play.", image: "/images/kijani-hero.png", items: [{ label: "Students", href: "/community/students" }, { label: "Families", href: "/community/families" }, { label: "Teachers and staff", href: "/community/staff" }, { label: "Alumni", href: "/community/alumni" }, { label: "Resources and policies", href: "/community/resources-policies" }] },
  { label: "News & events", href: "/news-events", intro: "The latest stories, dates and announcements from school.", featured: "See what is happening across our community.", image: "/images/kijani-creative-learning.png", items: [{ label: "Latest news", href: "/news-events/latest" }, { label: "Events calendar", href: "/news-events/calendar" }, { label: "Announcements", href: "/news-events/announcements" }, { label: "Gallery", href: "/gallery" }] },
];

export function PublicShell() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const navRef = useRef<HTMLElement>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [atBottom, setAtBottom] = useState(false);
  const active = NAVIGATION.find((item) => item.label === openMenu);
  const pageTitle = pathname === "/" ? "Home" : pathname.split("/").filter(Boolean).pop()?.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) || "School";

  useEffect(() => { setOpenMenu(null); setMobileOpen(false); setSearchOpen(false); }, [pathname]);
  useEffect(() => {
    const close = (event: MouseEvent) => { if (navRef.current && !navRef.current.contains(event.target as Node)) setOpenMenu(null); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  useEffect(() => {
    const updateScrollPosition = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      setAtBottom(maxScroll > 160 && window.scrollY >= maxScroll - 120);
    };
    updateScrollPosition();
    window.addEventListener("scroll", updateScrollPosition, { passive: true });
    window.addEventListener("resize", updateScrollPosition);
    return () => { window.removeEventListener("scroll", updateScrollPosition); window.removeEventListener("resize", updateScrollPosition); };
  }, []);
  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpenMenu(null); setMobileOpen(false); setSearchOpen(false); } };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, []);
  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [mobileOpen]);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const value = query.trim(); navigate(value ? `/news-events?search=${encodeURIComponent(value)}` : "/news-events"); };

  return <div className="site-shell">
    <PublicPageMeta title={pageTitle} description={`Discover ${APP_NAME}, a connected Nursery, Primary and Secondary school.`} />
    <a className="public-skip-link" href="#public-content">Skip to content</a>
    <header className="site-header" ref={navRef} onMouseLeave={() => setOpenMenu(null)}>
      <div className="site-header-inner">
        <Link to="/" className="site-brand" aria-label={`${APP_NAME} home`}><span className="site-brand-mark">K</span><span><b>{APP_NAME}</b><small>Learning with purpose</small></span></Link>
        <nav className="site-nav" aria-label="Main navigation">{NAVIGATION.map((item) => { const menuId = `public-menu-${item.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`; return <button key={item.label} id={`${menuId}-trigger`} type="button" className={`site-nav-trigger ${openMenu === item.label || pathname.startsWith(item.href) ? "is-active" : ""}`} aria-haspopup="true" aria-controls={menuId} aria-expanded={openMenu === item.label} onMouseEnter={() => setOpenMenu(item.label)} onFocus={() => setOpenMenu(item.label)} onClick={() => setOpenMenu(openMenu === item.label ? null : item.label)}>{item.label}<ChevronDown aria-hidden="true" /></button>; })}</nav>
        <div className="site-header-actions"><button className="site-icon-button" type="button" aria-label="Search" onClick={() => { setSearchOpen(!searchOpen); setOpenMenu(null); }}><Search aria-hidden="true" /></button><Link className="site-apply-button" to="/admissions">Apply <ArrowRight aria-hidden="true" /></Link><Link className="site-portal-link" to="/portal">Portal</Link></div>
        <button className="site-mobile-toggle" type="button" onClick={() => setMobileOpen(!mobileOpen)} aria-expanded={mobileOpen} aria-label={mobileOpen ? "Close navigation" : "Open navigation"}>{mobileOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}</button>
      </div>
      {active && <div id={`public-menu-${active.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`} className="site-mega-menu" role="region" aria-label={`${active.label} navigation`}><div className="site-mega-intro"><div className="site-mega-image"><img src={active.image} alt="" loading="lazy" decoding="async" /></div><p className="site-mega-number">0{NAVIGATION.indexOf(active) + 1}</p><h2>{active.label}</h2><p>{active.intro}</p><Link to={active.href} className="site-mega-featured">{active.featured}<ArrowRight aria-hidden="true" /></Link></div><div className="site-mega-links">{active.items.map((item) => <Link key={item.label} to={item.href}>{item.label}<ArrowRight aria-hidden="true" /></Link>)}</div></div>}
      {mobileOpen && <div className="site-mobile-menu"><div className="site-mobile-lead"><p className="site-mega-number">Explore</p><p>Find your way around the school.</p></div>{NAVIGATION.map((item) => <details key={item.label}><summary>{item.label}<ChevronDown aria-hidden="true" /></summary><div>{item.items.map((child) => <Link key={child.label} to={child.href}>{child.label}</Link>)}</div></details>)}<div className="site-mobile-actions"><Link to="/admissions">Apply to the school <ArrowRight aria-hidden="true" /></Link><Link to="/portal">Open the portal <ArrowRight aria-hidden="true" /></Link></div></div>}
    </header>
    {searchOpen && <div className="site-search-panel"><form onSubmit={submitSearch}><label htmlFor="public-search">Search the school website</label><div><input id="public-search" autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search news, learning, admissions..." /><button type="submit" aria-label="Submit search"><Search aria-hidden="true" /></button></div></form></div>}
    {pathname !== "/" && <nav className="site-breadcrumb" aria-label="Breadcrumb"><div><Link to="/"><Home className="h-3.5 w-3.5" aria-hidden="true" /> Home</Link><span aria-hidden="true">/</span><span aria-current="page">{pageTitle}</span></div></nav>}
    <main id="public-content" tabIndex={-1} className="site-content"><Outlet /></main>
    <button className={`site-scroll-control ${atBottom ? "is-up" : ""}`} type="button" onClick={() => window.scrollTo({ top: atBottom ? 0 : document.documentElement.scrollHeight, behavior: "smooth" })} aria-label={atBottom ? "Scroll to top" : "Scroll to bottom"} title={atBottom ? "Scroll to top" : "Scroll to bottom"}>{atBottom ? <ArrowUp aria-hidden="true" /> : <ArrowDown aria-hidden="true" />}</button>
    <footer className="site-footer"><div className="site-footer-top"><div className="site-footer-brand"><span className="site-brand-mark">K</span><h2>{APP_NAME}</h2><p>Learning with purpose, from first questions to future choices.</p><Link to="/contact" className="site-footer-link">Visit and connect <ArrowRight aria-hidden="true" /></Link></div><div><p className="site-footer-label">Explore</p><Link to="/about">About the school</Link><Link to="/academics">Learning</Link><Link to="/school-life">School life</Link><Link to="/news-events">News & events</Link></div><div><p className="site-footer-label">Take the next step</p><Link to="/admissions">Admissions</Link><Link to="/contact">Book a visit</Link><Link to="/portal">School portal</Link><Link to="/contact">Contact us</Link></div><div><p className="site-footer-label">Find us</p><address>{SCHOOL_PROFILE.address}<br />{SCHOOL_PROFILE.phone}<br />{SCHOOL_PROFILE.generalEmail}</address></div></div><div className="site-footer-bottom"><span>© {new Date().getFullYear()} {APP_NAME}</span><span>Nursery · Primary · Secondary</span><span>Privacy · Safeguarding · Accessibility</span></div></footer>
  </div>;
}
