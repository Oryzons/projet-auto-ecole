"use client";

import { motion, useReducedMotion } from "motion/react";

import { LOGO_PATHS, LOGO_VIEWBOX } from "@/lib/logo-paths";
import { cn } from "@/lib/utils";

/** Marque seule : le « V » de Virage, en `currentColor`. */
export function LogoMark({
  className,
  animated = false,
}: {
  className?: string;
  animated?: boolean;
}) {
  const reduce = useReducedMotion();
  const play = animated && !reduce;
  return (
    <svg viewBox={LOGO_VIEWBOX} className={cn("h-8 w-auto text-primary", className)} aria-hidden>
      {LOGO_PATHS.sails.map((d, index) => (
        <motion.path
          key={index}
          d={d}
          fill="currentColor"
          initial={play ? { opacity: 0, y: 6 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: index * 0.08 }}
        />
      ))}
    </svg>
  );
}

/** Logo complet : le V et le nom, comme dans l'app mobile. */
export function Logo({
  className,
  showText = true,
  tone = "default",
  animated = false,
}: {
  className?: string;
  showText?: boolean;
  tone?: "default" | "inverse";
  animated?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", tone === "inverse" ? "text-white" : "text-[#1c2430]", className)}>
      <LogoMark className={cn("h-7 w-auto", tone === "inverse" && "text-white")} animated={animated} />
      {showText && (
        <span
          className={cn(
            "-mt-0.5 text-[22px] font-extrabold tracking-[-0.03em]",
            tone === "inverse" ? "text-white" : "text-foreground",
          )}
        >
          virage
        </span>
      )}
    </span>
  );
}
