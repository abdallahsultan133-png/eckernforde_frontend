import { cleanup, render, screen } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router";
import PublicDetailPage from "./detail-page";

const aboutPages = [
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

afterEach(cleanup);

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

describe("About Us destination pages", () => {
  it.each(aboutPages)("renders %s at %s with its page-specific composition", (label, path, marker) => {
    const { container } = render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/about/:slug" element={<PublicDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(label);
    expect(container.querySelector(marker), path).not.toBeNull();
    expect(container.querySelector(".ref-media"), path).not.toBeNull();
    for (const image of container.querySelectorAll(".ref-media img")) {
      expect(image.getAttribute("src"), path).toMatch(
        /^\/images\/kijani-(hero|creative-learning|community-voice)-1280\.jpg$/
      );
      expect(image.getAttribute("alt"), path).toContain("Illustrative image");
    }
  }, 30_000);
});
