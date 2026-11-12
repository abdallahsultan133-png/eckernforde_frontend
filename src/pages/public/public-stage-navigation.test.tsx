import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { PublicShell } from "@/components/public/public-shell";
import { PUBLIC_STAGE_NAVIGATION } from "@/components/public/public-navigation";
import PublicDetailPage from "./detail-page";

function CurrentRoute() { return <output data-testid="current-route">{useLocation().pathname}</output>; }

beforeAll(() => {
  vi.stubGlobal("IntersectionObserver", class { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } });
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
});
afterEach(() => { cleanup(); document.body.style.overflow = ""; vi.restoreAllMocks(); });

describe("stage submenu destinations", () => {
  it("shows each stage's own menu and opens every destination as a blank-media page", async () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes><Route element={<PublicShell />}><Route path="*" element={<><PublicDetailPage /><CurrentRoute /></>} /></Route></Routes>
      </MemoryRouter>
    );
    for (const [stage, items] of Object.entries(PUBLIC_STAGE_NAVIGATION)) {
      const seen = new Set<string>();
      for (const [label, href] of items) {
        expect(seen.has(href), href).toBe(false);
        seen.add(href);
        fireEvent.click(await screen.findByRole("button", { name: "Open navigation" }));
        const dialog = await screen.findByRole("dialog", { name: "School navigation" });
        fireEvent.click(within(dialog).getByRole("button", { name: "Explore " + stage + " navigation" }));
        expect(dialog.querySelector(".ref-navigation-body")?.classList.contains("has-stage-submenu")).toBe(true);
        expect(dialog.querySelector(".ref-navigation-stage.is-selected")).not.toBeNull();
        const submenu = await screen.findByRole("navigation", { name: stage + " navigation" });
        fireEvent.click(within(submenu).getByRole("link", { name: label }));
        await waitFor(() => expect(screen.getByTestId("current-route").textContent).toBe(href));
        expect(container.querySelector("#public-content .ref-page-banner, #public-content .ref-stage-banner"), href).not.toBeNull();
        expect(container.querySelectorAll("#public-content .ref-media img"), href).toHaveLength(0);
        expect(screen.getByRole("heading", { level: 1 }).textContent?.trim().length).toBeGreaterThan(0);
      }
    }
  }, 180_000);
});
