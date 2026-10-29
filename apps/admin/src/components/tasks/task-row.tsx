"use client";

import { Check, ChevronDown, CircleDashed, Clock3, Link2 } from "lucide-react";
import Link from "next/link";
import {
  AnimatePresence,
  PresenceContext,
  motion,
  useReducedMotion,
} from "motion/react";
import { useEffect, useState } from "react";

import { EASE_OUT } from "@/components/motion/tokens";
import { TONE_CLASS } from "@/components/plan/tones";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { dueLabel, useTaskMutations } from "@/hooks/use-tasks";
import { TASK_PRIORITY_LABELS, TASK_STATUS_LABELS } from "@/lib/crm";
import { cn } from "@/lib/utils";

export type TaskRowData = {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueAt: string | null;
  assignee: string | null;
  entityLabel: string | null;
  href: string | null;
  /** tous les élèves et véhicules liés (sinon `entityLabel`) */
  links?: { label: string; href: string | null }[];
  description?: string | null;
  category?: string;
};

const STATUS_ICON = {
  TODO: CircleDashed,
  IN_PROGRESS: Clock3,
  DONE: Check,
} as const;

/** Couleur du flash qui traverse la ligne quand le statut change. */
const FLASH = {
  TODO: "bg-slate-200/70",
  IN_PROGRESS: "bg-primary-soft",
  DONE: "bg-emerald-100",
} as const;
const BURST = Array.from({ length: 8 }, (_, i) => (i / 8) * Math.PI * 2);
const SPRING = { type: "spring", stiffness: 520, damping: 22 } as const;

/** Ligne de tâche : case à cocher pour terminer, menu de statut, échéance et élément lié. */
export function TaskRow({
  task,
  dense = false,
  onOpen,
}: {
  task: TaskRowData;
  dense?: boolean;
  onOpen?: () => void;
}) {
  const { update } = useTaskMutations();
  const reduce = useReducedMotion();
  // le nouveau statut s'affiche tout de suite, animé, sans attendre la réponse du serveur
  const [override, setOverride] = useState<string | null>(null);
  const [pulse, setPulse] = useState(0);
  const status = override ?? task.status;
  const done = status === "DONE";
  const progress = status === "IN_PROGRESS";
  const due = dueLabel(task.dueAt, done);
  const urgent = task.priority === "URGENT" || task.priority === "HIGH";
  const animated = pulse > 0 && !reduce;

  useEffect(() => {
    if (override && task.status === override) setOverride(null);
  }, [task.status, override]);

  const setStatus = (next: string) => {
    if (next === status) return;
    setOverride(next);
    setPulse((p) => p + 1);
    update.mutate(
      { id: task.id, patch: { status: next }, previous: status },
      { onError: () => setOverride(null) },
    );
  };

  return (
    <motion.div
      exit={
        reduce
          ? { opacity: 0 }
          : {
              opacity: 0,
              height: 0,
              transition: { duration: 0.28, ease: EASE_OUT },
            }
      }
      className="overflow-hidden"
    >
      {/* les lignes déjà là au chargement ne doivent pas transmettre « pas d'animation d'entrée » à leurs effets */}
      <PresenceContext.Provider value={null}>
        <div
          className={cn(
            "group relative flex items-start gap-3 rounded-xl transition-colors",
            dense
              ? "px-2 py-2 hover:bg-secondary/60"
              : "px-3 py-3 hover:bg-secondary/50",
          )}
        >
          {animated && (
            <motion.span
              key={`flash-${pulse}`}
              aria-hidden
              className={cn(
                "pointer-events-none absolute inset-0 origin-left rounded-xl",
                FLASH[status as keyof typeof FLASH],
              )}
              initial={{ opacity: 0.95, scaleX: 0 }}
              animate={{ opacity: [0.95, 0.95, 0], scaleX: 1 }}
              transition={{
                duration: 0.75,
                times: [0, 0.45, 1],
                ease: EASE_OUT,
              }}
            />
          )}
          <div className="relative mt-0.5 shrink-0">
            <motion.button
              key={`box-${pulse}`}
              type="button"
              onClick={() => setStatus(done ? "TODO" : "DONE")}
              disabled={update.isPending}
              aria-label={
                done
                  ? `Rouvrir « ${task.title} »`
                  : `Terminer « ${task.title} »`
              }
              initial={false}
              animate={
                animated
                  ? done
                    ? { scale: [1, 0.7, 1.25, 1] }
                    : progress
                      ? { rotate: [0, 360], scale: [1, 1.15, 1] }
                      : { rotate: [0, -120, 0], scale: [1, 0.85, 1] }
                  : undefined
              }
              transition={{ duration: done ? 0.45 : 0.6, ease: EASE_OUT }}
              className={cn(
                "relative grid size-5 place-items-center rounded-full border-[1.5px] transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none",
                done
                  ? "border-emerald-500 bg-emerald-500 text-white"
                  : progress
                    ? "border-primary text-primary"
                    : "border-slate-300 text-transparent hover:border-emerald-500 hover:text-emerald-500",
              )}
            >
              {progress ? (
                // à moitié rempli : la tâche est commencée
                <motion.span
                  className="absolute inset-[2.5px] rounded-full bg-[conic-gradient(currentColor_0_50%,transparent_50%_100%)]"
                  initial={animated ? { scale: 0 } : false}
                  animate={{ scale: 1 }}
                  transition={SPRING}
                />
              ) : done ? (
                <svg viewBox="0 0 12 12" className="size-3" aria-hidden>
                  <motion.path
                    d="M2.5 6.3 5 8.6 9.6 3.6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={animated ? { pathLength: 0 } : false}
                    animate={{ pathLength: 1 }}
                    transition={{
                      duration: 0.3,
                      delay: animated ? 0.12 : 0,
                      ease: EASE_OUT,
                    }}
                  />
                </svg>
              ) : (
                <Check className="size-3" strokeWidth={3} />
              )}
            </motion.button>
            {/* validation : une onde et quelques éclats autour de la case */}
            {animated && done && (
              <span
                key={`burst-${pulse}`}
                aria-hidden
                className="pointer-events-none absolute inset-0"
              >
                <motion.span
                  className="absolute inset-0 rounded-full border-2 border-emerald-400"
                  initial={{ scale: 1, opacity: 0.8 }}
                  animate={{ scale: 1.8, opacity: 0 }}
                  transition={{ duration: 0.6, ease: EASE_OUT }}
                />
                {BURST.map((angle, i) => (
                  <motion.span
                    key={i}
                    className={cn(
                      "absolute top-1/2 left-1/2 -mt-[2px] -ml-[2px] size-1 rounded-full",
                      i % 2 ? "bg-emerald-400" : "bg-primary",
                    )}
                    initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                    animate={{
                      x: Math.cos(angle) * 13,
                      y: Math.sin(angle) * 13,
                      opacity: 0,
                      scale: 0.4,
                    }}
                    transition={{ duration: 0.55, ease: EASE_OUT, delay: 0.05 }}
                  />
                ))}
              </span>
            )}
            {/* en cours : un anneau qui tourne une fois autour de la case */}
            {animated && progress && (
              <motion.span
                key={`ring-${pulse}`}
                aria-hidden
                className="pointer-events-none absolute -inset-1 rounded-full border-2 border-primary/50 border-t-transparent border-r-transparent"
                initial={{ rotate: 0, opacity: 1 }}
                animate={{ rotate: 360, opacity: 0 }}
                transition={{ duration: 0.7, ease: EASE_OUT }}
              />
            )}
          </div>

          <div className="relative min-w-0 flex-1">
            {onOpen ? (
              <button
                type="button"
                onClick={onOpen}
                className={cn(
                  "text-left text-[13.5px] leading-snug font-medium line-through decoration-2 transition-[color,text-decoration-color] duration-500 hover:text-primary",
                  done
                    ? "text-muted-foreground decoration-slate-400/80"
                    : "text-foreground decoration-transparent",
                )}
              >
                {task.title}
              </button>
            ) : (
              <p
                className={cn(
                  "text-[13.5px] leading-snug font-medium line-through decoration-2 transition-[color,text-decoration-color] duration-500",
                  done
                    ? "text-muted-foreground decoration-slate-400/80"
                    : "text-foreground decoration-transparent",
                )}
              >
                {task.title}
              </p>
            )}
            <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground">
              <span
                className={cn(
                  "font-medium",
                  TONE_CLASS[due.tone].text,
                  due.tone === "neutral" && "text-muted-foreground",
                )}
              >
                {due.text}
              </span>
              {urgent && !done && (
                <span
                  className={cn(
                    "rounded-md px-1.5 py-px text-[11px] font-semibold",
                    TONE_CLASS[
                      task.priority === "URGENT" ? "danger" : "warning"
                    ].soft,
                  )}
                >
                  {TASK_PRIORITY_LABELS[task.priority]}
                </span>
              )}
              {task.assignee && <span>· {task.assignee}</span>}
              {(task.links?.length ? task.links : task.entityLabel ? [{ label: task.entityLabel, href: task.href }] : []).map((link) =>
                link.href ? (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                  >
                    <Link2 className="size-3" />
                    {link.label}
                  </Link>
                ) : (
                  <span key={link.label} className="inline-flex items-center gap-1">
                    <Link2 className="size-3" />
                    {link.label}
                  </span>
                ),
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  aria-label={`Statut : ${TASK_STATUS_LABELS[status]}`}
                  className={cn(
                    "relative inline-flex h-7 shrink-0 items-center gap-1 overflow-hidden rounded-lg border px-2 text-xs font-medium transition-colors duration-300 hover:border-border focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none",
                    progress
                      ? "border-primary/15 bg-primary-soft/70 text-primary"
                      : done
                        ? "border-emerald-200/70 bg-emerald-50 text-emerald-700"
                        : "border-transparent text-muted-foreground hover:bg-card",
                  )}
                />
              }
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={status}
                  initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, y: -10 }}
                  transition={{ duration: 0.22, ease: EASE_OUT }}
                  className="inline-flex items-center gap-1"
                >
                  {(() => {
                    const Icon =
                      STATUS_ICON[status as keyof typeof STATUS_ICON];
                    return Icon ? <Icon className="size-3" /> : null;
                  })()}
                  {TASK_STATUS_LABELS[status]}
                </motion.span>
              </AnimatePresence>
              <ChevronDown className="size-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              {(["TODO", "IN_PROGRESS", "DONE"] as const).map((current) => {
                const Icon = STATUS_ICON[current];
                return (
                  <DropdownMenuItem
                    key={current}
                    onClick={() => setStatus(current)}
                  >
                    <Icon /> {TASK_STATUS_LABELS[current]}
                    {status === current && (
                      <Check className="ml-auto text-primary" />
                    )}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </PresenceContext.Provider>
    </motion.div>
  );
}
