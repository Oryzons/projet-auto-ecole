"use client";

import { ChevronLeft, ChevronRight, MapPin, Plus } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

import { EASE_OUT } from "@/components/motion/tokens";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { dayKey, formatTimeRange, isPast, placesLeft, type SessionBase } from "./calendar-shared";

const START = 8;
const END = 22;
const HOUR_PX = 44;
const HOURS = Array.from({ length: END - START }, (_, i) => START + i);

function startOfWeek(date: Date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}
const addDays = (date: Date, days: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

/** Couleur selon le type de séance : code, examen blanc, rendez-vous pédagogique. */
function kindColor(title: string) {
  if (/examen/i.test(title)) return "#E07B16";
  if (/rendez-vous|aac|pédago/i.test(title)) return "#8B5CF6";
  return "#2D50F5";
}

/** Semaine des séances de code : une colonne par jour, chaque séance avec son remplissage. */
export function TheoryWeek<T extends SessionBase>({
  week,
  onWeekChange,
  sessions,
  onSelectSession,
  onCreate,
}: {
  week: Date;
  onWeekChange: (date: Date) => void;
  sessions: T[];
  onSelectSession: (session: T) => void;
  onCreate: (day: string, time: string) => void;
}) {
  const monday = startOfWeek(week);
  const days = Array.from({ length: 6 }, (_, i) => addDays(monday, i));
  if (sessions.some((s) => dayKey(new Date(s.startsAt)) === dayKey(addDays(monday, 6)))) days.push(addDays(monday, 6));
  const [hover, setHover] = useState<{ day: string; hour: number } | null>(null);
  const [now] = useState(() => Date.now());
  const today = dayKey(new Date(now));
  const label = `${monday.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} – ${addDays(monday, 5).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}`;

  return (
    <div>
      <div className="flex items-center justify-between gap-3 px-1 pb-4">
        <p className="text-[15px] font-semibold whitespace-nowrap text-foreground">{label}</p>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" className="hidden sm:inline-flex" onClick={() => onWeekChange(new Date())}>
            Aujourd&apos;hui
          </Button>
          <Button variant="ghost" size="icon" aria-label="Semaine précédente" onClick={() => onWeekChange(addDays(monday, -7))}>
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Semaine suivante" onClick={() => onWeekChange(addDays(monday, 7))}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div style={{ minWidth: 44 + days.length * 96 }}>
          <div className="flex border-b border-border pb-2">
            <div className="w-11 shrink-0" />
            <div className="grid flex-1" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}>
              {days.map((d) => (
                <div key={dayKey(d)} className="flex flex-col items-center gap-0.5">
                  <span className="text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
                    {d.toLocaleDateString("fr-FR", { weekday: "short" }).replace(".", "")}
                  </span>
                  <span className={cn("grid size-7 place-items-center rounded-full text-sm font-semibold tabular", dayKey(d) === today ? "bg-primary text-white" : "text-foreground")}>
                    {d.getDate()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <motion.div
            key={dayKey(monday)}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: EASE_OUT }}
            className="flex"
          >
            <div className="relative w-11 shrink-0" style={{ height: HOURS.length * HOUR_PX }}>
              {HOURS.map((h, i) => (
                <span key={h} className="absolute right-2 -translate-y-1/2 text-[11px] text-muted-foreground tabular" style={{ top: i * HOUR_PX }}>
                  {i === 0 ? "" : `${h}h`}
                </span>
              ))}
            </div>
            <div className="grid flex-1" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))`, height: HOURS.length * HOUR_PX }}>
              {days.map((d) => {
                const key = dayKey(d);
                const daySessions = sessions.filter((s) => dayKey(new Date(s.startsAt)) === key);
                const open = key >= today;
                return (
                  <div
                    key={key}
                    className={cn("relative border-l border-border", key < today && "bg-subtle/50")}
                    onMouseMove={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setHover({ day: key, hour: START + Math.min(HOURS.length - 1, Math.floor((e.clientY - rect.top) / HOUR_PX)) });
                    }}
                    onMouseLeave={() => setHover(null)}
                    onClick={() => hover && open && onCreate(key, `${String(hover.hour).padStart(2, "0")}:00`)}
                  >
                    {HOURS.map((h, i) => (
                      <div key={h} className="pointer-events-none absolute inset-x-0 border-t border-border/70" style={{ top: i * HOUR_PX }} />
                    ))}
                    {open && hover?.day === key && !daySessions.some((s) => new Date(s.startsAt).getHours() <= hover.hour && new Date(s.startsAt).getTime() + s.durationMinutes * 60_000 > new Date(d).setHours(hover.hour)) && (
                      <div
                        className="pointer-events-none absolute inset-x-1 flex items-center gap-1 rounded-lg border border-dashed border-primary/40 bg-primary-soft/40 px-2 text-[11px] font-medium text-primary"
                        style={{ top: (hover.hour - START) * HOUR_PX + 1, height: HOUR_PX - 2 }}
                      >
                        <Plus className="size-3" /> {hover.hour}h
                      </div>
                    )}
                    {daySessions.map((s) => {
                      const start = new Date(s.startsAt);
                      const top = (start.getHours() + start.getMinutes() / 60 - START) * HOUR_PX;
                      const height = (s.durationMinutes / 60) * HOUR_PX;
                      const color = kindColor(s.title);
                      const past = isPast(s);
                      const ratio = s.capacity ? s.registeredCount / s.capacity : 1;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectSession(s);
                          }}
                          className={cn(
                            "absolute inset-x-1 z-[5] flex flex-col overflow-hidden rounded-lg border-l-[3px] px-2 py-1 text-left transition-shadow hover:shadow-[0_4px_14px_-4px_rgb(15_40_84/0.25)]",
                            past && "opacity-70",
                          )}
                          style={{ top: top + 1, height: Math.max(24, height - 2), borderLeftColor: color, background: `color-mix(in srgb, ${color} ${past ? 7 : 12}%, var(--card))` }}
                        >
                          <span className="truncate text-[12px] leading-tight font-semibold text-foreground">{s.title}</span>
                          <span className="truncate text-[11px] text-muted-foreground tabular">{formatTimeRange(s)}</span>
                          {height >= 80 && (
                            <span className="flex min-w-0 items-center gap-1 text-[11px] text-muted-foreground">
                              <MapPin className="size-3 shrink-0" />
                              <span className="truncate">{s.location}</span>
                            </span>
                          )}
                          {height >= 60 && (
                            <span className="mt-auto pb-0.5">
                              <span className="flex justify-between text-[10.5px] font-medium" style={{ color }}>
                                <span className="tabular">
                                  {s.registeredCount}/{s.capacity}
                                </span>
                                <span>{placesLeft(s) === 0 ? "complet" : `${placesLeft(s)} pl.`}</span>
                              </span>
                              <span className="mt-0.5 block h-1 overflow-hidden rounded-full bg-card/80">
                                <span className="block h-full rounded-full" style={{ width: `${Math.min(100, ratio * 100)}%`, background: color }} />
                              </span>
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-3 px-1 text-xs text-muted-foreground">
        {[
          ["Séance de code", "#2D50F5"],
          ["Examen blanc", "#E07B16"],
          ["Rendez-vous pédagogique", "#8B5CF6"],
        ].map(([label, color]) => (
          <span key={label} className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full" style={{ background: color }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
