"use client";

import { motion, useReducedMotion } from "motion/react";
import { memo } from "react";

import { PlanMotion } from "@/components/plan/furniture";
import { AisleLife, DRAW_ORDER, Ground, ROOMS, RoomFloor, ZoneArt, sceneBounds } from "@/components/plan/scene";
import { EASE_OUT } from "@/components/motion/tokens";
import { cn } from "@/lib/utils";

const B = sceneBounds();

/** Le plan de l'auto-école, en décor : même scène animée que la vue d'ensemble, sans données ni interaction. */
export const PlanBackdrop = memo(function PlanBackdrop({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      aria-hidden
      className={cn("pointer-events-none select-none", className)}
      initial={{ opacity: 0, scale: reduce ? 1 : 0.96, y: reduce ? 0 : 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.9, ease: EASE_OUT, delay: 0.1 }}
    >
      <svg viewBox={`${B.x} ${B.y} ${B.w} ${B.h}`} className="block size-full" preserveAspectRatio="xMidYMid meet">
        <PlanMotion.Provider value={!reduce}>
          <Ground />
          {DRAW_ORDER.map((id) => (
            <g key={id}>
              <RoomFloor id={id} />
              <ZoneArt id={id} />
              {ROOMS[id].col === 2 && <AisleLife after={ROOMS[id].row as 0 | 1 | 2} />}
            </g>
          ))}
        </PlanMotion.Provider>
      </svg>
    </motion.div>
  );
});
