"use client";

import { Ban, CalendarClock, CarFront, Check, ChevronLeft, ChevronRight, Clock3, Plus, TriangleAlert, UsersRound } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { toast } from "sonner";

import { EASE_OUT } from "@/components/motion/tokens";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Segmented } from "@/components/ui/segmented";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { useLessonMutations, useLessons } from "@/hooks/use-lessons";
import { findConflicts, INSTRUCTOR_COLORS, isLive, lessonEnd, PLANNER_END_HOUR, PLANNER_START_HOUR, type LessonDto, type LessonsPayload } from "@/lib/lessons";
import { cn } from "@/lib/utils";
import { colorHex } from "@/lib/vehicles";

import { dayKey, formatLongDay, formatTime } from "./calendar-shared";
import { LessonDetailDialog, LessonFormDialog, type LessonDraft } from "./lesson-dialogs";

const HOUR_PX = 60;
const SNAP = 15;
const DAY_MS = 86_400_000;
const HOURS = Array.from({ length: PLANNER_END_HOUR - PLANNER_START_HOUR }, (_, i) => PLANNER_START_HOUR + i);
const GRID_HEIGHT = HOURS.length * HOUR_PX;

type Mode = "day" | "week";
type GroupBy = "instructor" | "vehicle";

function startOfWeek(date: Date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}
const addDays = (date: Date, days: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
const minutesOfDay = (date: Date) => date.getHours() * 60 + date.getMinutes();
const toTime = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const slotFor = (lesson: LessonDto) => ({ ...lesson, instructorId: lesson.instructor?.id ?? null, vehicleId: lesson.vehicle?.id ?? null });

type Column = { key: string; day: Date; label: string; sub?: string; color?: string; instructorId?: string | null; vehicleId?: string | null; match: (l: LessonDto) => boolean };
type Drag = { id: string; col: number; minutes: number; moved: boolean };

/** Répartit les leçons qui se chevauchent sur des couloirs côte à côte. */
function layoutLanes(lessons: LessonDto[]) {
  const sorted = [...lessons].sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  const out = new Map<string, { lane: number; lanes: number }>();
  let cluster: LessonDto[] = [];
  let clusterEnd = 0;
  let laneEnds: number[] = [];
  const flush = () => {
    cluster.forEach((l) => (out.get(l.id)!.lanes = laneEnds.length));
    cluster = [];
    laneEnds = [];
  };
  for (const lesson of sorted) {
    const start = new Date(lesson.startsAt).getTime();
    if (cluster.length && start >= clusterEnd) flush();
    let lane = laneEnds.findIndex((end) => end <= start);
    if (lane === -1) lane = laneEnds.push(0) - 1;
    laneEnds[lane] = lessonEnd(lesson);
    out.set(lesson.id, { lane, lanes: 1 });
    cluster.push(lesson);
    clusterEnd = Math.max(clusterEnd, lessonEnd(lesson));
  }
  flush();
  return out;
}

export function DrivingPlanner() {
  const [mode, setMode] = useState<Mode>("day");
  const [groupBy, setGroupBy] = useState<GroupBy>("instructor");
  const [anchor, setAnchor] = useState(() => new Date());
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [draft, setDraft] = useState<LessonDraft | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const weekStart = startOfWeek(anchor);
  const weekEnd = addDays(weekStart, 7);
  const { data, isLoading, isError } = useLessons(weekStart, weekEnd);
  const lessons = useMemo(() => data?.lessons ?? [], [data]);
  const canEdit = data?.canEdit ?? false;
  const colorOf = useMemo(() => {
    const map = new Map((data?.instructors ?? []).map((i, index) => [i.id, INSTRUCTOR_COLORS[index % INSTRUCTOR_COLORS.length]!]));
    return (id: string | null | undefined) => (id && map.get(id)) || "#64748B";
  }, [data?.instructors]);

  const day = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate());
  const visible = lessons.filter((l) => !l.instructor || !hidden.has(l.instructor.id));
  const instructors = (data?.instructors ?? []).filter((i) => !hidden.has(i.id));

  const columns: Column[] = useMemo(() => {
    if (mode === "week") {
      const days = Array.from({ length: 6 }, (_, i) => addDays(weekStart, i));
      // le dimanche n'apparaît que s'il porte des leçons
      if (lessons.some((l) => new Date(l.startsAt).getDay() === 0)) days.push(addDays(weekStart, 6));
      return days.map((d) => ({
        key: dayKey(d),
        day: d,
        label: d.toLocaleDateString("fr-FR", { weekday: "short" }).replace(".", ""),
        sub: String(d.getDate()),
        match: (l) => dayKey(new Date(l.startsAt)) === dayKey(d),
      }));
    }
    const sameDay = (l: LessonDto) => dayKey(new Date(l.startsAt)) === dayKey(day);
    if (groupBy === "instructor")
      return instructors.map((i) => ({
        key: i.id,
        day,
        label: `${i.firstName} ${i.lastName}`,
        color: colorOf(i.id),
        instructorId: i.id,
        match: (l) => sameDay(l) && l.instructor?.id === i.id,
      }));
    const cols: Column[] = (data?.vehicles ?? []).map((v) => ({
      key: v.id,
      day,
      label: v.name,
      sub: v.status === "MAINTENANCE" ? "Au garage" : v.status === "OUT_OF_SERVICE" ? "Hors service" : v.plate,
      color: colorHex(v.color) ?? undefined,
      vehicleId: v.id,
      match: (l) => sameDay(l) && l.vehicle?.id === v.id,
    }));
    if (visible.some((l) => sameDay(l) && !l.vehicle)) cols.push({ key: "none", day, label: "Sans véhicule", vehicleId: null, match: (l) => sameDay(l) && !l.vehicle });
    return cols;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, groupBy, dayKey(day), dayKey(weekStart), data, hidden]);

  /* ---------- indicateurs ---------- */
  const active = visible.filter((l) => l.status !== "CANCELLED");
  const periodLessons = mode === "day" ? active.filter((l) => dayKey(new Date(l.startsAt)) === dayKey(day)) : active;
  const hours = periodLessons.reduce((sum, l) => sum + l.durationMinutes / 60, 0);
  const capacity = Math.max(1, instructors.length) * (mode === "day" ? 1 : 6) * 9;
  const cancelled = visible.filter((l) => l.status === "CANCELLED" && (mode === "week" || dayKey(new Date(l.startsAt)) === dayKey(day))).length;
  const liveNow = lessons.filter((l) => isLive(l, now)).length;

  /* ---------- glisser-déposer ---------- */
  const colsRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const { update } = useLessonMutations();

  function startDrag(event: ReactPointerEvent, lesson: LessonDto, col: number) {
    if (event.button !== 0) return;
    event.stopPropagation();
    const movable = canEdit && lesson.status === "PLANNED" && new Date(lesson.startsAt).getTime() > now;
    const origin = { x: event.clientX, y: event.clientY, minutes: minutesOfDay(new Date(lesson.startsAt)) };
    let state: Drag = { id: lesson.id, col, minutes: origin.minutes, moved: false };
    const move = (e: PointerEvent) => {
      if (!movable) return;
      const dist = Math.hypot(e.clientX - origin.x, e.clientY - origin.y);
      if (!state.moved && dist < 5) return;
      const rect = colsRef.current!.getBoundingClientRect();
      const nextCol = clamp(Math.floor(((e.clientX - rect.left) / rect.width) * columns.length), 0, columns.length - 1);
      const delta = Math.round(((e.clientY - origin.y) / HOUR_PX) * 60 / SNAP) * SNAP;
      const minutes = clamp(origin.minutes + delta, PLANNER_START_HOUR * 60, PLANNER_END_HOUR * 60 - lesson.durationMinutes);
      state = { id: lesson.id, col: nextCol, minutes, moved: true };
      setDrag(state);
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      setDrag(null);
      if (!state.moved) return setDetailId(lesson.id);
      drop(lesson, columns[state.col]!, state.minutes);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  /** Ce que deviendrait la leçon lâchée sur cette colonne à cette heure, et ce qui bloque. */
  function target(lesson: LessonDto, col: Column, minutes: number) {
    const startsAt = new Date(col.day.getFullYear(), col.day.getMonth(), col.day.getDate(), Math.floor(minutes / 60), minutes % 60);
    const patch: Record<string, unknown> = {};
    if (startsAt.getTime() !== new Date(lesson.startsAt).getTime()) patch.startsAt = startsAt.toISOString();
    if (col.instructorId !== undefined && col.instructorId !== lesson.instructor?.id) patch.instructorId = col.instructorId;
    if (col.vehicleId !== undefined && col.vehicleId !== (lesson.vehicle?.id ?? null)) patch.vehicleId = col.vehicleId;
    const next = { ...slotFor(lesson), startsAt, ...(patch.instructorId ? { instructorId: col.instructorId! } : {}), ...("vehicleId" in patch ? { vehicleId: col.vehicleId ?? null } : {}) };
    const conflicts = findConflicts(next, lessons.map(slotFor), {
      instructor: (id) => data?.instructors.find((i) => i.id === id)?.firstName,
      vehicle: (id) => data?.vehicles.find((v) => v.id === id)?.name,
      student: () => `${lesson.student.firstName} ${lesson.student.lastName}`,
    });
    if (startsAt.getTime() < now) conflicts.unshift({ kind: "student", message: "Impossible de déplacer une leçon dans le passé" });
    return { startsAt, patch, conflicts };
  }

  function drop(lesson: LessonDto, col: Column, minutes: number) {
    const { startsAt, patch, conflicts } = target(lesson, col, minutes);
    if (!Object.keys(patch).length) return;
    if (conflicts.length) return void toast.error("Créneau déjà pris", { description: conflicts[0]!.message });
    update.mutate(
      { id: lesson.id, data: patch },
      { onSuccess: () => toast.success("Leçon déplacée", { description: `${lesson.student.firstName} ${lesson.student.lastName} · ${formatLongDay(startsAt)} à ${toTime(minutes)}` }) },
    );
  }

  /* ---------- clic sur un créneau libre ---------- */
  const [hover, setHover] = useState<{ col: number; minutes: number } | null>(null);
  const slotAt = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const minutes = PLANNER_START_HOUR * 60 + Math.floor(((event.clientY - rect.top) / HOUR_PX) * 2) * 30;
    return clamp(minutes, PLANNER_START_HOUR * 60, PLANNER_END_HOUR * 60 - 60);
  };
  const slotOpen = (col: Column, minutes: number) => {
    const at = new Date(col.day.getFullYear(), col.day.getMonth(), col.day.getDate(), Math.floor(minutes / 60), minutes % 60);
    return canEdit && !drag && at.getTime() > now;
  };

  function shift(step: number) {
    setAnchor((a) => addDays(a, step * (mode === "day" ? 1 : 7)));
  }
  const title =
    mode === "day"
      ? formatLongDay(day)
      : `${weekStart.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} – ${addDays(weekStart, 5).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}`;
  const detail = lessons.find((l) => l.id === detailId) ?? null;
  const nowMinutes = minutesOfDay(new Date(now));
  const todayKey = dayKey(new Date(now));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label={mode === "day" ? "Leçons ce jour" : "Leçons cette semaine"} value={periodLessons.length} icon={<CalendarClock />} className="h-full" hint={liveNow ? `${liveNow} en cours maintenant` : undefined} />
        <StatCard label="Heures de conduite" value={Math.round(hours * 10) / 10} icon={<Clock3 />} className="h-full" />
        <StatCard
          label="Occupation des moniteurs"
          value={Math.round((hours / capacity) * 100)}
          format="percent"
          icon={<UsersRound />}
          className="h-full"
          hint={`Sur ${mode === "day" ? "9 h" : "6 jours de 9 h"} par moniteur`}
        />
        <StatCard label="Annulations" value={cancelled} icon={<Ban />} className="h-full" />
      </div>

      <Card className="gap-0 overflow-hidden p-0">
        {/* barre d'outils */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3 sm:px-5">
          <Segmented
            size="sm"
            options={[
              { value: "day", label: "Jour" },
              { value: "week", label: "Semaine" },
            ]}
            value={mode}
            onChange={setMode}
          />
          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="icon-sm" aria-label="Précédent" onClick={() => shift(-1)}>
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setAnchor(new Date())}>
              Aujourd&apos;hui
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label="Suivant" onClick={() => shift(1)}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
          <p className="min-w-0 truncate text-[15px] font-semibold text-foreground first-letter:uppercase">{title}</p>
          <div className="ml-auto flex items-center gap-2">
            {mode === "day" && (
              <Segmented
                size="sm"
                options={[
                  { value: "instructor", label: "Moniteurs" },
                  { value: "vehicle", label: "Véhicules" },
                ]}
                value={groupBy}
                onChange={setGroupBy}
              />
            )}
            {canEdit && (
              <Button size="sm" onClick={() => setDraft({ day: dayKey(day >= new Date(new Date(now).toDateString()) ? day : new Date(now)) })}>
                <Plus /> Nouvelle leçon
              </Button>
            )}
          </div>
        </div>

        {/* moniteurs : légende et filtre */}
        {data && data.instructors.length > 1 && (
          <div className="flex flex-wrap items-center gap-1.5 border-b border-border px-4 py-2.5 sm:px-5">
            {data.instructors.map((i) => {
              const off = hidden.has(i.id);
              const count = lessons.filter((l) => l.instructor?.id === i.id && l.status !== "CANCELLED" && (mode === "week" || dayKey(new Date(l.startsAt)) === dayKey(day))).length;
              return (
                <button
                  key={i.id}
                  type="button"
                  aria-pressed={!off}
                  onClick={() =>
                    setHidden((current) => {
                      const next = new Set(current);
                      if (next.has(i.id)) next.delete(i.id);
                      else if (next.size < data.instructors.length - 1) next.add(i.id);
                      return next;
                    })
                  }
                  className={cn(
                    "inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium transition-colors",
                    off ? "border-dashed border-border text-muted-foreground/70" : "border-border bg-card text-foreground hover:bg-subtle",
                  )}
                >
                  <span className="size-2 rounded-full" style={{ background: off ? "transparent" : colorOf(i.id), boxShadow: `inset 0 0 0 1.5px ${colorOf(i.id)}` }} />
                  {i.firstName}
                  <span className="text-muted-foreground tabular">{count}</span>
                </button>
              );
            })}
            {canEdit && <span className="ml-auto hidden text-xs text-muted-foreground md:inline">Glissez une leçon pour la déplacer · cliquez sur un créneau libre pour en créer une</span>}
          </div>
        )}

        {isError ? (
          <p className="flex items-center gap-2 px-5 py-10 text-sm text-muted-foreground">
            <TriangleAlert className="size-4 text-warning" /> Chargement impossible, réessayez dans un instant.
          </p>
        ) : isLoading || !data ? (
          <Skeleton className="m-5 h-[520px] rounded-xl" />
        ) : columns.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">Aucun moniteur à afficher.</p>
        ) : (
          <div className="max-h-[min(72vh,820px)] overflow-auto">
            <div className="relative" style={{ minWidth: 56 + columns.length * (mode === "week" ? 120 : 150) }}>
              {/* en-têtes de colonnes */}
              <div className="sticky top-0 z-20 flex border-b border-border bg-card/95 backdrop-blur">
                <div className="w-14 shrink-0" />
                <div className="grid flex-1" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}>
                  {columns.map((col) => {
                    const today = mode === "week" && dayKey(col.day) === todayKey;
                    const count = visible.filter((l) => col.match(l) && l.status !== "CANCELLED").length;
                    return (
                      <div key={col.key} className="flex min-w-0 items-center gap-2 border-l border-border px-3 py-2.5">
                        {mode === "week" ? (
                          <button type="button" onClick={() => (setAnchor(col.day), setMode("day"))} className="flex items-center gap-2 text-left" title="Voir la journée">
                            <span className="text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">{col.label}</span>
                            <span className={cn("grid size-7 place-items-center rounded-full text-sm font-semibold tabular", today ? "bg-primary text-white" : "text-foreground")}>{col.sub}</span>
                          </button>
                        ) : (
                          <>
                            {groupBy === "vehicle" ? (
                              <span className="relative grid size-7 shrink-0 place-items-center rounded-full bg-secondary text-muted-foreground">
                                <CarFront className="size-3.5" />
                                <span className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-card" style={{ background: col.color ?? "var(--muted-foreground)" }} />
                              </span>
                            ) : (
                              <span className="grid size-7 shrink-0 place-items-center rounded-full text-[11px] font-semibold text-white" style={{ background: col.color }}>
                                {col.label.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                              </span>
                            )}
                            <span className="min-w-0">
                              <span className="block truncate text-[13px] font-semibold text-foreground">{col.label}</span>
                              {col.sub && <span className={cn("block truncate text-[11px]", /garage|service/i.test(col.sub) ? "text-warning" : "text-muted-foreground")}>{col.sub}</span>}
                            </span>
                          </>
                        )}
                        <span className="ml-auto shrink-0 rounded-full bg-secondary px-1.5 text-[11px] text-muted-foreground tabular">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <motion.div
                key={`${mode}-${groupBy}-${mode === "day" ? dayKey(day) : dayKey(weekStart)}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: EASE_OUT }}
                className="flex"
              >
                {/* heures */}
                <div className="relative w-14 shrink-0" style={{ height: GRID_HEIGHT }}>
                  {HOURS.map((h, i) => (
                    <span key={h} className="absolute right-2 -translate-y-1/2 text-[11px] text-muted-foreground tabular" style={{ top: i * HOUR_PX }}>
                      {i === 0 ? "" : `${h}h`}
                    </span>
                  ))}
                </div>

                <div ref={colsRef} className="relative grid flex-1 select-none" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))`, height: GRID_HEIGHT }}>
                  {columns.map((col, colIndex) => {
                    const own = visible.filter((l) => col.match(l) && l.id !== drag?.id);
                    const dragged = drag && drag.col === colIndex ? lessons.find((l) => l.id === drag.id) : null;
                    const lanes = layoutLanes(own.filter((l) => l.status !== "CANCELLED"));
                    const closed = mode === "day" && groupBy === "vehicle" && /garage|service/i.test(col.sub ?? "");
                    const isToday = dayKey(col.day) === todayKey;
                    const pastUntil = dayKey(col.day) < todayKey ? GRID_HEIGHT : isToday ? clamp(((nowMinutes - PLANNER_START_HOUR * 60) / 60) * HOUR_PX, 0, GRID_HEIGHT) : 0;
                    return (
                      <div
                        key={col.key}
                        className={cn("relative border-l border-border", closed && "bg-[repeating-linear-gradient(135deg,transparent_0_8px,var(--subtle)_8px_16px)]")}
                        onMouseMove={(e) => setHover({ col: colIndex, minutes: slotAt(e) })}
                        onMouseLeave={() => setHover(null)}
                        onClick={(e) => {
                          const minutes = slotAt(e);
                          if (!slotOpen(col, minutes)) return;
                          setDraft({ day: dayKey(col.day), time: toTime(minutes), instructorId: col.instructorId ?? null, vehicleId: col.vehicleId ?? null });
                        }}
                      >
                        {/* lignes d'heures et passé grisé */}
                        {HOURS.map((h, i) => (
                          <div key={h} className="pointer-events-none absolute inset-x-0 border-t border-border/70" style={{ top: i * HOUR_PX }}>
                            <div className="absolute inset-x-0 border-t border-dashed border-border/40" style={{ top: HOUR_PX / 2 }} />
                          </div>
                        ))}
                        {pastUntil > 0 && <div className="pointer-events-none absolute inset-x-0 top-0 bg-subtle/55" style={{ height: pastUntil }} />}

                        {hover?.col === colIndex && slotOpen(col, hover.minutes) && (
                          <div
                            className="pointer-events-none absolute inset-x-1 flex items-center gap-1 rounded-lg border border-dashed border-primary/40 bg-primary-soft/40 px-2 text-[11px] font-medium text-primary"
                            style={{ top: ((hover.minutes - PLANNER_START_HOUR * 60) / 60) * HOUR_PX + 1, height: HOUR_PX - 2 }}
                          >
                            <Plus className="size-3" /> {toTime(hover.minutes)}
                          </div>
                        )}

                        {own.map((lesson) => (
                          <LessonBlock
                            key={lesson.id}
                            lesson={lesson}
                            mode={mode}
                            groupBy={groupBy}
                            color={colorOf(lesson.instructor?.id)}
                            lane={lanes.get(lesson.id)}
                            now={now}
                            canEdit={canEdit}
                            ghost={false}
                            onPointerDown={(e) => startDrag(e, lesson, colIndex)}
                            onOpen={() => setDetailId(lesson.id)}
                          />
                        ))}
                        {drag && lessons.find((l) => l.id === drag.id) && col.match(lessons.find((l) => l.id === drag.id)!) && (
                          <PlaceholderOf lesson={lessons.find((l) => l.id === drag.id)!} />
                        )}
                        {dragged && (
                          <LessonBlock
                            lesson={{ ...dragged, startsAt: new Date(col.day.getFullYear(), col.day.getMonth(), col.day.getDate(), Math.floor(drag!.minutes / 60), drag!.minutes % 60).toISOString() }}
                            mode={mode}
                            groupBy={groupBy}
                            color={colorOf(col.instructorId ?? dragged.instructor?.id)}
                            now={now}
                            canEdit
                            ghost
                            blocked={target(dragged, col, drag!.minutes).conflicts[0]?.message}
                          />
                        )}

                        {isToday && nowMinutes >= PLANNER_START_HOUR * 60 && nowMinutes <= PLANNER_END_HOUR * 60 && (
                          <div className="pointer-events-none absolute inset-x-0 z-[3] h-0.5 bg-danger" style={{ top: ((nowMinutes - PLANNER_START_HOUR * 60) / 60) * HOUR_PX }}>
                            {colIndex === 0 && <span className="absolute -top-[3px] -left-1 size-2 rounded-full bg-danger" />}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </Card>

      <LessonFormDialog draft={draft} onOpenChange={(open) => !open && setDraft(null)} data={data as LessonsPayload | undefined} />
      <LessonDetailDialog
        lesson={detail}
        canEdit={canEdit}
        onOpenChange={(open) => !open && setDetailId(null)}
        onEdit={(lesson) => {
          setDetailId(null);
          setDraft({ lesson });
        }}
      />
    </div>
  );
}

function PlaceholderOf({ lesson }: { lesson: LessonDto }) {
  const start = new Date(lesson.startsAt);
  return (
    <div
      className="pointer-events-none absolute inset-x-1 rounded-lg border-2 border-dashed border-border"
      style={{ top: ((minutesOfDay(start) - PLANNER_START_HOUR * 60) / 60) * HOUR_PX + 1, height: (lesson.durationMinutes / 60) * HOUR_PX - 2 }}
    />
  );
}

function LessonBlock({
  lesson,
  mode,
  groupBy,
  color,
  lane,
  now,
  canEdit,
  ghost,
  onPointerDown,
  onOpen,
  blocked,
}: {
  lesson: LessonDto;
  mode: Mode;
  groupBy: GroupBy;
  color: string;
  lane?: { lane: number; lanes: number };
  now: number;
  canEdit: boolean;
  ghost: boolean;
  onPointerDown?: (event: ReactPointerEvent) => void;
  onOpen?: () => void;
  /** Pendant un déplacement : raison pour laquelle le créneau visé est refusé. */
  blocked?: string;
}) {
  const start = new Date(lesson.startsAt);
  const top = ((minutesOfDay(start) - PLANNER_START_HOUR * 60) / 60) * HOUR_PX;
  const height = (lesson.durationMinutes / 60) * HOUR_PX;
  const live = isLive(lesson, now);
  const cancelled = lesson.status === "CANCELLED";
  const done = lesson.status === "DONE" || (!cancelled && !live && lessonEnd(lesson) <= now);
  const movable = canEdit && lesson.status === "PLANNED" && start.getTime() > now;
  const lanes = lane?.lanes ?? 1;
  const width = `calc((100% - 8px) / ${lanes})`;
  const left = `calc(4px + (100% - 8px) / ${lanes} * ${lane?.lane ?? 0})`;
  const secondary = mode === "week" ? lesson.instructor?.firstName : groupBy === "instructor" ? lesson.vehicle?.name : lesson.instructor?.firstName;
  const progress = live ? (now - start.getTime()) / (lessonEnd(lesson) - start.getTime()) : 0;
  const compact = height < 50;

  return (
    <div
      role="button"
      tabIndex={ghost ? -1 : 0}
      onPointerDown={onPointerDown}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onOpen?.())}
      title={`${lesson.student.firstName} ${lesson.student.lastName} · ${formatTime(start)} – ${formatTime(new Date(lessonEnd(lesson)))}${lesson.vehicle ? ` · ${lesson.vehicle.name}` : ""}`}
      className={cn(
        "group absolute z-[5] flex flex-col overflow-hidden rounded-lg border-l-[3px] px-2 py-1 text-left outline-none transition-[box-shadow,opacity]",
        movable ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
        ghost && "z-30 cursor-grabbing shadow-[0_12px_32px_-8px_rgb(15_40_84/0.35)] ring-2 ring-primary/40",
        blocked && "ring-danger",
        !ghost && "hover:shadow-[0_4px_14px_-4px_rgb(15_40_84/0.25)] focus-visible:ring-2 focus-visible:ring-primary",
        cancelled && "z-[4] opacity-60",
        done && !ghost && "opacity-75",
      )}
      style={{
        top: top + 1,
        height: Math.max(22, height - 2),
        left: cancelled ? "4px" : left,
        width: cancelled ? "calc(100% - 8px)" : width,
        borderLeftColor: color,
        background: blocked
          ? "var(--danger-soft)"
          : cancelled
          ? `repeating-linear-gradient(135deg, var(--card) 0 6px, var(--subtle) 6px 12px)`
          : `color-mix(in srgb, ${color} ${done ? 7 : 13}%, var(--card))`,
      }}
    >
      <span className={cn("flex items-center gap-1 truncate text-[12px] leading-tight font-semibold text-foreground", cancelled && "line-through decoration-foreground/40")}>
        {live && (
          <span className="relative flex size-1.5 shrink-0">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-70" />
            <span className="relative inline-flex size-1.5 rounded-full bg-success" />
          </span>
        )}
        {lesson.status === "DONE" && <Check className="size-3 shrink-0 text-success" />}
        <span className="truncate">
          {lesson.student.firstName} {mode === "week" ? `${lesson.student.lastName.charAt(0)}.` : lesson.student.lastName}
        </span>
      </span>
      {!compact && (
        <span className="truncate text-[11px] text-muted-foreground tabular">
          {formatTime(start)} – {formatTime(new Date(lessonEnd(lesson)))}
          {cancelled ? " · annulée" : ""}
        </span>
      )}
      {blocked && <span className="truncate text-[11px] font-semibold text-danger">{blocked}</span>}
      {!blocked && !compact && secondary && height >= 70 && <span className="truncate text-[11px] font-medium" style={{ color }}>{secondary}</span>}
      {lesson.report?.issues.length ? <TriangleAlert className="absolute top-1 right-1 size-3 text-warning" /> : null}
      {live && (
        <span className="absolute inset-x-0 bottom-0 h-1 bg-success/15">
          <motion.span className="block h-full bg-success" initial={{ width: 0 }} animate={{ width: `${progress * 100}%` }} transition={{ duration: 0.8, ease: EASE_OUT }} />
        </span>
      )}
    </div>
  );
}
