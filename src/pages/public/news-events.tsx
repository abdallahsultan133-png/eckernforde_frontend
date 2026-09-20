import { ArrowUpRight, CalendarDays, Newspaper } from "lucide-react";
import { useMemo } from "react";
import { useSearchParams } from "react-router";
import { PublicPageMeta } from "@/components/public/public-page-meta";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiQuery } from "@/hooks/use-api-query";

type PublicNews = { id: number; title: string; content: string; createdAt: string };
type PublicEvent = { id: number; title: string; description: string | null; type: string; startAt: string; endAt: string | null; allDay: boolean };

const formatDate = (value: string, options?: Intl.DateTimeFormatOptions) => new Date(value).toLocaleDateString(undefined, options);

export default function NewsEventsPage() {
  const [searchParams] = useSearchParams();
  const search = searchParams.get("search")?.trim() ?? "";
  const { data, isLoading, isError, refetch } = useApiQuery<{ data: PublicNews[] }>("/announcements/public", { staleTime: 60_000 });
  const from = new Date().toISOString().slice(0, 10);
  const to = new Date(Date.now() + 1000 * 60 * 60 * 24 * 90).toISOString().slice(0, 10);
  const { data: eventsData, isLoading: eventsLoading, isError: eventsError, refetch: refetchEvents } = useApiQuery<{ data: PublicEvent[] }>(`/calendar/public?from=${from}&to=${to}`, { staleTime: 60_000 });
  const stories = useMemo(() => {
    const allStories = data?.data ?? [];
    if (!search) return allStories;
    const query = search.toLowerCase();
    return allStories.filter((story) => `${story.title} ${story.content}`.toLowerCase().includes(query));
  }, [data?.data, search]);
  const events = eventsData?.data ?? [];
  const featuredStory = stories[0];
  const otherStories = stories.slice(1);

  return <>
    <PublicPageMeta title="News & Events" description="Approved public school news and event information." />
    <section className="public-page-hero news-events-hero"><p className="public-eyebrow">News & events</p><h1>A public window into school life.</h1><p className="public-lede">Only school-wide updates explicitly approved for public publication appear here. Personal, academic and class communications stay within the secure portal.</p><div className="news-hero-note"><span>Stay connected</span><span aria-hidden="true">·</span><span>Stories, milestones and moments from our community</span></div></section>
    <section className="mx-auto max-w-[1440px] px-4 pb-20 sm:px-6 lg:px-10">
      <div className="news-section-heading"><div><p className="public-eyebrow">Latest news</p><h2>{search ? `Results for “${search}”` : "School updates"}</h2></div><Newspaper className="h-7 w-7" aria-hidden="true" /></div>
      {isLoading ? <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-56 w-full" />)}</div> : isError ? <ErrorState title="Can’t load school news" description="Please try again shortly." onRetry={refetch} /> : stories.length === 0 ? <div className="news-empty"><Newspaper className="h-7 w-7" aria-hidden="true" /><h3>{search ? "No matching public news" : "No public news yet"}</h3><p>{search ? "Try another search term or browse the public news when new stories are published." : "The school has not published any public news at this time. Current families can find private notices in the secure portal."}</p></div> : <div className="news-story-grid">
        {featuredStory && <article className="news-featured-card"><div><p className="news-card-kicker">Featured story</p><time dateTime={featuredStory.createdAt}>{formatDate(featuredStory.createdAt, { day: "numeric", month: "long", year: "numeric" })}</time><h3>{featuredStory.title}</h3><p>{featuredStory.content}</p></div><ArrowUpRight className="news-card-arrow h-6 w-6" aria-hidden="true" /></article>}
        {otherStories.map((story) => <article key={story.id} className="news-story-card"><time dateTime={story.createdAt}>{formatDate(story.createdAt, { day: "numeric", month: "long", year: "numeric" })}</time><h3>{story.title}</h3><p>{story.content}</p><ArrowUpRight className="news-card-arrow h-5 w-5" aria-hidden="true" /></article>)}
      </div>}
      <div className="news-section-heading news-events-heading"><div><p className="public-eyebrow">Coming up</p><h2>Public events</h2></div><CalendarDays className="h-7 w-7" aria-hidden="true" /></div>
      {eventsLoading ? <Skeleton className="h-40 w-full" /> : eventsError ? <ErrorState title="Can’t load public events" description="Please try again shortly." onRetry={refetchEvents} /> : events.length === 0 ? <div className="news-empty"><CalendarDays className="h-7 w-7" aria-hidden="true" /><h3>No public events yet</h3><p>When the school approves an event for public publication, it will appear here.</p></div> : <div className="news-event-list">{events.map((event) => { const date = new Date(event.startAt); return <article key={event.id} className="news-event-item"><time className="news-event-date" dateTime={event.startAt}><strong>{date.getDate()}</strong><span>{formatDate(event.startAt, { month: "short" })}</span></time><div className="min-w-0"><span className="news-event-type">{event.type || "School event"}</span><h3>{event.title}</h3>{event.description && <p>{event.description}</p>}</div><ArrowUpRight className="news-card-arrow hidden h-5 w-5 shrink-0 sm:block" aria-hidden="true" /></article>; })}</div>}
    </section>
  </>;
}
