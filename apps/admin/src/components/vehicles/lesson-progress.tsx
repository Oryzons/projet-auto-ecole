"use client";

import { useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

import { EASE_OUT } from "@/components/motion/tokens";
import type { VehicleDto } from "@/lib/vehicles";

const TIME = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" });

function remaining(ms: number) {
  const minutes = Math.max(0, Math.ceil(ms / 60_000));
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${String(m).padStart(2, "0")}` : `${h} h`;
}

/** Leçon en cours sur le véhicule : barre qui se remplit jusqu'à la fin, mise à jour en direct. */
export function LessonProgress({ lesson }: { lesson: NonNullable<VehicleDto["currentLesson"]> }) {
  const queryClient = useQueryClient();
  const start = new Date(lesson.startsAt).getTime();
  const end = new Date(lesson.endsAt).getTime();
  const [now, setNow] = useState(() => Date.now());
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  // à la fin de la leçon, la fiche se recharge : le véhicule redevient disponible
  useEffect(() => {
    if (now < end) return;
    void queryClient.invalidateQueries({ queryKey: ["vehicles"] });
  }, [now >= end]); // eslint-disable-line react-hooks/exhaustive-deps

  const progress = Math.min(1, Math.max(0, (now - start) / (end - start)));
  const left = end - now;
  const soon = left < 10 * 60_000;
  const first = (name: string | null) => name?.split(" ")[0] ?? null;

  return (
    <div className="mt-3 rounded-xl border border-primary/15 bg-primary-soft/50 px-3 py-2.5">
      <div className="flex items-center justify-between gap-2 text-[12.5px]">
        <span className="flex min-w-0 items-center gap-2 font-medium text-foreground">
          <span className="relative flex size-2 shrink-0">
            <span className="absolute inset-0 animate-ping rounded-full bg-primary/60" />
            <span className="relative size-2 rounded-full bg-primary" />
          </span>
          <span className="truncate">
            Leçon en cours{lesson.student ? ` · ${lesson.student}` : ""}
          </span>
        </span>
        <span className={soon ? "shrink-0 font-semibold text-amber-700 tabular" : "shrink-0 font-semibold text-primary tabular"}>encore {remaining(left)}</span>
      </div>
      <div
        className="relative mt-2 h-2 overflow-hidden rounded-full bg-white"
        role="progressbar"
        aria-label="Temps écoulé de la leçon"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
      >
        <motion.div
          className={soon ? "absolute inset-y-0 left-0 rounded-full bg-amber-500" : "absolute inset-y-0 left-0 rounded-full bg-primary"}
          initial={{ width: 0 }}
          animate={{ width: `${progress * 100}%` }}
          // remplissage à l'apparition, puis avance régulière seconde par seconde
          transition={entered ? { duration: 1, ease: "linear" } : { duration: 1.2, ease: EASE_OUT }}
          onAnimationComplete={() => setEntered(true)}
        >
          {/* reflet qui glisse le long de la barre */}
          <span className="absolute inset-0 animate-[shimmer_2.2s_linear_infinite] bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.55)_50%,transparent_100%)] bg-[length:200%_100%]" />
        </motion.div>
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground tabular">
        <span>Début {TIME.format(start)}</span>
        {lesson.instructor && <span className="truncate px-2">avec {first(lesson.instructor)}</span>}
        <span>Fin {TIME.format(end)}</span>
      </div>
    </div>
  );
}
