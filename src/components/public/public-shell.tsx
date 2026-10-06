import {
  ArrowRight,
  ChevronDown,
  Home,
  LockKeyhole,
  Menu,
  Search,
  X,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router";

import { PublicPageMeta } from "@/components/public/public-page-meta";
import { APP_NAME, SCHOOL_PROFILE } from "@/constants";
import { PUBLIC_BRAND } from "./public-brand";
import { PublicCta } from "./public-cta";
import {
  publicDropdownTransition,
  publicMobileMenuTransition,
  withoutPublicMotion,
} from "./public-motion";
import "./public-foundation.css";

type NavSection = {
  label: string;
  href: string;
  intro: string;
  featured: string;
  image: string;
  items: Array<{ label: string; href: string }>;
};

const NAVIGATION: NavSection[] = [
  {
    label: "Explore",
    href: "/about",
    intro: "Meet the people, purpose and community behind the school.",
    featured: "Discover a connected school shaped by care, curiosity and participation.",
    image: "/images/kijani-community-voice.png",
    items: [
      { label: "About the school", href: "/about" },
      { label: "Our story", href: "/about/our-story" },
      { label: "Mission and values", href: "/about/mission-values" },
      { label: "Leadership", href: "/about/leadership" },
      { label: "Campus and facilities", href: "/about/campus-facilities" },
      { label: "Our community", href: "/community" },
    ],
  },
  {
    label: "Learning",
    href: "/academics",
    intro: "A connected learning journey from Nursery to Secondary.",
    featured: "Learning grows when children are known, challenged and inspired.",
    image: "/images/kijani-creative-learning.png",
    items: [
      { label: "Nursery", href: "/academics/early-years" },
      { label: "Primary School", href: "/academics/primary" },
      { label: "Secondary School", href: "/academics/secondary" },
      { label: "Curriculum and subjects", href: "/academics/curriculum" },
      { label: "Learning support", href: "/academics/learning-support" },
      { label: "Examinations", href: "/academics/examinations" },
    ],
  },
  {
    label: "Admissions",
    href: "/admissions",
    intro: "Practical guidance for families considering the school.",
    featured: "Start with a conversation and find the right next step for your family.",
    image: "/images/kijani-hero.png",
    items: [
      { label: "Admissions overview", href: "/admissions" },
      { label: "Why choose us", href: "/admissions/why-choose-us" },
      { label: "The admissions journey", href: "/admissions/journey" },
      { label: "Entry requirements", href: "/admissions/requirements" },
      { label: "Book a visit", href: "/admissions/visit" },
      { label: "Frequently asked questions", href: "/admissions/faqs" },
    ],
  },
  {
    label: "School life",
    href: "/school-life",
    intro: "The experiences, relationships and passions that shape each school day.",
    featured: "Explore the many ways students learn, contribute and belong.",
    image: "/images/kijani-community-voice.png",
    items: [
      { label: "School life overview", href: "/school-life" },
      { label: "Sports and wellbeing", href: "/school-life/sports-wellbeing" },
      { label: "Arts and music", href: "/school-life/arts-music" },
      { label: "Clubs and activities", href: "/school-life/clubs-activities" },
      { label: "Trips and service", href: "/school-life/trips-service" },
      { label: "Our facilities", href: "/school-life/facilities" },
    ],
  },
  {
    label: "News & events",
    href: "/news-events",
    intro: "Stories, dates and announcements from across the school.",
    featured: "See what is happening across the school community.",
    image: "/images/kijani-creative-learning.png",
    items: [
      { label: "News and events", href: "/news-events" },
      { label: "Latest news", href: "/news-events/latest" },
      { label: "Events calendar", href: "/news-events/calendar" },
      { label: "Announcements", href: "/news-events/announcements" },
      { label: "Gallery", href: "/gallery" },
    ],
  },
];

const MOBILE_DISCLOSURES = NAVIGATION.filter(({ label }) =>
  ["Explore", "Learning", "School life", "News & events"].includes(label),
);

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "summary",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

function menuId(label: string) {
  return `public-menu-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}
function isCurrentPath(pathname: string, href: string) {
  if (href === "/about") {
    return pathname.startsWith("/about") || pathname.startsWith("/community") || pathname === "/contact";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PublicShell() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const headerRef = useRef<HTMLElement>(null);
  const megaMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileToggleRef = useRef<HTMLButtonElement>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  const active = NAVIGATION.find((item) => item.label === openMenu);
  const pageTitle = pathname === "/"
    ? "Home"
    : pathname
        .split("/")
        .filter(Boolean)
        .pop()
        ?.replace(/-/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase()) || "School";

  const closeMobileMenu = useCallback((restoreFocus = false) => {
    setMobileOpen(false);
    if (restoreFocus) {
      window.setTimeout(() => mobileToggleRef.current?.focus(), 0);
    }
  }, []);

  useEffect(() => {
    setOpenMenu(null);
    setMobileOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    const closeOnOutsidePointer = (event: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    };

    document.addEventListener("mousedown", closeOnOutsidePointer);
    return () => document.removeEventListener("mousedown", closeOnOutsidePointer);
  }, []);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;

      if (mobileOpen) {
        closeMobileMenu(true);
        return;
      }

      if (searchOpen) {
        setSearchOpen(false);
        window.setTimeout(() => searchButtonRef.current?.focus(), 0);
        return;
      }

      if (openMenu) {
        const trigger = triggerRefs.current[openMenu];
        setOpenMenu(null);
        window.setTimeout(() => trigger?.focus(), 0);
      }
    };

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [closeMobileMenu, mobileOpen, openMenu, searchOpen]);

  useEffect(() => {
    if (!mobileOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => {
      const firstFocusable = mobileMenuRef.current?.querySelector<HTMLElement>(focusableSelector);
      firstFocusable?.focus();
    }, 0);

    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || !mobileMenuRef.current) return;

      const focusable = Array.from(
        mobileMenuRef.current.querySelectorAll<HTMLElement>(focusableSelector),
      ).filter((element) => !element.hasAttribute("disabled"));

      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", trapFocus);
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", trapFocus);
    };
  }, [mobileOpen]);

  const focusFirstMegaMenuLink = () => {
    window.setTimeout(() => megaMenuRef.current?.querySelector<HTMLElement>("a[href]")?.focus(), 0);
  };

  const handleDesktopTriggerKeyDown = (
    event: ReactKeyboardEvent<HTMLButtonElement>,
    label: string,
  ) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpenMenu(label);
      focusFirstMegaMenuLink();
    }
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = query.trim();
    navigate(value ? `/news-events?search=${encodeURIComponent(value)}` : "/news-events");
  };

  return (
    <div className="public-site site-shell">
      <PublicPageMeta
        title={pageTitle}
        description={`Discover ${APP_NAME}, a connected Nursery, Primary and Secondary school.`}
      />
      <a className="public-skip-link" href="#public-content">Skip to content</a>

      <header
        className="site-header"
        ref={headerRef}
        onMouseLeave={() => setOpenMenu(null)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpenMenu(null);
        }}
      >
        <div className="site-header-inner">
          <Link to="/" className="site-brand" aria-label={`${APP_NAME} home`}>
            <span className="site-brand-mark" aria-hidden="true">{PUBLIC_BRAND.mark}</span>
            <span className="site-brand-copy">
              <b>{PUBLIC_BRAND.name}</b>
              <small>{PUBLIC_BRAND.tagline}</small>
            </span>
          </Link>

          <nav className="site-nav" aria-label="Main navigation">
            {NAVIGATION.map((item) => {
              const id = menuId(item.label);
              const isOpen = openMenu === item.label;
              const isActive = isCurrentPath(pathname, item.href);

              return (
                <button
                  key={item.label}
                  ref={(element) => { triggerRefs.current[item.label] = element; }}
                  id={`${id}-trigger`}
                  type="button"
                  className={`site-nav-trigger ${isOpen || isActive ? "is-active" : ""}`}
                  aria-haspopup="true"
                  aria-controls={id}
                  aria-expanded={isOpen}
                  onMouseEnter={() => setOpenMenu(item.label)}
                  onFocus={() => setOpenMenu(item.label)}
                  onKeyDown={(event) => handleDesktopTriggerKeyDown(event, item.label)}
                  onClick={() => setOpenMenu(isOpen ? null : item.label)}
                >
                  {item.label}
                  <ChevronDown aria-hidden="true" />
                </button>
              );
            })}
          </nav>

          <div className="site-header-actions">
            <button
              ref={searchButtonRef}
              className="site-icon-button"
              type="button"
              aria-label="Search news and events"
              aria-controls="public-search-panel"
              aria-expanded={searchOpen}
              onClick={() => {
                setSearchOpen((current) => !current);
                setOpenMenu(null);
              }}
            >
              <Search aria-hidden="true" />
            </button>
            <PublicCta to="/admissions" variant="navigation" showArrow>Enquire</PublicCta>
            <PublicCta to="/portal" variant="portal">
              <LockKeyhole aria-hidden="true" />
              Go to Portal
            </PublicCta>
          </div>

          <button
            ref={mobileToggleRef}
            className="site-mobile-toggle"
            type="button"
            onClick={() => {
              if (mobileOpen) closeMobileMenu(false);
              else {
                setMobileOpen(true);
                setOpenMenu(null);
                setSearchOpen(false);
              }
            }}
            aria-controls="public-mobile-menu"
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
          >
            {mobileOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>

        <AnimatePresence>
          {active ? (
            <motion.div
              ref={megaMenuRef}
              key={active.label}
              id={menuId(active.label)}
              className="site-mega-menu"
              role="navigation"
              aria-labelledby={`${menuId(active.label)}-trigger`}
              variants={publicDropdownTransition}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={withoutPublicMotion(shouldReduceMotion)}
            >
              <div className="site-mega-intro">
                <div className="site-mega-image">
                  <img src={active.image} alt="" loading="lazy" decoding="async" />
                </div>
                <p className="site-mega-number">0{NAVIGATION.indexOf(active) + 1} / {active.label}</p>
                <h2>{active.label}</h2>
                <p>{active.intro}</p>
                <Link to={active.href} className="site-mega-featured">
                  {active.featured}<ArrowRight aria-hidden="true" />
                </Link>
              </div>
              <div className="site-mega-links">
                {active.items.map((item) => (
                  <Link key={item.label} to={item.href}>
                    {item.label}<ArrowRight aria-hidden="true" />
                  </Link>
                ))}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <AnimatePresence>
          {mobileOpen ? (
            <motion.div
              ref={mobileMenuRef}
              id="public-mobile-menu"
              className="site-mobile-menu"
              role="dialog"
              aria-modal="true"
              aria-label="School navigation"
              variants={publicMobileMenuTransition}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={withoutPublicMotion(shouldReduceMotion)}
            >
              <div className="site-mobile-menu-inner">
                <div className="site-mobile-lead">
                  <p className="site-mobile-kicker">Explore school</p>
                  <h2>Find the right path.</h2>
                </div>

                <div className="site-mobile-stage-grid" aria-label="School stages">
                  {PUBLIC_BRAND.stages.map((stage) => (
                    <Link
                      key={stage.label}
                      to={stage.href}
                      className={`site-mobile-stage-link stage-accent--${stage.tone}`}
                    >
                      <span>{stage.label}</span><ArrowRight aria-hidden="true" />
                    </Link>
                  ))}
                </div>

                <div className="site-mobile-priority-links">
                  <Link to="/admissions">Admissions <ArrowRight aria-hidden="true" /></Link>
                  <Link to="/admissions/visit">Contact / Visit <ArrowRight aria-hidden="true" /></Link>
                </div>

                {MOBILE_DISCLOSURES.map((item) => (
                  <details key={item.label}>
                    <summary>{item.label}<ChevronDown aria-hidden="true" /></summary>
                    <div>
                      {item.items.map((child) => <Link key={child.label} to={child.href}>{child.label}</Link>)}
                    </div>
                  </details>
                ))}

                <div className="site-mobile-actions">
                  <PublicCta to="/admissions" variant="navigation" showArrow>Start an enquiry</PublicCta>
                  <PublicCta to="/portal" variant="portal" showArrow>Go to Portal</PublicCta>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </header>

      <AnimatePresence>
        {searchOpen ? (
          <motion.div
            id="public-search-panel"
            className="site-search-panel"
            variants={publicDropdownTransition}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={withoutPublicMotion(shouldReduceMotion)}
          >
            <form onSubmit={submitSearch}>
              <label htmlFor="public-search">Search news and events</label>
              <div>
                <input
                  id="public-search"
                  autoFocus
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search stories, announcements and dates"
                />
                <button type="submit" aria-label="Submit search"><Search aria-hidden="true" /></button>
              </div>
            </form>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {pathname !== "/" ? (
        <nav className="site-breadcrumb" aria-label="Breadcrumb">
          <div>
            <Link to="/"><Home className="h-3.5 w-3.5" aria-hidden="true" /> Home</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{pageTitle}</span>
          </div>
        </nav>
      ) : null}

      <main id="public-content" tabIndex={-1} className="site-content"><Outlet /></main>

      <footer className="site-footer">
        <div className="site-footer-main">
          <div className="site-footer-brand">
            <span className="site-brand-mark" aria-hidden="true">{PUBLIC_BRAND.mark}</span>
            <h2>{PUBLIC_BRAND.name}</h2>
            <p>{PUBLIC_BRAND.tagline}, from first questions to future choices.</p>
            <PublicCta to="/contact" variant="text" showArrow>Visit and connect</PublicCta>
          </div>

          <div className="site-footer-group">
            <p className="site-footer-label">School stages</p>
            {PUBLIC_BRAND.stages.map((stage) => <Link key={stage.label} to={stage.href}>{stage.label}</Link>)}
            <Link to="/academics">Academics</Link>
          </div>

          <div className="site-footer-group site-footer-group--explore">
            <p className="site-footer-label">Explore</p>
            <Link to="/about">About the school</Link>
            <Link to="/school-life">School Life</Link>
            <Link to="/gallery">Gallery</Link>
            <Link to="/news-events">News & events</Link>
          </div>

          <div className="site-footer-group site-footer-group--school-life">
            <p className="site-footer-label">Admissions</p>
            <Link to="/admissions">Admissions overview</Link>
            <Link to="/admissions/visit">Book a visit</Link>
            <Link to="/contact">Contact the school</Link>
            <PublicCta className="site-footer-portal" to="/portal" variant="portal">Go to Portal</PublicCta>
          </div>

          <div className="site-footer-group site-footer-contact">
            <p className="site-footer-label">Contact</p>
            <address>{SCHOOL_PROFILE.address}</address>
            <a href={`tel:${SCHOOL_PROFILE.phone.replace(/\s/g, "")}`}>{SCHOOL_PROFILE.phone}</a>
            <a href={`mailto:${SCHOOL_PROFILE.generalEmail}`}>{SCHOOL_PROFILE.generalEmail}</a>
          </div>
        </div>

        <div className="site-footer-lower">
          <div className="site-footer-policies">
            <p className="site-footer-label">Policies</p>
            <div>
              <Link to="/about/safeguarding">Safeguarding</Link>
              <span>Privacy</span>
              <span>Accessibility</span>
            </div>
          </div>
          <div className="site-footer-bottom">
            <span>© {new Date().getFullYear()} {APP_NAME}</span>
            <span>Nursery · Primary · Secondary</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
