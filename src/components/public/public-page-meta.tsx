import { useEffect } from "react";
import { APP_NAME } from "@/constants";

/**
 * Public routes do not use Refine resource titles. Keep their document title
 * and description useful to search engines, browser history and assistive
 * technology without claiming unverified school facts.
 */
export function PublicPageMeta({ title, description }: { title: string; description: string }) {
  useEffect(() => {
    const pageTitle = `${title} | ${APP_NAME}`;
    const configuredSiteUrl = import.meta.env.VITE_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
    const publicOrigin = (() => {
      if (!configuredSiteUrl) return undefined;
      try {
        const url = new URL(configuredSiteUrl);
        return url.protocol === "http:" || url.protocol === "https:" ? url.origin : undefined;
      } catch {
        return undefined;
      }
    })();
    const canonicalUrl = publicOrigin ? `${publicOrigin}${window.location.pathname}` : undefined;
    document.title = pageTitle;
    let descriptionTag = document.querySelector('meta[name="description"]');
    if (!descriptionTag) {
      descriptionTag = document.createElement("meta");
      descriptionTag.setAttribute("name", "description");
      document.head.appendChild(descriptionTag);
    }
    descriptionTag.setAttribute("content", description);
    const setProperty = (property: string, content: string) => {
      let tag = document.querySelector(`meta[property="${property}"]`);
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute("property", property);
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", content);
    };
    setProperty("og:title", pageTitle);
    setProperty("og:description", description);
    setProperty("og:type", "website");
    const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (canonicalUrl) {
      setProperty("og:url", canonicalUrl);
      const link = canonical ?? document.createElement("link");
      link.setAttribute("rel", "canonical");
      link.setAttribute("href", canonicalUrl);
      if (!canonical) document.head.appendChild(link);
    } else {
      canonical?.remove();
    }
    const setName = (name: string, content: string) => {
      let tag = document.querySelector(`meta[name="${name}"]`);
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute("name", name);
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", content);
    };
    setName("twitter:title", pageTitle);
    setName("twitter:description", description);
    setName("twitter:card", "summary_large_image");
  }, [description, title]);
  return null;
}
