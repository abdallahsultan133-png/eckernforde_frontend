import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { cn } from "@/lib/utils.ts";
import type { User } from "@/types";
import { useGetIdentity } from "@refinedev/core";
import { User as UserIcon } from "lucide-react";

const getInitials = (name = "") => {
  const names = name.trim().split(" ").filter(Boolean);
  if (names.length === 0) return "";

  let initials = names[0].substring(0, 1).toUpperCase();
  if (names.length > 1) {
    initials += names[names.length - 1].substring(0, 1).toUpperCase();
  }
  return initials;
};

type UserAvatarProps = {
  /** Override the default h-10 w-10 sizing (e.g. a compact avatar in the sidebar footer). */
  className?: string;
};

export function UserAvatar({ className }: UserAvatarProps = {}) {
  const { data: user, isLoading: userIsLoading } = useGetIdentity<User>();

  if (userIsLoading) {
    return <Skeleton className={cn("h-10 w-10 rounded-full", className)} />;
  }

  if (!user) {
    return (
      <Avatar className={cn("h-10 w-10", className)}>
        <AvatarFallback>
          <UserIcon className="h-5 w-5" />
        </AvatarFallback>
      </Avatar>
    );
  }

  return (
    <Avatar className={cn("h-10 w-10", className)}>
      {user.image && <AvatarImage src={user.image} alt={user.name} />}

      <AvatarFallback>
        {user.name ? getInitials(user.name) : <UserIcon className="h-4 w-4" />}
      </AvatarFallback>
    </Avatar>
  );
}

UserAvatar.displayName = "UserAvatar";
