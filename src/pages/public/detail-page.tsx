import { useLocation, useParams } from "react-router";
import PublicNotFoundPage from "./not-found";
import AdmissionsPage from "./admissions";
import NewsEventsPage, { PublicFeedDetail } from "./news-events";
import { resolvePublicPage } from "./public-page-catalog";
import { PublicPageLayout } from "./public-page-layouts";
export default function PublicDetailPage() {
  const { pathname } = useLocation(),
    { slug = "" } = useParams();
  if (pathname.startsWith("/news-events/")) {
    if (slug.startsWith("story-"))
      return <PublicFeedDetail kind="story" id={slug.slice(6)} />;
    if (slug.startsWith("event-"))
      return <PublicFeedDetail kind="event" id={slug.slice(6)} />;
    if (
      ["latest", "news", "announcements", "calendar", "events"].includes(slug)
    )
      return (
        <NewsEventsPage
          view={
            slug === "calendar" || slug === "events"
              ? "events"
              : slug === "announcements"
              ? "announcements"
              : "news"
          }
        />
      );
  }
  if (pathname === "/admissions/visit") return <AdmissionsPage mode="visit" />;
  const page = resolvePublicPage(pathname);
  return page ? <PublicPageLayout page={page} /> : <PublicNotFoundPage />;
}
