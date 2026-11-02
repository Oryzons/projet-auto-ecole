"use client";

import type { ReactNode } from "react";

import { AnimatedNumber } from "@/components/motion";
import { cn, formatCurrency } from "@/lib/utils";

const FORMATS = {
  number: (n: number) => Math.round(n).toLocaleString("fr-FR"),
  /** Valeur en centimes. */
  currency: (n: number) => formatCurrency(Math.round(n)),
  percent: (n: number) => `${Math.round(n)} %`,
};

export function StatCard({
  label,
  value,
  format = "number",
  icon,
  hint,
  tone = "default",
  className,
}: {
  label: string;
  value: number;
  format?: keyof typeof FORMATS;
  /** Icône déjà rendue (ex. <Wallet />), pour rester utilisable depuis un composant serveur. */
  icon?: ReactNode;
  hint?: ReactNode;
  tone?: "default" | "primary";
  className?: string;
}) {
  const primary = tone === "primary";
  return (
    <div
      className={cn(
        "group relative flex flex-col gap-4 overflow-hidden rounded-2xl border p-5 transition-[box-shadow,transform] duration-300 ease-out hover:-translate-y-0.5",
        primary
          ? "border-transparent bg-gradient-to-br from-primary to-primary-strong text-white shadow-primary hover:shadow-[0_18px_40px_-16px_rgb(30_111_217/0.7)]"
          : "border-border bg-card shadow-card hover:shadow-raised",
        className,
      )}
    >
      {primary && (
        <svg
          className="pointer-events-none absolute -right-8 -bottom-6 h-24 w-56 text-white/10"
          viewBox="0 0 200 60"
          fill="none"
          aria-hidden
        >
          <path d="M0 30 C 25 15 50 45 75 30 C 100 15 125 45 150 30 C 175 15 200 45 225 30" stroke="currentColor" strokeWidth="10" strokeLinecap="round" />
        </svg>
      )}
      <div className="flex items-center justify-between gap-3">
        <p className={cn("text-[13px] font-medium", primary ? "text-white/80" : "text-muted-foreground")}>{label}</p>
        {icon && (
          <span
            className={cn(
              "grid size-9 place-items-center rounded-xl [&_svg]:size-[18px]",
              primary ? "bg-white/15 text-white" : "bg-primary-soft text-primary",
            )}
          >
            {icon}
          </span>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-[28px] leading-none font-semibold tracking-[-0.03em]">
          <AnimatedNumber value={value} format={FORMATS[format]} />
        </p>
        {hint && (
          <p className={cn("text-xs", primary ? "text-white/75" : "text-muted-foreground")}>{hint}</p>
        )}
      </div>
    </div>
  );
}
