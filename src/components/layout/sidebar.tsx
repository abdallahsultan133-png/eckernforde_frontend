"use client";

import * as React from "react";

import {
  useGetIdentity,
  useLink,
  useRefineOptions,
} from "@refinedev/core";
import { useLocation } from "react-router";
import {
  Activity,
  Bell,
  BarChart3,
  BookOpen,
  Building2,
  CalendarDays,
  ChevronsUpDown,
  FileText,
  GraduationCap,
  HeartHandshake,
  LayoutDashboard,
  LineChart,
  Megaphone,
  MessagesSquare,
  PanelLeft,
  ScrollText,
  Sparkles,
  UserCheck,
  UserRound,
  Users,
  Globe2,
  Inbox,
  X,
  type LucideIcon,
} from "lucide-react";

import {
  Sidebar as ShadcnSidebar,
  SidebarContent as ShadcnSidebarContent,
  SidebarFooter as ShadcnSidebarFooter,
  SidebarHeader as ShadcnSidebarHeader,
  SidebarRail as ShadcnSidebarRail,
  useSidebar as useShadcnSidebar,
} from "@/components/ui/sidebar.tsx";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useApiQuery } from "@/hooks/use-api-query.ts";
import { portalSchoolName, portalSchoolTagline } from "@/lib/school-brand";
import { cn } from "@/lib/utils.ts";
import { APP_TAGLINE } from "@/constants";
import { ROLE_LABEL, STAFF_ROLES, ADMIN_ROLES } from "@/lib/roles";
import { UserRole, type User } from "@/types";
import { UserAvatar } from "./user-avatar";
import { AccountMenu } from "./account-menu";

// ─────────────────────────────────────────────────────────────────────────────
// Navigation manifest
//
// An explicit, role-aware map of the *actual* routes registered in App.tsx.
// Refine's useMenu() only knows about `resources` (9 flat entries, shown to
// every role identically) — that's what made the old sidebar feel generic.
// This manifest also surfaces the real guarded routes (/users,
// /admin/departments, /admin/audit-logs, /parent, /ai-assistant) and gates each
// one with the SAME role list as its <RequireRole> wrapper. It grants nothing:
// route guards remain the single source of truth for access.
// ─────────────────────────────────────────────────────────────────────────────

type NavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
  /** Roles allowed to *see* the link. Omitted = every authenticated role. Mirrors the route's <RequireRole>. */
  roles?: UserRole[];
  /** Per-role label overrides — cosmetic only, the route never changes. */
  labelByRole?: Partial<Record<UserRole, string>>;
  /** Optional role-specific destination; server authorization still decides access. */
  toByRole?: Partial<Record<UserRole, string>>;
  /** Live unread counter that feeds this item's badge. */
  badge?: "messages";
  /** Exact pathname match only (Dashboard, so it isn't "active" on every route). */
  exact?: boolean;
};

type NavGroup = { label: string; items: NavItem[] };

const NAV: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", to: "/portal", icon: LayoutDashboard, exact: true },
      {
        label: "Class & Subjects",
        to: "/classes",
        icon: GraduationCap,
        roles: [UserRole.STUDENT, UserRole.TEACHER],
        labelByRole: { [UserRole.TEACHER]: "My Classes" },
      },
      { label: "Activity", to: "/activity", icon: Activity, roles: [UserRole.STUDENT, ...STAFF_ROLES] },
    ],
  },
  {
    label: "Teaching",
    items: [
      { label: "Classes", to: "/classes", icon: GraduationCap, roles: ADMIN_ROLES },
      { label: "Subjects", to: "/subjects", icon: BookOpen, roles: STAFF_ROLES },
      {
        label: "Departments",
        to: "/admin/departments",
        icon: Building2,
        roles: ADMIN_ROLES,
      },
    ],
  },
  {
    label: "People",
    items: [
      { label: "Students", to: "/students", icon: GraduationCap, roles: ADMIN_ROLES },
      { label: "Teachers", to: "/teachers", icon: UserRound, roles: ADMIN_ROLES },
      { label: "Parents & Guardians", to: "/guardians", icon: HeartHandshake, roles: ADMIN_ROLES },
      { label: "Users & Access", to: "/users", icon: Users, roles: ADMIN_ROLES },
    ],
  },
  {
    label: "Learning",
    items: [
      { label: "Homework", to: "/homework", icon: FileText, toByRole: { [UserRole.PARENT]: "/parent/homework" } },
      { label: "Attendance", to: "/attendance", icon: UserCheck, toByRole: { [UserRole.PARENT]: "/parent/attendance" } },
      { label: "Reports", to: "/parent/reports", icon: BarChart3, roles: [UserRole.PARENT] },
      {
        label: "Grades",
        to: "/grades",
        icon: BarChart3,
        roles: [UserRole.STUDENT, ...STAFF_ROLES],
        labelByRole: { [UserRole.STUDENT]: "Report" },
        toByRole: { [UserRole.STUDENT]: "/grades/term-results" },
      },
      {
        label: "Insights",
        to: "/insights",
        icon: LineChart,
        roles: [UserRole.STUDENT, ...STAFF_ROLES],
      },
      { label: "Calendar", to: "/calendar", icon: CalendarDays },
    ],
  },
  {
    label: "Communication",
    items: [
      { label: "Announcements", to: "/announcements", icon: Megaphone, roles: [UserRole.STUDENT, ...STAFF_ROLES] },
      { label: "Notifications", to: "/notifications", icon: Bell, roles: [UserRole.STUDENT, ...STAFF_ROLES] },
      { label: "Messages", to: "/messages", icon: MessagesSquare, badge: "messages" },
    ],
  },
  {
    label: "Management",
    items: [
      { label: "AI Assistant", to: "/ai-assistant", icon: Sparkles, roles: ADMIN_ROLES },
      { label: "Audit Log", to: "/admin/audit-logs", icon: ScrollText, roles: ADMIN_ROLES },
      { label: "Admissions Enquiries", to: "/admin/admissions", icon: Inbox, roles: ADMIN_ROLES },
      { label: "Publications", to: "/admin/publications", icon: Globe2, roles: ADMIN_ROLES },
      { label: "Public Events", to: "/admin/public-events", icon: CalendarDays, roles: ADMIN_ROLES },
      { label: "Report Card Template", to: "/admin/report-card-template", icon: FileText, roles: ADMIN_ROLES },
    ],
  },
];

function useNavGroups(role?: UserRole): NavGroup[] {
  return React.useMemo(() => {
    return NAV.map((group) => ({
      label: group.label,
      items: group.items.filter((item) => !item.roles || (role && item.roles.includes(role))),
    })).filter((group) => group.items.length > 0);
  }, [role]);
}

function isRouteActive(pathname: string, to: string, exact?: boolean) {
  if (exact) return pathname === to;
  if (to === "/portal") return pathname === "/portal";
  return pathname === to || pathname.startsWith(`${to}/`);
}

// ── Sidebar ──────────────────────────────────────────────────────────────────
export function Sidebar() {
  const { data: identity } = useGetIdentity<User>();
  const role = identity?.role;
  const groups = useNavGroups(role);
  const { pathname } = useLocation();

  // The one badge backed by a real endpoint. Poll gently; refetch is cheap
  // ({ count } only) and mirrors the notification bell's cadence.
  const { data: unread } = useApiQuery<{ count: number }>("/messages/unread-count", {
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
  const badges = { messages: unread?.count ?? 0 };

  return (
    <ShadcnSidebar collapsible="icon" className={cn("portal-sidebar border-none", "print:hidden")}>
      <ShadcnSidebarRail />
      <BrandHeader />

      <ShadcnSidebarContent
        className={cn(
          "flex flex-col gap-0 border-r border-sidebar-border bg-sidebar px-2.5 py-3",
          "[scrollbar-width:thin] [scrollbar-color:var(--sidebar-border)_transparent]",
          "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent",
          "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-sidebar-border",
        )}
      >
        <nav aria-label="Primary" className="flex flex-col gap-1">
          {groups.map((group, index) => (
            <NavSection key={group.label} label={group.label} first={index === 0}>
              {group.items.map((item) => (
                <NavItemRow
                  key={item.to}
                  item={item}
                  role={role}
                  active={isRouteActive(pathname, (role && item.toByRole?.[role]) || item.to, item.exact)}
                  badge={item.badge ? badges[item.badge] : 0}
                />
              ))}
            </NavSection>
          ))}
        </nav>
      </ShadcnSidebarContent>

      <AccountFooter role={role} />
    </ShadcnSidebar>
  );
}

// ── Section ──────────────────────────────────────────────────────────────────
function NavSection({
  label,
  first,
  children,
}: {
  label: string;
  first: boolean;
  children: React.ReactNode;
}) {
  const { open, isMobile } = useShadcnSidebar();
  const showLabel = open || isMobile;

  return (
    <div
      className={cn(
        "flex flex-col gap-1",
        // Horizontal rule between groups. Expanded: a hairline above the group
        // label. Collapsed: a short centred tick (a full-width rule reads as
        // noise at icon width).
        !first && showLabel && "mt-3 border-t border-sidebar-border pt-3",
        !first && !showLabel && "mt-2",
      )}
    >
      {showLabel ? (
        <p className="px-2.5 pb-1 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/60">
          {label}
        </p>
      ) : (
        !first && (
          <div aria-hidden="true" className="mx-auto mb-1 h-px w-6 rounded-full bg-sidebar-border" />
        )
      )}
      <ul aria-label={label} className="flex flex-col gap-0.5">
        {children}
      </ul>
    </div>
  );
}

// ── Item ─────────────────────────────────────────────────────────────────────
function NavItemRow({
  item,
  role,
  active,
  badge,
}: {
  item: NavItem;
  role?: UserRole;
  active: boolean;
  badge: number;
}) {
  const Link = useLink();
  const { open, isMobile, setOpenMobile } = useShadcnSidebar();
  const collapsed = !open && !isMobile;
  const Icon = item.icon;
  const label = (role && item.labelByRole?.[role]) || item.label;
  const destination = (role && item.toByRole?.[role]) || item.to;

  // The collapsed-only label tooltip is driven by hover/focus. Collapsing or
  // expanding the sidebar must NOT surface it on its own: if the cursor happens
  // to be resting over a row when you toggle, `tipOpen` is still true from that
  // earlier hover and flipping `collapsed` would pop the label for an item you
  // never touched. Reset the hover state on every toggle (adjust-state-during-
  // render, so there's no one-frame flash) — the tooltip can only reappear from
  // a fresh pointer/keyboard interaction with the row.
  const [tipOpen, setTipOpen] = React.useState(false);
  const [prevCollapsed, setPrevCollapsed] = React.useState(collapsed);
  if (prevCollapsed !== collapsed) {
    setPrevCollapsed(collapsed);
    if (tipOpen) setTipOpen(false);
  }

  const body = (
    <Link
      to={destination}
      aria-current={active ? "page" : undefined}
      aria-label={badge > 0 ? `${label}, ${badge} unread` : label}
      onClick={() => {
        if (isMobile) setOpenMobile(false);
      }}
      className={cn(
        "group/nav relative flex min-h-11 items-center rounded-lg text-[13px] outline-none",
        "transition-[background-color,color] duration-150 ease-out",
        "focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-1 focus-visible:ring-offset-sidebar",
        collapsed ? "w-9 justify-center px-0" : "gap-3 px-2.5",
        active
          ? "bg-sidebar-accent font-medium text-foreground ring-1 ring-inset ring-black/[0.05] dark:ring-white/[0.06]"
          : "text-muted-foreground hover:bg-sidebar-accent/55 hover:text-foreground",
      )}
    >
      {/* Accent indicator — high-contrast, monochrome, sits on the sidebar edge */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute rounded-full bg-foreground transition-all duration-150 ease-out",
          collapsed
            ? "left-0 top-1/2 h-4 -translate-y-1/2"
            : "-left-2.5 top-1/2 h-5 -translate-y-1/2",
          active ? "w-[3px] opacity-100" : "w-[3px] opacity-0",
        )}
      />

      <Icon
        className={cn(
          "h-[17px] w-[17px] shrink-0 transition-colors duration-150",
          active ? "text-foreground" : "text-muted-foreground group-hover/nav:text-foreground",
        )}
        strokeWidth={active ? 2.25 : 2}
      />

      {!collapsed && <span className="min-w-0 flex-1 truncate">{label}</span>}

      {!collapsed && badge > 0 && (
        <span className="ml-auto flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-sidebar-accent px-1 text-[11px] font-semibold tabular-nums text-foreground ring-1 ring-inset ring-black/[0.06] dark:ring-white/[0.08]">
          {badge > 99 ? "99+" : badge}
        </span>
      )}

      {collapsed && badge > 0 && (
        <span
          aria-hidden="true"
          className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-foreground ring-2 ring-sidebar"
        />
      )}
    </Link>
  );

  // Keep the tree shape identical whether expanded or collapsed — swapping
  // between `<li>{body}</li>` and a Tooltip-wrapped `<li>` on every toggle
  // remounted ~15 links at once and made the collapse animation stutter.
  // The tooltip is simply never allowed to open while the sidebar is expanded.
  return (
    <li>
      <Tooltip
        delayDuration={250}
        open={collapsed && tipOpen}
        onOpenChange={setTipOpen}
      >
        <TooltipTrigger asChild>{body}</TooltipTrigger>
        <TooltipContent side="right" className="flex items-center gap-2">
          {label}
          {badge > 0 && (
            <span className="rounded bg-primary-foreground/15 px-1 text-[10px] font-semibold tabular-nums">
              {badge > 99 ? "99+" : badge}
            </span>
          )}
        </TooltipContent>
      </Tooltip>
    </li>
  );
}

// ── Brand ────────────────────────────────────────────────────────────────────
function BrandHeader() {
  const { title } = useRefineOptions();
  const { data: identity } = useGetIdentity<User>();
  const isAdmin = Boolean(identity?.role && ADMIN_ROLES.includes(identity.role));
  const isParent = identity?.role === UserRole.PARENT;
  const usesAcademyBrand = isAdmin || isParent;
  const isSchoolStaff = identity?.role === UserRole.TEACHER || identity?.role === UserRole.STUDENT;
  const { data: portal } = useApiQuery<{ data: { context: { schoolBand: "primary" | "secondary" } | null } }>(isSchoolStaff ? "/portal-context" : null);
  const { open, isMobile, toggleSidebar, setOpenMobile } = useShadcnSidebar();
  const expanded = open || isMobile;
  // Keep the primary brand compact enough to remain legible in the expanded
  // sidebar. The school-band detail remains available in the tagline below.
  const schoolBand = isSchoolStaff ? portal?.data.context?.schoolBand : null;
  // Do not briefly flash the generic Eckernforde Schools label while the
  // student's portal context is loading; resolve the exact school name as
  // soon as the context identifies the primary/secondary campus.
  const schoolName = isSchoolStaff
    ? schoolBand ? portalSchoolName(schoolBand) : "School Portal"
    : "School Portal";
  const schoolTagline = usesAcademyBrand
    ? "School Portal"
    : schoolBand ? portalSchoolTagline(schoolBand) : APP_TAGLINE;
  const schoolDisplayName = schoolBand === "secondary"
    ? "Eckernforde Cambridge"
    : schoolBand === "primary"
      ? "Eckernforde English Medium"
      : schoolName;
  const schoolDisplayTagline = schoolBand === "secondary"
    ? "Secondary School"
    : schoolBand === "primary"
      ? "Primary School"
      : schoolTagline;
  const schoolLogo = isSchoolStaff && schoolBand === "secondary"
    ? "/eckernforde-cambridge-badge.png"
    : isSchoolStaff && schoolBand === "primary"
      ? "/eckernforde-english-medium-primary-badge.png"
      : null;

  const mark = (
    <span className={cn("flex h-10 shrink-0 items-center justify-center overflow-hidden rounded-[10px] text-sidebar-primary-foreground [&>svg]:h-[18px] [&>svg]:w-[18px]", usesAcademyBrand ? "w-auto gap-0.5 bg-transparent px-0 shadow-none" : schoolLogo ? "w-10 bg-transparent shadow-none" : "w-10 bg-sidebar-primary shadow-sm")}>
      {usesAcademyBrand && expanded ? <><img src="/eckernforde-cambridge-badge.png" alt="Eckernforde Schools" className="h-8 w-8 object-contain" /><img src="/eckernforde-english-medium-primary-badge.png" alt="Eckernforde Schools" className="h-8 w-8 object-contain" /></> : usesAcademyBrand ? <img src="/eckernforde-cambridge-badge.png" alt="Eckernforde Schools" className="h-9 w-9 object-contain" /> : schoolLogo ? <img src={schoolLogo} alt={schoolName} className="h-full w-full object-contain" /> : title.icon}
    </span>
  );

  return (
    <ShadcnSidebarHeader className="min-h-16 h-auto flex-row items-center gap-2 border-b border-sidebar-border bg-sidebar px-3 py-3">
      {expanded ? (
        <>
          <div className="flex min-w-0 flex-1 items-center gap-2 px-2 py-2">
            {mark}
            <div className="min-w-0 flex-1 leading-none">
              <p className="max-w-[15rem] whitespace-normal break-words text-[12px] font-bold leading-tight tracking-tight text-sidebar-foreground">
                {schoolDisplayName}
              </p>
              <p className="mt-1 whitespace-normal text-[11px] font-semibold leading-tight text-muted-foreground">{schoolDisplayTagline}</p>
            </div>
          </div>

          {isMobile ? (
            <button
              type="button"
              onClick={() => setOpenMobile(false)}
              aria-label="Close navigation menu"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={toggleSidebar}
              aria-label="Collapse sidebar"
              title="Collapse sidebar (Ctrl+B)"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
            >
              <PanelLeft className="h-4 w-4" />
            </button>
          )}
        </>
      ) : (
        <Tooltip delayDuration={250}>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={toggleSidebar}
              aria-label="Expand sidebar"
              title="Expand sidebar (Ctrl+B)"
              className="mx-auto flex h-9 w-9 items-center justify-center rounded-[10px] outline-none transition-transform hover:scale-[1.04] focus-visible:ring-2 focus-visible:ring-sidebar-ring"
            >
              {mark}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">Expand sidebar</TooltipContent>
        </Tooltip>
      )}
    </ShadcnSidebarHeader>
  );
}

// ── Account ──────────────────────────────────────────────────────────────────
function AccountFooter({ role }: { role?: UserRole }) {
  const { open, isMobile, setOpenMobile } = useShadcnSidebar();
  const collapsed = !open && !isMobile;
  const { data: user } = useGetIdentity<User>();

  return (
    <ShadcnSidebarFooter className="border-t border-sidebar-border bg-sidebar p-2.5">
      <AccountMenu
        side={collapsed ? "right" : "top"}
        align={collapsed ? "end" : "start"}
        contentClassName="w-[--radix-dropdown-menu-trigger-width]"
        onNavigate={() => {
          if (isMobile) setOpenMobile(false);
        }}
      >
        <button
          type="button"
          aria-label="Account menu"
          className={cn(
            "flex w-full items-center gap-2.5 rounded-lg text-left outline-none",
            "transition-colors hover:bg-sidebar-accent/60 focus-visible:ring-2 focus-visible:ring-sidebar-ring",
            "data-[state=open]:bg-sidebar-accent",
            collapsed ? "justify-center p-1" : "p-1.5",
          )}
        >
          <UserAvatar className="h-8 w-8 rounded-lg" />
          {!collapsed && (
            <>
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block truncate text-[13px] font-medium text-sidebar-foreground">
                  {user?.name ?? "Account"}
                </span>
                <span className="block truncate text-[11px] text-muted-foreground">
                  {role ? ROLE_LABEL[role] : user?.email}
                </span>
              </span>
              <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
            </>
          )}
        </button>
      </AccountMenu>
    </ShadcnSidebarFooter>
  );
}

Sidebar.displayName = "Sidebar";
