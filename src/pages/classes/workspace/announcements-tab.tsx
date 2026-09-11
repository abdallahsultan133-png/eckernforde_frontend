import { Link } from "react-router";
import { Megaphone, Pin, Plus } from "lucide-react";

import { Button } from "@/components/ui/button.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { EmptyState } from "@/components/ui/empty-state.tsx";
import { ErrorState } from "@/components/ui/error-state.tsx";
import { StatusBadge } from "@/components/ui/status-badge.tsx";
import { useApiQuery } from "@/hooks/use-api-query.ts";
import { timeAgo } from "@/lib/time.ts";
import { SectionCard } from "./section-card.tsx";

type AnnouncementRow = {
  id: number;
  title: string;
  content: string;
  pinned: boolean;
  createdAt: string;
  author: { id: string; name: string } | null;
};

export function AnnouncementsTab({ classId, canManage }: { classId: number; canManage: boolean }) {
  const { data, isLoading, isError, refetch } = useApiQuery<{ data: AnnouncementRow[] }>(
    `/announcements?classId=${classId}`,
  );
  const items = data?.data ?? [];

  const postButton = canManage ? (
    <Button asChild size="sm">
      <Link to={`/announcements/create?classId=${classId}`}>
        <Plus className="mr-1.5 h-4 w-4" />
        Post announcement
      </Link>
    </Button>
  ) : undefined;

  return (
    <SectionCard
      title="Announcements"
      count={isLoading || isError ? undefined : items.length}
      action={postButton}
      flush
    >
      {isLoading ? (
        <div className="divide-y">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2 px-5 py-4">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-full max-w-md" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="p-5">
          <ErrorState description="Couldn't load announcements for this class." onRetry={refetch} />
        </div>
      ) : items.length === 0 ? (
        <div className="p-5">
          <EmptyState
            icon={Megaphone}
            title="No announcements yet"
            description={
              canManage
                ? "Post an update to reach everyone enrolled in this class."
                : "Your teacher hasn't posted any announcements for this class yet."
            }
            action={canManage ? { label: "Post announcement", to: `/announcements/create?classId=${classId}` } : undefined}
          />
        </div>
      ) : (
        <ul className="divide-y">
          {items.map((a) => (
            <li key={a.id} className="px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold">{a.title}</p>
                {a.pinned && (
                  <StatusBadge tone="info" icon={<Pin className="h-3 w-3" />}>
                    Pinned
                  </StatusBadge>
                )}
              </div>
              <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-sm text-muted-foreground">
                {a.content}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {a.author?.name ?? "Unknown"} · {timeAgo(a.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

AnnouncementsTab.displayName = "AnnouncementsTab";
