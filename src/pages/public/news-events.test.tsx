import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router";
import NewsEventsPage, { PublicFeedDetail } from "./news-events";
const feeds = vi.hoisted(() => ({
  news: {
    data: { data: [] as unknown[] },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  },
  events: {
    data: { data: [] as unknown[] },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  },
}));
vi.mock("@/hooks/use-api-query", () => ({
  useApiQuery: (path: string) =>
    path.startsWith("/announcements/public") ? feeds.news : feeds.events,
}));
afterEach(cleanup);
beforeEach(() => {
  for (const query of Object.values(feeds)) {
    query.data.data = [];
    query.isLoading = false;
    query.isError = false;
    query.refetch.mockClear();
  }
});
const mount = (element: React.ReactNode, path = "/news-events") =>
  render(<MemoryRouter initialEntries={[path]}>{element}</MemoryRouter>);
describe("approved public feed destinations", () => {
  it("provides distinct loading, error/retry and empty states", () => {
    feeds.news.isLoading = true;
    const result = mount(<NewsEventsPage view="news" />);
    expect(screen.getByRole("status").textContent).toContain(
      "Loading school news"
    );
    feeds.news.isLoading = false;
    feeds.news.isError = true;
    result.rerender(
      <MemoryRouter>
        <NewsEventsPage view="news" />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole("button", { name: "Retry school news" }));
    expect(feeds.news.refetch).toHaveBeenCalledOnce();
    feeds.news.isError = false;
    result.rerender(
      <MemoryRouter>
        <NewsEventsPage view="news" />
      </MemoryRouter>
    );
    expect(
      screen.getByRole("heading", { name: "No public news yet" })
    ).toBeTruthy();
  });
  it("opens real approved news content and treats markup as text", () => {
    feeds.news.data.data = [
      {
        id: 7,
        title: "Approved notice",
        content: "<img src=x onerror=alert(1)>Public text",
        createdAt: "2026-10-08T10:00:00Z",
      },
    ];
    const { container } = mount(<PublicFeedDetail kind="story" id="7" />);
    expect(
      screen.getByRole("heading", { name: "Approved notice" })
    ).toBeTruthy();
    expect(container.querySelector(".ref-article-body img")).toBeNull();
    expect(screen.getByText(/<img src=x/)).toBeTruthy();
  });
  it("selects a recurring event by occurrence date", () => {
    feeds.events.data.data = [
      {
        id: "repeat",
        title: "First occurrence",
        description: "First",
        startAt: "2026-10-09T10:00:00Z",
        endAt: null,
        allDay: false,
        type: "event",
      },
      {
        id: "repeat",
        title: "Second occurrence",
        description: "Second",
        startAt: "2026-10-16T10:00:00Z",
        endAt: null,
        allDay: false,
        type: "event",
      },
    ];
    mount(
      <PublicFeedDetail kind="event" id="repeat" />,
      "/news-events/event-repeat?date=2026-10-16T10%3A00%3A00Z"
    );
    expect(
      screen.getByRole("heading", { name: "Second occurrence" })
    ).toBeTruthy();
    expect(
      screen.queryByRole("heading", { name: "First occurrence" })
    ).toBeNull();
  });
  it("shows unavailable information instead of inventing an old story", () => {
    mount(<PublicFeedDetail kind="story" id="999" />);
    expect(
      screen.getByRole("heading", { name: "This public item is unavailable" })
    ).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: /Return to school news/ })
        .getAttribute("href")
    ).toBe("/news-events/latest");
  });
});
