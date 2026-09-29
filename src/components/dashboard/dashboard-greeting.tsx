import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useGetIdentity } from "@refinedev/core";
import type { User } from "@/types";
import { UserRole } from "@/types";
import { useApiQuery } from "@/hooks/use-api-query";
import { portalSchoolName } from "@/lib/school-brand";

const firstName = (name?: string) => name?.trim().split(/\s+/)[0] ?? "";

/**
 * The dashboard masthead — "Welcome back, {first name}" plus a role-specific
 * subtitle. All four role dashboards had their own copy of this `motion.div`;
 * this is the single version.
 */
export function DashboardGreeting({ subtitle }: { subtitle: ReactNode }) {
  const { data: identity } = useGetIdentity<User>();
  const isSchoolStaff = identity?.role === UserRole.STUDENT || identity?.role === UserRole.TEACHER;
  const { data: portal } = useApiQuery<{ data: { context: { schoolBand: "primary" | "secondary" } | null } }>(isSchoolStaff ? "/portal-context" : null);
  const reduce = useReducedMotion();
  const name = firstName(identity?.name);
  const schoolName = isSchoolStaff ? portalSchoolName(portal?.data.context?.schoolBand) : "School Portal";
  const today = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  const hour = new Date().getHours();
  const salutation = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary/75">
        <span>{schoolName}</span>
        <span aria-hidden="true" className="h-1 w-1 rounded-full bg-primary/45" />
        <span className="text-muted-foreground">{today}</span>
      </div>
      <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
        {salutation}{name ? `, ${name}` : ""}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground sm:text-base">{subtitle}</p>
    </motion.div>
  );
}

DashboardGreeting.displayName = "DashboardGreeting";
