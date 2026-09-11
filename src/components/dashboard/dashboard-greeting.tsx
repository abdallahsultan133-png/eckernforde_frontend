import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useGetIdentity } from "@refinedev/core";
import type { User } from "@/types";

const firstName = (name?: string) => name?.trim().split(/\s+/)[0] ?? "";

/**
 * The dashboard masthead — "Welcome back, {first name}" plus a role-specific
 * subtitle. All four role dashboards had their own copy of this `motion.div`;
 * this is the single version.
 */
export function DashboardGreeting({ subtitle }: { subtitle: ReactNode }) {
  const { data: identity } = useGetIdentity<User>();
  const reduce = useReducedMotion();
  const name = firstName(identity?.name);

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
        Welcome back{name ? `, ${name}` : ""}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground sm:text-base">{subtitle}</p>
    </motion.div>
  );
}

DashboardGreeting.displayName = "DashboardGreeting";
