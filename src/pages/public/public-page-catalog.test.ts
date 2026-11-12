import { describe, expect, it } from "vitest";
import {
  PUBLIC_NAVIGATION,
  PUBLIC_STAGE_NAVIGATION,
} from "@/components/public/public-navigation";
import { PUBLIC_PAGE_CATALOG, resolvePublicPage } from "./public-page-catalog";

describe("public destination integrity", () => {
  it("resolves every contextual menu destination without crossing route families", () => {
    const functional = new Set([
      "/admissions/visit",
      "/news-events/latest",
      "/news-events/calendar",
      "/news-events/announcements",
      "/gallery",
    ]);
    const groups = [
      ...PUBLIC_NAVIGATION.map((g) => g.items),
      ...Object.values(PUBLIC_STAGE_NAVIGATION),
    ];
    for (const items of groups) {
      expect(new Set(items.map(([, href]) => href)).size).toBe(items.length);
      for (const [, href] of items)
        expect(
          functional.has(href) || Boolean(resolvePublicPage(href)),
          href
        ).toBe(true);
    }
    expect(resolvePublicPage("/about/primary")).toBeUndefined();
    expect(resolvePublicPage("/community/fees")).toBeUndefined();
    expect(resolvePublicPage("/academics/primary/")?.stage).toBe("Primary");
  });

  it("gives Nursery, Primary and Secondary their own six-link menus and routes", () => {
    expect(Object.keys(PUBLIC_STAGE_NAVIGATION)).toEqual(["Nursery", "Primary", "Secondary"]);
    for (const [stage, items] of Object.entries(PUBLIC_STAGE_NAVIGATION)) {
      expect(items, stage).toHaveLength(6);
      expect(new Set(items.map(([, href]) => href)).size, stage).toBe(6);
      for (const [label, href] of items) {
        const page = resolvePublicPage(href);
        expect(page, href).toBeDefined();
        expect(page?.stage, href).toBe(stage);
        expect(page?.sections.length, label).toBeGreaterThan(0);
      }
    }
  });

  it("marks unsupported institutional facts as awaiting confirmation", () => {
    for (const href of [
      "/admissions/fees",
      "/admissions/term-dates",
      "/admissions/policy",
      "/about/leadership",
      "/about/safeguarding",
      "/news-events/publications",
      "/community/alumni",
    ])
      expect(resolvePublicPage(href)?.pending, href).toBeTruthy();
    expect(
      Object.keys(PUBLIC_PAGE_CATALOG).some((p) => p.includes("undefined"))
    ).toBe(false);
  });

  it("provides distinct local pages for all nine About us destinations", () => {
    const aboutItems = PUBLIC_NAVIGATION.find((group) => group.label === "About us")!.items;
    expect(aboutItems).toHaveLength(9);
    for (const [label, href] of aboutItems) {
      const page = resolvePublicPage(href);
      expect(page, href).toBeDefined();
      expect(page?.label, href).toBe(label);
      expect(page?.sections.length, href).toBeGreaterThan(0);
      expect(page?.layout, href).toBeTruthy();
    }
    for (const href of [
      "/about/directors-welcome",
      "/about/accreditation-memberships",
      "/about/community-spaces",
      "/about/work-for-us",
    ])
      expect(resolvePublicPage(href)?.pending, href).toBeTruthy();
  });
});
