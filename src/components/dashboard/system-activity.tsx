import { History } from "lucide-react";
import { ActionQueue } from "@/components/dashboard/action-queue";
import { useApiQuery } from "@/hooks/use-api-query.ts";
import { timeAgo } from "@/lib/time";

type AuditRow = {
  id: number;
  action: string;
  resource: string;
  resourceId: string | null;
  details: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string } | null;
};

const VERB: Record<string, string> = {
  create: "created",
  update: "updated",
  delete: "deleted",
  grade: "graded",
  mark: "recorded",
  save: "saved",
  enroll: "enrolled a student",
  unenroll: "removed a student",
  self_join: "joined a class",
  link_parent: "linked a parent",
  unlink_parent: "unlinked a parent",
  role_update: "changed a role",
  photo_update: "updated a photo",
  photo_remove: "removed a photo",
  reset_password: "reset a password",
};

const NOUN: Record<string, string> = {
  classes: "a class",
  subjects: "a subject",
  assignments: "an assignment",
  submissions: "a submission",
  exams: "an exam",
  exam_results: "exam results",
  class_grades: "final grades",
  calendar_events: "a calendar event",
  users: "a user",
  enrollments: "an enrolment",
  departments: "a department",
  student_profiles: "a student profile",
  announcements: "an announcement",
};

/** "class.create" → "Created a class"; falls back to a Title-cased action. */
function humanizeAction(action: string, resource: string): string {
  const verbKey = action.includes(".") ? action.split(".")[1] : action;
  const verb = VERB[verbKey];
  const noun = NOUN[resource];
  if (verb && noun) {
    const v = verb.charAt(0).toUpperCase() + verb.slice(1);
    // "enrolled a student" etc. already reads whole — don't append a noun.
    return /\ba\b|\ban\b/.test(verb) ? v : `${v} ${noun}`;
  }
  return action.replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * The last few administrative actions from the audit log (`GET /audit-logs`,
 * admin-only). Distinct from the org-wide "Recent activity" feed: this is who
 * changed what — class edits, role changes, grade saves — not new content.
 */
export function SystemActivity({ max = 7 }: { max?: number }) {
  const { data, isLoading, isError, refetch } = useApiQuery<{ data: AuditRow[] }>(
    "/audit-logs?limit=10",
  );

  const rows = data?.data ?? [];

  return (
    <ActionQueue
      title="System activity"
      icon={History}
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
      maxItems={max}
      emptyIcon={History}
      emptyTitle="No recent activity"
      emptyDescription="Administrative changes across the school will be logged here."
      viewAll={{ label: "Full audit log", href: "/admin/audit-logs" }}
      items={rows.map((r) => ({
        id: r.id,
        title: r.details || humanizeAction(r.action, r.resource),
        meta: `${r.user?.name ?? "System"} · ${timeAgo(r.createdAt)}`,
      }))}
    />
  );
}

SystemActivity.displayName = "SystemActivity";
