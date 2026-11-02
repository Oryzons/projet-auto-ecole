"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Briques communes des panneaux du plan (Planning, Espace examens) : même rendu partout. */

export function StatBar({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-3 divide-x divide-border rounded-2xl border border-border bg-card">{children}</div>;
}

export function Stat({ label, value, warn }: { label: string; value: number | string; warn?: boolean }) {
  return (
    <div className="px-3 py-2.5 text-center">
      <p className={cn("text-xl font-semibold tracking-[-0.02em] tabular-nums", warn ? "text-amber-600" : "text-foreground")}>{value}</p>
      <p className="mt-0.5 truncate text-[11.5px] text-muted-foreground">{label}</p>
    </div>
  );
}

export function SectionTitle({ children, count }: { children: ReactNode; count?: number }) {
  return (
    <h3 className="flex items-center justify-between text-xs font-semibold tracking-[0.06em] text-muted-foreground uppercase">
      {children}
      {count !== undefined && <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] tracking-normal tabular-nums">{count}</span>}
    </h3>
  );
}

/** Carte mise en avant : prochaine leçon ou prochain examen (bleu), leçon en cours (vert). */
export function HighlightCard({ href, live, className, children }: { href?: string; live?: boolean; className?: string; children: ReactNode }) {
  const classes = cn(
    "rounded-2xl px-3.5 py-3",
    live ? "block border border-emerald-200/80 bg-emerald-50/60 transition-colors hover:bg-emerald-50" : "bg-primary-soft/60",
    href && !live && "block transition-colors hover:bg-primary-soft",
    className,
  );
  return href ? (
    <Link href={href} className={classes}>
      {children}
    </Link>
  ) : (
    <div className={classes}>{children}</div>
  );
}

/** Ligne d'agenda : colonne horaire à gauche, petit trait de couleur, titre et ligne secondaire. */
export function ScheduleRow({
  href,
  lead,
  leadSub,
  color,
  title,
  subtitle,
  trailing,
  muted,
}: {
  href: string;
  lead: string;
  leadSub?: string;
  color: string;
  title: string;
  subtitle: string;
  trailing?: ReactNode;
  muted?: boolean;
}) {
  return (
    <li>
      <Link href={href} className={cn("group flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-secondary/70", muted && "opacity-60 hover:opacity-100")}>
        <span className="w-11 shrink-0 text-right whitespace-nowrap">
          <span className="block text-[13px] font-semibold text-foreground tabular-nums">{lead}</span>
          {leadSub && <span className="block text-[11px] text-muted-foreground tabular-nums">{leadSub}</span>}
        </span>
        <span className="h-8 w-[3px] shrink-0 rounded-full" style={{ background: color }} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13.5px] font-medium text-foreground">{title}</span>
          <span className="mt-0.5 block truncate text-xs text-muted-foreground">{subtitle}</span>
        </span>
        {trailing}
        <ChevronRight className="size-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
      </Link>
    </li>
  );
}

export function EmptyNote({ children }: { children: ReactNode }) {
  return <p className="mt-2 rounded-xl border border-dashed border-border px-3 py-3 text-center text-[13px] text-muted-foreground">{children}</p>;
}

/** Bandeau ambre en bas du panneau (leçons à reprogrammer, élèves sans date…). */
export function WarningLink({ href, icon, children }: { href: string; icon: ReactNode; children: ReactNode }) {
  return (
    <Link href={href} className="flex items-center gap-2.5 rounded-xl bg-amber-50 px-3.5 py-2.5 text-[13px] text-amber-800 transition-colors hover:bg-amber-100/70">
      {icon}
      <span className="flex-1">{children}</span>
      <ChevronRight className="size-4" />
    </Link>
  );
}
