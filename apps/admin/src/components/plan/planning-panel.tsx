"use client";

import { CalendarClock, Car, ChevronRight, RotateCcw } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { EASE_OUT } from "@/components/motion/tokens";
import { INSTRUCTOR_COLORS } from "@/lib/lessons";
import type { PlanSchedule } from "@/lib/plan-types";
import { cn } from "@/lib/utils";

const START = 8;
const END = 19;
const TICKS = [8, 10, 12, 14, 16, 18];

const time = (iso: string) => new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
const hours = (d: Date) => d.getHours() + d.getMinutes() / 60;
const pct = (h: number) => `${Math.min(100, Math.max(0, ((h - START) / (END - START)) * 100))}%`;

type Lesson = PlanSchedule["lessons"][number];

/** Panneau Planning du plan : chiffres clés, leçon en cours, frise des moniteurs et programme du jour. */
export function PlanningPanel({ schedule }: { schedule: PlanSchedule }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const color = (id: string | null) => {
    const index = schedule.instructors.findIndex((i) => i.id === id);
    return index >= 0 ? INSTRUCTOR_COLORS[index % INSTRUCTOR_COLORS.length]! : "#94a3b8";
  };
  const firstName = (id: string | null) => schedule.instructors.find((i) => i.id === id)?.firstName ?? "—";
  const state = (l: Lesson) => {
    const s = new Date(l.startsAt).getTime();
    const e = new Date(l.endsAt).getTime();
    if (l.status === "DONE" || e <= now) return "done" as const;
    return s <= now ? ("live" as const) : ("next" as const);
  };

  const live = schedule.lessons.filter((l) => state(l) === "live");
  const upcoming = schedule.lessons.filter((l) => state(l) === "next");
  const done = schedule.lessons.filter((l) => state(l) === "done");
  const nowH = hours(new Date(now));

  return (
    <div className="space-y-5 px-5 pt-4 pb-1">
      {/* chiffres clés */}
      <div className="grid grid-cols-3 divide-x divide-border rounded-2xl border border-border bg-card">
        <Stat label="Aujourd'hui" value={schedule.lessons.length} />
        <Stat label="7 jours" value={schedule.week} />
        <Stat label="À reprogrammer" value={schedule.cancelled} warn={schedule.cancelled > 0} />
      </div>

      {/* en ce moment */}
      {live.length > 0 ? (
        <section className="space-y-2">
          <SectionTitle>En ce moment</SectionTitle>
          {live.map((l) => {
            const s = new Date(l.startsAt).getTime();
            const e = new Date(l.endsAt).getTime();
            const ratio = (now - s) / (e - s);
            return (
              <Link
                key={l.id}
                href={`/admin/calendar?lesson=${l.id}`}
                className="block rounded-2xl border border-emerald-200/80 bg-emerald-50/60 px-3.5 py-3 transition-colors hover:bg-emerald-50"
              >
                <span className="flex items-center gap-2">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                    <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-foreground">{l.student}</span>
                  <span className="shrink-0 text-xs font-medium text-emerald-700 tabular-nums">encore {Math.max(1, Math.round((e - now) / 60_000))} min</span>
                </span>
                <span className="mt-1 flex items-center gap-1.5 pl-4 text-xs text-muted-foreground">
                  {firstName(l.instructorId)}
                  {l.vehicle && (
                    <>
                      <span aria-hidden>·</span>
                      <Car className="size-3" /> {l.vehicle}
                    </>
                  )}
                </span>
                <span className="mt-2.5 block h-1.5 overflow-hidden rounded-full bg-emerald-100">
                  <motion.span
                    className="block h-full rounded-full bg-emerald-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, ratio * 100)}%` }}
                    transition={{ duration: 0.8, ease: EASE_OUT }}
                  />
                </span>
              </Link>
            );
          })}
        </section>
      ) : upcoming[0] ? (
        <div className="flex items-center gap-3 rounded-2xl bg-primary-soft/60 px-3.5 py-3">
          <CalendarClock className="size-4 shrink-0 text-primary" />
          <p className="min-w-0 flex-1 truncate text-[13px] text-foreground">
            Prochaine leçon à <span className="font-semibold tabular-nums">{time(upcoming[0].startsAt)}</span> · {upcoming[0].student}
          </p>
        </div>
      ) : null}

      {/* frise de la journée par moniteur */}
      {schedule.instructors.length > 0 && (
        <section>
          <SectionTitle>Journée des moniteurs</SectionTitle>
          <div className="mt-2.5 space-y-2">
            {schedule.instructors.map((instructor) => {
              const own = schedule.lessons.filter((l) => l.instructorId === instructor.id);
              const c = color(instructor.id);
              return (
                <div key={instructor.id} className="flex items-center gap-2.5">
                  <span className="w-12 shrink-0 truncate text-xs font-medium text-foreground">{instructor.firstName}</span>
                  <Link href="/admin/calendar" className="relative h-6 flex-1 rounded-md bg-secondary/80" title={`${own.length} leçon${own.length > 1 ? "s" : ""} aujourd'hui`}>
                    {own.map((l) => {
                      const st = state(l);
                      return (
                        <span
                          key={l.id}
                          className={cn("absolute inset-y-0.5 rounded-[4px]", st === "done" && "opacity-40")}
                          style={{
                            left: pct(hours(new Date(l.startsAt))),
                            width: `calc(${pct(hours(new Date(l.endsAt)))} - ${pct(hours(new Date(l.startsAt)))} - 2px)`,
                            background: c,
                          }}
                        />
                      );
                    })}
                    {nowH >= START && nowH <= END && <span className="absolute -inset-y-1 w-0.5 rounded-full bg-red-500" style={{ left: pct(nowH) }} />}
                  </Link>
                </div>
              );
            })}
            <div className="flex pl-[58px] text-[10.5px] text-muted-foreground tabular-nums">
              <div className="relative h-3 flex-1">
                {TICKS.map((h) => (
                  <span key={h} className="absolute -translate-x-1/2" style={{ left: pct(h) }}>
                    {h}h
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* programme */}
      <section>
        <SectionTitle count={upcoming.length}>À venir</SectionTitle>
        {upcoming.length === 0 ? (
          <p className="mt-2 rounded-xl border border-dashed border-border px-3 py-3 text-center text-[13px] text-muted-foreground">Plus de leçon prévue aujourd&apos;hui.</p>
        ) : (
          <ul className="mt-1.5 -mx-2">
            {upcoming.map((l) => (
              <LessonRow key={l.id} lesson={l} color={color(l.instructorId)} instructor={firstName(l.instructorId)} />
            ))}
          </ul>
        )}
      </section>

      {done.length > 0 && (
        <section>
          <SectionTitle count={done.length}>Terminées</SectionTitle>
          <ul className="mt-1.5 -mx-2">
            {done.map((l) => (
              <LessonRow key={l.id} lesson={l} color={color(l.instructorId)} instructor={firstName(l.instructorId)} muted />
            ))}
          </ul>
        </section>
      )}

      {schedule.cancelled > 0 && (
        <Link href="/admin/calendar" className="flex items-center gap-2.5 rounded-xl bg-amber-50 px-3.5 py-2.5 text-[13px] text-amber-800 transition-colors hover:bg-amber-100/70">
          <RotateCcw className="size-4 shrink-0" />
          <span className="flex-1">
            {schedule.cancelled} leçon{schedule.cancelled > 1 ? "s annulées" : " annulée"} cette semaine à reprogrammer
          </span>
          <ChevronRight className="size-4" />
        </Link>
      )}
    </div>
  );
}

function Stat({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
  return (
    <div className="px-3 py-2.5 text-center">
      <p className={cn("text-xl font-semibold tracking-[-0.02em] tabular-nums", warn ? "text-amber-600" : "text-foreground")}>{value}</p>
      <p className="mt-0.5 truncate text-[11.5px] text-muted-foreground">{label}</p>
    </div>
  );
}

function SectionTitle({ children, count }: { children: React.ReactNode; count?: number }) {
  return (
    <h3 className="flex items-center justify-between text-xs font-semibold tracking-[0.06em] text-muted-foreground uppercase">
      {children}
      {count !== undefined && <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] tracking-normal tabular-nums">{count}</span>}
    </h3>
  );
}

function LessonRow({ lesson, color, instructor, muted }: { lesson: Lesson; color: string; instructor: string; muted?: boolean }) {
  const minutes = Math.round((new Date(lesson.endsAt).getTime() - new Date(lesson.startsAt).getTime()) / 60_000);
  return (
    <li>
      <Link
        href={`/admin/calendar?lesson=${lesson.id}`}
        className={cn("group flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-secondary/70", muted && "opacity-60 hover:opacity-100")}
      >
        <span className="w-11 shrink-0 text-right">
          <span className="block text-[13px] font-semibold text-foreground tabular-nums">{time(lesson.startsAt)}</span>
          <span className="block text-[11px] text-muted-foreground tabular-nums">{minutes} min</span>
        </span>
        <span className="h-8 w-[3px] shrink-0 rounded-full" style={{ background: color }} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13.5px] font-medium text-foreground">{lesson.student}</span>
          <span className="mt-0.5 block truncate text-xs text-muted-foreground">
            {instructor}
            {lesson.vehicle ? ` · ${lesson.vehicle}` : ""}
          </span>
        </span>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
      </Link>
    </li>
  );
}
