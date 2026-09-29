import { useState } from "react";
import { useGetIdentity } from "@refinedev/core";
import { keepPreviousData, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import {
    ChevronLeft, ChevronRight, Plus, Minus, Loader2, Trash2,
    BookOpenCheck, CalendarDays, Flag, Clock, Repeat, Sparkles, CalendarRange, LayoutGrid, List, Rows3, CircleCheck,
    Download, ExternalLink, School, UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Breadcrumb } from "@/components/layout/breadcrumb.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Field } from "@/components/ui/field.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { ErrorState } from "@/components/ui/error-state.tsx";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog.tsx";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
    AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog.tsx";
import { BACKEND_BASE_URL } from "@/constants";
import { useApiQuery } from "@/hooks/use-api-query.ts";
import { UserRole, type User } from "@/types";
import { cn } from "@/lib/utils.ts";

type CalendarEventType = "class" | "exam" | "holiday" | "event" | "deadline";
type EventSource = "manual" | "exam" | "homework";
type RecurrenceFreq = "none" | "daily" | "weekly" | "monthly";

type CalendarEvent = {
    id: number;
    title: string;
    type: CalendarEventType;
    startAt: string;
    endAt: string | null;
    allDay: boolean;
    description: string | null;
    class: { id: number; name: string } | null;
    source: EventSource;
    link?: string | null;
    recurrenceFreq?: RecurrenceFreq;
    isRecurrenceInstance?: boolean;
    recurrenceParentId?: number | null;
};

type LinkedChild = { id: string; name: string };

const RECURRENCE_LABELS: Record<RecurrenceFreq, string> = {
    none: "Does not repeat",
    daily: "Repeats daily",
    weekly: "Repeats weekly",
    monthly: "Repeats monthly",
};

const TYPE_CONFIG: Record<CalendarEventType, {
    label: string;
    icon: LucideIcon;
    dot: string;
    /** Legend / badge pill. */
    chip: string;
    /** Compact event chip inside a month cell — tinted fill + left accent bar. */
    cell: string;
    /** Round icon badge in the agenda panel. */
    iconWrap: string;
}> = {
    class: {
        label: "Class",
        icon: CalendarDays,
        dot: "bg-blue-500",
        chip: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300",
        cell: "border-l-2 border-blue-500 bg-blue-50/80 text-blue-900 dark:border-blue-400 dark:bg-blue-950/50 dark:text-blue-100",
        iconWrap: "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400",
    },
    exam: {
        label: "Exam",
        icon: BookOpenCheck,
        dot: "bg-red-500",
        chip: "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300",
        cell: "border-l-2 border-red-500 bg-red-50/80 text-red-900 dark:border-red-400 dark:bg-red-950/50 dark:text-red-100",
        iconWrap: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400",
    },
    holiday: {
        label: "Holiday",
        icon: Flag,
        dot: "bg-emerald-500",
        chip: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
        cell: "border-l-2 border-emerald-500 bg-emerald-50/80 text-emerald-900 dark:border-emerald-400 dark:bg-emerald-950/50 dark:text-emerald-100",
        iconWrap: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400",
    },
    event: {
        label: "Event",
        icon: Sparkles,
        dot: "bg-primary",
        chip: "border-primary/25 bg-primary/5 text-primary",
        cell: "border-l-2 border-primary bg-primary/5 text-foreground",
        iconWrap: "bg-primary/10 text-primary",
    },
    deadline: {
        label: "Deadline",
        icon: Clock,
        dot: "bg-amber-500",
        chip: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
        cell: "border-l-2 border-amber-500 bg-amber-50/80 text-amber-900 dark:border-amber-400 dark:bg-amber-950/50 dark:text-amber-100",
        iconWrap: "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400",
    },
};

const EVENT_TYPES: CalendarEventType[] = ["class", "exam", "holiday", "event", "deadline"];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const isoDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const fullEventTime = (event: CalendarEvent) => {
    if (isAllDayLike(event)) return "All day";
    const start = new Date(event.startAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    const end = event.endAt ? new Date(event.endAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : null;
    return end ? `${start} – ${end}` : start;
};

const icsDate = (iso: string, allDay: boolean) => {
    const date = new Date(iso);
    if (allDay) return isoDate(date).replaceAll("-", "");
    return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
};

const escapeIcs = (value: string) => value.replaceAll("\\", "\\\\").replaceAll("\n", "\\n").replaceAll(",", "\\,").replaceAll(";", "\\;");

const downloadCalendar = (events: CalendarEvent[], label: string) => {
    const body = events.map((event) => [
        "BEGIN:VEVENT",
        `UID:${event.source}-${event.id}-${event.startAt}@eckernforde-schools`,
        `${event.allDay ? "DTSTART;VALUE=DATE" : "DTSTART"}:${icsDate(event.startAt, event.allDay)}`,
        ...(event.endAt ? [`${event.allDay ? "DTEND;VALUE=DATE" : "DTEND"}:${icsDate(event.endAt, event.allDay)}`] : []),
        `SUMMARY:${escapeIcs(event.title)}`,
        ...(event.description ? [`DESCRIPTION:${escapeIcs(event.description)}`] : []),
        ...(event.class?.name ? [`LOCATION:${escapeIcs(event.class.name)}`] : []),
        "END:VEVENT",
    ].join("\r\n")).join("\r\n");
    const blob = new Blob([`BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Eckernforde Schools//Portal Calendar//EN\r\n${body}\r\nEND:VCALENDAR\r\n`], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-calendar.ics`;
    anchor.click();
    URL.revokeObjectURL(url);
};

/** "9a", "2:30p" — terse enough to fit an event chip. */
const compactTime = (iso: string) => {
    const d = new Date(iso);
    let h = d.getHours();
    const m = d.getMinutes();
    const suffix = h >= 12 ? "p" : "a";
    h = h % 12 || 12;
    return m === 0 ? `${h}${suffix}` : `${h}:${String(m).padStart(2, "0")}${suffix}`;
};

const isAllDayLike = (e: CalendarEvent) => e.allDay || e.type === "holiday";

// All-day items float to the top of a day, then timed items in chronological order.
const byStart = (a: CalendarEvent, b: CalendarEvent) => {
    if (isAllDayLike(a) !== isAllDayLike(b)) return isAllDayLike(a) ? -1 : 1;
    return new Date(a.startAt).getTime() - new Date(b.startAt).getTime();
};

const gridVariants = {
    enter: (dir: number) => ({ opacity: 0, x: dir === 0 ? 0 : dir * 28 }),
    center: { opacity: 1, x: 0 },
    exit: (dir: number) => ({ opacity: 0, x: dir === 0 ? 0 : -dir * 28 }),
};

type CalendarView = "month" | "week" | "day" | "agenda";

function PanelEmpty({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
    return (
        <div className="flex flex-col items-center gap-3 py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted/60 ring-1 ring-inset ring-border/60">
                <Icon className="h-5 w-5 text-muted-foreground/70" />
            </div>
            <p className="text-sm text-muted-foreground">{text}</p>
        </div>
    );
}

function EventRow({ event, onSelect, dense = false }: { event: CalendarEvent; onSelect: (event: CalendarEvent) => void; dense?: boolean }) {
    const config = TYPE_CONFIG[event.type];
    const Icon = config.icon;
    return (
        <button type="button" onClick={() => onSelect(event)} className={cn("group/event flex w-full min-w-0 items-start gap-3 rounded-lg border border-border/60 bg-card/70 p-3 text-left transition hover:border-primary/25 hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", dense && "gap-2 p-2.5")}>
            <div className={cn("mt-0.5 flex shrink-0 items-center justify-center rounded-md", dense ? "h-7 w-7" : "h-8 w-8", config.iconWrap)}>
                <Icon className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex items-start gap-2"><p className="min-w-0 flex-1 truncate text-sm font-semibold">{event.title}</p><ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition group-hover/event:opacity-100" aria-hidden="true" /></div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className={cn("text-[10px]", config.chip)}>{config.label}</Badge>
                    <span>{fullEventTime(event)}</span>
                    {event.class && <span className="truncate">{event.class.name}</span>}
                </div>
                {!dense && event.description && <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">{event.description}</p>}
            </div>
        </button>
    );
}

function AgendaView({ events, month, year, onSelect }: { events: CalendarEvent[]; month: number; year: number; onSelect: (event: CalendarEvent) => void }) {
    const groups = Array.from(new Set(events.map((event) => event.startAt.slice(0, 10)))).sort();
    if (groups.length === 0) return <PanelEmpty icon={CalendarDays} text="Nothing scheduled in this period." />;
    return (
        <div className="space-y-5 p-4 sm:p-6">
            {groups.map((date) => (
                <section key={date} aria-labelledby={`agenda-${date}`}>
                    <div className="mb-2 flex items-baseline justify-between gap-3">
                        <h3 id={`agenda-${date}`} className="font-display text-sm font-semibold">
                            {new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}
                        </h3>
                        <span className="text-xs text-muted-foreground">{month === new Date(`${date}T12:00:00`).getMonth() && year === new Date(`${date}T12:00:00`).getFullYear() ? "This month" : "Adjacent date"}</span>
                    </div>
                    <div className="grid gap-2 md:grid-cols-2">
                        {events.filter((event) => event.startAt.slice(0, 10) === date).sort(byStart).map((event) => <EventRow key={`${event.id}-${event.startAt}`} event={event} onSelect={onSelect} />)}
                    </div>
                </section>
            ))}
        </div>
    );
}

function WeekView({ anchor, eventsOn, onSelectDay, onSelectEvent }: { anchor: Date; eventsOn: (date: Date) => CalendarEvent[]; onSelectDay: (date: Date) => void; onSelectEvent: (event: CalendarEvent) => void }) {
    const start = new Date(anchor);
    start.setDate(anchor.getDate() - anchor.getDay());
    const days = Array.from({ length: 7 }, (_, index) => {
        const date = new Date(start);
        date.setDate(start.getDate() + index);
        return date;
    });
    return (
        <div className="grid grid-cols-1 divide-y divide-border/60 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-7">
            {days.map((date) => {
                const events = eventsOn(date);
                return (
                    <section key={isoDate(date)} className="min-h-44 p-3 text-left">
                        <div className="mb-3 flex items-center justify-between gap-2">
                            <button type="button" onClick={() => onSelectDay(date)} className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground hover:text-foreground">{DAYS[date.getDay()]}</button>
                            <button type="button" onClick={() => onSelectDay(date)} className={cn("flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold hover:bg-muted", isoDate(date) === isoDate(new Date()) && "bg-primary text-primary-foreground hover:bg-primary")}>{date.getDate()}</button>
                        </div>
                        <div className="space-y-2">
                            {events.slice(0, 4).map((event) => <EventRow key={`${event.id}-${event.startAt}`} event={event} onSelect={onSelectEvent} dense />)}
                            {events.length > 4 && <p className="pl-1 text-xs font-medium text-muted-foreground">+{events.length - 4} more</p>}
                            {events.length === 0 && <p className="text-xs text-muted-foreground/60">No events</p>}
                        </div>
                    </section>
                );
            })}
        </div>
    );
}

function DayView({ date, eventsOn, onSelect }: { date: Date; eventsOn: (date: Date) => CalendarEvent[]; onSelect: (event: CalendarEvent) => void }) {
    const events = eventsOn(date);
    return (
        <div className="p-4 sm:p-6">
            <div className="mb-4 flex items-baseline justify-between gap-3 border-b border-border/60 pb-4">
                <h3 className="font-display text-lg font-semibold">{date.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}</h3>
                <span className="text-xs text-muted-foreground">{events.length} event{events.length === 1 ? "" : "s"}</span>
            </div>
            {events.length === 0 ? <PanelEmpty icon={CalendarDays} text="Nothing scheduled for this day." /> : <div className="grid gap-2 md:grid-cols-2">{events.map((event) => <EventRow key={`${event.id}-${event.startAt}`} event={event} onSelect={onSelect} />)}</div>}
        </div>
    );
}

const CalendarPage = () => {
    const { data: identity } = useGetIdentity<User>();
    const isAdmin = identity?.role === UserRole.ADMIN || identity?.role === UserRole.SUPER_ADMIN;
    const isParent = identity?.role === UserRole.PARENT;

    const queryClient = useQueryClient();
    const [today] = useState(new Date());
    const [current, setCurrent] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
    const [direction, setDirection] = useState(0);
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);
    const [view, setView] = useState<CalendarView>(() => typeof window !== "undefined" && window.matchMedia?.("(max-width: 640px)").matches ? "agenda" : "month");
    const [showForm, setShowForm] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [childId, setChildId] = useState("");

    // Form state
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [type, setType] = useState<CalendarEventType>("event");
    const [startAt, setStartAt] = useState("");
    const [endAt, setEndAt] = useState("");
    const [allDay, setAllDay] = useState(false);
    const [recurrenceFreq, setRecurrenceFreq] = useState<RecurrenceFreq>("none");
    const [recurrenceEndAt, setRecurrenceEndAt] = useState("");
    const [creating, setCreating] = useState(false);

    const year = current.getFullYear();
    const month = current.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const weeks = Math.ceil((firstWeekday + daysInMonth) / 7);
    const totalCells = weeks * 7;

    // The visible grid spills into the previous/next month — fetch that whole
    // window so leading/trailing days show their real events too, the way a
    // desktop calendar does, instead of rendering as dead cells.
    const gridStart = new Date(year, month, 1 - firstWeekday);
    const gridEnd = new Date(year, month, 1 - firstWeekday + totalCells - 1);
    const isCurrentMonth = month === today.getMonth() && year === today.getFullYear();

    const childrenQuery = useApiQuery<{ data: LinkedChild[] }>(isParent ? "/profile/my-children" : null);
    const linkedChildren = childrenQuery.data?.data ?? [];
    const selectedChildId = childId || linkedChildren[0]?.id || "";
    const calendarPath = `/calendar?from=${isoDate(gridStart)}&to=${isoDate(gridEnd)}${isParent && selectedChildId ? `&childId=${encodeURIComponent(selectedChildId)}` : ""}`;
    const { data, isFetching, isLoading, isError, refetch } = useApiQuery<{ data: CalendarEvent[] }>(calendarPath, {
        placeholderData: keepPreviousData,
    });
    const allEvents = data?.data ?? [];
    const visibleEvents = allEvents;

    const goToMonth = (offset: number) => {
        setDirection(offset);
        setCurrent(new Date(year, month + offset, 1));
    };
    const goToToday = () => {
        setDirection(0);
        setCurrent(new Date(today.getFullYear(), today.getMonth(), 1));
    };
    const openDay = (d: Date) => {
        if (d.getMonth() !== month || d.getFullYear() !== year) {
            setDirection(d.getTime() > current.getTime() ? 1 : -1);
            setCurrent(new Date(d.getFullYear(), d.getMonth(), 1));
        }
        setSelectedDay(d);
    };
    const openCreateOn = (d: Date) => {
        setStartAt(`${isoDate(d)}T09:00`);
        setAllDay(false);
        setShowForm(true);
    };

    const eventsOn = (d: Date) => {
        const key = isoDate(d);
        return visibleEvents.filter((e) => e.startAt.slice(0, 10) === key).sort(byStart);
    };

    const selectedEvents = selectedDay ? eventsOn(selectedDay) : [];
    const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;
    const monthEvents = visibleEvents.filter((e) => e.startAt.slice(0, 7) === monthKey);
    const now = new Date();
    const upcomingEvents = [...visibleEvents]
        .filter((e) => new Date(e.startAt).getTime() >= now.getTime())
        .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
        .slice(0, 6);
    const nextUp = upcomingEvents[0];
    const examOrDeadlineCount = monthEvents.filter((e) => e.type === "exam" || e.type === "deadline").length;
    const focusDay = selectedDay ?? (isCurrentMonth ? today : new Date(year, month, 1));
    const viewAnchor = focusDay;
    const focusEvents = eventsOn(focusDay);

    // fetch() rejects with a TypeError when the request never reached the server
    // (backend down, wrong VITE_BACKEND_BASE_URL, CORS) — surface that as
    // something actionable instead of the raw "Failed to fetch".
    const describeError = (err: unknown, fallback: string) => {
        if (err instanceof TypeError) return "Couldn't reach the server — is the backend running?";
        return err instanceof Error ? err.message : fallback;
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return toast.error("Title is required.");
        if (!startAt) return toast.error("Start date/time is required.");
        setCreating(true);
        try {
            const res = await fetch(`${BACKEND_BASE_URL}/calendar`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: title.trim(), description: description || undefined, type, startAt, endAt: endAt || undefined, allDay,
                    recurrenceFreq, recurrenceEndAt: recurrenceFreq !== "none" && recurrenceEndAt ? recurrenceEndAt : undefined,
                }),
            });
            if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error ?? "Failed to create event");
            toast.success("Event created.");
            setTitle(""); setDescription(""); setStartAt(""); setEndAt(""); setType("event"); setAllDay(false);
            setRecurrenceFreq("none"); setRecurrenceEndAt("");
            setShowForm(false);
            queryClient.invalidateQueries({ queryKey: [calendarPath] });
        } catch (err) {
            toast.error(describeError(err, "Failed to create event"));
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (eventId: number) => {
        setDeletingId(eventId);
        try {
            const res = await fetch(`${BACKEND_BASE_URL}/calendar/${eventId}`, { method: "DELETE", credentials: "include" });
            if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error ?? "Failed to delete event");
            queryClient.invalidateQueries({ queryKey: [calendarPath] });
            toast.success("Event deleted.");
        } catch (err) {
            toast.error(describeError(err, "Failed to delete event"));
        } finally {
            setDeletingId(null);
        }
    };

    const rowStyle = { gridTemplateRows: `repeat(${weeks}, minmax(6.75rem, 1fr))` } as const;
    const firstLoad = isLoading && !data;

    return (
        <div className="calendar-page space-y-6">
            <Breadcrumb />

            <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="flex flex-wrap items-end justify-between gap-4"
            >
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/5 text-primary">
                        <CalendarRange className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="font-display text-2xl font-bold tracking-tight">School calendar</h1>
                        <p className="text-sm text-muted-foreground">Classes, homework deadlines, exams and school events in one place.</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                {isParent && linkedChildren.length > 0 && (
                    <Select value={selectedChildId} onValueChange={(value) => { setChildId(value); setSelectedDay(null); setSelectedEvent(null); }}>
                        <SelectTrigger className="h-9 w-[190px]" aria-label="Choose child calendar"><UserRound className="mr-2 h-4 w-4 text-muted-foreground" /><SelectValue /></SelectTrigger>
                        <SelectContent>{linkedChildren.map((child) => <SelectItem key={child.id} value={child.id}>{child.name}</SelectItem>)}</SelectContent>
                    </Select>
                )}
                <Button variant="outline" size="sm" disabled={monthEvents.length === 0} onClick={() => downloadCalendar(monthEvents, `${MONTHS[month]}-${year}`)}>
                    <Download className="mr-1.5 h-4 w-4" />Export month
                </Button>
                {isAdmin && (
                    <Dialog open={showForm} onOpenChange={setShowForm}>
                        <DialogTrigger asChild>
                            <Button className="shadow-sm">
                                <Plus className="mr-1.5 h-4 w-4" />Add Event
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-xl">
                            <DialogHeader>
                                <DialogTitle>New Event</DialogTitle>
                                <DialogDescription>Add a class, exam, holiday, deadline, or general event to the calendar.</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleCreate} className="space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <Field label="Title" required className="sm:col-span-2">
                                        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Sports Day" />
                                    </Field>
                                    <Field label="Type" htmlFor="event-type">
                                        <Select value={type} onValueChange={(v) => setType(v as CalendarEventType)}>
                                            <SelectTrigger id="event-type"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {EVENT_TYPES.map((t) => {
                                                    const { label, icon: Icon, dot } = TYPE_CONFIG[t];
                                                    return (
                                                        <SelectItem key={t} value={t}>
                                                            <span className="flex items-center gap-2">
                                                                <span className={cn("h-2 w-2 rounded-full", dot)} />
                                                                <Icon className="h-3.5 w-3.5" />
                                                                {label}
                                                            </span>
                                                        </SelectItem>
                                                    );
                                                })}
                                            </SelectContent>
                                        </Select>
                                    </Field>
                                    <div className="flex items-center gap-2 pt-7">
                                        <Switch checked={allDay} onCheckedChange={setAllDay} id="allDay" />
                                        <Label htmlFor="allDay">All day</Label>
                                    </div>
                                    <Field label={`${allDay ? "Start date" : "Start"}`} required>
                                        <Input type={allDay ? "date" : "datetime-local"} value={startAt} onChange={(e) => setStartAt(e.target.value)} />
                                    </Field>
                                    <Field label={allDay ? "End date" : "End"}>
                                        <Input type={allDay ? "date" : "datetime-local"} value={endAt} onChange={(e) => setEndAt(e.target.value)} />
                                    </Field>
                                    <Field label={<><Repeat className="h-3.5 w-3.5" /> Repeat</>} htmlFor="event-repeat">
                                        <Select value={recurrenceFreq} onValueChange={(v) => setRecurrenceFreq(v as RecurrenceFreq)}>
                                            <SelectTrigger id="event-repeat"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {(Object.keys(RECURRENCE_LABELS) as RecurrenceFreq[]).map((f) => (
                                                    <SelectItem key={f} value={f}>{RECURRENCE_LABELS[f]}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </Field>
                                    {recurrenceFreq !== "none" && (
                                        <Field label="Repeat until (optional)">
                                            <Input type="date" value={recurrenceEndAt} onChange={(e) => setRecurrenceEndAt(e.target.value)} />
                                        </Field>
                                    )}
                                    <Field label="Description" className="sm:col-span-2">
                                        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
                                    </Field>
                                </div>
                                <DialogFooter>
                                    <Button type="submit" className="w-full sm:w-auto" disabled={creating}>
                                        {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {creating ? "Creating…" : "Create Event"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}
                </div>
            </motion.div>

            <Card className="overflow-hidden border-border/70 shadow-sm">
                <div className="grid divide-y divide-border/70 sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
                    <div className="px-4 py-3.5"><p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">This month</p><p className="mt-1 text-xl font-semibold tabular-nums">{monthEvents.length}</p><p className="text-xs text-muted-foreground">{MONTHS[month]} {year}</p></div>
                    <div className="px-4 py-3.5"><p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Exams & deadlines</p><p className="mt-1 text-xl font-semibold tabular-nums">{examOrDeadlineCount}</p><p className="text-xs text-muted-foreground">{examOrDeadlineCount ? "Requiring preparation" : "Nothing urgent"}</p></div>
                    <div className="bg-primary/[0.035] px-4 py-3.5"><p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary"><CalendarDays className="h-3.5 w-3.5" />Focus day</p><p className="mt-1 text-sm font-semibold">{focusDay.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</p><p className="flex items-center gap-1 text-xs text-muted-foreground">{focusEvents.length ? <><CircleCheck className="h-3 w-3 text-primary" />{focusEvents.length} item{focusEvents.length === 1 ? "" : "s"} planned</> : "Open schedule"}</p></div>
                    <div className="px-4 py-3.5"><p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Next scheduled</p><p className="mt-1 truncate text-sm font-semibold">{nextUp?.title ?? "Nothing scheduled"}</p><p className="text-xs text-muted-foreground">{nextUp ? new Date(nextUp.startAt).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }) : "Add an event to begin"}</p></div>
                </div>
            </Card>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Month grid */}
                <Card className="relative gap-0 overflow-hidden border-border/60 py-0 shadow-sm lg:col-span-2">
                    {/* background-refetch hairline */}
                    {isFetching && !firstLoad && (
                        <span className="absolute inset-x-0 top-0 z-20 h-0.5 animate-pulse bg-primary/70" aria-hidden="true" />
                    )}

                    {/* Navigation */}
                    <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
                        <div className="flex items-baseline gap-2">
                            <h2 className="font-display text-[15px] font-semibold tracking-tight">{MONTHS[month]}</h2>
                            <span className="text-sm text-muted-foreground">{year}</span>
                            {monthEvents.length > 0 && (
                                <span className="ml-1 text-[11px] font-medium text-muted-foreground/70">
                                    · {monthEvents.length} event{monthEvents.length === 1 ? "" : "s"}
                                </span>
                            )}
                        </div>
                        <div className="flex flex-wrap items-center justify-end gap-1">
                            <div className="mr-1 flex items-center rounded-lg border border-border/60 bg-muted/30 p-0.5" role="group" aria-label="Calendar view">
                                {([
                                    ["month", "Month", LayoutGrid],
                                    ["week", "Week", Rows3],
                                    ["day", "Day", CalendarDays],
                                    ["agenda", "Agenda", List],
                                ] as const).map(([value, label, Icon]) => (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => setView(value)}
                                        aria-pressed={view === value}
                                        className={cn(
                                            "inline-flex h-7 items-center gap-1 rounded-md px-2 text-[11px] font-medium transition-colors",
                                            view === value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                                        )}
                                    >
                                        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                                        <span className="hidden md:inline">{label}</span>
                                    </button>
                                ))}
                            </div>
                            {!isCurrentMonth && (
                                <Button variant="outline" size="sm" className="mr-1 h-7 px-2.5 text-xs" onClick={goToToday}>
                                    Today
                                </Button>
                            )}
                            <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Previous month" onClick={() => goToMonth(-1)}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Next month" onClick={() => goToMonth(1)}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {view === "month" && <>
                    {/* Day headers */}
                    <div className="grid grid-cols-7 border-b border-border/60">
                        {DAYS.map((d, i) => {
                            const isTodayCol = isCurrentMonth && today.getDay() === i;
                            return (
                                <div
                                    key={d}
                                    className={cn(
                                        "py-2 text-center text-[10px] font-semibold uppercase tracking-[0.08em]",
                                        isTodayCol ? "text-primary" : "text-muted-foreground/70",
                                        (i === 0 || i === 6) && !isTodayCol && "text-muted-foreground/40",
                                    )}
                                >
                                    {d}
                                </div>
                            );
                        })}
                    </div>
                    </>}

                    {/* Calendar content */}
                    <div className="overflow-hidden">
                        {isError && !data ? (
                            <div className="p-6">
                                <ErrorState
                                    title="Couldn't load the calendar"
                                    description="We couldn't reach the schedule. Check your connection and try again."
                                    onRetry={refetch}
                                />
                            </div>
                        ) : firstLoad ? (
                            <div className="grid grid-cols-7" style={rowStyle}>
                                {Array.from({ length: totalCells }).map((_, i) => (
                                    <div key={i} className="space-y-1.5 border-b border-r border-border/60 p-1.5 [&:nth-child(7n)]:border-r-0">
                                        <Skeleton className="h-6 w-6 rounded-full" />
                                        <Skeleton className="h-3 w-full" />
                                        {i % 3 === 0 && <Skeleton className="h-3 w-2/3" />}
                                    </div>
                                ))}
                            </div>
                        ) : view === "agenda" ? (
                            <AgendaView events={monthEvents} month={month} year={year} onSelect={setSelectedEvent} />
                        ) : view === "week" ? (
                            <WeekView anchor={viewAnchor} eventsOn={eventsOn} onSelectDay={(date) => { setSelectedDay(date); setView("day"); }} onSelectEvent={setSelectedEvent} />
                        ) : view === "day" ? (
                            <DayView date={viewAnchor} eventsOn={eventsOn} onSelect={setSelectedEvent} />
                        ) : (
                            <AnimatePresence mode="wait" custom={direction}>
                                <motion.div
                                    key={`${year}-${month}`}
                                    custom={direction}
                                    variants={gridVariants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    transition={{ duration: 0.22, ease: "easeOut" }}
                                    className="grid grid-cols-7"
                                    style={rowStyle}
                                >
                                    {Array.from({ length: totalCells }).map((_, i) => {
                                        const date = new Date(year, month, 1 - firstWeekday + i);
                                        const inMonth = date.getMonth() === month;
                                        const isToday = isoDate(date) === isoDate(today);
                                        const isSelected = !!selectedDay && isoDate(date) === isoDate(selectedDay);
                                        const isWeekend = i % 7 === 0 || i % 7 === 6;
                                        const isLastRow = i >= totalCells - 7;
                                        const dayEvents = eventsOn(date);
                                        const overflow = dayEvents.length - 3;

                                        const dayLabel = `${date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}${dayEvents.length ? `, ${dayEvents.length} event${dayEvents.length === 1 ? "" : "s"}` : ", no events"}`;

                                        return (
                                            <div
                                                key={i}
                                                role="button"
                                                tabIndex={0}
                                                aria-label={dayLabel}
                                                aria-current={isToday ? "date" : undefined}
                                                onClick={() => openDay(date)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter" || e.key === " ") {
                                                        e.preventDefault();
                                                        openDay(date);
                                                    }
                                                }}
                                                className={cn(
                                                    "group relative flex cursor-pointer flex-col gap-1 overflow-hidden border-b border-r border-border/60 p-1.5 transition-colors [&:nth-child(7n)]:border-r-0 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                                                    isLastRow && "border-b-0",
                                                    inMonth ? "hover:bg-muted/40" : "bg-muted/20 hover:bg-muted/30",
                                                    isWeekend && inMonth && "bg-muted/[0.12]",
                                                    isToday && "bg-primary/[0.04]",
                                                    isSelected && "bg-primary/[0.07] ring-1 ring-inset ring-primary/40",
                                                )}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className={cn(
                                                        "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium tabular-nums transition-colors",
                                                        isToday && "bg-primary font-semibold text-primary-foreground shadow-sm ring-2 ring-primary/15",
                                                        !isToday && isSelected && "font-semibold text-primary",
                                                        !isToday && !isSelected && !inMonth && "text-muted-foreground/40",
                                                    )}>
                                                        {date.getDate()}
                                                    </span>
                                                    {isAdmin && inMonth && (
                                                        <div className="pointer-events-none flex items-center gap-0.5 opacity-0 transition group-hover:pointer-events-auto group-hover:opacity-100">
                                                            <button
                                                                type="button"
                                                                onClick={(e) => { e.stopPropagation(); openCreateOn(date); }}
                                                                aria-label={`Add event on ${date.toLocaleDateString()}`}
                                                                title="Add event"
                                                                className="flex h-5 w-5 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
                                                            >
                                                                <Plus className="h-3.5 w-3.5" />
                                                            </button>
                                                            {dayEvents.some((ev) => ev.source === "manual" && ev.id > 0 && !ev.isRecurrenceInstance) && (
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => { e.stopPropagation(); openDay(date); }}
                                                                    aria-label={`Remove an event on ${date.toLocaleDateString()}`}
                                                                    title="Remove an event"
                                                                    className="flex h-5 w-5 items-center justify-center rounded-md text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                                                                >
                                                                    <Minus className="h-3.5 w-3.5" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className={cn(
                                                    "mt-0.5 flex min-h-12 flex-1 flex-col gap-[3px] rounded-md border border-border/65 bg-background/65 p-1 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.45)] transition-colors group-hover:border-primary/20 group-hover:bg-background/90",
                                                    !inMonth && "bg-muted/25",
                                                    isSelected && "border-primary/35 bg-background",
                                                )}>
                                                    {dayEvents.slice(0, 3).map((ev) => {
                                                        const cfg = TYPE_CONFIG[ev.type];
                                                        const timed = !isAllDayLike(ev);
                                                        return (
                                                            <button
                                                                key={`${ev.id}-${ev.startAt}`}
                                                                type="button"
                                                                onClick={(event) => { event.stopPropagation(); setSelectedEvent(ev); }}
                                                                title={ev.title}
                                                                className={cn(
                                                                    "flex w-full items-center gap-1 overflow-hidden rounded-md py-[3px] pl-1.5 pr-1 text-left text-[10.5px] font-medium leading-tight focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                                                                    cfg.cell,
                                                                    !inMonth && "opacity-55",
                                                                )}
                                                            >
                                                                {timed && (
                                                                    <span className="shrink-0 text-[9.5px] tabular-nums opacity-60">{compactTime(ev.startAt)}</span>
                                                                )}
                                                                <span className="truncate">{ev.title}</span>
                                                            </button>
                                                        );
                                                    })}
                                                    {overflow > 0 && (
                                                        <span className="pl-1.5 text-[10px] font-medium text-muted-foreground/70">
                                                            +{overflow} more
                                                        </span>
                                                    )}
                                                    {dayEvents.length === 0 && <span className="px-1 pt-0.5 text-[10px] text-muted-foreground/40">No events</span>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </motion.div>
                            </AnimatePresence>
                        )}
                    </div>
                </Card>

                {/* Day agenda panel */}
                <Card className="gap-0 overflow-hidden border-border/60 py-0 shadow-sm lg:sticky lg:top-4 lg:self-start">
                    {selectedDay ? (
                        <div className="flex items-center gap-3 border-b border-border/60 bg-primary/[0.04] px-5 py-4">
                            <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-md border border-primary/20 bg-background shadow-sm">
                                <span className="text-[9px] font-semibold uppercase tracking-wide text-primary">
                                    {selectedDay.toLocaleDateString(undefined, { month: "short" })}
                                </span>
                                <span className="text-lg font-bold leading-none tabular-nums">{selectedDay.getDate()}</span>
                            </div>
                            <div className="min-w-0">
                                <p className="truncate font-display text-base font-semibold">
                                    {selectedDay.toLocaleDateString(undefined, { weekday: "long" })}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {selectedEvents.length === 0
                                        ? "No events"
                                        : `${selectedEvents.length} event${selectedEvents.length === 1 ? "" : "s"}`}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="border-b border-border/60 px-5 py-4">
                            <p className="font-display text-base font-semibold">Coming up</p>
                            <p className="text-xs text-muted-foreground">Your next events and deadlines.</p>
                        </div>
                    )}

                    <CardContent className="p-4">
                        {!selectedDay ? (
                            upcomingEvents.length === 0
                                ? <PanelEmpty icon={CalendarRange} text="Nothing else is scheduled in this view." />
                                : <div className="space-y-2">{upcomingEvents.map((event) => <EventRow key={`${event.id}-${event.startAt}`} event={event} onSelect={setSelectedEvent} dense />)}</div>
                        ) : selectedEvents.length === 0 ? (
                            <PanelEmpty icon={CalendarDays} text="Nothing scheduled for this day." />
                        ) : (
                            <ol className="relative space-y-2.5 before:absolute before:bottom-3 before:left-[14px] before:top-3 before:w-px before:bg-border/70 before:content-['']">
                                {selectedEvents.map((ev, index) => {
                                    const { label, icon: Icon, chip, iconWrap } = TYPE_CONFIG[ev.type];
                                    return (
                                        <motion.li
                                            key={`${ev.id}-${ev.startAt}`}
                                            initial={{ opacity: 0, x: -8 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.25, delay: index * 0.05, ease: "easeOut" }}
                                            className="relative flex gap-3"
                                        >
                                            <div className={cn(
                                                "z-10 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-4 ring-background",
                                                iconWrap,
                                            )}>
                                                <Icon className="h-3.5 w-3.5" />
                                            </div>
                                            <div className="min-w-0 flex-1 space-y-1.5 rounded-md border border-border/60 bg-card/60 p-3 transition-colors hover:border-border">
                                                <div className="flex items-start justify-between gap-2">
                                                    <span className="text-sm font-medium leading-snug">{ev.title}</span>
                                                    {isAdmin && ev.source === "manual" && ev.id > 0 && !ev.isRecurrenceInstance && (
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <button
                                                                    type="button"
                                                                    disabled={deletingId === ev.id}
                                                                    aria-label={`Delete event: ${ev.title}`}
                                                                    className="-mr-1 -mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                                                                >
                                                                    {deletingId === ev.id
                                                                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                                                                        : <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />}
                                                                </button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Delete this event?</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        &ldquo;{ev.title}&rdquo;
                                                                        {ev.recurrenceFreq && ev.recurrenceFreq !== "none"
                                                                            ? " and every occurrence in the series"
                                                                            : ""}{" "}
                                                                        will be permanently removed from the calendar.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                    <AlertDialogAction
                                                                        onClick={() => handleDelete(ev.id)}
                                                                        className="bg-destructive text-white hover:bg-destructive/90"
                                                                    >
                                                                        Delete event
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    <Badge variant="outline" className={cn("text-[10px]", chip)}>{label}</Badge>
                                                    {ev.recurrenceFreq && ev.recurrenceFreq !== "none" && (
                                                        <Badge variant="outline" className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                                            <Repeat className="h-2.5 w-2.5" />
                                                            {RECURRENCE_LABELS[ev.recurrenceFreq].replace("Repeats ", "")}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                                                    <Clock className="h-3 w-3" />
                                                    {isAllDayLike(ev)
                                                        ? "All day"
                                                        : (
                                                            <>
                                                                {new Date(ev.startAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                                                                {ev.endAt && ` – ${new Date(ev.endAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`}
                                                            </>
                                                        )}
                                                </p>
                                                {ev.class && <p className="text-xs text-muted-foreground">{ev.class.name}</p>}
                                                {ev.description && <p className="text-xs text-muted-foreground">{ev.description}</p>}
                                                {ev.isRecurrenceInstance && (
                                                    <p className="text-[10px] italic text-muted-foreground">
                                                        Part of a recurring series — edit or delete the first occurrence to change it.
                                                    </p>
                                                )}
                                            </div>
                                        </motion.li>
                                    );
                                })}
                            </ol>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Dialog open={Boolean(selectedEvent)} onOpenChange={(open) => { if (!open) setSelectedEvent(null); }}>
                <DialogContent className="max-w-lg">
                    {selectedEvent && (() => {
                        const config = TYPE_CONFIG[selectedEvent.type];
                        const Icon = config.icon;
                        return <>
                            <DialogHeader>
                                <div className="mb-2 flex items-center gap-3">
                                    <span className={cn("flex h-10 w-10 items-center justify-center rounded-lg", config.iconWrap)}><Icon className="h-5 w-5" aria-hidden="true" /></span>
                                    <div className="min-w-0"><Badge variant="outline" className={cn("mb-1 text-[10px]", config.chip)}>{config.label}</Badge><DialogTitle className="text-left">{selectedEvent.title}</DialogTitle></div>
                                </div>
                                <DialogDescription className="text-left">{new Date(selectedEvent.startAt).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</DialogDescription>
                            </DialogHeader>
                            <dl className="grid gap-3 rounded-lg border bg-muted/20 p-4 text-sm">
                                <div className="flex items-start justify-between gap-4"><dt className="flex items-center gap-2 text-muted-foreground"><Clock className="h-4 w-4" />Time</dt><dd className="text-right font-medium">{fullEventTime(selectedEvent)}</dd></div>
                                <div className="flex items-start justify-between gap-4"><dt className="flex items-center gap-2 text-muted-foreground"><School className="h-4 w-4" />Calendar</dt><dd className="text-right font-medium">{selectedEvent.class?.name ?? "School-wide"}</dd></div>
                                {selectedEvent.recurrenceFreq && selectedEvent.recurrenceFreq !== "none" && <div className="flex items-start justify-between gap-4"><dt className="flex items-center gap-2 text-muted-foreground"><Repeat className="h-4 w-4" />Repeats</dt><dd className="text-right font-medium">{RECURRENCE_LABELS[selectedEvent.recurrenceFreq].replace("Repeats ", "")}</dd></div>}
                            </dl>
                            {selectedEvent.description && <p className="text-sm leading-6 text-muted-foreground">{selectedEvent.description}</p>}
                            {selectedEvent.link && <DialogFooter><Button asChild className="w-full sm:w-auto"><Link to={selectedEvent.link}>Open related record<ExternalLink className="ml-2 h-4 w-4" /></Link></Button></DialogFooter>}
                        </>;
                    })()}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default CalendarPage;
