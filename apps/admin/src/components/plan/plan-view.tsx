"use client";

import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { FlaskConical, ListPlus, UserPlus } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

import { EASE_OUT } from "@/components/motion/tokens";
import { TaskFormDialog, type TaskDefaults } from "@/components/tasks/task-form-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { ZONE_IDS, type PlanData, type ZoneId } from "@/lib/plan-types";
import { cn } from "@/lib/utils";

import { IsoPlan, type IsoPlanHandle } from "./iso-plan";
import { TONE_CLASS } from "./tones";
import { ZONE_ICONS } from "./zone-icons";
import { ZonePanel } from "./zone-panel";

const PANEL_WIDTH = 404;

function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => true,
  );
}

const isZone = (value: string | null): value is ZoneId => Boolean(value && (ZONE_IDS as readonly string[]).includes(value));

/** Écran principal : le plan de l'auto-école, ses indicateurs et le panneau de la zone choisie. */
export function PlanView({ initial }: { initial: PlanData }) {
  const { data } = useQuery({
    queryKey: ["plan"],
    queryFn: async () => {
      const res = await fetch("/api/plan");
      if (!res.ok) throw new Error("Chargement impossible");
      return (await res.json()) as PlanData;
    },
    initialData: initial,
    refetchInterval: 30_000,
  });
  const reduce = useReducedMotion() ?? false;
  const desktop = useMediaQuery("(min-width: 768px)");
  const planRef = useRef<IsoPlanHandle>(null);
  const [selected, setSelected] = useState<ZoneId | null>(null);
  const [taskDialog, setTaskDialog] = useState<TaskDefaults | null>(null);

  // ?zone=… ouvre directement une zone (lien partageable, retour arrière)
  useEffect(() => {
    const zone = new URLSearchParams(window.location.search).get("zone");
    if (isZone(zone)) setSelected(zone);
  }, []);

  const select = useCallback((id: ZoneId | null) => {
    setSelected(id);
    const url = new URL(window.location.href);
    if (id) url.searchParams.set("zone", id);
    else url.searchParams.delete("zone");
    window.history.replaceState(window.history.state, "", url);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && selected && !document.querySelector("[role=dialog]")) select(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, select]);

  const zone = data.zones.find((z) => z.id === selected) ?? null;
  const today = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="flex flex-col gap-4">
      {/* en-tête */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.08em] text-primary uppercase">{today}</p>
          <h1 className="mt-1 flex flex-wrap items-center gap-2.5 text-[26px] font-semibold tracking-[-0.03em] text-foreground sm:text-[30px]">
            Vue d&apos;ensemble
            <span
              title="Les chiffres viennent d'une base de démonstration en mémoire, remise à zéro à chaque redémarrage du serveur."
              className="inline-flex h-6 items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 text-[11.5px] font-semibold tracking-normal text-amber-800"
            >
              <FlaskConical className="size-3" /> Données de démonstration
            </span>
          </h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setTaskDialog({ category: "ADMIN" })}>
            <ListPlus /> Nouvelle tâche
          </Button>
          <Link href="/admin/applications?create=1" className={buttonVariants()}>
            <UserPlus /> Nouveau dossier
          </Link>
        </div>
      </div>

      {/* indicateurs clés, reliés aux zones du plan */}
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {data.kpis.map((kpi) => {
          const body = (
            <>
              <span className="flex items-center gap-1.5 text-xs whitespace-nowrap text-muted-foreground">
                <span className={cn("size-1.5 shrink-0 rounded-full", TONE_CLASS[kpi.tone].dot)} />
                {kpi.label}
              </span>
              <span className={cn("mt-0.5 block text-[22px] font-semibold tracking-[-0.02em] tabular-nums", kpi.tone === "danger" || kpi.tone === "warning" ? TONE_CLASS[kpi.tone].text : "text-foreground")}>
                {kpi.value}
              </span>
            </>
          );
          const className = "min-w-[132px] flex-1 rounded-2xl border border-border bg-card px-3.5 py-2.5 transition-colors";
          return kpi.href ? (
            <Link key={kpi.label} href={kpi.href} className={cn(className, "hover:border-primary/30 hover:bg-primary-soft/30")}>
              {body}
            </Link>
          ) : (
            <div key={kpi.label} className={className}>
              {body}
            </div>
          );
        })}
      </div>

      {/* plan */}
      <div className="relative h-[clamp(420px,calc(100svh-19rem),900px)] overflow-hidden rounded-3xl border border-border bg-[radial-gradient(120%_90%_at_50%_20%,#ffffff_0%,#eef1f6_70%)] max-md:h-[min(52svh,380px)]">
        <IsoPlan
          ref={planRef}
          zones={data.zones}
          selected={selected}
          onSelect={select}
          insetRight={desktop && zone ? PANEL_WIDTH + 12 : 0}
          insetBottom={desktop ? 60 : 0}
          reducedMotion={reduce}
        />

        {/* légende */}
        <div className="pointer-events-none absolute top-3 left-3 hidden items-center gap-3 rounded-full border border-white/70 bg-white/75 px-3 py-1.5 text-[11.5px] font-medium text-muted-foreground shadow-sm backdrop-blur-md sm:flex">
          {(
            [
              ["danger", "Alerte"],
              ["warning", "En attente"],
              ["active", "Actif"],
              ["success", "À jour"],
            ] as const
          ).map(([tone, label]) => (
            <span key={tone} className="flex items-center gap-1.5">
              <span className={cn("size-2 rounded-full", TONE_CLASS[tone].dot)} />
              {label}
            </span>
          ))}
        </div>

        {/* navigation par zones (ordinateur) */}
        <nav
          data-plan-control
          aria-label="Zones du plan"
          className={cn(
            "absolute bottom-3 left-[68px] hidden max-w-[calc(100%-84px)] gap-1 overflow-x-auto rounded-2xl border border-white/70 bg-white/80 p-1 shadow-[0_8px_24px_-12px_rgb(20_32_60/0.35)] backdrop-blur-md transition-[max-width] duration-300 md:flex no-scrollbar",
            zone && "max-w-[calc(100%-84px-416px)]",
          )}
        >
          {data.zones.map((z) => {
            const Icon = ZONE_ICONS[z.id];
            const active = z.id === selected;
            return (
              <button
                key={z.id}
                type="button"
                onClick={() => select(active ? null : z.id)}
                aria-pressed={active}
                className={cn(
                  "relative flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-2.5 text-[12.5px] font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none",
                  active ? "bg-primary text-white" : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                {z.title}
                {(z.tone === "danger" || z.tone === "warning") && !active && <span className={cn("size-1.5 rounded-full", TONE_CLASS[z.tone].dot)} />}
              </button>
            );
          })}
        </nav>

        {/* panneau de la zone (ordinateur) */}
        <AnimatePresence>
          {zone && desktop && (
            <motion.aside
              key="panel"
              data-plan-control
              aria-label={`Zone ${zone.title}`}
              initial={{ opacity: 0, x: reduce ? 0 : 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: reduce ? 0 : 24 }}
              transition={{ duration: 0.28, ease: EASE_OUT }}
              style={{ width: PANEL_WIDTH }}
              className="absolute top-3 right-3 bottom-3 overflow-hidden rounded-2xl border border-white/80 bg-white/90 shadow-[0_24px_60px_-24px_rgb(20_32_60/0.45)] backdrop-blur-xl"
            >
              <ZonePanel zone={zone} onClose={() => select(null)} onCreateTask={(category) => setTaskDialog({ category })} />
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* navigation par zones (téléphone) : liste interactive sous le plan */}
      <div className="grid grid-cols-2 gap-2 md:hidden">
        {data.zones.map((z) => {
          const Icon = ZONE_ICONS[z.id];
          return (
            <button
              key={z.id}
              type="button"
              onClick={() => select(z.id)}
              className="flex items-center gap-2.5 rounded-2xl border border-border bg-card px-3 py-2.5 text-left active:scale-[0.98]"
            >
              <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl", TONE_CLASS[z.tone === "neutral" ? "active" : z.tone].soft)}>
                <Icon className="size-4" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-semibold text-foreground">{z.title}</span>
                <span className={cn("block truncate text-xs", z.tone === "danger" || z.tone === "warning" ? TONE_CLASS[z.tone].text : "text-muted-foreground")}>
                  {z.count} {z.countLabel}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* panneau de la zone (téléphone) : feuille qui monte du bas */}
      <AnimatePresence>
        {zone && !desktop && (
          <>
            <motion.div
              key="backdrop"
              className="fixed inset-0 z-40 bg-ink/25"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => select(null)}
            />
            <motion.aside
              key="sheet"
              aria-label={`Zone ${zone.title}`}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.32, ease: EASE_OUT }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 120 || info.velocity.y > 600) select(null);
              }}
              className="fixed inset-x-0 bottom-0 z-50 flex h-[82svh] flex-col overflow-hidden rounded-t-3xl bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-20px_50px_-20px_rgb(20_32_60/0.4)]"
            >
              <div className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-slate-200" aria-hidden />
              <div className="min-h-0 flex-1">
                <ZonePanel zone={zone} onClose={() => select(null)} onCreateTask={(category) => setTaskDialog({ category })} />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <TaskFormDialog open={Boolean(taskDialog)} onOpenChange={(open) => !open && setTaskDialog(null)} defaults={taskDialog ?? undefined} />
    </div>
  );
}
