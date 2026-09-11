import { GraduationCap } from "lucide-react";
import { ActionQueue } from "@/components/dashboard/action-queue";
import { useApiQuery } from "@/hooks/use-api-query.ts";

type ClassRow = {
  id: number;
  name: string;
  status: "active" | "inactive" | "archived";
  subject?: { name: string; code: string } | null;
  teacher?: { name: string } | null;
};

interface ClassListPanelProps {
  /** "teacher"/"student" → "My classes"; "admin" → "Recent classes". */
  variant?: "mine" | "recent";
  /** Show the teacher name in the meta line (useful for students/admins). */
  showTeacher?: boolean;
  max?: number;
}

/**
 * Compact list of the signed-in user's classes (`GET /classes` is already
 * role-scoped server-side — a teacher gets their own, a student their enrolled
 * ones, an admin the catalogue). Each row deep-links into the class workspace.
 */
export function ClassListPanel({
  variant = "mine",
  showTeacher = false,
  max = 6,
}: ClassListPanelProps) {
  const { data, isLoading, isError, refetch } = useApiQuery<{ data: ClassRow[] }>(
    `/classes?limit=${Math.max(max, 12)}`,
  );
  const classes = data?.data ?? [];

  return (
    <ActionQueue
      title={variant === "recent" ? "Recent classes" : "My classes"}
      icon={GraduationCap}
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
      maxItems={max}
      emptyIcon={GraduationCap}
      emptyTitle="No classes yet"
      emptyDescription={
        variant === "recent"
          ? "Classes created in your school will show up here."
          : "You're not in any classes yet."
      }
      viewAll={{ label: "All classes", href: "/classes" }}
      items={classes.map((c) => ({
        id: c.id,
        title: c.name,
        meta: [
          c.subject ? `${c.subject.code} · ${c.subject.name}` : null,
          showTeacher && c.teacher ? c.teacher.name : null,
        ]
          .filter(Boolean)
          .join("  ·  "),
        href: `/classes/show/${c.id}`,
        badge:
          c.status !== "active"
            ? { label: c.status, tone: "neutral" as const }
            : undefined,
      }))}
    />
  );
}

ClassListPanel.displayName = "ClassListPanel";
