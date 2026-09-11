import { useEffect } from "react";
import { APP_NAME } from "@/constants";

/**
 * Public routes do not use Refine resource titles. Keep their document title
 * and description useful to search engines, browser history and assistive
 * technology without claiming unverified school facts.
 */
export function PublicPageMeta({ title, description }: { title: string; description: string }) {
  useEffect(() => {
    document.title = `${title} | ${APP_NAME}`;
    let descriptionTag = document.querySelector('meta[name="description"]');
    if (!descriptionTag) {
      descriptionTag = document.createElement("meta");
      descriptionTag.setAttribute("name", "description");
      document.head.appendChild(descriptionTag);
    }
    descriptionTag.setAttribute("content", description);
  }, [description, title]);
  return null;
}
