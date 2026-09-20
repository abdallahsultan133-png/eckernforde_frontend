import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";

import { SCHOOL_PROFILE } from "../../constants";
import { PublicPageMeta } from "./public-page-meta";

describe("PublicPageMeta", () => {
  afterEach(() => {
    cleanup();
    document.head.querySelector('link[rel="canonical"]')?.remove();
    document.head.querySelector('meta[property="og:url"]')?.remove();
    vi.unstubAllEnvs();
  });

  it("updates the document and social metadata for a public route", () => {
    vi.stubEnv("VITE_PUBLIC_SITE_URL", "https://school.example");
    window.history.pushState({}, "", "/admissions");

    render(<PublicPageMeta title="Admissions" description="Start an enquiry." />);

    expect(document.title).toBe(`Admissions | ${SCHOOL_PROFILE.name}`);
    expect(document.querySelector('meta[name="description"]')?.getAttribute("content")).toBe("Start an enquiry.");
    expect(document.querySelector('meta[property="og:title"]')?.getAttribute("content")).toBe(`Admissions | ${SCHOOL_PROFILE.name}`);
    expect(document.querySelector('meta[name="twitter:description"]')?.getAttribute("content")).toBe("Start an enquiry.");
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe("https://school.example/admissions");
    expect(document.querySelector('meta[property="og:url"]')?.getAttribute("content")).toBe("https://school.example/admissions");
  });

  it("does not publish a canonical URL when no public origin is configured", () => {
    window.history.pushState({}, "", "/academics");

    render(<PublicPageMeta title="Academics" description="Explore learning." />);

    expect(document.querySelector('link[rel="canonical"]')).toBeNull();
    expect(document.querySelector('meta[property="og:url"]')).toBeNull();
  });
});
