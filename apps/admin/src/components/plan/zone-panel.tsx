"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, ChevronRight, ListPlus, Plus, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { TaskRow } from "@/components/tasks/task-row";
import { EASE_OUT } from "@/components/motion/tokens";
import { buttonVariants } from "@/components/ui/button";
import { useTaskMutations } from "@/hooks/use-tasks";
import type { PlanItem, PlanZone } from "@/lib/plan-types";
import { ZONE_TASK_CATEGORY } from "@/lib/plan-types";
import { cn } from "@/lib/utils";

import { TONE_CLASS } from "./tones";
import { ZONE_ICONS } from "./zone-icons";

const VISIBLE_ITEMS = 6;

/**
 * Panneau flottant d'une zone : indicateurs, éléments à traiter, tâches.
 * Une ligne ouvre la fiche liée, ou son détail dans le panneau sans quitter le plan.
 */
export function ZonePanel({ zone, onClose, onCreateTask }: { zone: PlanZone; onClose: () => void; onCreateTask: (category: string) => void }) {
  const [detail, setDetail] = useState<PlanItem | null>(null);
  const [showAll, setShowAll] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const Icon = ZONE_ICONS[zone.id];
  const category = ZONE_TASK_CATEGORY[zone.id];

  // changement de zone : on revient en haut de la liste
  useEffect(() => {
    setDetail(null);
    setShowAll(false);
    scrollRef.current?.scrollTo({ top: 0 });
  }, [zone.id]);

  const items = showAll ? zone.items : zone.items.slice(0, VISIBLE_ITEMS);

  return (
    <div className="flex h-full flex-col">
      {/* en-tête */}
      <div className="flex items-start gap-3 border-b border-border/70 px-5 pt-4 pb-4">
        <span className={cn("grid size-11 shrink-0 place-items-center rounded-xl", TONE_CLASS[zone.tone === "neutral" ? "active" : zone.tone].soft)}>
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[17px] font-semibold tracking-[-0.01em] text-foreground">{zone.title}</h2>
          <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">{zone.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer le panneau et revenir au plan"
          className="-mt-1 -mr-2 grid size-9 shrink-0 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none"
        >
          <X className="size-[18px]" />
        </button>
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <AnimatePresence mode="wait" initial={false}>
          {detail?.detail ? (
            <motion.div key="detail" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.2, ease: EASE_OUT }} className="px-5 py-4">
              <button type="button" onClick={() => setDetail(null)} className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-primary hover:underline">
                <ArrowLeft className="size-3.5" /> {zone.title}
              </button>
              <h3 className="text-[15px] font-semibold text-foreground">{detail.detail.title}</h3>
              <dl className="mt-3 divide-y divide-border rounded-xl border border-border">
                {detail.detail.rows.map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-[13px]">
                    <dt className="text-muted-foreground">{row.label}</dt>
                    <dd className={cn("font-medium text-foreground", row.tone && TONE_CLASS[row.tone].text)}>{row.value}</dd>
                  </div>
                ))}
              </dl>
              {detail.detail.note && <p className="mt-3 rounded-xl bg-amber-50 px-3.5 py-2.5 text-[13px] text-amber-800">{detail.detail.note}</p>}
              <TaskList tasks={zone.tasks.filter((t) => t.entityLabel === detail.detail!.title)} title="Tâches liées" emptyText="Aucune tâche ouverte pour ce véhicule." />
            </motion.div>
          ) : (
            <motion.div key="main" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2, ease: EASE_OUT }}>
              {/* indicateurs */}
              <div className="grid grid-cols-2 gap-2 px-5 pt-4">
                {zone.metrics.map((metric) => {
                  const body = (
                    <>
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className={cn("size-1.5 rounded-full", TONE_CLASS[metric.tone].dot)} />
                        {metric.label}
                      </span>
                      <span className={cn("mt-1 block text-xl font-semibold tracking-[-0.02em] tabular-nums", metric.tone === "danger" || metric.tone === "warning" ? TONE_CLASS[metric.tone].text : "text-foreground")}>
                        {metric.value}
                      </span>
                    </>
                  );
                  return metric.href ? (
                    <Link key={metric.label} href={metric.href} className="group rounded-xl border border-border bg-card px-3 py-2.5 transition-colors hover:border-primary/30 hover:bg-primary-soft/40">
                      {body}
                    </Link>
                  ) : (
                    <div key={metric.label} className="rounded-xl border border-border bg-card px-3 py-2.5">
                      {body}
                    </div>
                  );
                })}
              </div>

              {/* éléments de la zone */}
              <section className="px-3 pt-5">
                <h3 className="flex items-center justify-between px-2 text-xs font-semibold tracking-[0.06em] text-muted-foreground uppercase">
                  {zone.itemsTitle}
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] tracking-normal text-muted-foreground tabular-nums">{zone.items.length}</span>
                </h3>
                {zone.items.length === 0 ? (
                  <p className="mx-2 mt-2 rounded-xl border border-dashed border-border px-3 py-4 text-center text-[13px] text-muted-foreground">Rien à signaler ici pour le moment.</p>
                ) : (
                  <ul className="mt-1.5">
                    {items.map((item) => (
                      <li key={item.id}>
                        <ItemRow item={item} onDetail={() => setDetail(item)} />
                      </li>
                    ))}
                  </ul>
                )}
                {zone.items.length > VISIBLE_ITEMS && (
                  <button type="button" onClick={() => setShowAll((v) => !v)} className="mx-2 mt-1 text-[13px] font-medium text-primary hover:underline">
                    {showAll ? "Réduire" : `Afficher les ${zone.items.length} éléments`}
                  </button>
                )}
              </section>

              <TaskList
                tasks={zone.tasks}
                title={zone.id === "accueil" ? "Tâches en retard" : "Tâches de la zone"}
                emptyText={zone.id === "accueil" ? "Aucune tâche en retard." : "Aucune tâche ouverte."}
                category={category}
                onMore={category ? () => onCreateTask(category) : undefined}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="border-t border-border/70 px-5 py-3">
        <Link href={zone.page.href} className={cn(buttonVariants({ variant: "secondary" }), "w-full justify-center")}>
          {zone.page.label} <ArrowRight />
        </Link>
      </div>
    </div>
  );
}

function ItemRow({ item, onDetail }: { item: PlanItem; onDetail: () => void }) {
  const content = (
    <>
      <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", TONE_CLASS[item.tone].dot)} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13.5px] font-medium text-foreground">{item.title}</span>
        <span className="mt-0.5 block truncate text-xs text-muted-foreground">{item.subtitle}</span>
      </span>
      {item.badge && <span className={cn("mt-0.5 shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-semibold", TONE_CLASS[item.tone].soft)}>{item.badge}</span>}
      <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
    </>
  );
  const className = "group flex w-full items-start gap-2.5 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-secondary/70 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none";
  if (item.detail)
    return (
      <button type="button" onClick={onDetail} className={className}>
        {content}
      </button>
    );
  if (item.href)
    return (
      <Link href={item.href} className={className}>
        {content}
      </Link>
    );
  return <div className={className}>{content}</div>;
}

function TaskList({
  tasks,
  title,
  emptyText,
  category,
  onMore,
}: {
  tasks: PlanZone["tasks"];
  title: string;
  emptyText: string;
  category?: string | null;
  onMore?: () => void;
}) {
  return (
    <section className="px-3 pt-5 pb-4">
      <h3 className="flex items-center justify-between px-2 text-xs font-semibold tracking-[0.06em] text-muted-foreground uppercase">
        {title}
        <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] tracking-normal tabular-nums">{tasks.length}</span>
      </h3>
      {tasks.length === 0 && <p className="mx-2 mt-2 text-[13px] text-muted-foreground">{emptyText}</p>}
      <div className="mt-1">
        {tasks.map((task) => (
          <TaskRow key={task.id} task={task} dense />
        ))}
      </div>
      {category && <QuickAdd category={category} onMore={onMore} />}
    </section>
  );
}

/** Ajout rapide : un titre et Entrée, échéance demain soir. */
function QuickAdd({ category, onMore }: { category: string; onMore?: () => void }) {
  const [title, setTitle] = useState("");
  const { create } = useTaskMutations();
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (title.trim().length < 2) return;
    const due = new Date(Date.now() + 86_400_000);
    due.setHours(18, 0, 0, 0);
    create.mutate({ title: title.trim(), category, priority: "NORMAL", dueAt: due.toISOString() }, { onSuccess: () => setTitle("") });
  };
  return (
    <form onSubmit={submit} className="mx-2 mt-2 flex items-center gap-1.5 rounded-xl border border-dashed border-border px-2.5 py-1.5 focus-within:border-primary/50 focus-within:bg-primary-soft/20">
      <Plus className="size-4 shrink-0 text-muted-foreground" />
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Ajouter une tâche…"
        aria-label="Titre de la nouvelle tâche"
        maxLength={140}
        disabled={create.isPending}
        className="h-7 min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground"
      />
      {onMore && (
        <button type="button" onClick={onMore} title="Plus d'options" aria-label="Créer avec plus d'options" className="grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground">
          <ListPlus className="size-4" />
        </button>
      )}
    </form>
  );
}
