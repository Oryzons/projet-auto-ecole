"use client";

import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type HTMLMotionProps,
} from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";

import { cn } from "@/lib/utils";
import { DURATION, EASE_OUT } from "./tokens";

export * from "./tokens";

type Direction = "up" | "down" | "left" | "right" | "none";

function offset(direction: Direction, distance: number) {
  switch (direction) {
    case "up":
      return { y: distance };
    case "down":
      return { y: -distance };
    case "left":
      return { x: distance };
    case "right":
      return { x: -distance };
    default:
      return {};
  }
}

/** Apparition douce (fondu + léger glissement). */
export function FadeIn({
  children,
  className,
  delay = 0,
  direction = "up",
  distance = 12,
  duration = DURATION.slow,
  ...props
}: HTMLMotionProps<"div"> & {
  delay?: number;
  direction?: Direction;
  distance?: number;
  duration?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, ...(reduce ? {} : offset(direction, distance)) }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration, delay, ease: EASE_OUT }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

const staggerContainer = (stagger: number, delay: number) => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren: delay } },
});

/** Conteneur dont les enfants <StaggerItem> apparaissent en cascade. */
export function Stagger({
  children,
  className,
  stagger = 0.06,
  delay = 0,
  as = "div",
  ...props
}: HTMLMotionProps<"div"> & {
  stagger?: number;
  delay?: number;
  as?: "div" | "ul" | "ol" | "section";
}) {
  const Component = motion[as] as typeof motion.div;
  return (
    <Component
      className={className}
      variants={staggerContainer(stagger, delay)}
      initial="hidden"
      animate="show"
      {...props}
    >
      {children}
    </Component>
  );
}

export function StaggerItem({
  children,
  className,
  distance = 14,
  as = "div",
  ...props
}: HTMLMotionProps<"div"> & { distance?: number; as?: "div" | "li" | "section" | "article" }) {
  const reduce = useReducedMotion();
  const Component = motion[as] as typeof motion.div;
  return (
    <Component
      className={className}
      variants={{
        hidden: { opacity: 0, y: reduce ? 0 : distance },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: DURATION.slow, ease: EASE_OUT },
        },
      }}
      {...props}
    >
      {children}
    </Component>
  );
}

/** Nombre qui s'anime jusqu'à sa valeur (compteurs des tableaux de bord). */
export function AnimatedNumber({
  value,
  format = (n) => Math.round(n).toLocaleString("fr-FR"),
  duration = 1.1,
  className,
}: {
  value: number;
  format?: (value: number) => string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  const motionValue = useMotionValue(0);
  const display = useTransform(motionValue, (latest) => format(latest));

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      motionValue.set(value);
      return;
    }
    const controls = animate(motionValue, value, { duration, ease: EASE_OUT });
    return () => controls.stop();
  }, [inView, value, duration, reduce, motionValue]);

  return (
    <motion.span ref={ref} className={cn("tabular", className)}>
      {display}
    </motion.span>
  );
}

/** Barre de progression animée. */
export function ProgressBar({
  value,
  className,
  barClassName,
  label,
}: {
  value: number;
  className?: string;
  barClassName?: string;
  label?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-secondary", className)}
    >
      <motion.div
        className={cn("h-full rounded-full bg-primary", barClassName)}
        initial={{ width: 0 }}
        animate={{ width: `${clamped}%` }}
        transition={{ duration: 0.9, ease: EASE_OUT, delay: 0.1 }}
      />
    </div>
  );
}

/** Anneau de progression (avancement du dossier). */
export function ProgressRing({
  value,
  size = 120,
  stroke = 10,
  className,
  children,
}: {
  value: number;
  size?: number;
  stroke?: number;
  className?: string;
  children?: ReactNode;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("relative inline-grid place-items-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-primary-soft"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          className="text-primary"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - clamped / 100) }}
          transition={{ duration: 1.2, ease: EASE_OUT, delay: 0.15 }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}
