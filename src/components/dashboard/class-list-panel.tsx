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
  /** Optional heading override for role-specific dashboard copy. */
  title?: string;
  /** Student rows open the Class & Subjects catalogue instead of a class workspace. */
  studentView?: boolean;
  /** Hide the dashboard footer link when the rows already provide the intended navigation. */
  hideViewAll?: boolean;
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
  title,
  studentView = false,
  hideViewAll = false,
  max = 6,
}: ClassListPanelProps) {
  const scope = variant === "mine" ? "&mine=1" : "";
  const { data, isLoading, isError, refetch } = useApiQuery<{ data: ClassRow[] }>(
    `/classes?limit=${Math.max(max, 12)}${scope}`,
  );
  const classes = data?.data ?? [];
  const displayClasses = variant === "mine"
    ? Array.from(classes.reduce((groups, item) => {
        const current = groups.get(item.name) ?? { ...item, subjects: [] as string[] };
        if (item.subject?.name && !current.subjects.includes(item.subject.name)) current.subjects.push(item.subject.name);
        groups.set(item.name, current);
        return groups;
      }, new Map<string, ClassRow & { subjects: string[] }>()).values())
    : classes;

  return (
    <ActionQueue
      title={title ?? (variant === "recent" ? "Recent classes" : "My classes")}
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
      viewAll={hideViewAll ? undefined : { label: "All classes", href: "/classes" }}
      items={displayClasses.map((c) => ({
        id: c.id,
        title: c.name,
        meta: [
          (c as ClassRow & { subjects?: string[] }).subjects?.length ? `Subjects: ${(c as ClassRow & { subjects: string[] }).subjects.join(", ")}` : null,
          !(c as ClassRow & { subjects?: string[] }).subjects && c.subject ? `${c.subject.code} · ${c.subject.name}` : null,
          showTeacher && c.teacher ? c.teacher.name : null,
        ]
          .filter(Boolean)
          .join("  ·  "),
        href: studentView ? "/classes" : `/classes/show/${c.id}`,
        badge:
          c.status !== "active"
            ? { label: c.status, tone: "neutral" as const }
            : undefined,
      }))}
    />
  );
}

ClassListPanel.displayName = "ClassListPanel";
