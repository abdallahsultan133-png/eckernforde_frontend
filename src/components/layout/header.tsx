import { UserAvatar } from "@/components/layout/user-avatar.tsx";
import { NotificationsBell } from "@/components/layout/notifications-bell.tsx";
import { ThemeToggle } from "@/components/refine-ui/theme/theme-toggle.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import { useSidebar } from "@/components/ui/sidebar.tsx";
import { AccountMenu } from "@/components/layout/account-menu.tsx";
import { cn } from "@/lib/utils.ts";
import { portalPage } from "@/lib/portal-page";
import { ROLE_LABEL_SHORT } from "@/lib/roles";
import { loadSearchHistory, rememberSearch } from "@/lib/search-history";
import { usePortalSearch, type PortalSearchResult } from "@/hooks/use-portal-search.ts";
import { UserRole, type User } from "@/types";
import { useRef, useState } from "react";
import {
  useActiveAuthProvider,
  useGetIdentity,
} from "@refinedev/core";
import { useKBar } from "kbar";
import { Link, useLocation, useNavigate } from "react-router";
import {
  Menu,
  X,
  ArrowLeft,
  Search,
  Plus,
  School,
  BookOpen,
  Megaphone,
  ClipboardCheck,
  FileText,
  Building2,
  BarChart3,
  Users,
  type LucideIcon,
} from "lucide-react";

type QuickAction = { label: string; href: string; icon: LucideIcon };

function quickActionsForRole(role?: UserRole): QuickAction[] {
  if (role === UserRole.SUPER_ADMIN) {
    return [
      { label: "Accounts & Roles", href: "/users", icon: Users },
      { label: "Audit Log", href: "/admin/audit-logs", icon: FileText },
      { label: "Departments", href: "/admin/departments", icon: Building2 },
      { label: "Academic Insights", href: "/insights", icon: BarChart3 },
    ];
  }
  if (role === UserRole.ADMIN) {
    return [
      { label: "Manage Users", href: "/users", icon: Users },
      { label: "Create Class", href: "/classes/create", icon: School },
      { label: "Add Subject", href: "/subjects/create", icon: BookOpen },
      { label: "Send Announcement", href: "/announcements/create", icon: Megaphone },
      { label: "Publish Results", href: "/admin/publish-results", icon: BarChart3 },
    ];
  }
  if (role === UserRole.TEACHER) {
    return [
      { label: "Create Homework", href: "/homework/create", icon: FileText },
      { label: "Mark Attendance", href: "/attendance", icon: ClipboardCheck },
      { label: "Post Announcement", href: "/announcements/create", icon: Megaphone },
    ];
  }
  if (role === UserRole.STUDENT) {
    return [
      { label: "View Homework", href: "/homework", icon: FileText },
      { label: "View Report", href: "/grades/term-results", icon: BarChart3 },
    ];
  }
  return [];
}

function usePageTitle() {
  return portalPage(useLocation().pathname);
}

export const Header = () => {
  const { isMobile } = useSidebar();

  return <>{isMobile ? <MobileHeader /> : <DesktopHeader />}</>;
};

function DesktopHeader() {
  const { title, description } = usePageTitle();
  const navigate = useNavigate();
  const { query } = useKBar();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const portalResults = usePortalSearch(searchTerm, searchOpen && searchTerm.trim().length > 0);

  const openSearch = () => {
    setSearchOpen(true);
    setSearchHistory(loadSearchHistory());
    window.setTimeout(() => searchInputRef.current?.focus(), 0);
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchTerm("");
    query.setSearch("");
  };

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const term = searchTerm.trim();
    if (!term) return;
    setSearchHistory(rememberSearch(term));
    query.setSearch(term);
    query.toggle();
    window.setTimeout(() => query.setSearch(term), 0);
  };

  const chooseResult = (result: PortalSearchResult) => {
    const term = searchTerm.trim();
    if (term) setSearchHistory(rememberSearch(term));
    setSearchOpen(false);
    setSearchTerm("");
    query.setSearch("");
    navigate(result.path);
  };

  return (
    <header
      className={cn(
        "portal-header",
        "sticky",
        "top-0",
        "flex",
        "h-16",
        "shrink-0",
        "items-center",
        "gap-4",
        "border-b",
        "border-border",
        "bg-sidebar",
        "pl-5",
        "pr-3",
        "justify-between",
        "z-40"
      )}
    >
      {searchOpen ? (
        <div className="relative min-w-0 flex-1">
          <form className="flex min-w-0 items-center gap-2" role="search" onSubmit={submitSearch}>
            <Button variant="ghost" size="icon" className="h-11 w-11 shrink-0" aria-label="Close search" onClick={closeSearch} type="button">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex min-w-0 w-full max-w-2xl items-center gap-2 rounded-full bg-muted px-3">
              <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
              <input
                ref={searchInputRef}
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                onKeyDown={(event) => { if (event.key === "Escape") closeSearch(); }}
                placeholder="Search the portal"
                aria-label="Search the portal"
                autoComplete="off"
                className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              {searchTerm && <button type="button" aria-label="Clear search" className="text-muted-foreground hover:text-foreground" onClick={() => setSearchTerm("")}><X className="h-4 w-4" /></button>}
            </div>
            <Button type="submit" variant="ghost" size="icon" className="h-11 w-11 shrink-0" aria-label="Submit search"><Search className="h-5 w-5" /></Button>
          </form>
          <PortalSearchDropdown
            history={searchHistory}
            query={searchTerm}
            results={portalResults}
            onSelect={setSearchTerm}
            onSelectResult={chooseResult}
            offset="desktop"
          />
        </div>
      ) : (
        <div className="min-w-0">
          <p className="truncate text-base font-semibold leading-tight">{title}</p>
          {description && <p className="truncate text-xs text-muted-foreground">{description}</p>}
        </div>
      )}

      <div className="flex shrink-0 items-center gap-1.5">
        {!searchOpen && <SearchButton onClick={openSearch} />}
        <QuickActionMenu />
        <ThemeToggle />
        <NotificationsBell />
        <UserDropdown />
      </div>
    </header>
  );
}

function MobileMenuButton() {
    const { openMobile, setOpenMobile } = useSidebar();

    return (
        <Button
            variant="ghost"
            size="icon"
            className="ml-1 h-11 w-11 shrink-0 text-muted-foreground"
            aria-label={openMobile ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={openMobile}
            onClick={() => setOpenMobile(!openMobile)}
        >
            {openMobile ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
    );
}

function MobileHeader() {
    const { title } = usePageTitle();
    const navigate = useNavigate();
    const { query } = useKBar();
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchHistory, setSearchHistory] = useState<string[]>([]);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const portalResults = usePortalSearch(searchTerm, searchOpen && searchTerm.trim().length > 0);

    const openSearch = () => {
      setSearchOpen(true);
      setSearchHistory(loadSearchHistory());
      window.setTimeout(() => searchInputRef.current?.focus(), 0);
    };

    const closeSearch = () => {
      setSearchOpen(false);
      setSearchTerm("");
      query.setSearch("");
    };

    const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const term = searchTerm.trim();
      if (!term) return;
      setSearchHistory(rememberSearch(term));
      query.setSearch(term);
      query.toggle();
      // KBarSearch clears its internal query when the palette mounts. Restore
      // the submitted term after that mount so results open already filtered.
      window.setTimeout(() => query.setSearch(term), 0);
    };

    const chooseResult = (result: PortalSearchResult) => {
      const term = searchTerm.trim();
      if (term) setSearchHistory(rememberSearch(term));
      setSearchOpen(false);
      setSearchTerm("");
      query.setSearch("");
      navigate(result.path);
    };

    return (
        <header
            className={cn(
                "portal-header",
                "sticky",
                "top-0",
                "flex",
                "h-14",
                "shrink-0",
                "items-center",
                "gap-2",
                "border-b",
                "border-border",
                "bg-sidebar",
                "pr-3",
                "justify-between",
                "z-40"
            )}
        >

            {searchOpen ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 shrink-0"
                  aria-label="Close search"
                  onClick={closeSearch}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="relative min-w-0 flex-1">
                  <form className="flex min-w-0 items-center gap-2" role="search" onSubmit={submitSearch}>
                    <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-muted px-3">
                      <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
                      <input
                        ref={searchInputRef}
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        onKeyDown={(event) => { if (event.key === "Escape") closeSearch(); }}
                        placeholder="Search the portal"
                        aria-label="Search the portal"
                        autoComplete="off"
                        className="h-12 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                      />
                      {searchTerm && (
                        <button type="button" aria-label="Clear search" className="text-muted-foreground hover:text-foreground" onClick={() => setSearchTerm("")}>
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <Button type="submit" variant="ghost" size="icon" className="h-12 w-12 shrink-0" aria-label="Submit search">
                      <Search className="h-5 w-5" />
                    </Button>
                  </form>
                  <PortalSearchDropdown
                    history={searchHistory}
                    query={searchTerm}
                    results={portalResults}
                    onSelect={setSearchTerm}
                    onSelectResult={chooseResult}
                    offset="mobile"
                  />
                </div>
              </>
            ) : (
              <>
                <MobileMenuButton />
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold tracking-tight text-foreground">{title}</p>
                </div>
                <div className="flex items-center gap-1">
                  <SearchButton className="h-12 w-12" onClick={openSearch} />
                  <QuickActionMenu mobile />
                  <ThemeToggle className="h-12 w-12" />
                  <UserDropdown />
                </div>
              </>
            )}


        </header>
    );
}

function PortalSearchDropdown({
  history,
  query,
  results,
  onSelect,
  onSelectResult,
  offset,
}: {
  history: string[];
  query: string;
  results: PortalSearchResult[];
  onSelect: (term: string) => void;
  onSelectResult: (result: PortalSearchResult) => void;
  offset: "desktop" | "mobile";
}) {
  const normalizedQuery = query.trim().toLowerCase();
  const recentSearches = history.filter((term) => !normalizedQuery || term.toLowerCase().includes(normalizedQuery));
  const hasQuery = normalizedQuery.length > 0;

  if (!hasQuery && recentSearches.length === 0) return null;

  return (
    <div className={cn(
      "absolute right-0 top-full z-50 mt-2 max-h-[min(28rem,calc(100vh-6rem))] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-xl",
      offset === "desktop" ? "left-12" : "left-0",
    )} role="listbox" aria-label={hasQuery ? "Portal search results" : "Recent searches"}>
      {hasQuery && results.length > 0 && (
        <>
          <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Results</p>
          {results.map((result) => {
            const Icon = result.icon;
            return (
              <button
                key={result.id}
                type="button"
                role="option"
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => onSelectResult(result)}
              >
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{result.label}</span>
                  <span className="block truncate text-xs text-muted-foreground">{result.subtitle}</span>
                </span>
              </button>
            );
          })}
        </>
      )}
      {hasQuery && results.length === 0 && (
        <p className="px-3 py-3 text-sm text-muted-foreground">No matching portal results.</p>
      )}
      {!hasQuery && recentSearches.length > 0 && (
        <>
          <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Recent searches</p>
          {recentSearches.map((term) => (
            <button
              key={term}
              type="button"
              role="option"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onSelect(term)}
            >
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{term}</span>
            </button>
          ))}
        </>
      )}
    </div>
  );
}

function SearchButton({ className, onClick }: { className?: string; onClick?: () => void }) {
  const { query } = useKBar();

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Search (Ctrl+K)"
      title="Search (Ctrl+K)"
      className={className}
      onClick={onClick ?? (() => query.toggle())}
    >
      <Search className="h-5 w-5" />
    </Button>
  );
}

function QuickActionMenu({ mobile = false }: { mobile?: boolean }) {
  const { data: identity } = useGetIdentity<User>();
  const actions = quickActionsForRole(identity?.role);

  if (actions.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="default"
          aria-label="Open quick actions"
          className={mobile ? "h-12 gap-1.5 rounded-full px-3 text-sm font-semibold sm:hidden" : "hidden gap-1.5 sm:inline-flex"}
        >
          <Plus className="h-5 w-5" />
          Quick Actions
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {actions.map((action) => (
          <DropdownMenuItem key={action.label} asChild>
            <Link to={action.href} className="flex items-center gap-2 cursor-pointer">
              <action.icon className="h-4 w-4" />
              {action.label}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const UserDropdown = () => {
  const { data: identity } = useGetIdentity<User>();

  const authProvider = useActiveAuthProvider();

  if (!authProvider?.getIdentity) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {identity?.role && (
        <Badge variant="secondary" className="hidden sm:inline-flex">
          {ROLE_LABEL_SHORT[identity.role]}
        </Badge>
      )}
      <AccountMenu align="end">
        <button
          type="button"
          aria-label="Open account menu"
          className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <UserAvatar />
        </button>
      </AccountMenu>
    </div>
  );
};

Header.displayName = "Header";
MobileHeader.displayName = "MobileHeader";
DesktopHeader.displayName = "DesktopHeader";
