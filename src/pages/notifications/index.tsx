import { useMemo, useState } from "react";
import { Link } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Bell, BookOpenCheck, Check, CheckCheck, ClipboardCheck, FileText, GraduationCap, Info, Megaphone } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { BACKEND_BASE_URL } from "@/constants";
import { useApiQuery } from "@/hooks/use-api-query";
import { cn } from "@/lib/utils";

type NotificationType = "announcement" | "assignment" | "grade" | "attendance" | "exam" | "general";
type NotificationItem = { id: number; type: NotificationType; title: string; message: string; read: boolean; link: string | null; createdAt: string };
type Response = { data: NotificationItem[]; unreadCount: number };
type Filter = "all" | "unread" | "read";

const PATH = "/notifications?limit=100";
const ICONS: Record<NotificationType, typeof Bell> = {
  announcement: Megaphone,
  assignment: FileText,
  grade: GraduationCap,
  attendance: ClipboardCheck,
  exam: BookOpenCheck,
  general: Info,
};

const timeAgo = (value: string) => {
  const minutes = Math.floor((Date.now() - new Date(value).getTime()) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const dateGroup = (value: string) => {
  const date = new Date(value);
  const today = new Date();
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const difference = Math.round((startToday.getTime() - startDate.getTime()) / 86_400_000);
  if (difference === 0) return "Today";
  if (difference === 1) return "Yesterday";
  return "Earlier";
};

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Filter>("all");
  const { data, isLoading, isError, refetch } = useApiQuery<Response>(PATH);
  const items = useMemo(() => data?.data ?? [], [data?.data]);
  const visible = useMemo(
    () => items.filter((item) => filter === "all" || (filter === "unread" ? !item.read : item.read)),
    [items, filter],
  );
  const groups = useMemo(() => {
    const grouped = new Map<string, NotificationItem[]>();
    for (const item of visible) {
      const key = dateGroup(item.createdAt);
      grouped.set(key, [...(grouped.get(key) ?? []), item]);
    }
    return ["Today", "Yesterday", "Earlier"].flatMap((label) => {
      const groupedItems = grouped.get(label);
      return groupedItems?.length ? [{ label, items: groupedItems }] : [];
    });
  }, [visible]);

  const markRead = async (id: number) => {
    try {
      const response = await fetch(`${BACKEND_BASE_URL}/notifications/${id}/read`, { method: "PATCH", credentials: "include" });
      if (!response.ok) throw new Error("Unable to update notification");
      await queryClient.invalidateQueries({ queryKey: [PATH] });
    } catch {
      toast.error("Couldn't mark this notification as read.");
    }
  };

  const markAllRead = async () => {
    try {
      const response = await fetch(`${BACKEND_BASE_URL}/notifications/read-all`, { method: "PATCH", credentials: "include" });
      if (!response.ok) throw new Error("Unable to update notifications");
      await queryClient.invalidateQueries({ queryKey: [PATH] });
      toast.success("All notifications marked as read.");
    } catch {
      toast.error("Couldn't mark all notifications as read.");
    }
  };

  return (
    <PageContainer className="notifications-page">
      <PageHeader
        breadcrumb
        title="Notifications"
        description="Academic, attendance, homework, and school updates that relate to your account."
        actions={data?.unreadCount ? <Button variant="outline" size="sm" onClick={markAllRead}><CheckCheck className="mr-1.5 h-4 w-4" aria-hidden="true" />Mark all read</Button> : undefined}
      />

      <div className="flex gap-1 overflow-x-auto border-b border-border" role="group" aria-label="Filter notifications">
        {(["all", "unread", "read"] as Filter[]).map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
            className={cn(
              "min-h-10 shrink-0 border-b-2 border-transparent px-3 text-sm font-medium capitalize transition-colors",
              filter === value ? "border-primary text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {value}{value === "unread" && data?.unreadCount ? ` (${data.unreadCount})` : ""}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3" aria-busy="true">{Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-20 w-full" />)}</div>
      ) : isError ? (
        <ErrorState description="Couldn't load notifications." onRetry={refetch} />
      ) : visible.length === 0 ? (
        <EmptyState icon={Bell} title={filter === "all" ? "No notifications yet" : `No ${filter} notifications`} description="New school activity will appear here when it is available." />
      ) : (
        <div className="space-y-7">
          {groups.map((group) => (
            <section key={group.label} aria-labelledby={`notifications-${group.label.toLowerCase()}`}>
              <h2 id={`notifications-${group.label.toLowerCase()}`} className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">{group.label}</h2>
              <div className="divide-y divide-border border-y border-border bg-card">
                {group.items.map((item) => <NotificationRow key={item.id} item={item} onMarkRead={markRead} />)}
              </div>
            </section>
          ))}
        </div>
      )}
    </PageContainer>
  );
}

function NotificationRow({ item, onMarkRead }: { item: NotificationItem; onMarkRead: (id: number) => Promise<void> }) {
  const Icon = ICONS[item.type];
  const content = (
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-2">
        <p className={cn("text-sm font-medium", !item.read && "font-semibold")}>{item.title}</p>
        {!item.read && <StatusBadge tone="info">Unread</StatusBadge>}
      </div>
      <p className="mt-1 text-sm leading-5 text-muted-foreground">{item.message}</p>
      <time className="mt-1 block text-xs text-muted-foreground" dateTime={item.createdAt}>{timeAgo(item.createdAt)}</time>
    </div>
  );

  return (
    <article className={cn("flex items-start gap-3 px-3 py-4 sm:px-4", !item.read && "bg-secondary/20")}>
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center text-muted-foreground"><Icon className="h-4 w-4" aria-hidden="true" /></div>
      {item.link ? <Link to={item.link} className="min-w-0 flex-1 rounded-sm outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring">{content}</Link> : content}
      {!item.read && (
        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" aria-label={`Mark ${item.title} as read`} onClick={() => void onMarkRead(item.id)}>
          <Check className="h-4 w-4" aria-hidden="true" />
        </Button>
      )}
    </article>
  );
}
