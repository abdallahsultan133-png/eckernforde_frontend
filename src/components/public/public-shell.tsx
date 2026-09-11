import { Link, Outlet, useLocation } from "react-router";
import { Mail, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { APP_NAME } from "@/constants";
import { PublicPageMeta } from "@/components/public/public-page-meta";

const NAVIGATION = [
  { label: "About", to: "/about" },
  { label: "Academics", to: "/academics" },
  { label: "Admissions", to: "/admissions" },
  { label: "School Life", to: "/school-life" },
  { label: "News & Events", to: "/news-events" },
  { label: "Community", to: "/community" },
  { label: "Gallery", to: "/gallery" },
];

export function PublicShell() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const title = pathname === "/" ? "Home" : pathname.slice(1).split("/")[0].replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  const description = pathname === "/" ? "A welcoming public website and secure digital portal for the school community." : `${title} information for ${APP_NAME}.`;

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className="public-site min-h-svh bg-[#f7f4ee] pb-16 text-[#172b3a] lg:pb-0">
      <PublicPageMeta title={title} description={description} />
      <a className="public-skip-link" href="#public-content">Skip to content</a>
      <div className="bg-[#172b3a] px-4 py-2 text-center text-xs font-medium tracking-wide text-white sm:px-6">
        School information is being prepared for publication. <Link className="underline underline-offset-4" to="/contact">Contact the school</Link> for verified information.
      </div>
      <header className="sticky top-0 z-40 border-b border-[#172b3a]/10 bg-[#f7f4ee]/95 backdrop-blur">
        <div className="mx-auto flex h-18 max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-10">
          <Link to="/" className="group flex items-center gap-3" aria-label={`${APP_NAME} home`}>
            <span aria-hidden="true" className="grid h-10 w-10 place-items-center rounded-full bg-[#ba4a32] font-serif text-xl text-white transition-transform group-hover:rotate-[-8deg]">Y</span>
            <span className="leading-tight">
              <span className="block font-serif text-xl font-semibold tracking-tight">{APP_NAME}</span>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#172b3a]/65">Nursery · Primary · Secondary</span>
            </span>
          </Link>

          <nav aria-label="Main navigation" className="hidden items-center gap-6 lg:flex">
            {NAVIGATION.map((item) => <NavLink key={item.to} {...item} />)}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <Link className="public-text-link" to="/contact"><Mail className="h-4 w-4" aria-hidden="true" /> Contact</Link>
            <Link className="public-text-link" to="/admissions">Apply</Link>
            <Link className="public-portal-button" to="/portal">Portal</Link>
          </div>
          <button type="button" onClick={() => setOpen((value) => !value)} className="grid h-11 w-11 place-items-center lg:hidden" aria-label={open ? "Close navigation menu" : "Open navigation menu"} aria-controls="public-mobile-navigation" aria-expanded={open}>
            {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>
        {open && <nav id="public-mobile-navigation" aria-label="Mobile navigation" className="border-t border-[#172b3a]/10 bg-[#f7f4ee] px-4 py-5 lg:hidden">
          <div className="mx-auto grid max-w-[1440px] gap-1 sm:px-2">
            {NAVIGATION.map((item) => <NavLink key={item.to} {...item} mobile />)}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Link className="public-text-link justify-center border border-[#172b3a]/20 py-3 text-center" to="/contact">Contact</Link>
              <Link className="public-text-link justify-center border border-[#172b3a]/20 py-3 text-center" to="/admissions">Apply</Link>
            </div>
            <Link className="public-portal-button mt-4 justify-center" to="/portal">Open secure portal</Link>
          </div>
        </nav>}
      </header>
      <main id="public-content" tabIndex={-1} className="outline-none"><Outlet /></main>
      <footer className="bg-[#172b3a] text-white">
        <div className="mx-auto grid max-w-[1440px] gap-10 px-6 py-14 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr] lg:px-10">
          <div>
            <p className="font-serif text-3xl">{APP_NAME}</p>
            <p className="mt-3 max-w-sm text-sm leading-6 text-white/72">A clear, welcoming digital home for prospective families and a secure daily workspace for the school community.</p>
            <Link to="/portal" className="mt-6 inline-flex border-b border-white pb-1 text-sm font-semibold">Open secure portal</Link>
          </div>
          <FooterGroup title="Explore" links={NAVIGATION.slice(0, 4)} />
          <FooterGroup title="For families" links={[{ label: "Apply", to: "/admissions" }, { label: "Book a visit", to: "/admissions" }, { label: "Calendar", to: "/news-events" }, { label: "Contact", to: "/contact" }]} />
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/55">Verified information</p>
            <p className="mt-4 text-sm leading-6 text-white/72">School address, contacts, policies, fees and approved photography will be added after school review.</p>
          </div>
        </div>
        <div className="border-t border-white/15 px-6 py-5 text-center text-xs text-white/55">© {new Date().getFullYear()} {APP_NAME}. Placeholder identity pending school approval.</div>
      </footer>
      <nav aria-label="Quick actions" className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-2 border-t border-[#172b3a]/15 bg-[#f7f4ee] p-2 shadow-[0_-8px_24px_rgba(23,43,58,.10)] lg:hidden">
        <Link to="/admissions" className="flex min-h-11 items-center justify-center border border-[#172b3a]/25 px-4 text-sm font-semibold">Apply</Link>
        <Link to="/portal" className="flex min-h-11 items-center justify-center bg-[#172b3a] px-4 text-sm font-semibold text-white">Portal</Link>
      </nav>
    </div>
  );
}

function NavLink({ label, to, mobile = false }: { label: string; to: string; mobile?: boolean }) {
  const { pathname } = useLocation();
  const active = pathname === to;
  return <Link to={to} aria-current={active ? "page" : undefined} className={mobile ? "border-b border-[#172b3a]/10 py-3 text-lg font-medium" : `text-sm font-semibold transition-colors hover:text-[#ba4a32] ${active ? "text-[#ba4a32]" : ""}`}>{label}</Link>;
}

function FooterGroup({ title, links }: { title: string; links: Array<{ label: string; to: string }> }) {
  return <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-white/55">{title}</p><ul className="mt-4 space-y-3">{links.map((link) => <li key={link.to}><Link className="text-sm text-white/80 hover:text-white" to={link.to}>{link.label}</Link></li>)}</ul></div>;
}
