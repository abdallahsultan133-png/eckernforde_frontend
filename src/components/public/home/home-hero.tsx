import { ArrowDown, ArrowRight, MapPin } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router";

import { PublicCta } from "@/components/public/public-cta";
import { PUBLIC_BRAND } from "@/components/public/public-brand";
import { PUBLIC_MOTION } from "@/components/public/public-motion";

const heroContainer = {
  hidden: {},
  visible: {
    transition: {
      delayChildren: 0.14,
      staggerChildren: 0.09,
    },
  },
};

const heroItem = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: PUBLIC_MOTION.duration.reveal,
      ease: PUBLIC_MOTION.ease.enter,
    },
  },
};

export function HomeHero() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="homepage-hero" aria-labelledby="homepage-hero-title">
      <motion.div
        className="homepage-hero__media"
        initial={shouldReduceMotion ? false : { opacity: 0, scale: 1.045 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={shouldReduceMotion ? { duration: 0 } : {
          duration: 1.05,
          ease: PUBLIC_MOTION.ease.enter,
        }}
      >
        <img
          src="/images/kijani-hero.png"
          alt="Secondary students collaborating on a practical renewable-energy project"
          fetchPriority="high"
          decoding="async"
        />
      </motion.div>
      <div className="homepage-hero__wash" aria-hidden="true" />
      <div className="homepage-hero__depth-plane" aria-hidden="true" />

      <motion.div
        className="homepage-hero__content public-container"
        variants={heroContainer}
        initial={shouldReduceMotion ? false : "hidden"}
        animate="visible"
      >
        <motion.p className="homepage-eyebrow homepage-eyebrow--light" variants={heroItem}>
          Nursery · Primary · Secondary
        </motion.p>
        <motion.h1 id="homepage-hero-title" variants={heroItem}>
          Every beginning
          <span>opens a wider world.</span>
        </motion.h1>
        <motion.p className="homepage-hero__lead" variants={heroItem}>
          One connected school journey where care becomes curiosity, curiosity becomes confidence,
          and every learner is prepared for what comes next.
        </motion.p>
        <motion.div className="homepage-hero__actions" variants={heroItem}>
          <PublicCta to="/about" variant="primary" showArrow>Explore our school</PublicCta>
          <PublicCta to="/admissions/visit" variant="secondary" showArrow>Plan a visit</PublicCta>
        </motion.div>
      </motion.div>

      <motion.nav
        className="homepage-hero__stage-nav"
        aria-label="Explore school stages"
        initial={shouldReduceMotion ? false : { opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={shouldReduceMotion ? { duration: 0 } : {
          delay: 0.46,
          duration: PUBLIC_MOTION.duration.reveal,
          ease: PUBLIC_MOTION.ease.enter,
        }}
      >
        <span className="homepage-hero__stage-intro">Your learning journey</span>
        {PUBLIC_BRAND.stages.map((stage, index) => (
          <Link
            className={`homepage-hero__stage-link stage-accent--${stage.tone}`}
            key={stage.label}
            to={stage.href}
          >
            <span>0{index + 1}</span>
            <strong>{stage.label}</strong>
            <ArrowRight aria-hidden="true" />
          </Link>
        ))}
      </motion.nav>

      <a className="homepage-hero__scroll" href="#school-story">
        <span>Begin the journey</span>
        <ArrowDown aria-hidden="true" />
      </a>
      <div className="homepage-hero__location" aria-label="A connected school community">
        <MapPin aria-hidden="true" />
        <span>{PUBLIC_BRAND.tagline}</span>
      </div>
    </section>
  );
}
