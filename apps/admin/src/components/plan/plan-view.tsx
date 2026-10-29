"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { FlaskConical, ListPlus, Move, Search, UserPlus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";

import { useDraggable } from "@/hooks/use-draggable";
import { INTRO_FLAG } from "@/lib/intro";
import { Logo } from "@/components/brand/logo";
import { EASE_OUT } from "@/components/motion/tokens";
import { CommandMenu } from "@/components/shell/command-menu";
import { Launcher } from "@/components/shell/launcher";
import { useNavPath } from "@/components/shell/navigation-progress";
import { NotificationsMenu } from "@/components/shell/notifications-menu";
import { PLAN_PATH } from "@/components/shell/page-popup";
import { UserMenu } from "@/components/shell/user-menu";
import { TaskFormDialog, type TaskDefaults } from "@/components/tasks/task-form-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { ZONE_IDS, type PlanData, type ZoneId } from "@/lib/plan-types";
import { cn } from "@/lib/utils";

import { IsoPlan, type IsoPlanHandle } from "./iso-plan";
import { TONE_CLASS } from "./tones";
import { ZONE_ICONS } from "./zone-icons";
import { ZonePanel } from "./zone-panel";

const PANEL_WIDTH = 404;
/** Place laissée à la légende, en bas à droite, à côté de la barre des zones. */
const LEGEND_SPACE = 312;

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
  const wide = useMediaQuery("(min-width: 1024px)");
  const planRef = useRef<IsoPlanHandle>(null);
  const [selected, setSelected] = useState<ZoneId | null>(null);
  const [taskDialog, setTaskDialog] = useState<TaskDefaults | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();
  const onPlan = pathname === PLAN_PATH;
  // dès le clic vers une fenêtre, le plan se fige : le processeur sert à afficher la fenêtre
  const navPath = useNavPath();
  const queryClient = useQueryClient();
  const rootRef = useRef<HTMLDivElement>(null);
  // le panneau de zone se déplace comme les fenêtres ; il revient à droite à chaque ouverture
  const panelDrag = useDraggable<HTMLDivElement>(selected !== null);

  // juste après la connexion : le plan est déjà en place, tout le reste arrive autour (avant la première image)
  useLayoutEffect(() => {
    let intro = false;
    try {
      intro = sessionStorage.getItem(INTRO_FLAG) === "1";
      sessionStorage.removeItem(INTRO_FLAG);
    } catch {}
    const root = rootRef.current;
    if (!intro || !root) return;
    root.dataset.intro = "";
    const timer = window.setTimeout(() => delete root.dataset.intro, 1800);
    return () => window.clearTimeout(timer);
  }, []);

  // en revenant d'une fenêtre, les chiffres du plan tiennent compte de ce qui vient d'être fait
  useEffect(() => {
    if (onPlan) void queryClient.invalidateQueries({ queryKey: ["plan"] });
  }, [onPlan, queryClient]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ?zone=… ouvre directement une zone (lien partageable, retour arrière)
  useEffect(() => {
    const zone = new URLSearchParams(window.location.search).get("zone");
    if (isZone(zone)) setSelected(zone);
  }, []);

  const select = useCallback((id: ZoneId | null) => {
    setSelected(id);
    if (window.location.pathname !== PLAN_PATH) return;
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

  const kpiStrip = (
    <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
      {data.kpis.map((kpi) => {
        const body = (
          <>
            <span className={cn("size-1.5 shrink-0 rounded-full", TONE_CLASS[kpi.tone].dot)} />
            <span className="text-muted-foreground">{kpi.label}</span>
            <span className={cn("font-semibold tabular-nums", kpi.tone === "danger" || kpi.tone === "warning" ? TONE_CLASS[kpi.tone].text : "text-foreground")}>{kpi.value}</span>
          </>
        );
        const className =
          "flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-white/80 bg-white/95 px-3 text-[12.5px] whitespace-nowrap shadow-[0_6px_18px_-12px_rgb(20_32_60/0.4)] transition-colors";
        return kpi.href ? (
          <Link key={kpi.label} href={kpi.href} data-plan-control className={cn(className, "hover:border-primary/30 hover:bg-white")}>
            {body}
          </Link>
        ) : (
          <div key={kpi.label} className={className}>
            {body}
          </div>
        );
      })}
    </div>
  );

  return (
    <div ref={rootRef} className="relative h-full overflow-hidden bg-[radial-gradient(120%_90%_at_50%_35%,#ffffff_0%,#eceff5_75%)]">
      <IsoPlan
        ref={planRef}
        zones={data.zones}
        selected={selected}
        onSelect={select}
        insetRight={desktop && zone ? PANEL_WIDTH + 24 : 0}
        insetTop={desktop ? 112 : 96}
        insetBottom={desktop ? 64 : 60}
        homeZoom={desktop ? 1 : 1.45}
        reducedMotion={reduce}
        paused={!onPlan || navPath !== PLAN_PATH}
      />

      {/* en-tête flottant : titre, actions et indicateurs clés */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 flex flex-col gap-2.5 bg-gradient-to-b from-[#f6f7fb] from-40% to-transparent p-3 pb-6 transition-[padding] duration-300 sm:p-4 sm:pb-8"
        style={{ paddingRight: desktop && zone ? PANEL_WIDTH + 28 : undefined }}
      >
        <div className="intro-top flex items-center gap-2" style={{ "--intro-delay": "120ms" } as React.CSSProperties}>
          <Logo showText={false} className="pointer-events-auto mr-1 shrink-0" />
          <h1 className="truncate text-[20px] font-semibold tracking-[-0.03em] text-foreground sm:text-[24px]">Vue d&apos;ensemble</h1>
          <span className="hidden text-[13px] font-medium text-muted-foreground first-letter:uppercase xl:inline">{today}</span>
          <span
            title="Les chiffres viennent d'une base de démonstration en mémoire, remise à zéro à chaque redémarrage du serveur."
            className="pointer-events-auto inline-flex h-6 items-center gap-1 rounded-full border border-amber-200 bg-amber-50/90 px-2.5 text-[11.5px] font-semibold text-amber-800"
          >
            <FlaskConical className="size-3" /> Démo
          </span>
          <div className="pointer-events-auto ml-auto flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Rechercher"
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-white/95 px-2.5 text-[13px] text-muted-foreground shadow-xs transition-colors hover:border-primary/30 hover:bg-white lg:w-56"
            >
              <Search className="size-4" />
              <span className="flex-1 text-left max-lg:hidden">Rechercher un élève…</span>
              <kbd className="rounded-md border border-border bg-secondary px-1.5 text-[11px] font-medium max-lg:hidden">⌘K</kbd>
            </button>
            <Button variant="outline" size="sm" className="h-9 bg-white/95 max-md:hidden" onClick={() => setTaskDialog({ category: "ADMIN" })}>
              <ListPlus /> <span className="max-xl:hidden">Nouvelle tâche</span>
            </Button>
            <Link href="/admin/applications?create=1" className={cn(buttonVariants({ size: "sm" }), "h-9")} aria-label="Nouveau dossier">
              <UserPlus /> <span className="max-xl:hidden">Nouveau dossier</span>
            </Link>
            <Launcher />
            <NotificationsMenu className="max-sm:hidden" />
            <UserMenu compact />
          </div>
        </div>
        <div className="intro-top pointer-events-auto -mx-3 px-3 sm:mx-0 sm:px-0" style={{ "--intro-delay": "240ms" } as React.CSSProperties}>
          {kpiStrip}
        </div>
      </div>

      {/* légende */}
      <div
        className={cn(
          "intro-right pointer-events-none absolute right-3 bottom-3 hidden h-[46px] items-center gap-3.5 rounded-2xl border border-white/70 bg-white/95 px-4 text-[12px] font-medium text-muted-foreground shadow-[0_8px_24px_-12px_rgb(20_32_60/0.35)] transition-opacity duration-200 lg:flex",
          zone && "opacity-0",
        )}
      >
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

      {/* navigation par zones */}
      <nav
        data-plan-control
        aria-label="Zones du plan"
        className="intro-bottom no-scrollbar absolute bottom-3 left-3 flex gap-1 overflow-x-auto rounded-2xl border border-white/70 bg-white/95 p-1 shadow-[0_8px_24px_-12px_rgb(20_32_60/0.35)] transition-[right] duration-300 max-md:right-3 md:left-[68px]"
        style={{
          right: desktop ? (zone ? PANEL_WIDTH + 28 : wide ? LEGEND_SPACE : 12) : undefined,
          maxWidth: desktop ? "fit-content" : undefined,
          ["--intro-delay" as string]: "320ms",
        }}
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
            className="pointer-events-none absolute top-3 right-3 bottom-3"
          >
            <div
              ref={panelDrag.ref}
              style={panelDrag.style}
              className="pointer-events-auto size-full overflow-hidden rounded-2xl border border-white/80 bg-white/95 shadow-[0_24px_60px_-24px_rgb(20_32_60/0.45)]"
            >
              <ZonePanel
                zone={zone}
                onClose={() => select(null)}
                onCreateTask={(category) => setTaskDialog({ category })}
                dragHandle={
                  <button
                    type="button"
                    {...panelDrag.handleProps}
                    className="-mt-1 grid size-9 shrink-0 cursor-grab touch-none place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground active:cursor-grabbing"
                  >
                    <Move className="size-[18px]" />
                  </button>
                }
              />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

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

      <CommandMenu open={searchOpen} onOpenChange={setSearchOpen} />
      <TaskFormDialog open={Boolean(taskDialog)} onOpenChange={(open) => !open && setTaskDialog(null)} defaults={taskDialog ?? undefined} />
    </div>
  );
}
