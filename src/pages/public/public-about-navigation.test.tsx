import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { PublicShell } from "@/components/public/public-shell";
import PublicDetailPage from "./detail-page";

const destinations = [
  ["Our story", "/about/our-story", ".ref-story-journey"],
  ["Mission and values", "/about/mission-values", ".ref-statement"],
  ["A welcome from school leadership", "/about/directors-welcome", ".ref-director-intro"],
  ["Leadership and governance", "/about/leadership", ".ref-governance-sections"],
  ["Accreditations and memberships", "/about/accreditation-memberships", ".ref-membership-placeholders"],
  ["Campus and facilities", "/about/campus-facilities", "#landscape-content"],
  ["Community spaces", "/about/community-spaces", ".ref-editorial-sections"],
  ["Careers at Eckernforde", "/about/work-for-us", ".ref-careers-lead"],
  ["Safeguarding", "/about/safeguarding", ".ref-safeguarding-sections"],
] as const;

function RouteProbe() {
  return <output data-testid="current-route">{useLocation().pathname}</output>;
}

beforeAll(() => {
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() { return []; }
    }
  );
});
afterAll(() => vi.unstubAllGlobals());
beforeAll(() => vi.spyOn(window, "scrollTo").mockImplementation(() => {}));
afterEach(() => {
  cleanup();
  document.body.style.overflow = "";
  vi.restoreAllMocks();
});

describe("About us navigation integration", () => {
  it("opens every submenu destination as its own public page", async () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route element={<PublicShell />}>
            <Route
              path="*"
              element={
                <>
                  <PublicDetailPage />
                  <RouteProbe />
                </>
              }
            />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    for (const [label, href, marker] of destinations) {
      fireEvent.click(await screen.findByRole("button", { name: "Open navigation" }));
      fireEvent.click(await screen.findByRole("button", { name: "About us" }));
      const dialog = await screen.findByRole("dialog", {
        name: "School navigation",
      });
      fireEvent.click(within(dialog).getByRole("link", { name: label }));

      await waitFor(() =>
        expect(screen.getByTestId("current-route").textContent).toBe(href)
      );
      await waitFor(() =>
        expect(container.querySelector(marker), href).not.toBeNull()
      );
      const expectedHeading = label;
      await waitFor(() =>
        expect(
          screen.getByRole("heading", { level: 1 }).textContent
        ).toBe(expectedHeading)
      );
      await waitFor(() =>
        expect(
          screen.queryByRole("dialog", { name: "School navigation" })
        ).toBeNull()
      );
    }
  }, 120_000);
});
