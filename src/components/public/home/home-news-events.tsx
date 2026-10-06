import { ArrowRight, CalendarDays, Newspaper, RotateCw } from "lucide-react";
import { Link } from "react-router";

import { HomeReveal } from "@/components/public/home/home-motion";
import { useApiQuery } from "@/hooks/use-api-query";

type PublicNews = {
  id: number;
  title: string;
  content: string;
  createdAt: string;
};

type PublicEvent = {
  id: number;
  title: string;
  description: string | null;
  type: string;
  startAt: string;
  endAt: string | null;
  allDay: boolean;
};

function formatDate(value: string, options?: Intl.DateTimeFormatOptions) {
  return new Date(value).toLocaleDateString(undefined, options);
}

function FeedLoading() {
  return (
    <div className="homepage-feed__loading" aria-label="Loading school news and events" aria-busy="true">
      <span />
      <span />
      <span />
    </div>
  );
}

export function HomeNewsEvents() {
  const today = new Date();
  const from = today.toISOString().slice(0, 10);
  const to = new Date(today.getTime() + 1000 * 60 * 60 * 24 * 90).toISOString().slice(0, 10);
  const newsQuery = useApiQuery<{ data: PublicNews[] }>("/announcements/public", { staleTime: 60_000 });
  const eventsQuery = useApiQuery<{ data: PublicEvent[] }>(`/calendar/public?from=${from}&to=${to}`, { staleTime: 60_000 });
  const stories = newsQuery.data?.data.slice(0, 3) ?? [];
  const events = eventsQuery.data?.data.slice(0, 3) ?? [];

  return (
    <section className="homepage-feed" aria-labelledby="homepage-feed-title">
      <div className="public-container">
        <HomeReveal className="homepage-feed__heading">
          <div>
            <p className="homepage-eyebrow">News and events</p>
            <h2 id="homepage-feed-title">What is happening across the school.</h2>
          </div>
          <Link to="/news-events">View all news and events <ArrowRight aria-hidden="true" /></Link>
        </HomeReveal>

        <div className="homepage-feed__grid">
          <section className="homepage-feed__news" aria-labelledby="homepage-news-title">
            <div className="homepage-feed__label"><Newspaper aria-hidden="true" /><h3 id="homepage-news-title">Latest news</h3></div>
            {newsQuery.isLoading ? <FeedLoading /> : newsQuery.isError ? (
              <div className="homepage-feed__state" role="alert">
                <p>School news is temporarily unavailable.</p>
                <button type="button" onClick={() => newsQuery.refetch()}><RotateCw aria-hidden="true" />Try again</button>
              </div>
            ) : stories.length === 0 ? (
              <div className="homepage-feed__state"><p>No public news has been published yet.</p></div>
            ) : (
              <div className="homepage-feed__stories">
                {stories.map((story, index) => (
                  <article className={index === 0 ? "is-featured" : ""} key={story.id}>
                    <time dateTime={story.createdAt}>{formatDate(story.createdAt, { day: "numeric", month: "long", year: "numeric" })}</time>
                    <h4>{story.title}</h4>
                    <p>{story.content}</p>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="homepage-feed__events" aria-labelledby="homepage-events-title">
            <div className="homepage-feed__label"><CalendarDays aria-hidden="true" /><h3 id="homepage-events-title">Coming up</h3></div>
            {eventsQuery.isLoading ? <FeedLoading /> : eventsQuery.isError ? (
              <div className="homepage-feed__state" role="alert">
                <p>Public events are temporarily unavailable.</p>
                <button type="button" onClick={() => eventsQuery.refetch()}><RotateCw aria-hidden="true" />Try again</button>
              </div>
            ) : events.length === 0 ? (
              <div className="homepage-feed__state"><p>No public events have been published yet.</p></div>
            ) : (
              <div className="homepage-feed__event-list">
                {events.map((event) => (
                  <article key={event.id}>
                    <time dateTime={event.startAt}>
                      <strong>{new Date(event.startAt).getDate()}</strong>
                      <span>{formatDate(event.startAt, { month: "short" })}</span>
                    </time>
                    <div>
                      <span>{event.type || "School event"}</span>
                      <h4>{event.title}</h4>
                      {event.description ? <p>{event.description}</p> : null}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </section>
  );
}
