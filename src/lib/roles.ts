import { UserRole } from "@/types";

// Single source of truth for role labels and role groupings. Previously these
// were re-declared (with drifting copy — "Admin" vs "Administrator") in
// App.tsx, components/layout/header.tsx and components/layout/sidebar.tsx.

/** Full label — sidebar account area, profile, anywhere with room to breathe. */
export const ROLE_LABEL: Record<UserRole, string> = {
  [UserRole.PRIMARY_HEADMASTER]: "Primary headmaster",
  [UserRole.SECONDARY_HEADMASTER]: "Secondary headmaster",
  [UserRole.SUPER_ADMIN]: "Administrator",
  [UserRole.TEACHER]: "Teacher",
  [UserRole.STUDENT]: "Student",
  [UserRole.PARENT]: "Parent",
};

/** Compact label — the header badge and other tight spots. */
export const ROLE_LABEL_SHORT: Record<UserRole, string> = {
  [UserRole.PRIMARY_HEADMASTER]: "Primary HM",
  [UserRole.SECONDARY_HEADMASTER]: "Secondary HM",
  [UserRole.SUPER_ADMIN]: "Admin",
  [UserRole.TEACHER]: "Teacher",
  [UserRole.STUDENT]: "Student",
  [UserRole.PARENT]: "Parent",
};

/** Teachers + both admin tiers — anyone who manages a classroom. */
export const STAFF_ROLES: UserRole[] = [
  UserRole.TEACHER,
  UserRole.PRIMARY_HEADMASTER,
  UserRole.SECONDARY_HEADMASTER,
  UserRole.SUPER_ADMIN,
];

/** Admin tiers only. */
export const ADMIN_ROLES: UserRole[] = [UserRole.PRIMARY_HEADMASTER, UserRole.SECONDARY_HEADMASTER, UserRole.SUPER_ADMIN];

export const isStaff = (role?: UserRole): boolean =>
  !!role && STAFF_ROLES.includes(role);

export const isAdmin = (role?: UserRole): boolean =>
  !!role && ADMIN_ROLES.includes(role);
