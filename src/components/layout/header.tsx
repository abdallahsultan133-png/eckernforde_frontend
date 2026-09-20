import { UserAvatar } from "@/components/layout/user-avatar.tsx";
import { NotificationsBell } from "@/components/layout/notifications-bell.tsx";
import { ThemeToggle } from "@/components/refine-ui/theme/theme-toggle.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import { useSidebar } from "@/components/ui/sidebar.tsx";
import { AccountMenu } from "@/components/layout/account-menu.tsx";
import { cn } from "@/lib/utils.ts";
import { portalPage } from "@/lib/portal-page";
import { ROLE_LABEL_SHORT } from "@/lib/roles";
import { UserRole, type User } from "@/types";
import {
  useActiveAuthProvider,
  useGetIdentity,
} from "@refinedev/core";
import { useKBar } from "kbar";
import { Link, useLocation } from "react-router";
import {
  Menu,
  X,
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
      { label: "Create Assignment", href: "/assignments/create", icon: FileText },
      { label: "Mark Attendance", href: "/attendance", icon: ClipboardCheck },
      { label: "Post Announcement", href: "/announcements/create", icon: Megaphone },
    ];
  }
  if (role === UserRole.STUDENT) {
    return [
      { label: "View Assignments", href: "/assignments", icon: FileText },
      { label: "View Report", href: "/grades/term-results", icon: BarChart3 },
    ];
  }
  if (role === UserRole.PARENT) {
    return [{ label: "My Children", href: "/parent", icon: Users }];
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
      <div className="min-w-0">
        <p className="truncate text-base font-semibold leading-tight">{title}</p>
        {description && <p className="truncate text-xs text-muted-foreground">{description}</p>}
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <SearchButton />
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

            <MobileMenuButton />

            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold tracking-tight text-foreground">
                    {title}
                </p>
            </div>
            <div className="flex items-center gap-1">
                <SearchButton className="h-11 w-11" />
                <ThemeToggle className="h-11 w-11" />
                <NotificationsBell />
                <UserDropdown />
            </div>


        </header>
    );
}

function SearchButton({ className }: { className?: string }) {
  const { query } = useKBar();

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Search (Ctrl+K)"
      title="Search (Ctrl+K)"
      className={className}
      onClick={() => query.toggle()}
    >
      <Search className="h-[1.1rem] w-[1.1rem]" />
    </Button>
  );
}

function QuickActionMenu() {
  const { data: identity } = useGetIdentity<User>();
  const actions = quickActionsForRole(identity?.role);

  if (actions.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="hidden gap-1.5 sm:inline-flex">
          <Plus className="h-4 w-4" />
          Quick Action
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
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
