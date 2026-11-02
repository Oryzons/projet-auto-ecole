"use client";

import { CalendarClock, MapPin, UserRoundCheck } from "lucide-react";
import Link from "next/link";

import type { PlanExams } from "@/lib/plan-types";
import { cn } from "@/lib/utils";

import { EmptyNote, HighlightCard, ScheduleRow, SectionTitle, Stat, StatBar, WarningLink } from "./panel-ui";

const DAY = 86_400_000;
const SPAN = 14;
const KINDS = [
  { value: "CODE", label: "Code", color: "#2D50F5" },
  { value: "DRIVING", label: "Conduite", color: "#0E9F8E" },
] as const;
const kindOf = (value: string) => KINDS.find((k) => k.value === value) ?? { value, label: "Examen", color: "#94a3b8" };

const time = (iso: string) => new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
const shortDay = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" });
const longDay = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
const tickDay = (d: Date) => d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
const hoursLabel = (h: number) => `${Math.round(h * 10) / 10} h`.replace(".", ",");

/** « Aujourd'hui », « Demain » ou « J-4 » */
function countdown(iso: string) {
  const days = Math.round((startOfDay(new Date(iso)) - startOfDay(new Date())) / DAY);
  return days <= 0 ? "Aujourd'hui" : days === 1 ? "Demain" : `J-${days}`;
}

/** Panneau Espace examens du plan, dans le même style que le panneau Planning. */
export function ExamsPanel({ exams }: { exams: PlanExams }) {
  const today = startOfDay(new Date());
  const next = exams.upcoming[0];
  // position sur la frise des 14 prochains jours, en pourcentage
  const pos = (iso: string) => `${Math.min(100, Math.max(0, ((new Date(iso).getTime() - today) / (SPAN * DAY)) * 100))}%`;
  const soon = exams.upcoming.filter((e) => new Date(e.date).getTime() < today + SPAN * DAY);
  const nowPos = `${((Date.now() - today) / (SPAN * DAY)) * 100}%`;

  return (
    <div className="space-y-5 px-5 pt-4 pb-1">
      {/* chiffres clés */}
      <StatBar>
        <Stat label="À venir" value={exams.upcoming.length} />
        <Stat label="Prêts à inscrire" value={exams.ready.length} warn={exams.ready.length > 0} />
        <Stat label="Réussite 60 j" value={exams.passRate === null ? "—" : `${exams.passRate} %`} />
      </StatBar>

      {/* prochain examen */}
      {next && (
        <section className="space-y-2">
          <SectionTitle>Prochain examen</SectionTitle>
          <HighlightCard href={next.href}>
            <span className="flex items-center gap-2">
              <CalendarClock className="size-4 shrink-0 text-primary" />
              <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-foreground">{next.student}</span>
              <span className="shrink-0 text-xs font-medium text-primary tabular-nums">{countdown(next.date)}</span>
            </span>
            <span className="mt-1 flex items-center gap-1.5 pl-6 text-xs text-muted-foreground">
              <span className="first-letter:uppercase">{longDay(next.date)}</span> · <span className="tabular-nums">{time(next.date)}</span> · {kindOf(next.kind).label}
            </span>
            <span className="mt-0.5 flex items-center gap-1.5 pl-6 text-xs text-muted-foreground">
              <MapPin className="size-3 shrink-0" />
              <span className="truncate">{next.location ?? "Lieu à confirmer"}</span>
            </span>
          </HighlightCard>
        </section>
      )}

      {/* frise des 14 prochains jours */}
      <section>
        <SectionTitle>Les 14 prochains jours</SectionTitle>
        <div className="mt-2.5 space-y-2">
          {KINDS.map((kind) => {
            const own = soon.filter((e) => e.kind === kind.value);
            // plusieurs examens le même jour : une seule pastille avec leur nombre
            const byDay = own.reduce<PlanExams["upcoming"][]>((groups, e) => {
              const group = groups.find((g) => startOfDay(new Date(g[0]!.date)) === startOfDay(new Date(e.date)));
              if (group) group.push(e);
              else groups.push([e]);
              return groups;
            }, []);
            return (
              <div key={kind.value} className="flex items-center gap-2.5">
                <span className="w-14 shrink-0 truncate text-xs font-medium text-foreground">{kind.label}</span>
                <div className="relative h-6 flex-1 rounded-md bg-secondary/80" title={`${own.length} examen${own.length > 1 ? "s" : ""} de ${kind.label.toLowerCase()}`}>
                  {[7].map((d) => (
                    <span key={d} className="absolute inset-y-1 w-px bg-border" style={{ left: `${(d / SPAN) * 100}%` }} />
                  ))}
                  {byDay.map((group) => (
                    <Link
                      key={group[0]!.id}
                      href={group[0]!.href}
                      title={`${longDay(group[0]!.date)} · ${group.map((e) => `${e.student} ${time(e.date)}`).join(", ")}`}
                      className={cn(
                        "absolute top-1/2 grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full text-[9.5px] font-bold text-white ring-2 ring-card transition-transform hover:scale-125",
                        group.length > 1 ? "size-4" : "size-3",
                      )}
                      style={{ left: pos(group[0]!.date), background: kind.color }}
                    >
                      {group.length > 1 ? group.length : null}
                    </Link>
                  ))}
                  <span className="absolute -inset-y-1 w-0.5 rounded-full bg-red-500" style={{ left: nowPos }} />
                </div>
              </div>
            );
          })}
          <div className="flex pl-[66px] text-[10.5px] whitespace-nowrap text-muted-foreground tabular-nums">
            <div className="relative h-3 flex-1">
              {[0, 7, 14].map((d) => (
                <span key={d} className={cn("absolute", d === 0 ? "" : d === SPAN ? "-translate-x-full" : "-translate-x-1/2")} style={{ left: `${(d / SPAN) * 100}%` }}>
                  {d === 0 ? "auj." : tickDay(new Date(today + d * DAY))}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* programme */}
      <section>
        <SectionTitle count={exams.upcoming.length}>À venir</SectionTitle>
        {exams.upcoming.length === 0 ? (
          <EmptyNote>Aucun examen programmé.</EmptyNote>
        ) : (
          <ul className="mt-1.5 -mx-2">
            {exams.upcoming.map((e) => (
              <ScheduleRow
                key={e.id}
                href={e.href}
                lead={shortDay(e.date)}
                leadSub={time(e.date)}
                color={kindOf(e.kind).color}
                title={e.student}
                subtitle={`${kindOf(e.kind).label} · ${e.location ?? "lieu à confirmer"}`}
              />
            ))}
          </ul>
        )}
      </section>

      {exams.ready.length > 0 && (
        <section>
          <SectionTitle count={exams.ready.length}>Prêts à passer l&apos;examen</SectionTitle>
          <ul className="mt-1.5 -mx-2">
            {exams.ready.map((s) => (
              <ScheduleRow key={s.id} href={s.href} lead={hoursLabel(s.hours)} leadSub="faites" color="#f59e0b" title={s.student} subtitle="Prêt pour l'examen pratique · sans date" />
            ))}
          </ul>
        </section>
      )}

      {exams.recent.length > 0 && (
        <section>
          <SectionTitle count={exams.recent.length}>Résultats récents</SectionTitle>
          <ul className="mt-1.5 -mx-2">
            {exams.recent.map((r) => (
              <ScheduleRow
                key={r.id}
                href={r.href}
                lead={shortDay(r.date)}
                leadSub={kindOf(r.kind).label}
                color={kindOf(r.kind).color}
                title={r.student}
                subtitle={r.passed ? "Examen réussi" : "À repasser"}
                muted
                trailing={
                  <span className={cn("shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-semibold", r.passed ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600")}>
                    {r.passed ? "Reçu" : "Ajourné"}
                  </span>
                }
              />
            ))}
          </ul>
        </section>
      )}

      {exams.ready.length > 0 && (
        <WarningLink href={exams.ready[0]!.href} icon={<UserRoundCheck className="size-4 shrink-0" />}>
          {exams.ready.length} élève{exams.ready.length > 1 ? "s prêts" : " prêt"} sans date d&apos;examen
        </WarningLink>
      )}
    </div>
  );
}
