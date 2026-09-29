import type { ComponentProps, ReactNode } from "react";
import { Link } from "react-router";
import { useGetIdentity, useLogout } from "@refinedev/core";
import { BookOpen, LogOut, Settings, UserRound } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import { UserAvatar } from "@/components/layout/user-avatar.tsx";
import { cn } from "@/lib/utils.ts";
import { UserRole, type User } from "@/types";

type AccountMenuProps = {
  /** The trigger element (avatar button, full account row, …). */
  children: ReactNode;
  side?: ComponentProps<typeof DropdownMenuContent>["side"];
  align?: ComponentProps<typeof DropdownMenuContent>["align"];
  contentClassName?: string;
  /** Called after a menu item navigates — e.g. close the mobile drawer. */
  onNavigate?: () => void;
};

/**
 * The signed-in user's dropdown — identity header, Profile & Settings, Log out.
 * The header and the sidebar footer previously each carried their own copy of
 * this menu (with drifting markup); this is the single implementation. Only the
 * trigger differs between call sites, so that stays a `children` prop.
 */
export function AccountMenu({
  children,
  side = "bottom",
  align = "end",
  contentClassName,
  onNavigate,
}: AccountMenuProps) {
  const { data: user } = useGetIdentity<User>();
  const { mutate: logout, isPending } = useLogout();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent
        side={side}
        align={align}
        sideOffset={8}
        className={cn("min-w-56", contentClassName)}
      >
        <DropdownMenuLabel className="flex items-center gap-2.5 py-2">
          <UserAvatar className="h-8 w-8 rounded-lg" />
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-[13px] font-medium">
              {user?.name ?? "Account"}
            </span>
            {user?.email && user.role !== UserRole.STUDENT && (
              <span className="block truncate text-[11px] font-normal text-muted-foreground">
                {user.email}
              </span>
            )}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {user?.role === UserRole.TEACHER && <DropdownMenuItem asChild>
          <Link
            to="/portal/setup?change=1"
            onClick={onNavigate}
            className="flex cursor-pointer items-center gap-2"
          >
            <BookOpen className="h-4 w-4" />
            Change form or class
          </Link>
        </DropdownMenuItem>}
        {user?.role === UserRole.STUDENT && <DropdownMenuItem asChild>
          <Link
            to="/portal/setup?change=1"
            onClick={onNavigate}
            className="flex cursor-pointer items-center gap-2"
          >
            <BookOpen className="h-4 w-4" />
            Change form or class
          </Link>
        </DropdownMenuItem>}
        <DropdownMenuItem asChild>
          <Link to="/profile" onClick={onNavigate} className="flex cursor-pointer items-center gap-2">
            <UserRound className="h-4 w-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/profile#security" onClick={onNavigate} className="flex cursor-pointer items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => logout()}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="h-4 w-4 text-destructive" />
          {isPending ? "Logging out…" : "Log out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

AccountMenu.displayName = "AccountMenu";
