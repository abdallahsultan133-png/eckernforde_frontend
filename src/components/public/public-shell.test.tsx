import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
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
    </MemoryRouter>,
  );
}

describe("PublicShell", () => {
  afterEach(() => {
    cleanup();
    document.body.style.overflow = "";
  });

  it("keeps the public foundation scoped and exposes the existing portal route", () => {
    const { container } = renderShell();

    expect(container.querySelector(".public-site.site-shell")).not.toBeNull();
    const portalLinks = screen.getAllByRole("link", { name: /go to portal/i });
    expect(portalLinks.length).toBeGreaterThan(0);
    expect(portalLinks.every((link) => link.getAttribute("href") === "/portal")).toBe(true);
  });

  it("prioritizes the three school stages in the mobile menu", async () => {
    renderShell();
    fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));

    const dialog = await screen.findByRole("dialog", { name: "School navigation" });
    expect(dialog.querySelector(".stage-accent--nursery")?.getAttribute("href")).toBe("/academics/early-years");
    expect(dialog.querySelector(".stage-accent--primary")?.getAttribute("href")).toBe("/academics/primary");
    expect(dialog.querySelector(".stage-accent--secondary")?.getAttribute("href")).toBe("/academics/secondary");
    expect(within(dialog).getByRole("link", { name: /contact \/ visit/i }).getAttribute("href")).toBe("/admissions/visit");
  });

  it("closes the mobile menu with Escape and returns focus to its toggle", async () => {
    renderShell();
    const toggle = screen.getByRole("button", { name: "Open navigation" });
    fireEvent.click(toggle);
    await screen.findByRole("dialog", { name: "School navigation" });

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => expect(screen.queryByRole("dialog", { name: "School navigation" })).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(toggle));
  });

  it("opens a desktop menu from the keyboard and exposes its overview route", async () => {
    renderShell();
    const exploreTrigger = screen.getByRole("button", { name: "Explore" });
    exploreTrigger.focus();
    fireEvent.keyDown(exploreTrigger, { key: "ArrowDown" });

    const overviewLink = await screen.findByRole("link", {
      name: /discover a connected school/i,
    });
    expect(overviewLink.getAttribute("href")).toBe("/about");
  });
});
