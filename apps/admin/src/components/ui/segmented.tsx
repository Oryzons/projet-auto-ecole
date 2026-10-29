"use client";

import { motion } from "motion/react";
import { useId } from "react";

import { SPRING } from "@/components/motion/tokens";
import { cn } from "@/lib/utils";

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
  count?: number;
};

/** Sélecteur à onglets avec pastille animée. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
  size = "default",
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  size?: "default" | "sm";
}) {
  const id = useId();
  return (
    <div
      role="tablist"
      className={cn(
        "no-scrollbar inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-xl border border-border bg-secondary/70 p-1",
        className,
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "relative inline-flex shrink-0 items-center gap-1.5 rounded-[9px] font-medium whitespace-nowrap transition-colors duration-200",
              size === "sm" ? "h-7 px-2.5 text-xs" : "h-8 px-3 text-[13px]",
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {active && (
              <motion.span
                layoutId={`segmented-${id}`}
                className="absolute inset-0 rounded-[9px] bg-card shadow-[0_1px_2px_rgb(15_40_84/0.08),0_1px_6px_-1px_rgb(15_40_84/0.08)]"
                transition={SPRING}
              />
            )}
            <span className="relative">{option.label}</span>
            {option.count !== undefined && (
              <span
                className={cn(
                  "relative rounded-full px-1.5 text-[11px] tabular-nums",
                  active ? "bg-primary-soft text-primary-strong" : "bg-border/70 text-muted-foreground",
                )}
              >
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
