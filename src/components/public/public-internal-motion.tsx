import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useSyncExternalStore, type ReactNode } from "react";
import { usePublicReducedMotion } from "./public-motion";
import { PublicMedia } from "./public-media";
import { getPublicChapterOpacity } from "./public-chapter-progress";
function subscribeDesktop(cb: () => void) {
  const q = window.matchMedia?.("(min-width:1024px)");
  q?.addEventListener("change", cb);
  window.addEventListener("resize", cb);
  return () => {
    q?.removeEventListener("change", cb);
    window.removeEventListener("resize", cb);
  };
}
export function usePublicDesktop() {
  return useSyncExternalStore(
    subscribeDesktop,
    () => window.innerWidth >= 1024,
    () => false
  );
}
/** The reference's editorial entrances use +/-100px, with copy trailing titles. */
export function PublicEditorialReveal({
  children,
  direction = 1,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  direction?: number;
  delay?: number;
  className?: string;
}) {
  const reduced = usePublicReducedMotion();
  return (
    <motion.div
      className={"ref-editorial-reveal " + className}
      initial={reduced ? false : { x: direction * 100, opacity: 0 }}
      whileInView={{ x: 0, opacity: 1 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{
        duration: reduced ? 0 : 0.8,
        delay: reduced ? 0 : delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
type Chapter = { title: string; copy: string };
function ChapterPanel({
  chapter,
  index,
  count,
  progress,
  placeholderMedia = false,
}: {
  chapter: Chapter;
  index: number;
  count: number;
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
  placeholderMedia?: boolean;
}) {
  const opacity = useTransform(progress, (value) =>
    getPublicChapterOpacity(value, index, count)
  );
  const y = useTransform(opacity, [0, 1], [35, 0]);
  const image = (["opening", "creative", "community"] as const)[index % 3];
  return (
    <>
      <motion.div
        className="ref-chapter-picture"
        style={{ opacity }}
        aria-hidden="true"
      >
        <PublicMedia name={"learning-chapter-" + index} image={placeholderMedia ? undefined : image} />
      </motion.div>
      <motion.section
        className="ref-chapter-copy"
        style={{ opacity, y }}
        aria-label={chapter.title}
      >
        <span className="ref-kicker">
          {String(index + 1).padStart(2, "0")} /{" "}
          {String(count).padStart(2, "0")}
        </span>
        <h2>{chapter.title}</h2>
        <p>{chapter.copy}</p>
      </motion.section>
    </>
  );
}
/** Scroll-scrubbed split panels; native stacked reading at tablet/mobile/reduce. */
export function PublicScrollChapters({
  chapters,
  label,
  placeholderMedia = false,
}: {
  chapters: Chapter[];
  label: string;
  placeholderMedia?: boolean;
}) {
  const reduced = usePublicReducedMotion(),
    desktop = usePublicDesktop(),
    target = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target,
    offset: ["start start", "end end"],
  });
  const select = (i: number) => {
    const e = target.current;
    if (e)
      window.scrollTo({
        top:
          e.getBoundingClientRect().top +
          window.scrollY +
          (e.offsetHeight - window.innerHeight) *
            Math.min(0.99, (i + 0.15) / chapters.length),
        behavior: "smooth",
      });
  };
  if (reduced || !desktop)
    return (
      <section
        ref={target}
        className="ref-chapters ref-chapters-stacked"
        aria-label={label}
      >
        {chapters.map((c, i) => (
          <section className="ref-stacked-chapter" key={c.title}>
            <PublicMedia
              name={label + "-" + i}
              image={placeholderMedia ? undefined : (["opening", "creative", "community"] as const)[i % 3]}
            />
            <div>
              <PublicEditorialReveal direction={i % 2 ? -1 : 1}>
                <span className="ref-kicker">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h2>{c.title}</h2>
              </PublicEditorialReveal>
              <PublicEditorialReveal direction={i % 2 ? -1 : 1} delay={0.12}>
                <p>{c.copy}</p>
              </PublicEditorialReveal>
            </div>
          </section>
        ))}
      </section>
    );
  return (
    <section
      ref={target}
      className="ref-chapters"
      style={{ height: chapters.length * 100 + "svh" }}
      aria-label={label}
    >
      <div className="ref-chapter-pin">
        {chapters.map((c, i) => (
          <ChapterPanel
            key={c.title}
            chapter={c}
            index={i}
            count={chapters.length}
            progress={scrollYProgress}
            placeholderMedia={placeholderMedia}
          />
        ))}
        <nav className="ref-chapter-controls" aria-label="Choose a chapter">
          {chapters.map((c, i) => (
            <button
              key={c.title}
              onClick={() => select(i)}
              aria-label={"Read " + c.title}
            >
              {String(i + 1).padStart(2, "0")}
            </button>
          ))}
        </nav>
      </div>
    </section>
  );
}
