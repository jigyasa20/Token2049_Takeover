"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

// Headline: each word rises out of a mask, one after another, on page load.
export function RevealHeadline({ text, className, accent }: { text: string; className?: string; accent?: string[] }) {
  const words = text.split(" ");
  return (
    <h1 className={className} aria-label={text}>
      {words.map((w, i) => (
        <span key={i} aria-hidden className="inline-block overflow-hidden pb-[0.08em] align-bottom">
          <motion.span
            className={`inline-block ${accent?.includes(w) ? "italic text-accent" : ""}`}
            initial={{ y: "110%" }}
            animate={{ y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 + i * 0.07 }}
          >
            {w}
          </motion.span>
          {i < words.length - 1 && " "}
        </span>
      ))}
    </h1>
  );
}

// Sections: a small one-time fade-up as they scroll into view.
export function Reveal({ children, className, id }: { children: React.ReactNode; className?: string; id?: string }) {
  return (
    <motion.div
      id={id}
      className={className}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

// Callout strip: the two lines drift in opposite directions as you scroll past.
export function CalloutStrip({ title, sub }: { title: string; sub: string }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const x1 = useTransform(scrollYProgress, [0, 1], ["4%", "-4%"]);
  const x2 = useTransform(scrollYProgress, [0, 1], ["-4%", "4%"]);

  return (
    <section ref={ref} className="mt-16 overflow-hidden bg-accent py-14 text-center sm:py-20">
      {/* One line each, always: the font size shrinks with the viewport so neither wraps. */}
      <motion.p
        style={{ x: x1, fontSize: "clamp(1.05rem, 5.1vw, 4rem)" }}
        className="whitespace-nowrap px-4 font-display leading-[1.1] text-canvas"
      >
        {title}
      </motion.p>
      <motion.p
        style={{ x: x2, fontSize: "clamp(0.85rem, 4.2vw, 2.5rem)" }}
        className="mt-3 whitespace-nowrap px-4 font-display italic leading-tight text-highlight"
      >
        {sub}
      </motion.p>
    </section>
  );
}
