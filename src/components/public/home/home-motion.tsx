import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef, type ReactNode } from "react";

import {
  PUBLIC_MOTION,
  publicEntrance,
  publicImageReveal,
  withoutPublicMotion,
} from "@/components/public/public-motion";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

export function HomeReveal({ children, className, delay = 0 }: RevealProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      variants={publicEntrance}
      initial={shouldReduceMotion ? false : "hidden"}
      whileInView="visible"
      viewport={{ once: true, amount: 0.16 }}
      transition={shouldReduceMotion ? { duration: 0 } : { delay }}
    >
      {children}
    </motion.div>
  );
}

type ParallaxImageProps = {
  src: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  loading?: "eager" | "lazy";
  fetchPriority?: "high" | "low" | "auto";
};

export function ParallaxImage({
  src,
  alt,
  className,
  imageClassName,
  loading = "lazy",
  fetchPriority = "auto",
}: ParallaxImageProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: frameRef,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [-24, 24]);

  return (
    <motion.div
      ref={frameRef}
      className={className}
      variants={publicImageReveal}
      initial={shouldReduceMotion ? false : "hidden"}
      whileInView="visible"
      viewport={{ once: true, amount: 0.12 }}
      transition={withoutPublicMotion(shouldReduceMotion)}
    >
      <motion.img
        className={imageClassName}
        src={src}
        alt={alt}
        loading={loading}
        fetchPriority={fetchPriority}
        decoding="async"
        style={{ y: shouldReduceMotion ? 0 : y }}
        transition={{ duration: PUBLIC_MOTION.duration.image, ease: PUBLIC_MOTION.ease.enter }}
      />
    </motion.div>
  );
}
