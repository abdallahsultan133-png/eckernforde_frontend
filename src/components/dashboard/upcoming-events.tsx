import { motion } from "framer-motion";
import { Link } from "react-router";
import { CalendarClock, BookOpenCheck, FileText, PartyPopper, CalendarDays } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { useApiQuery } from "@/hooks/use-api-query.ts";

type EventType = "class" | "exam" | "holiday" | "event" | "deadline";

type CalendarEvent = {
    id: number;
    title: string;
    type: EventType;
    startAt: string;
    endAt: string | null;
    class: { id: number; name: string } | null;
};

const TYPE_ICONS: Record<EventType, typeof CalendarClock> = {
    class: CalendarDays,
    exam: BookOpenCheck,
    deadline: FileText,
    event: PartyPopper,
    holiday: PartyPopper,
};

const formatWhen = (iso: string) => {
    const date = new Date(iso);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    const time = date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    if (isToday) return `Today, ${time}`;
    if (isTomorrow) return `Tomorrow, ${time}`;
    return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
};

// Derived purely from startAt/endAt vs. now — there's no "cancelled" concept
// anywhere in the calendar schema, so that status is intentionally not shown
// rather than fabricated.
function eventStatus(startAt: string, endAt: string | null): "live" | "completed" | "upcoming" | null {
    const now = Date.now();
    const start = new Date(startAt).getTime();
    const end = endAt ? new Date(endAt).getTime() : null;

    if (end !== null) {
        if (now >= start && now <= end) return "live";
        if (now > end) return "completed";
        return "upcoming";
    }
    // No end time recorded — only report a status once we have enough
    // information to be confident (more than an hour past start = completed).
    if (now > start + 60 * 60 * 1000) return "completed";
    if (now >= start) return "live";
    return "upcoming";
}

function StatusBadge({ status }: { status: "live" | "completed" | "upcoming" }) {
    if (status === "live") {
        return (
            <Badge className="border-transparent bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                <span className="mr-1 h-1.5 w-1.5 rounded-full bg-emerald-500" /> Live
            </Badge>
        );
    }
    if (status === "completed") {
        return <Badge variant="secondary">Completed</Badge>;
    }
    return <Badge variant="outline">Upcoming</Badge>;
}

export function UpcomingEvents() {
    // Stable within a calendar day, so this doesn't cause a new query key on every render.
    const from = new Date().toISOString().slice(0, 10);
    const to = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const { data, isLoading, isError, refetch } = useApiQuery<{ data: CalendarEvent[] }>(`/calendar?from=${from}&to=${to}`);
    const events = (data?.data ?? []).slice(0, 6);

    return (
        <Card>
            <CardContent className="space-y-4 p-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Upcoming</h2>
                    <Link to="/calendar" className="text-xs text-muted-foreground hover:text-foreground">
                        View calendar →
                    </Link>
                </div>

                {isLoading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                    </div>
                ) : isError ? (
                    <ErrorState description="Unable to load the schedule." onRetry={refetch} />
                ) : events.length === 0 ? (
                    <EmptyState icon={CalendarDays} title="Nothing scheduled" description="Nothing scheduled in the next two weeks." />
                ) : (
                    <div className="space-y-1">
                        {events.map((e, index) => {
                            const Icon = TYPE_ICONS[e.type] ?? CalendarClock;
                            const status = e.type === "class" || e.type === "exam" ? eventStatus(e.startAt, e.endAt) : null;
                            return (
                                <motion.div
                                    key={`${e.type}-${e.id}`}
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.05, ease: "easeOut" }}
                                    className="flex items-center gap-3 rounded-lg py-2"
                                >
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                                        <Icon className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium">{e.title}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatWhen(e.startAt)}{e.class ? ` · ${e.class.name}` : ""}
                                        </p>
                                    </div>
                                    {status && <StatusBadge status={status} />}
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
