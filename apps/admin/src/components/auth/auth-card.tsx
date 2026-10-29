"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

import { EASE_OUT } from "@/components/motion/tokens";

/** En-tête + contenu d'un formulaire d'authentification, avec apparition en cascade. */
export function AuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const reduce = useReducedMotion();
  const item = {
    hidden: { opacity: 0, y: reduce ? 0 : 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT } },
  };
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } } }}
      className="w-full"
    >
      <motion.div variants={item} className="mb-6 space-y-1.5">
        <h1 className="text-[24px] leading-tight font-semibold tracking-[-0.025em] text-foreground">{title}</h1>
        {description && <p className="text-[15px] leading-relaxed text-muted-foreground">{description}</p>}
      </motion.div>
      <motion.div variants={item}>{children}</motion.div>
      {footer && (
        <motion.div variants={item} className="mt-6 text-[13px] text-muted-foreground">
          {footer}
        </motion.div>
      )}
    </motion.div>
  );
}

export function FormAlert({ tone = "danger", children }: { tone?: "danger" | "success" | "info"; children: ReactNode }) {
  const classes = {
    danger: "border-danger/20 bg-danger-soft text-danger",
    success: "border-success/20 bg-success-soft text-success",
    info: "border-primary/15 bg-primary-soft text-primary-strong",
  }[tone];
  return (
    <motion.div
      role={tone === "danger" ? "alert" : "status"}
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3, ease: EASE_OUT }}
      className="overflow-hidden"
    >
      <div className={`mb-4 rounded-xl border px-3.5 py-3 text-sm leading-relaxed ${classes}`}>{children}</div>
    </motion.div>
  );
}
