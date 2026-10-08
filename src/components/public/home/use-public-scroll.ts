import { useLayoutEffect, useRef, useState } from "react";
import { useInView, useScroll, useTransform } from "framer-motion";

export const clampProgress = (value: number) => Math.max(0, Math.min(1, value));

/** Measure on layout changes; scroll values never cause React renders. */
export function usePublicScroll() {
  const section = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLDivElement>(null);
  const visible = useInView(section);
  const [geometry, setGeometry] = useState(() => ({ top: 0, height: 1, canvasHeight: 1, canvasEnd: 1, width: typeof window === "undefined" ? 1440 : window.innerWidth, viewport: typeof window === "undefined" ? 1000 : window.innerHeight }));
  const { scrollY } = useScroll();
  useLayoutEffect(() => {
    const measure = () => {
      if (!section.current) return;
      const ending = canvas.current?.querySelector<HTMLElement>(".ref-community-ending");
      const canvasHeight = canvas.current?.offsetHeight ?? 1;
      // Finish on the last readable story, rather than pinning an empty canvas
      // after every tile has already travelled above or beyond the viewport.
      const canvasEnd = ending && canvas.current ? clampProgress(Math.max(
        (canvas.current.offsetLeft + ending.offsetLeft + ending.offsetWidth / 2 - section.current.clientWidth / 2) / (window.innerWidth * 1.6),
        (canvas.current.offsetTop + ending.offsetTop + ending.offsetHeight / 2 - window.innerHeight / 2) / (canvasHeight * 1.25),
      )) : 1;
      const next = { top: section.current.getBoundingClientRect().top + window.scrollY, height: section.current.offsetHeight, canvasHeight, canvasEnd, width: window.innerWidth, viewport: window.innerHeight };
      setGeometry(previous => Object.keys(next).every(key => previous[key as keyof typeof next] === next[key as keyof typeof next]) ? previous : next);
    };
    measure();
    const observer = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(measure);
    if (section.current) observer?.observe(section.current);
    if (canvas.current) observer?.observe(canvas.current);
    // Earlier content can move our document offset after fonts/media load.
    observer?.observe(document.body);
    window.addEventListener("resize", measure);
    document.fonts?.ready.then(measure);
    return () => { observer?.disconnect(); window.removeEventListener("resize", measure); };
  }, []);
  const distance = useTransform(() => scrollY.get() - geometry.top);
  return { section, canvas, geometry, distance, visible };
}
