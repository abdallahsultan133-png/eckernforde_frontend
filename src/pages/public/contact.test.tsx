import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router";
import ContactPage from "./contact";

afterEach(cleanup);

describe("public contact page structure", () => {
  it("places the interactive campus section before contact information", () => {
    const { container } = render(
      <MemoryRouter>
        <ContactPage />
      </MemoryRouter>
    );
    const sections = Array.from(
      container.querySelectorAll(
        ".ref-landscape-hero, .ref-campus-standalone, .ref-contact-columns"
      )
    );

    expect(sections.map((section) => section.classList[0])).toEqual([
      "ref-landscape-hero",
      "ref-campus",
      "ref-contact-columns",
    ]);
    expect(screen.getByRole("link", { name: "GO TO PORTAL" }).getAttribute("href")).toBe(
      "/portal"
    );
    const visitLink = screen.getByRole("link", { name: "PLAN A SCHOOL VISIT" });
    expect(visitLink.getAttribute("href")).toBe("/admissions/visit");
    expect(visitLink.querySelector("video")?.getAttribute("src")).toBe(
      "/videos/eckernforde-visit-preview.mp4"
    );
  });
});
