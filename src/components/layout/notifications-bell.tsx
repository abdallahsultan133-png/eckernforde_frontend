import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router";
import { Bell, Check, CheckCheck, Megaphone, FileText, GraduationCap, ClipboardCheck, BookOpenCheck, Info } from "lucide-react";
import { toast } from "sonner";
import {
    Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { cn } from "@/lib/utils.ts";
import { BACKEND_BASE_URL } from "@/constants";
import { useApiQuery } from "@/hooks/use-api-query.ts";

type NotificationType = "announcement" | "assignment" | "grade" | "attendance" | "exam" | "general";

type NotificationItem = {
    id: number;
    type: NotificationType;
    title: string;
    message: string;
    read: boolean;
    link: string | null;
    createdAt: string;
};

const TYPE_ICONS: Record<NotificationType, typeof Bell> = {
    announcement: Megaphone,
    assignment: FileText,
    grade: GraduationCap,
    attendance: ClipboardCheck,
    exam: BookOpenCheck,
    general: Info,
};

const timeAgo = (iso: string) => {
    const diffMs = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
};

// Polls every 30s regardless of open state, matching the previous manual-interval behavior.
const POLL_INTERVAL = 30000;
const NOTIFICATIONS_PATH = "/notifications?limit=15";

type NotificationsResponse = { data: NotificationItem[]; unreadCount: number };

export function NotificationsBell() {
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();

    const { data, isLoading: loading, refetch } = useApiQuery<NotificationsResponse>(NOTIFICATIONS_PATH, {
        refetchInterval: POLL_INTERVAL,
    });
    const items = data?.data ?? [];
    const unreadCount = data?.unreadCount ?? 0;

    const setOpenAndRefetch = (next: boolean) => {
        setOpen(next);
        if (next) refetch();
    };

    const markRead = async (id: number) => {
        await fetch(`${BACKEND_BASE_URL}/notifications/${id}/read`, { method: "PATCH", credentials: "include" });
        queryClient.setQueryData<NotificationsResponse>([NOTIFICATIONS_PATH], (prev) =>
            prev ? { data: prev.data.map((n) => n.id === id ? { ...n, read: true } : n), unreadCount: Math.max(0, prev.unreadCount - 1) } : prev
        );
    };

    const markAllRead = async () => {
        await fetch(`${BACKEND_BASE_URL}/notifications/read-all`, { method: "PATCH", credentials: "include" });
        queryClient.setQueryData<NotificationsResponse>([NOTIFICATIONS_PATH], (prev) =>
            prev ? { data: prev.data.map((n) => ({ ...n, read: true })), unreadCount: 0 } : prev
        );
        toast.success("All notifications marked as read.");
    };

    return (
        <Popover open={open} onOpenChange={setOpenAndRefetch}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative" aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : "Notifications"}>
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span aria-hidden="true" className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>

            <PopoverContent align="end" className="w-[360px] p-0">
                <div className="flex items-center justify-between px-4 py-3">
                    <h3 className="font-semibold">Notifications</h3>
                    {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" onClick={markAllRead} className="h-7 gap-1 text-xs">
                            <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                        </Button>
                    )}
                </div>
                <Separator />

                <div className="max-h-[420px] overflow-y-auto">
                    {loading ? (
                        <div className="space-y-3 p-4">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="flex gap-3">
                                    <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                                    <div className="flex-1 space-y-1.5">
                                        <Skeleton className="h-3.5 w-36" />
                                        <Skeleton className="h-3 w-48" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : items.length === 0 ? (
                        <div className="py-10 text-center text-sm text-muted-foreground">
                            <Bell className="mx-auto mb-2 h-5 w-5" />
                            No notifications yet.
                        </div>
                    ) : (
                        items.map((n) => {
                            const Icon = TYPE_ICONS[n.type];
                            const content = (
                                <div
                                    onClick={() => !n.read && markRead(n.id)}
                                    className={cn(
                                        "flex gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors",
                                        !n.read && "bg-blue-50/60 dark:bg-blue-950/30"
                                    )}
                                >
                                    <div className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                                        n.read ? "bg-muted" : "bg-blue-100 dark:bg-blue-900/50")}>
                                        <Icon aria-hidden="true" className={cn("h-4 w-4", n.read ? "text-muted-foreground" : "text-blue-600 dark:text-blue-400")} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-1">
                                            <p className={cn("text-sm leading-snug", !n.read && "font-medium")}>{n.title}</p>
                                            {!n.read && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); e.preventDefault(); markRead(n.id); }}
                                                    className="shrink-0 text-muted-foreground hover:text-primary"
                                                    aria-label={`Mark "${n.title}" as read`}
                                                    title="Mark as read"
                                                >
                                                    <Check className="h-3 w-3" aria-hidden="true" />
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                                        <p className="mt-0.5 text-[10px] text-muted-foreground">{timeAgo(n.createdAt)}</p>
                                    </div>
                                </div>
                            );

                            return n.link ? (
                                <Link key={n.id} to={n.link} onClick={() => { setOpen(false); if (!n.read) markRead(n.id); }}>
                                    {content}
                                </Link>
                            ) : (
                                <div key={n.id}>{content}</div>
                            );
                        })
                    )}
                </div>

                {items.length > 0 && (
                    <>
                        <Separator />
                        <div className="p-2 text-center">
                            <span className="text-xs text-muted-foreground">{items.length} shown · notifications auto-expire after 30 days</span>
                        </div>
                    </>
                )}
            </PopoverContent>
        </Popover>
    );
}
