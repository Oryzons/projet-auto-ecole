"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

import { EASE_OUT } from "@/components/motion/tokens";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  className,
  compact = false,
}: {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
  className?: string;
  /** Sur téléphone : grand titre seul, sans surtitre ni paragraphe. */
  compact?: boolean;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.header
      initial={{ opacity: 0, y: reduce ? 0 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE_OUT }}
      className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}
    >
      <div className="min-w-0 space-y-1.5">
        {eyebrow && (
          <p className={cn("text-xs font-semibold tracking-[0.08em] text-primary uppercase", compact && "max-lg:hidden")}>
            {eyebrow}
          </p>
        )}
        <h1
          className={cn(
            "text-[26px] leading-tight font-semibold tracking-[-0.025em] text-foreground sm:text-[28px]",
            compact && "max-lg:text-[30px] max-lg:leading-none max-lg:tracking-[-0.035em]",
          )}
        >
          {title}
        </h1>
        {description && (
          <p className={cn("max-w-2xl text-[15px] leading-relaxed text-muted-foreground", compact && "max-lg:hidden")}>
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </motion.header>
  );
}
