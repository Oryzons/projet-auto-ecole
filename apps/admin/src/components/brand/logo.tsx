"use client";

import { motion, useReducedMotion } from "motion/react";
import { useId } from "react";

import { LOGO_ROAD, LOGO_VIEWBOX } from "@/lib/logo-paths";
import { cn } from "@/lib/utils";

/** Marque seule : la tuile bleue et sa route en virage. `inverse` : tuile blanche, route bleue. */
export function LogoMark({
  className,
  animated = false,
  inverse = false,
}: {
  className?: string;
  animated?: boolean;
  inverse?: boolean;
}) {
  const reduce = useReducedMotion();
  const play = animated && !reduce;
  const id = useId();
  const tile = inverse ? "#ffffff" : `url(#${id}-g)`;
  const edge = inverse ? "#2d50f5" : "#ffffff";
  const dash = inverse ? "#ffffff" : "#2d50f5";
  return (
    <svg viewBox={LOGO_VIEWBOX} className={cn("size-8 shrink-0", className)} aria-hidden>
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4f6fff" />
          <stop offset="1" stopColor="#2140d8" />
        </linearGradient>
        <clipPath id={`${id}-c`}>
          <rect width="32" height="32" rx="9" />
        </clipPath>
      </defs>
      <rect width="32" height="32" rx="9" fill={tile} />
      <g clipPath={`url(#${id}-c)`}>
        <motion.path
          d={LOGO_ROAD}
          stroke={edge}
          strokeWidth={7.5}
          fill="none"
          initial={play ? { pathLength: 0 } : false}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.path
          d={LOGO_ROAD}
          stroke={dash}
          strokeWidth={1.3}
          fill="none"
          strokeDasharray="2.4 2.4"
          initial={play ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: play ? 0.6 : 0 }}
        />
      </g>
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
      <LogoMark className="size-8" animated={animated} inverse={tone === "inverse"} />
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
