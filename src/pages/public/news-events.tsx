import { useMemo } from "react";
import { useSearchParams } from "react-router";
import { PublicPageMeta } from "@/components/public/public-page-meta";
import { PublicMedia } from "@/components/public/public-media";
import { useApiQuery } from "@/hooks/use-api-query";

type PublicNews = { id: number; title: string; content: string; createdAt: string };
type PublicEvent = { id: number; title: string; description: string | null; type: string; startAt: string; endAt: string | null; allDay: boolean };
const formatDate = (value: string) => new Date(value).toLocaleDateString("en", { day:"numeric",month:"long",year:"numeric" });

export default function NewsEventsPage() {
  const [searchParams] = useSearchParams();
  const search = searchParams.get("search")?.trim() ?? "";
  const { data, isLoading, isError, refetch } = useApiQuery<{ data: PublicNews[] }>("/announcements/public", { staleTime: 60_000 });
  const from = new Date().toISOString().slice(0, 10);
  const to = new Date(Date.now() + 1000 * 60 * 60 * 24 * 90).toISOString().slice(0, 10);
  const { data: eventsData, isLoading: eventsLoading, isError: eventsError, refetch: refetchEvents } = useApiQuery<{ data: PublicEvent[] }>(`/calendar/public?from=${from}&to=${to}`, { staleTime: 60_000 });
  const stories = useMemo(() => { const all = data?.data ?? []; return search ? all.filter(s => `${s.title} ${s.content}`.toLowerCase().includes(search.toLowerCase())) : all; }, [data?.data,search]);
  const events = (eventsData?.data ?? []).filter(event => !search || `${event.title} ${event.description ?? ""}`.toLowerCase().includes(search.toLowerCase()));
  return <div className="ref-news-page"><PublicPageMeta title="News and events" description="Published school news and upcoming public events from ACADEMIX." /><div className="ref-news-layout"><div className="ref-news-introduction"><h1>Latest<br/>news</h1><p>Keep up with stories and moments from ACADEMIX.</p><a href="#public-events" className="ref-event-prompt"><h2>Explore upcoming events</h2><span>View events →</span></a></div><section className="ref-news-stories" aria-label="School news">{search && <h2 className="ref-search-results">Results for “{search}”</h2>}{isLoading ? <p className="ref-empty" role="status">Loading school news…</p> : isError ? <div className="ref-empty" role="alert"><h2>Can’t load school news</h2><p>Please try again shortly.</p><button onClick={()=>refetch()}>Try again</button></div> : stories.length === 0 ? <div className="ref-news-empty"><PublicMedia name="school-news-feature"/><div><h2>{search ? "No matching public news" : "No public news yet"}</h2><p>{search ? "Try another search term." : "Published school stories will appear here."}</p></div></div> : stories.map((story,i)=><article className="ref-news-story" key={story.id}><PublicMedia name={`news-story-${i+1}`}/><div className="ref-news-story-copy"><time dateTime={story.createdAt}>{formatDate(story.createdAt)}</time><h2>{story.title}</h2><p>{story.content}</p></div></article>)}</section></div><section id="public-events" className="ref-news-events"><h2>Public events</h2>{eventsLoading ? <p className="ref-empty" role="status">Loading public events…</p> : eventsError ? <div className="ref-empty" role="alert"><h3>Can’t load public events</h3><button onClick={()=>refetchEvents()}>Try again</button></div> : events.length === 0 ? <div className="ref-empty"><h3>No public events yet</h3><p>Upcoming public dates will be shared here.</p></div> : events.map(event=><article key={event.id}><time dateTime={event.startAt}><strong>{new Date(event.startAt).getDate()}</strong><span>{new Date(event.startAt).toLocaleDateString("en",{month:"short"})}</span></time><div><p className="ref-kicker">{event.type || "School event"}</p><h3>{event.title}</h3><p>{formatDate(event.startAt)}</p>{event.description && <p>{event.description}</p>}</div></article>)}</section></div>;
}
