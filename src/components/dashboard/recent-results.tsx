import { Award } from "lucide-react";
import { ActionQueue } from "@/components/dashboard/action-queue";
import { useApiQuery } from "@/hooks/use-api-query.ts";
import { timeAgo } from "@/lib/time";

type NotificationRow = {
  id: number;
  type: "announcement" | "assignment" | "grade" | "attendance" | "exam" | "general";
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
};

/**
 * A student's most recent graded work, sourced from their own `grade`
 * notifications (`GET /notifications`) — the same rows the notification bell
 * shows, filtered to grades and surfaced as an at-a-glance queue. Not
 * fabricated: every row is a real notification the backend wrote when a
 * teacher graded a submission or saved a final grade.
 */
export function RecentResults({ max = 6 }: { max?: number }) {
  const { data, isLoading, isError, refetch } = useApiQuery<{
    data: NotificationRow[];
  }>("/notifications?limit=50");

  const results = (data?.data ?? []).filter((n) => n.type === "grade");

  return (
    <ActionQueue
      title="Recent results"
      icon={Award}
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
      maxItems={max}
      emptyIcon={Award}
      emptyTitle="No results yet"
      emptyDescription="Grades and feedback from your teachers will show up here."
      viewAll={{ label: "All grades", href: "/grades" }}
      items={results.map((n) => ({
        id: n.id,
        title: n.message,
        meta: timeAgo(n.createdAt),
        href: n.link ?? "/grades",
        badge: n.read ? undefined : { label: "New", tone: "info" as const },
      }))}
    />
  );
}

RecentResults.displayName = "RecentResults";
