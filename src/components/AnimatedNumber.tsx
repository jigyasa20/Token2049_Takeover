"use client";

import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { useEffect } from "react";
import { formatUsd } from "@/data/spots";

// Counts smoothly to the new value whenever it changes (e.g. a new top bid).
export function AnimatedUsd({ value, className }: { value: number; className?: string }) {
  const mv = useMotionValue(value);
  const text = useTransform(mv, (v) => formatUsd(Math.round(v)));

  useEffect(() => {
    const controls = animate(mv, value, { duration: 0.8, ease: "easeOut" });
    return () => controls.stop();
  }, [mv, value]);

  return <motion.span className={className}>{text}</motion.span>;
}
