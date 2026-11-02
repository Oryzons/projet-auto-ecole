"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "motion/react";

import { EASE_OUT } from "@/components/motion/tokens";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type SessionBase = {
  id: string;
  title: string;
  location: string;
  startsAt: string;
  durationMinutes: number;
  capacity: number;
  notes: string | null;
  registeredCount: number;
};

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export function dayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

export function formatTime(date: Date) {
  return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export function formatTimeRange(session: Pick<SessionBase, "startsAt" | "durationMinutes">) {
  const start = new Date(session.startsAt);
  const end = new Date(start.getTime() + session.durationMinutes * 60_000);
  return `${formatTime(start)} – ${formatTime(end)}`;
}

export function formatLongDay(date: Date) {
  const text = date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m} min`;
  return m ? `${h} h ${String(m).padStart(2, "0")}` : `${h} h`;
}

export function placesLeft(session: Pick<SessionBase, "capacity" | "registeredCount">) {
  return Math.max(0, session.capacity - session.registeredCount);
}

export function isPast(session: Pick<SessionBase, "startsAt">) {
  return new Date(session.startsAt).getTime() <= Date.now();
}

/** Bloc date « 14 / OCT. » utilisé dans les listes. */
export function DateTile({ date, muted }: { date: Date; muted?: boolean }) {
  return (
    <span
      className={cn(
        "flex w-14 shrink-0 flex-col items-center justify-center rounded-xl py-2 leading-none",
        muted ? "bg-subtle text-muted-foreground" : "bg-primary-soft text-primary-strong",
      )}
    >
      <span className="text-[11px] font-semibold tracking-[0.06em] uppercase">
        {date.toLocaleDateString("fr-FR", { weekday: "short" }).replace(".", "")}
      </span>
      <span className="mt-1 text-[22px] font-semibold tracking-tight tabular">{date.getDate()}</span>
      <span className="mt-0.5 text-[11px] font-medium uppercase">
        {date.toLocaleDateString("fr-FR", { month: "short" }).replace(".", "")}
      </span>
    </span>
  );
}

/** Jauge des places : bleue, orange quand il reste peu de places, grise quand c'est complet. */
export function CapacityMeter({ registered, capacity, className }: { registered: number; capacity: number; className?: string }) {
  const ratio = capacity > 0 ? registered / capacity : 1;
  const left = Math.max(0, capacity - registered);
  return (
    <div className={cn("min-w-0", className)}>
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="text-muted-foreground">
          <span className="font-semibold text-foreground tabular">{registered}</span> / {capacity} inscrits
        </span>
        <span className={cn("font-medium", left === 0 ? "text-muted-foreground" : ratio >= 0.8 ? "text-warning" : "text-primary")}>
          {left === 0 ? "Complet" : `${left} place${left > 1 ? "s" : ""}`}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary">
        <motion.div
          className={cn("h-full rounded-full", left === 0 ? "bg-muted-foreground/40" : ratio >= 0.8 ? "bg-warning" : "bg-primary")}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, ratio * 100)}%` }}
          transition={{ duration: 0.7, ease: EASE_OUT }}
        />
      </div>
    </div>
  );
}

/**
 * Calendrier mensuel. Chaque jour affiche ses sessions sous forme de pastilles
 * (heure + places) sur grand écran, et de points sur mobile.
 */
export function MonthCalendar<T extends SessionBase>({
  month,
  onMonthChange,
  sessions,
  selectedDay,
  onSelectDay,
  onSelectSession,
  sessionTone,
}: {
  month: Date;
  onMonthChange: (month: Date) => void;
  sessions: T[];
  selectedDay: string | null;
  onSelectDay: (key: string) => void;
  onSelectSession?: (session: T) => void;
  /** Couleur d'une pastille : inscrit, complet, passé… */
  sessionTone?: (session: T) => "primary" | "success" | "muted" | "warning";
}) {
  const first = startOfMonth(month);
  const offset = (first.getDay() + 6) % 7;
  const gridStart = new Date(first.getFullYear(), first.getMonth(), 1 - offset);
  const days = Array.from({ length: 42 }, (_, i) => new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i));
  const visibleDays = days[35].getMonth() !== first.getMonth() ? days.slice(0, 35) : days;
  const today = dayKey(new Date());

  const byDay = new Map<string, T[]>();
  for (const session of sessions) {
    const key = dayKey(new Date(session.startsAt));
    byDay.set(key, [...(byDay.get(key) ?? []), session]);
  }

  const monthLabel = first.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const toneClass = {
    primary: "bg-primary-soft text-primary-strong hover:bg-primary/15",
    success: "bg-success-soft text-success hover:bg-success/15",
    warning: "bg-warning-soft text-warning hover:bg-warning/15",
    muted: "bg-subtle text-muted-foreground hover:bg-secondary",
  } as const;
  const dotClass = { primary: "bg-primary", success: "bg-success", warning: "bg-warning", muted: "bg-muted-foreground/40" } as const;

  return (
    <div>
      <div className="flex items-center justify-between gap-3 px-1 pb-4">
        <p className="text-[15px] font-semibold whitespace-nowrap text-foreground first-letter:uppercase">{monthLabel}</p>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" className="hidden sm:inline-flex" onClick={() => onMonthChange(startOfMonth(new Date()))}>
            Aujourd&apos;hui
          </Button>
          <Button variant="ghost" size="icon" aria-label="Mois précédent" onClick={() => onMonthChange(addMonths(month, -1))}>
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Mois suivant" onClick={() => onMonthChange(addMonths(month, 1))}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-7 border-b border-border pb-2 text-center text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
        {WEEKDAYS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <motion.div
        key={dayKey(first)}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: EASE_OUT }}
        className="grid grid-cols-7 gap-px overflow-hidden rounded-b-xl bg-border"
      >
        {visibleDays.map((day) => {
          const key = dayKey(day);
          const inMonth = day.getMonth() === first.getMonth();
          const daySessions = byDay.get(key) ?? [];
          const selected = selectedDay === key;
          return (
            <div
              key={key}
              role="button"
              tabIndex={0}
              aria-label={`${day.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}, ${daySessions.length} session${daySessions.length > 1 ? "s" : ""}`}
              aria-pressed={selected}
              onClick={() => onSelectDay(key)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelectDay(key);
                }
              }}
              className={cn(
                "group relative flex min-h-14 cursor-pointer flex-col gap-1 bg-card p-1.5 text-left transition-colors outline-none sm:min-h-24 sm:p-2",
                !inMonth && "bg-subtle/60",
                selected ? "bg-primary-soft/50 ring-2 ring-primary ring-inset" : "hover:bg-subtle focus-visible:bg-subtle",
              )}
            >
              <span
                className={cn(
                  "grid size-6 place-items-center rounded-full text-xs font-medium tabular",
                  key === today ? "bg-primary text-white" : inMonth ? "text-foreground" : "text-muted-foreground/60",
                )}
              >
                {day.getDate()}
              </span>
              {daySessions.length > 0 && (
                <>
                  <span className="flex flex-wrap gap-1 sm:hidden">
                    {daySessions.map((s) => (
                      <span key={s.id} className={cn("size-1.5 rounded-full", dotClass[sessionTone?.(s) ?? "primary"])} />
                    ))}
                  </span>
                  <span className="hidden flex-col gap-1 sm:flex">
                    {daySessions.slice(0, 3).map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          if (onSelectSession) onSelectSession(s);
                          else onSelectDay(key);
                        }}
                        title={`${formatTime(new Date(s.startsAt))} · ${s.location} · ${placesLeft(s) === 0 ? "complet" : `${placesLeft(s)} place${placesLeft(s) > 1 ? "s" : ""}`}`}
                        className={cn("truncate rounded-md px-1.5 py-1 text-left text-[11px] font-medium transition-colors", toneClass[sessionTone?.(s) ?? "primary"])}
                      >
                        <span className="tabular">{formatTime(new Date(s.startsAt))}</span>
                        <span className="hidden opacity-75 2xl:inline"> · {placesLeft(s) === 0 ? "complet" : `${placesLeft(s)} pl.`}</span>
                      </button>
                    ))}
                    {daySessions.length > 3 && (
                      <span className="px-1.5 text-[11px] text-muted-foreground">+{daySessions.length - 3}</span>
                    )}
                  </span>
                </>
              )}
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}
