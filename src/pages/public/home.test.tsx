import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import PublicHome from "./home";

const { useApiQueryMock } = vi.hoisted(() => ({
  useApiQueryMock: vi.fn(),
}));

vi.mock("@/hooks/use-api-query", () => ({
  useApiQuery: useApiQueryMock,
}));

describe("PublicHome", () => {
  beforeAll(() => {
    vi.stubGlobal("IntersectionObserver", class {
      observe() {}
      unobserve() {}
      disconnect() {}
    });
    vi.stubGlobal("ResizeObserver", class {
      observe() {}
      unobserve() {}
      disconnect() {}
    });
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  afterEach(() => cleanup());

  beforeEach(() => {
    useApiQueryMock.mockImplementation((path: string) => {
      if (path === "/announcements/public") {
        return {
          data: { data: [{ id: 1, title: "Community story", content: "An approved public update.", createdAt: "2026-09-15T08:00:00.000Z" }] },
          isLoading: false,
          isError: false,
          refetch: vi.fn(),
        };
      }

      return {
        data: { data: [{ id: 2, title: "Open morning", description: "Visit the school.", type: "Visit", startAt: "2026-10-20T08:00:00.000Z", endAt: null, allDay: false }] },
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
      };
    });
  });

  it("presents one connected Nursery, Primary and Secondary journey with valid routes", () => {
    render(<MemoryRouter><PublicHome /></MemoryRouter>);

    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain("A place to learn.");
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain("A place to grow.");
    expect(screen.getByRole("link", { name: /explore nursery/i }).getAttribute("href")).toBe("/academics/early-years");
    expect(screen.getByRole("link", { name: /explore primary/i }).getAttribute("href")).toBe("/academics/primary");
    expect(screen.getByRole("link", { name: /explore secondary/i }).getAttribute("href")).toBe("/academics/secondary");
    expect(screen.getByRole("link", { name: /plan a school visit/i }).getAttribute("href")).toBe("/admissions/visit");
  });

  it("uses approved public news and event queries without fabricated feed items", () => {
    render(<MemoryRouter><PublicHome /></MemoryRouter>);

    expect(screen.getByRole("heading", { name: "Community story" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Open morning" })).toBeTruthy();
    expect(useApiQueryMock).toHaveBeenCalledWith("/announcements/public", { staleTime: 60_000 });
    expect(useApiQueryMock.mock.calls.some(([path]) => String(path).startsWith("/calendar/public?"))).toBe(true);
  });

  it("shows honest empty states instead of fabricated school stories", () => {
    useApiQueryMock.mockReturnValue({ data: { data: [] }, isLoading: false, isError: false, refetch: vi.fn() });
    render(<MemoryRouter><PublicHome /></MemoryRouter>);
    expect(screen.getByText("No public news has been published yet.")).toBeTruthy();
    expect(screen.getByText("No public events have been published yet.")).toBeTruthy();
  });

  it("offers retries when public feeds are unavailable", () => {
    const refetch = vi.fn();
    useApiQueryMock.mockReturnValue({ isLoading: false, isError: true, refetch });
    render(<MemoryRouter><PublicHome /></MemoryRouter>);
    fireEvent.click(screen.getAllByRole("button", { name: "Try again" })[0]);
    expect(refetch).toHaveBeenCalledOnce();
  });

  it("opens campus details without inventing facility or address facts", async () => {
    render(<MemoryRouter><PublicHome /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: "Learning spaces" }));
    expect(screen.getByRole("dialog", { name: "Learning spaces" })).toBeTruthy();
    expect(screen.getByText(/Student numbers to be confirmed/)).toBeTruthy();
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });
});
