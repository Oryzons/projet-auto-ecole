"use client";

import { motion, useReducedMotion } from "motion/react";
import { useId } from "react";

import { LOGO_BOTTOM, LOGO_GRADIENT, LOGO_TILE_RADIUS, LOGO_TOP, LOGO_VIEWBOX } from "@virage/shared/brand";
import { cn } from "@/lib/utils";

/** Marque seule : la tuile bleue et le S en deux barres. `inverse` : tuile blanche, S bleu. */
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
  const ink = inverse ? "#2d50f5" : "#ffffff";
  return (
    <svg viewBox={LOGO_VIEWBOX} className={cn("size-8 shrink-0", className)} aria-hidden>
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={LOGO_GRADIENT[0]} />
          <stop offset="1" stopColor={LOGO_GRADIENT[1]} />
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx={LOGO_TILE_RADIUS} fill={tile} />
      {/* les deux voies glissent en place, comme un changement de voie */}
      <motion.path
        d={LOGO_TOP}
        fill={ink}
        initial={play ? { x: -14, opacity: 0 } : false}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.path
        d={LOGO_BOTTOM}
        fill={ink}
        initial={play ? { x: 14, opacity: 0 } : false}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: play ? 0.12 : 0, ease: [0.22, 1, 0.36, 1] }}
      />
    </svg>
  );
}

/** Logo complet : la marque et le nom, comme dans l'app mobile. */
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
          shift
        </span>
      )}
    </span>
  );
}
