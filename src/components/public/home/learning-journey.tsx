import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import type { CSSProperties } from "react";
import { Link } from "react-router";

import { publicSubtleReveal } from "@/components/public/public-motion";
import { HomeReveal } from "./home-motion";

const stages = [
  {
    number: "01",
    tone: "nursery",
    label: "Nursery",
    title: "A safe place to begin with wonder.",
    copy: "Care, discovery, play and early learning create a warm sense of belonging from the very first day.",
    href: "/academics/early-years",
    range: "Care · Discovery · Play",
    visual: ["Touch", "Listen", "Imagine"],
  },
  {
    number: "02",
    tone: "primary",
    label: "Primary",
    title: "Curiosity grows into confident foundations.",
    copy: "Literacy, numeracy, making, teamwork and exploration help learners connect knowledge with the world around them.",
    href: "/academics/primary",
    range: "Explore · Make · Collaborate",
    visual: ["Read", "Question", "Create", "Share"],
  },
  {
    number: "03",
    tone: "secondary",
    label: "Secondary",
    title: "Independent thinking finds its direction.",
    copy: "Science, discussion, leadership and creative problem-solving prepare students to make thoughtful future choices.",
    href: "/academics/secondary",
    range: "Think · Lead · Prepare",
    visual: ["Ideas", "Purpose", "Future"],
  },
] as const;

export function LearningJourney() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="homepage-journey" aria-labelledby="journey-title">
      <div className="public-container">
        <HomeReveal className="homepage-section-heading homepage-section-heading--journey">
          <div>
            <p className="homepage-eyebrow">The learning journey</p>
            <h2 id="journey-title">Three distinct stages. One continuous story.</h2>
          </div>
          <p>
            The experience changes as children grow, while the relationships, purpose and sense of
            belonging stay connected.
          </p>
        </HomeReveal>

        <div className="homepage-journey__sequence">
          <div className="homepage-journey__line" aria-hidden="true" />
          {stages.map((stage, index) => (
            <motion.article
              className={`homepage-journey__chapter homepage-journey__chapter--${stage.tone} stage-accent--${stage.tone}`}
              key={stage.label}
              variants={publicSubtleReveal}
              initial={shouldReduceMotion ? false : "hidden"}
              whileInView="visible"
              viewport={{ once: true, amount: 0.22 }}
              transition={shouldReduceMotion ? { duration: 0 } : { delay: index * 0.06 }}
            >
              <div className="homepage-journey__number" aria-hidden="true">{stage.number}</div>
              <div className="homepage-journey__copy">
                <p className="homepage-eyebrow">{stage.label}</p>
                <h3>{stage.title}</h3>
                <p>{stage.copy}</p>
                <span className="homepage-journey__range">{stage.range}</span>
                <Link to={stage.href}>
                  Explore {stage.label}
                  <ArrowRight aria-hidden="true" />
                </Link>
              </div>
              <div className={`homepage-journey__visual homepage-journey__visual--${stage.tone}`} aria-hidden="true">
                <div className="homepage-journey__visual-depth" />
                {stage.visual.map((word, wordIndex) => (
                  <span key={word} style={{ "--word-index": wordIndex } as CSSProperties}>{word}</span>
                ))}
                {stage.tone === "secondary" ? <div className="homepage-journey__horizon" /> : null}
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
