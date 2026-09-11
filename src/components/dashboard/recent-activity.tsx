import { motion } from "framer-motion";
import { Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Megaphone, FileText, CheckCircle2, Activity, ArrowRight } from "lucide-react";
import { useApiQuery } from "@/hooks/use-api-query.ts";

type ActivityItem = {
  type: "announcement" | "assignment" | "submission";
  id: number;
  title: string;
  description: string;
  time: string;
};

const ICONS = {
  announcement: Megaphone,
  assignment: FileText,
  submission: CheckCircle2,
} as const;

const timeAgo = (iso: string) => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

interface RecentActivityProps {
  /** Restrict the feed to these activity types — e.g. announcements-only for a parent. */
  types?: ActivityItem["type"][];
  /** How many items to request from the backend. Dashboard shows 5; the full page asks for more. */
  limit?: number;
  /** Show the "Read more" link to the full activity page. Hidden on the full page itself. */
  showReadMore?: boolean;
}

export function RecentActivity({ types, limit = 5, showReadMore = true }: RecentActivityProps = {}) {
  const { data, isLoading, isError, refetch } = useApiQuery<{ data: ActivityItem[] }>(
    `/dashboard/recent-activity?limit=${limit}`,
  );
  const activities = (data?.data ?? []).filter((a) => !types || types.includes(a.type));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))
        ) : isError ? (
          <ErrorState description="Unable to load recent activity." onRetry={refetch} />
        ) : activities.length === 0 ? (
          <EmptyState icon={Activity} title="No recent activity yet" description="Announcements, assignments, and submissions will show up here." />
        ) : (
          <>
            {activities.map((activity, index) => {
              const Icon = ICONS[activity.type];
              return (
                <motion.div
                  key={`${activity.type}-${activity.id}`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05, ease: "easeOut" }}
                  className="flex items-start gap-3"
                >
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex flex-col">
                    <p className="text-sm font-medium leading-snug">{activity.title}</p>
                    <p className="text-sm text-muted-foreground">{activity.description}</p>
                    <span className="text-xs text-muted-foreground">{timeAgo(activity.time)}</span>
                  </div>
                </motion.div>
              );
            })}

            {showReadMore && (
              <Link
                to="/activity"
                className="inline-flex items-center gap-1 pt-1 text-sm font-medium text-primary hover:underline"
              >
                Read more
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
