import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ArrowRight, BookOpenCheck, CalendarDays, Clock3 } from "lucide-react";
import { useApiQuery } from "@/hooks/use-api-query";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { schoolDate, lessonState } from "@/lib/school-time";

type Event = { id: number; title: string; startAt: string; endAt: string | null; type: string; allDay: boolean; class: { id: number; name: string } | null };

export function TodaySchedule() {
  const [now, setNow] = useState(Date.now);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 60_000); return () => clearInterval(timer); }, []);
  const day = schoolDate(new Date(now));
  const from = new Date(`${day}T00:00:00+03:00`).toISOString().slice(0, 10);
  const { data, isLoading, isError, refetch } = useApiQuery<{ data: Event[] }>(`/calendar?from=${from}&to=${day}`);
  const lessons = (data?.data ?? []).filter((event) => (event.type === "class" || event.type === "exam") && schoolDate(new Date(event.startAt)) === day).sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt));

  return <div className="daily-schedule">
    <div className="daily-schedule__meta"><span className="daily-schedule__date"><CalendarDays className="h-4 w-4" />{new Date(`${day}T12:00:00+03:00`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "Africa/Dar_es_Salaam" })}</span><span className="daily-schedule__timezone"><Clock3 className="h-3.5 w-3.5" /> East Africa Time</span>{!isLoading && !isError && lessons.length > 0 && <span className="daily-schedule__count">{lessons.length} {lessons.length === 1 ? "item" : "items"}</span>}</div>
    {isLoading ? <div className="space-y-3">{[0, 1, 2].map((index) => <Skeleton key={index} className="h-[76px] w-full rounded-xl" />)}</div>
      : isError ? <ErrorState description="Unable to load today's lessons." onRetry={refetch} />
      : lessons.length === 0 ? <EmptyState icon={CalendarDays} title="No lessons scheduled today" description="Check the full calendar for upcoming school events." />
      : <ol className="lesson-list">{lessons.map((lesson) => <li key={`${lesson.type}-${lesson.id}`} className={`lesson-list__item lesson-list__item--${lesson.type}`}>
        <div className="lesson-list__time"><time dateTime={lesson.startAt}>{lesson.allDay ? "All day" : new Date(lesson.startAt).toLocaleTimeString("en-GB", { timeZone: "Africa/Dar_es_Salaam", hour: "2-digit", minute: "2-digit" })}</time><span className="lesson-list__marker" /></div>
        <div className="lesson-list__content"><div className="lesson-list__title"><p>{lesson.title}</p><span className="lesson-list__type">{lesson.type === "exam" ? <BookOpenCheck className="h-3 w-3" /> : null}{lesson.type === "exam" ? "Exam" : "Class"}</span></div><p className="lesson-list__class">{lesson.class?.name ?? "School schedule"}</p>{!lesson.allDay && <span className="lesson-state">{lessonState(lesson.startAt, lesson.endAt, now)}</span>}</div>
      </li>)}</ol>}
    <Link to="/calendar" className="daily-schedule__link">View full timetable <ArrowRight className="h-4 w-4" /></Link>
  </div>;
}
