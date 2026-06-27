"use client";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";

interface ScrollRevealTextProps {
  text: string;
  className?: string;
  delay?: number;
  tag?: "h1" | "h2" | "h3" | "p";
}

/**
 * ScrollRevealText — splits text into words and animates each in
 * one-by-one as the element enters the viewport.
 */
export default function ScrollRevealText({
  text,
  className = "",
  delay = 0,
  tag: Tag = "h2",
}: ScrollRevealTextProps) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const words = text.split(" ");

  return (
    <Tag ref={ref as any} className={`overflow-hidden ${className}`}>
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden mr-[0.25em]">
          <motion.span
            className="inline-block"
            initial={{ y: "110%", opacity: 0 }}
            animate={inView ? { y: "0%", opacity: 1 } : {}}
            transition={{
              duration: 0.55,
              delay: delay + i * 0.07,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}
