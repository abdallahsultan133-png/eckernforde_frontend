import { cleanup, render, screen } from "@testing-library/react";
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

    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain("Every beginning");
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain("opens a wider world.");
    expect(screen.getByRole("link", { name: /explore nursery/i }).getAttribute("href")).toBe("/academics/early-years");
    expect(screen.getByRole("link", { name: /explore primary/i }).getAttribute("href")).toBe("/academics/primary");
    expect(screen.getByRole("link", { name: /explore secondary/i }).getAttribute("href")).toBe("/academics/secondary");
    expect(screen.getAllByRole("link", { name: /plan a visit/i }).every((link) => link.getAttribute("href") === "/admissions/visit")).toBe(true);
  });

  it("uses approved public news and event queries without fabricated feed items", () => {
    render(<MemoryRouter><PublicHome /></MemoryRouter>);

    expect(screen.getByRole("heading", { name: "Community story" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Open morning" })).toBeTruthy();
    expect(useApiQueryMock).toHaveBeenCalledWith("/announcements/public", { staleTime: 60_000 });
    expect(useApiQueryMock.mock.calls.some(([path]) => String(path).startsWith("/calendar/public?"))).toBe(true);
  });
});
