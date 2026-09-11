import type { ComponentProps, ReactNode } from "react";
import { Link } from "react-router";
import { useGetIdentity, useLogout } from "@refinedev/core";
import { LogOut, User as UserIcon } from "lucide-react";

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
import type { User } from "@/types";

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
            {user?.email && (
              <span className="block truncate text-[11px] font-normal text-muted-foreground">
                {user.email}
              </span>
            )}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link
            to="/profile"
            onClick={onNavigate}
            className="flex cursor-pointer items-center gap-2"
          >
            <UserIcon className="h-4 w-4" />
            Profile &amp; Settings
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
