"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarDays, CalendarPlus, ChevronRight, History, MapPin, UsersRound } from "lucide-react";
import { useMemo, useState } from "react";

import { CapacityMeter, DateTile, MonthCalendar, dayKey, formatLongDay, formatTimeRange, isPast, placesLeft, startOfMonth } from "./calendar-shared";
import { SessionDetailDialog, SessionFormDialog, type StaffSession } from "./session-dialogs";
import { SessionHistorySheet } from "./session-history-sheet";
import { TheoryWeek } from "./theory-week";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Segmented } from "@/components/ui/segmented";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { cn } from "@/lib/utils";

type View = "upcoming" | "past";
type Layout = "month" | "week";

/** Séances de code collectives : calendrier du mois ou de la semaine, inscriptions et appel. */
export function TheoryCalendar({ initialSessionId }: { initialSessionId?: string | null }) {
  const [layout, setLayout] = useState<Layout>("month");
  const [week, setWeek] = useState(() => new Date());
  const [defaultTime, setDefaultTime] = useState<string | null>(null);
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [view, setView] = useState<View>("upcoming");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<StaffSession | null>(null);
  // ?session=… ouvre directement la fiche d'une séance (lien depuis le plan)
  const [detailId, setDetailId] = useState<string | null>(initialSessionId ?? null);
  const [historyOpen, setHistoryOpen] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["sessions", "staff"],
    queryFn: async () => {
      const res = await fetch("/api/sessions");
      if (!res.ok) throw new Error("Chargement impossible");
      return (await res.json()).sessions as StaffSession[];
    },
  });
  const sessions = useMemo(() => data ?? [], [data]);
  const detail = sessions.find((s) => s.id === detailId) ?? null;

  const upcoming = sessions.filter((s) => !isPast(s));
  const past = sessions.filter((s) => isPast(s)).reverse();
  const listed = selectedDay
    ? sessions.filter((s) => dayKey(new Date(s.startsAt)) === selectedDay)
    : view === "upcoming"
      ? upcoming
      : past;

  const seatsOpen = upcoming.reduce((sum, s) => sum + placesLeft(s), 0);
  const registrations = upcoming.reduce((sum, s) => sum + s.registeredCount, 0);
  const capacity = upcoming.reduce((sum, s) => sum + s.capacity, 0);

  function openCreate(day: string | null = selectedDay, time: string | null = null) {
    setEditing(null);
    if (day !== selectedDay) setSelectedDay(day);
    setDefaultTime(time);
    setFormOpen(true);
  }

  return (
    <div className="space-y-6">

      <Stagger className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
        <StaggerItem>
          <StatCard label="Sessions à venir" value={upcoming.length} icon={<CalendarDays />} className="h-full" />
        </StaggerItem>
        <StaggerItem>
          <StatCard label="Élèves inscrits" value={registrations} icon={<UsersRound />} className="h-full" />
        </StaggerItem>
        <StaggerItem className="col-span-2 xl:col-span-1">
          <StatCard
            label="Places encore libres"
            value={seatsOpen}
            icon={<CalendarPlus />}
            className="h-full"
            hint={capacity ? `Taux de remplissage : ${Math.round((registrations / capacity) * 100)} %` : undefined}
          />
        </StaggerItem>
      </Stagger>

      <div className={cn("grid grid-cols-[minmax(0,1fr)] items-start gap-5", layout === "month" && "xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]")}>
        <FadeIn delay={0.08}>
          <Card className="gap-0 p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-2 border-b border-border pb-4">
              <Segmented
                size="sm"
                options={[
                  { value: "month", label: "Mois" },
                  { value: "week", label: "Semaine" },
                ]}
                value={layout}
                onChange={setLayout}
              />
              <div className="ml-auto flex items-center gap-2">
                <Button variant="outline" size="icon-sm" onClick={() => setHistoryOpen(true)} aria-label="Historique des séances et des appels" title="Historique des séances">
                  <History />
                </Button>
                <Button size="sm" onClick={() => openCreate()}>
                  <CalendarPlus /> Nouvelle séance
                </Button>
              </div>
            </div>
            {isLoading ? (
              <Skeleton className="h-[420px] rounded-xl" />
            ) : layout === "week" ? (
              <TheoryWeek
                week={week}
                onWeekChange={setWeek}
                sessions={sessions}
                onSelectSession={(s) => setDetailId(s.id)}
                onCreate={(day, time) => openCreate(day, time)}
              />
            ) : (
              <MonthCalendar
                month={month}
                onMonthChange={(m) => {
                  setMonth(m);
                  setSelectedDay(null);
                }}
                sessions={sessions}
                selectedDay={selectedDay}
                onSelectDay={(key) => setSelectedDay((current) => (current === key ? null : key))}
                onSelectSession={(s) => setDetailId(s.id)}
                sessionTone={(s) => (isPast(s) ? "muted" : placesLeft(s) === 0 ? "warning" : "primary")}
              />
            )}
          </Card>
        </FadeIn>

        <FadeIn delay={0.14}>
          <Card className="gap-0 p-0">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
              {selectedDay ? (
                <>
                  <div>
                    <p className="text-[15px] font-semibold text-foreground">{formatLongDay(new Date(`${selectedDay}T12:00`))}</p>
                    <button type="button" onClick={() => setSelectedDay(null)} className="text-xs font-medium text-primary hover:text-primary-strong">
                      Voir toutes les sessions
                    </button>
                  </div>
                  {selectedDay >= dayKey(new Date()) && (
                    <Button size="sm" variant="outline" onClick={() => openCreate()}>
                      <CalendarPlus /> Ajouter
                    </Button>
                  )}
                </>
              ) : (
                <Segmented
                  size="sm"
                  options={[
                    { value: "upcoming", label: `À venir (${upcoming.length})` },
                    { value: "past", label: "Passées" },
                  ]}
                  value={view}
                  onChange={setView}
                />
              )}
            </div>

            {isError ? (
              <EmptyState compact icon={CalendarDays} title="Chargement impossible" description="Rechargez la page dans un instant." />
            ) : isLoading ? (
              <div className="space-y-3 p-5">
                <Skeleton className="h-20 rounded-xl" />
                <Skeleton className="h-20 rounded-xl" />
              </div>
            ) : listed.length === 0 ? (
              <EmptyState
                compact
                icon={CalendarDays}
                title={selectedDay ? "Aucune session ce jour-là" : view === "upcoming" ? "Aucune session prévue" : "Aucune session passée"}
                description={view === "upcoming" || selectedDay ? "Créez une date : les élèves seront prévenus pour s'inscrire." : undefined}
                action={
                  (view === "upcoming" || (selectedDay && selectedDay >= dayKey(new Date()))) ? (
                    <Button size="sm" onClick={() => openCreate()}>
                      <CalendarPlus /> Nouvelle session
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <ul className="divide-y divide-border">
                {listed.map((s) => {
                  const start = new Date(s.startsAt);
                  const done = isPast(s);
                  return (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => setDetailId(s.id)}
                        className="group flex w-full items-center gap-3.5 px-5 py-4 text-left transition-colors hover:bg-subtle/60"
                      >
                        <DateTile date={start} muted={done} />
                        <span className="min-w-0 flex-1 space-y-1.5">
                          <span className="block truncate text-sm font-semibold text-foreground">{s.title}</span>
                          <span className="block text-xs text-muted-foreground">
                            <span className="tabular">{formatTimeRange(s)}</span>
                          </span>
                          <span className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="size-3 shrink-0" />
                            <span className="truncate">{s.location}</span>
                          </span>
                          <CapacityMeter registered={s.registeredCount} capacity={s.capacity} className={cn("pt-1", done && "opacity-70")} />
                        </span>
                        <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </FadeIn>
      </div>

      <SessionHistorySheet sessions={sessions} open={historyOpen} onOpenChange={setHistoryOpen} />
      <SessionFormDialog open={formOpen} onOpenChange={setFormOpen} session={editing} defaultDay={selectedDay} defaultTime={defaultTime} />
      <SessionDetailDialog
        session={detail}
        onOpenChange={(open) => !open && setDetailId(null)}
        onEdit={(s) => {
          setDetailId(null);
          setEditing(s);
          setFormOpen(true);
        }}
      />
    </div>
  );
}
