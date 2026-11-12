import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router";

import { PublicShell } from "./public-shell";

function renderShell(initialEntry = "/") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route element={<PublicShell />}>
          <Route path="*" element={<div>Public page content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe("PublicShell", () => {
  beforeEach(() => vi.spyOn(window, "scrollTo").mockImplementation(() => {}));
  afterEach(() => {
    cleanup();
    document.body.style.overflow = "";
    vi.restoreAllMocks();
  });

  it("keeps the public foundation scoped and exposes the existing portal route", () => {
    const { container } = renderShell();

    expect(container.querySelector(".public-site.site-shell")).not.toBeNull();
    expect(container.querySelector(".ref-monogram")?.textContent?.trim()).toBe(
      "E"
    );
    const portalLinks = screen.getAllByRole("link", { name: /go to portal/i });
    expect(portalLinks.length).toBeGreaterThan(0);
    expect(
      portalLinks.every((link) => link.getAttribute("href") === "/portal")
    ).toBe(true);
  });

  it("prioritizes the three school stages in the mobile menu", async () => {
    renderShell();
    fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));

    const dialog = await screen.findByRole("dialog", {
      name: "School navigation",
    });
    expect(
      dialog.querySelector(".stage-accent--nursery")?.getAttribute("href")
    ).toBe("/academics/early-years");
    expect(
      dialog.querySelector(".stage-accent--primary")?.getAttribute("href")
    ).toBe("/academics/primary");
    expect(
      dialog.querySelector(".stage-accent--secondary")?.getAttribute("href")
    ).toBe("/academics/secondary");
    expect(
      within(dialog)
        .getByRole("link", { name: /contact \/ visit/i })
        .getAttribute("href")
    ).toBe("/admissions/visit");
  });

  it("closes the mobile menu with Escape and returns focus to its toggle", async () => {
    renderShell();
    const toggle = screen.getByRole("button", { name: "Open navigation" });
    fireEvent.click(toggle);
    await screen.findByRole("dialog", { name: "School navigation" });

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(
      () =>
        expect(
          screen.queryByRole("dialog", { name: "School navigation" })
        ).toBeNull(),
      { timeout: 3000 }
    );
    await waitFor(() => expect(document.activeElement).toBe(toggle));
  });

  it("opens the About us submenu with the nine reference destinations", async () => {
    renderShell();
    const exploreTrigger = screen.getByRole("button", {
      name: "Open navigation",
    });
    exploreTrigger.focus();
    fireEvent.click(exploreTrigger);
    fireEvent.click(await screen.findByRole("button", { name: "About us" }));

    const dialog = await screen.findByRole("dialog", {
      name: "School navigation",
    });
    const submenu = dialog.querySelector(".ref-navigation-submenu");
    expect(submenu).not.toBeNull();
    const links = within(submenu as HTMLElement).getAllByRole("link");
    expect(links.map((link) => link.textContent?.trim())).toEqual([
      "Our story",
      "Mission and values",
      "A welcome from school leadership",
      "Leadership and governance",
      "Accreditations and memberships",
      "Campus and facilities",
      "Community spaces",
      "Careers at Eckernforde",
      "Safeguarding",
    ]);
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/about/our-story",
      "/about/mission-values",
      "/about/directors-welcome",
      "/about/leadership",
      "/about/accreditation-memberships",
      "/about/campus-facilities",
      "/about/community-spaces",
      "/about/work-for-us",
      "/about/safeguarding",
    ]);
  });
  it("closes navigation after an About us destination is selected", async () => {
    renderShell("/about");
    fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));
    fireEvent.click(await screen.findByRole("button", { name: "About us" }));
    fireEvent.click(
      await screen.findByRole("link", { name: "Our story" })
    );
    await waitFor(
      () =>
        expect(
          screen.queryByRole("dialog", { name: "School navigation" })
        ).toBeNull(),
      { timeout: 3000 }
    );
    await waitFor(() =>
      expect(document.body.style.overflow).not.toBe("hidden")
    );
  });
});
