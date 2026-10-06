import type { Transition, Variants } from "framer-motion";

export const PUBLIC_MOTION = {
  duration: {
    instant: 0.12,
    fast: 0.18,
    standard: 0.28,
    reveal: 0.52,
    image: 0.72,
  },
  ease: {
    standard: [0.22, 1, 0.36, 1],
    enter: [0.16, 1, 0.3, 1],
    exit: [0.4, 0, 1, 1],
  },
} as const;

export const publicTransition: Transition = {
  duration: PUBLIC_MOTION.duration.standard,
  ease: PUBLIC_MOTION.ease.standard,
};

export const publicEntrance: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: PUBLIC_MOTION.duration.reveal, ease: PUBLIC_MOTION.ease.enter } },
};

export const publicSubtleReveal: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: publicTransition },
};

export const publicImageReveal: Variants = {
  hidden: { opacity: 0, scale: 1.025 },
  visible: { opacity: 1, scale: 1, transition: { duration: PUBLIC_MOTION.duration.image, ease: PUBLIC_MOTION.ease.enter } },
};

export const publicDropdownTransition: Variants = {
  hidden: { opacity: 0, y: -8 },
  visible: { opacity: 1, y: 0, transition: { duration: PUBLIC_MOTION.duration.fast, ease: PUBLIC_MOTION.ease.enter } },
  exit: { opacity: 0, y: -5, transition: { duration: PUBLIC_MOTION.duration.instant, ease: PUBLIC_MOTION.ease.exit } },
};

export const publicMobileMenuTransition: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0, transition: { duration: PUBLIC_MOTION.duration.standard, ease: PUBLIC_MOTION.ease.enter } },
  exit: { opacity: 0, x: 12, transition: { duration: PUBLIC_MOTION.duration.fast, ease: PUBLIC_MOTION.ease.exit } },
};

export function withoutPublicMotion(shouldReduce: boolean | null) {
  return shouldReduce ? { duration: 0 } : undefined;
}

