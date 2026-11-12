import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { PublicPageMeta } from "@/components/public/public-page-meta";
import { PublicMedia } from "@/components/public/public-media";
import { PublicBreadcrumb } from "@/components/public/public-editorial";
import { useApiQuery } from "@/hooks/use-api-query";
import { RelatedPublicPages } from "./public-page-layouts";
export type PublicNews = {
  id: number;
  title: string;
  content: string;
  createdAt: string;
};
export type PublicEvent = {
  id: number | string;
  title: string;
  description: string | null;
  type: string;
  startAt: string;
  endAt: string | null;
  allDay: boolean;
};
export type PublicFeedView = "combined" | "news" | "announcements" | "events";
export const formatPublicDate = (value: string) =>
  new Date(value).toLocaleDateString("en", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
function usePublicFeeds() {
  const range = useMemo(
    () => ({
      from: new Date().toISOString().slice(0, 10),
      to: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10),
    }),
    []
  );
  const news = useApiQuery<{ data: PublicNews[] }>("/announcements/public", {
    staleTime: 60000,
  });
  const events = useApiQuery<{ data: PublicEvent[] }>(
    "/calendar/public?from=" + range.from + "&to=" + range.to,
    { staleTime: 60000 }
  );
  return { news, events };
}
export function PublicFeedState({
  kind,
  loading,
  error,
  retry,
  empty,
}: {
  kind: string;
  loading: boolean;
  error: boolean;
  retry: () => unknown;
  empty?: string;
}) {
  if (loading)
    return (
      <p className="ref-feed-state" role="status">
        Loading {kind}…
      </p>
    );
  if (error)
    return (
      <div className="ref-feed-state" role="alert">
        <h2>Can’t load {kind}</h2>
        <p>Please try again.</p>
        <button onClick={() => void retry()}>Retry {kind}</button>
      </div>
    );
  return (
    <div className="ref-feed-state">
      <h2>{empty || "No public " + kind + " yet"}</h2>
      <p>School-approved information will appear here when published.</p>
    </div>
  );
}
function FeedNavigation({ view }: { view: PublicFeedView }) {
  return (
    <nav className="ref-news-local-nav" aria-label="News and events sections">
      <Link
        to="/news-events/latest"
        aria-current={view === "news" ? "page" : undefined}
      >
        News
      </Link>
      <Link
        to="/news-events/calendar"
        aria-current={view === "events" ? "page" : undefined}
      >
        Events
      </Link>
      <Link
        to="/news-events/announcements"
        aria-current={view === "announcements" ? "page" : undefined}
      >
        Announcements
      </Link>
      <Link to="/news-events/publications">Publications</Link>
    </nav>
  );
}
function EventRows({ events }: { events: PublicEvent[] }) {
  return (
    <>
      {events.map((e) => (
        <article key={String(e.id) + "-" + e.startAt}>
          <time dateTime={e.startAt}>
            <strong>{new Date(e.startAt).getDate()}</strong>
            <span>
              {new Date(e.startAt).toLocaleDateString("en", { month: "short" })}
            </span>
          </time>
          <div>
            <p className="ref-kicker">{e.type || "School event"}</p>
            <h3>{e.title}</h3>
            <p>{formatPublicDate(e.startAt)}</p>
            <Link
              to={
                "/news-events/event-" +
                encodeURIComponent(String(e.id)) +
                "?date=" +
                encodeURIComponent(e.startAt)
              }
            >
              Event details <span aria-hidden="true">→</span>
            </Link>
          </div>
        </article>
      ))}
    </>
  );
}
export default function NewsEventsPage({
  view = "combined",
}: {
  view?: PublicFeedView;
}) {
  const [params, setParams] = useSearchParams(),
    search = params.get("search")?.trim() || "",
    [query, setQuery] = useState(search);
  useEffect(() => setQuery(search), [search]);
  const { news, events } = usePublicFeeds();
  const stories = (news.data?.data || []).filter(
    (s) =>
      !search ||
      (s.title + " " + s.content).toLowerCase().includes(search.toLowerCase())
  );
  const dates = (events.data?.data || []).filter(
    (e) =>
      !search ||
      (e.title + " " + (e.description || ""))
        .toLowerCase()
        .includes(search.toLowerCase())
  );
  const title =
    view === "events"
      ? "Public events"
      : view === "announcements"
      ? "School announcements"
      : "Latest news";
  const path =
    view === "events"
      ? "/news-events/calendar"
      : view === "announcements"
      ? "/news-events/announcements"
      : view === "news"
      ? "/news-events/latest"
      : "/news-events";
  return (
    <div className="ref-news-page">
      <PublicPageMeta
        title={title}
        description="School-approved public notices and upcoming events from Eckernforde Schools."
      />
      <FeedNavigation view={view} />
      {view === "events" ? (
        <div className="ref-event-list-page">
          <h1>{title}</h1>
          <p>Dates and descriptions approved for public viewing.</p>
          <section className="ref-news-events" aria-label="Public events">
            {events.isLoading || events.isError || dates.length === 0 ? (
              <PublicFeedState
                kind="events"
                loading={events.isLoading}
                error={events.isError}
                retry={events.refetch}
                empty="No public events yet"
              />
            ) : (
              <EventRows events={dates} />
            )}
          </section>
        </div>
      ) : (
        <>
          <div className="ref-news-layout">
            <div className="ref-news-introduction">
              <h1>{title}</h1>
              <p>
                {view === "announcements"
                  ? "Notices approved by the school for public viewing."
                  : "Keep up with school-approved stories and notices from Eckernforde Schools."}
              </p>
              <Link to="/news-events/calendar" className="ref-event-prompt">
                <h2>Explore upcoming events</h2>
                <span>View events →</span>
              </Link>
            </div>
            <section className="ref-news-stories" aria-label="School news">
              <form
                className="ref-news-filter"
                onSubmit={(e) => {
                  e.preventDefault();
                  setParams(query.trim() ? { search: query.trim() } : {});
                }}
              >
                <label htmlFor="public-news-search">
                  Search school updates
                </label>
                <input
                  id="public-news-search"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <button type="submit">Search</button>
              </form>
              {search && (
                <h2 className="ref-search-results">Results for “{search}”</h2>
              )}
              {news.isLoading || news.isError || stories.length === 0 ? (
                <PublicFeedState
                  kind="school news"
                  loading={news.isLoading}
                  error={news.isError}
                  retry={news.refetch}
                  empty={
                    search ? "No matching public news" : "No public news yet"
                  }
                />
              ) : (
                stories.map((s, i) => (
                  <article className="ref-news-story" key={s.id}>
                    <PublicMedia name={"news-story-" + (i + 1)} />
                    <div className="ref-news-story-copy">
                      <time dateTime={s.createdAt}>
                        {formatPublicDate(s.createdAt)}
                      </time>
                      <h2>{s.title}</h2>
                      <p>
                        {s.content.length > 180
                          ? s.content.slice(0, 180) + "…"
                          : s.content}
                      </p>
                      <Link
                        to={"/news-events/story-" + s.id}
                        aria-label={"Read " + s.title}
                      >
                        Read the story <span aria-hidden="true">→</span>
                      </Link>
                    </div>
                  </article>
                ))
              )}
            </section>
          </div>
          {view === "combined" && (
            <section id="public-events" className="ref-news-events">
              <h2>Public events</h2>
              {events.isLoading || events.isError || dates.length === 0 ? (
                <PublicFeedState
                  kind="events"
                  loading={events.isLoading}
                  error={events.isError}
                  retry={events.refetch}
                  empty="No public events yet"
                />
              ) : (
                <EventRows events={dates} />
              )}
            </section>
          )}
        </>
      )}
      <RelatedPublicPages path={path} />
    </div>
  );
}
export function PublicFeedDetail({
  kind,
  id,
}: {
  kind: "story" | "event";
  id: string;
}) {
  const [params] = useSearchParams(),
    { news, events } = usePublicFeeds(),
    isStory = kind === "story";
  const query = isStory ? news : events;
  const story = isStory
    ? news.data?.data.find((s) => String(s.id) === id)
    : undefined;
  const event = !isStory
    ? events.data?.data.find(
        (e) =>
          String(e.id) === id &&
          (!params.get("date") || e.startAt === params.get("date"))
      )
    : undefined;
  const item = story || event,
    title =
      item?.title ||
      (query.isLoading
        ? "Loading…"
        : query.isError
        ? "Information unavailable"
        : "This public item is unavailable");
  return (
    <>
      <PublicPageMeta
        title={title}
        description={
          story?.content.slice(0, 150) ||
          event?.description?.slice(0, 150) ||
          "School-approved public information."
        }
      />
      <header className="ref-article-hero">
        <div>
          <PublicBreadcrumb
            label={
              "News & events / " + (isStory ? "School story" : "Event details")
            }
          />
          <h1>{title}</h1>
          {story && (
            <time className="ref-article-meta" dateTime={story.createdAt}>
              {formatPublicDate(story.createdAt)}
            </time>
          )}
          {event && (
            <p className="ref-article-meta">
              <time dateTime={event.startAt}>
                {formatPublicDate(event.startAt)}
              </time>{" "}
              ·{" "}
              {event.allDay
                ? "All day"
                : new Date(event.startAt).toLocaleTimeString("en", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
            </p>
          )}
        </div>
      </header>
      <article className="ref-article-body">
        {query.isLoading || query.isError ? (
          <PublicFeedState
            kind={isStory ? "school news" : "events"}
            loading={query.isLoading}
            error={query.isError}
            retry={query.refetch}
          />
        ) : !item ? (
          <>
            <p>
              This item is not available in the current school-approved public
              feed. It may no longer be published or may fall outside the
              current event range.
            </p>
            <Link
              to={isStory ? "/news-events/latest" : "/news-events/calendar"}
            >
              Return to {isStory ? "school news" : "public events"} →
            </Link>
          </>
        ) : (
          <>
            {story ? (
              <p>{story.content}</p>
            ) : (
              <>
                <p>
                  {event!.description ||
                    "No additional public description has been published."}
                </p>
                {!event!.allDay && (
                  <p>
                    Times are shown in{" "}
                    {Intl.DateTimeFormat().resolvedOptions().timeZone}.
                  </p>
                )}
              </>
            )}
            <Link
              to={isStory ? "/news-events/latest" : "/news-events/calendar"}
            >
              ← Back to {isStory ? "school news" : "public events"}
            </Link>
          </>
        )}
      </article>
      <RelatedPublicPages path="/news-events" />
    </>
  );
}
