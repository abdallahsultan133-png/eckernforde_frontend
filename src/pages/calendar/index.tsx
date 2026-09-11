import { useState } from "react";
import { useGetIdentity } from "@refinedev/core";
import { keepPreviousData, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import {
    ChevronLeft, ChevronRight, Plus, Minus, Loader2, Trash2,
    BookOpenCheck, CalendarDays, Flag, Clock, Repeat, Sparkles, CalendarRange,
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
import { StatCard } from "@/components/dashboard/stat-card.tsx";
import { BACKEND_BASE_URL } from "@/constants";
import { useApiQuery } from "@/hooks/use-api-query.ts";
import { UserRole, type User } from "@/types";
import { cn } from "@/lib/utils.ts";

type CalendarEventType = "class" | "exam" | "holiday" | "event" | "deadline";
type EventSource = "manual" | "exam" | "assignment";
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
    recurrenceFreq?: RecurrenceFreq;
    isRecurrenceInstance?: boolean;
    recurrenceParentId?: number | null;
};

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
        dot: "bg-violet-500",
        chip: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-300",
        cell: "border-l-2 border-violet-500 bg-violet-50/80 text-violet-900 dark:border-violet-400 dark:bg-violet-950/50 dark:text-violet-100",
        iconWrap: "bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400",
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

function PanelEmpty({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
    return (
        <div className="flex flex-col items-center gap-3 py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/60 ring-1 ring-inset ring-border/60">
                <Icon className="h-5 w-5 text-muted-foreground/70" />
            </div>
            <p className="text-sm text-muted-foreground">{text}</p>
        </div>
    );
}

const CalendarPage = () => {
    const { data: identity } = useGetIdentity<User>();
    const isAdmin = identity?.role === UserRole.ADMIN || identity?.role === UserRole.SUPER_ADMIN;

    const queryClient = useQueryClient();
    const [today] = useState(new Date());
    const [current, setCurrent] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
    const [direction, setDirection] = useState(0);
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [visibleTypes, setVisibleTypes] = useState<Set<CalendarEventType>>(new Set(EVENT_TYPES));

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

    const calendarPath = `/calendar?from=${isoDate(gridStart)}&to=${isoDate(gridEnd)}`;
    const { data, isFetching, isLoading, isError, refetch } = useApiQuery<{ data: CalendarEvent[] }>(calendarPath, {
        placeholderData: keepPreviousData,
    });
    const allEvents = data?.data ?? [];
    const visibleEvents = allEvents.filter((e) => visibleTypes.has(e.type));

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

    const toggleType = (t: CalendarEventType) => {
        setVisibleTypes((prev) => {
            const next = new Set(prev);
            if (next.has(t)) next.delete(t); else next.add(t);
            return next;
        });
    };

    const eventsOn = (d: Date) => {
        const key = isoDate(d);
        return visibleEvents.filter((e) => e.startAt.slice(0, 10) === key).sort(byStart);
    };

    const selectedEvents = selectedDay ? eventsOn(selectedDay) : [];

    const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;
    const monthEvents = visibleEvents.filter((e) => e.startAt.slice(0, 7) === monthKey);
    const now = new Date();
    const nextUp = [...visibleEvents]
        .filter((e) => new Date(e.startAt).getTime() >= now.getTime())
        .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())[0];
    const examOrDeadlineCount = monthEvents.filter((e) => e.type === "exam" || e.type === "deadline").length;

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
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 text-white shadow-sm ring-1 ring-inset ring-white/15">
                        <CalendarRange className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="font-display text-2xl font-bold tracking-tight">Calendar</h1>
                        <p className="text-sm text-muted-foreground">Classes, exams, deadlines, and school events.</p>
                    </div>
                </div>
                {isAdmin && (
                    <Dialog open={showForm} onOpenChange={setShowForm}>
                        <DialogTrigger asChild>
                            <Button className="bg-violet-600 text-white shadow-sm hover:bg-violet-600/90">
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
                                    <Button type="submit" className="w-full bg-violet-600 text-white hover:bg-violet-600/90 sm:w-auto" disabled={creating}>
                                        {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {creating ? "Creating…" : "Create Event"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}
            </motion.div>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-3">
                <StatCard
                    title="Events this month"
                    value={String(monthEvents.length)}
                    icon={CalendarDays}
                    color="blue"
                    description={`${MONTHS[month]} ${year}`}
                    index={0}
                />
                <StatCard
                    title="Exams & deadlines"
                    value={String(examOrDeadlineCount)}
                    icon={BookOpenCheck}
                    color={examOrDeadlineCount > 0 ? "red" : "green"}
                    description="Requiring preparation"
                    index={1}
                />
                <StatCard
                    title="Next up"
                    value={nextUp ? nextUp.title : "—"}
                    icon={Sparkles}
                    color="purple"
                    description={nextUp
                        ? new Date(nextUp.startAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })
                        : "Nothing scheduled"}
                    index={2}
                />
            </div>

            {/* Type filter */}
            <div className="flex flex-wrap items-center gap-1.5">
                <span className="mr-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Show</span>
                {EVENT_TYPES.map((t) => {
                    const { label, icon: Icon, chip } = TYPE_CONFIG[t];
                    const active = visibleTypes.has(t);
                    return (
                        <motion.button
                            key={t}
                            type="button"
                            whileTap={{ scale: 0.95 }}
                            onClick={() => toggleType(t)}
                            aria-pressed={active}
                            className={cn(
                                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all",
                                active
                                    ? chip
                                    : "border-border/60 bg-transparent text-muted-foreground/70 hover:border-border hover:text-foreground",
                            )}
                        >
                            <Icon className={cn("h-3 w-3 transition-opacity", !active && "opacity-40")} />
                            {label}
                        </motion.button>
                    );
                })}
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Month grid */}
                <Card className="relative gap-0 overflow-hidden border-border/60 py-0 shadow-sm lg:col-span-2">
                    {/* background-refetch hairline */}
                    {isFetching && !firstLoad && (
                        <span className="absolute inset-x-0 top-0 z-20 h-0.5 animate-pulse bg-violet-500/70" aria-hidden="true" />
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
                        <div className="flex items-center gap-1">
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

                    {/* Day headers */}
                    <div className="grid grid-cols-7 border-b border-border/60">
                        {DAYS.map((d, i) => {
                            const isTodayCol = isCurrentMonth && today.getDay() === i;
                            return (
                                <div
                                    key={d}
                                    className={cn(
                                        "py-2 text-center text-[10px] font-semibold uppercase tracking-[0.08em]",
                                        isTodayCol ? "text-violet-600 dark:text-violet-400" : "text-muted-foreground/70",
                                        (i === 0 || i === 6) && !isTodayCol && "text-muted-foreground/40",
                                    )}
                                >
                                    {d}
                                </div>
                            );
                        })}
                    </div>

                    {/* Calendar cells */}
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
                                                    isToday && "bg-violet-500/[0.04]",
                                                    isSelected && "bg-violet-500/[0.07] ring-1 ring-inset ring-violet-500/40",
                                                )}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className={cn(
                                                        "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium tabular-nums transition-colors",
                                                        isToday && "bg-violet-600 font-semibold text-white shadow-sm ring-2 ring-violet-600/15",
                                                        !isToday && isSelected && "font-semibold text-violet-700 dark:text-violet-300",
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

                                                <div className="flex flex-col gap-[3px]">
                                                    {dayEvents.slice(0, 3).map((ev) => {
                                                        const cfg = TYPE_CONFIG[ev.type];
                                                        const timed = !isAllDayLike(ev);
                                                        return (
                                                            <div
                                                                key={`${ev.id}-${ev.startAt}`}
                                                                title={ev.title}
                                                                className={cn(
                                                                    "flex items-center gap-1 overflow-hidden rounded-md py-[3px] pl-1.5 pr-1 text-[10.5px] font-medium leading-tight",
                                                                    cfg.cell,
                                                                    !inMonth && "opacity-55",
                                                                )}
                                                            >
                                                                {timed && (
                                                                    <span className="shrink-0 text-[9.5px] tabular-nums opacity-60">{compactTime(ev.startAt)}</span>
                                                                )}
                                                                <span className="truncate">{ev.title}</span>
                                                            </div>
                                                        );
                                                    })}
                                                    {overflow > 0 && (
                                                        <span className="pl-1.5 text-[10px] font-medium text-muted-foreground/70">
                                                            +{overflow} more
                                                        </span>
                                                    )}
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
                        <div className="flex items-center gap-3 border-b border-border/60 bg-violet-500/[0.04] px-5 py-4">
                            <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl border border-violet-500/20 bg-background shadow-sm">
                                <span className="text-[9px] font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-400">
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
                            <p className="font-display text-base font-semibold">Agenda</p>
                            <p className="text-xs text-muted-foreground">Pick a day to see its schedule.</p>
                        </div>
                    )}

                    <CardContent className="p-4">
                        {!selectedDay ? (
                            <PanelEmpty icon={CalendarRange} text="Click any day on the calendar." />
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
                                            <div className="min-w-0 flex-1 space-y-1.5 rounded-xl border border-border/60 bg-card/60 p-3 transition-colors hover:border-border">
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
        </div>
    );
};

export default CalendarPage;
