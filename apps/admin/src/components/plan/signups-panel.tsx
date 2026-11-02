"use client";

import { Clock3, UserPlus } from "lucide-react";
import Link from "next/link";

import type { PlanSignups } from "@/lib/plan-types";

import { EmptyNote, HighlightCard, ScheduleRow, SectionTitle, Stat, StatBar, WarningLink } from "./panel-ui";

const STEP_COLORS = ["#94a3b8", "#f59e0b", "#8b5cf6", "#2D50F5", "#0E9F8E"];
const time = (iso: string) => new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
const shortDay = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" });

/** « il y a 2 h », « hier », « il y a 5 j » */
function ago(iso: string) {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (minutes < 60) return `il y a ${Math.max(1, minutes)} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.round(hours / 24);
  return days === 1 ? "hier" : `il y a ${days} j`;
}

/** Panneau Inscriptions du plan, dans le même style que Planning et Examens. */
export function SignupsPanel({ signups }: { signups: PlanSignups }) {
  const oldest = signups.stalled[0];
  const latest = signups.recent[0];
  const max = Math.max(1, ...signups.steps.map((s) => s.count));

  return (
    <div className="space-y-5 px-5 pt-4 pb-1">
      {/* chiffres clés */}
      <StatBar>
        <Stat label="Nouveaux 7 j" value={signups.week} />
        <Stat label="En cours" value={signups.inProgress} />
        <Stat label="Conversion 30 j" value={signups.conversion === null ? "—" : `${signups.conversion} %`} />
      </StatBar>

      {/* le dossier qui attend le plus, sinon la dernière inscription */}
      {oldest ? (
        <section className="space-y-2">
          <SectionTitle>Attend une action</SectionTitle>
          <HighlightCard href={oldest.href}>
            <span className="flex items-center gap-2">
              <Clock3 className="size-4 shrink-0 text-primary" />
              <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-foreground">{oldest.student}</span>
              <span className="shrink-0 text-xs font-medium text-primary tabular-nums">depuis {oldest.days} j</span>
            </span>
            <span className="mt-1 block pl-6 text-xs text-muted-foreground">{oldest.reason}</span>
          </HighlightCard>
        </section>
      ) : latest ? (
        <section className="space-y-2">
          <SectionTitle>Dernière inscription</SectionTitle>
          <HighlightCard href={latest.href}>
            <span className="flex items-center gap-2">
              <UserPlus className="size-4 shrink-0 text-primary" />
              <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-foreground">{latest.student}</span>
              <span className="shrink-0 text-xs font-medium text-primary tabular-nums">{ago(latest.createdAt)}</span>
            </span>
            <span className="mt-1 block pl-6 text-xs text-muted-foreground">
              {latest.permit} · {latest.stage}
            </span>
          </HighlightCard>
        </section>
      ) : null}

      {/* parcours du dossier */}
      <section>
        <SectionTitle>Parcours d&apos;inscription</SectionTitle>
        <div className="mt-2.5 space-y-2">
          {signups.steps.map((step, index) => (
            <Link key={step.status} href={step.href} className="group flex items-center gap-2.5" title={`${step.count} dossier${step.count > 1 ? "s" : ""} · ${step.label}`}>
              <span className="w-[76px] shrink-0 truncate text-xs font-medium text-foreground group-hover:text-primary">{step.label}</span>
              <span className="relative h-6 flex-1 rounded-md bg-secondary/80">
                {step.count > 0 && (
                  <span
                    className="absolute inset-y-0.5 left-0.5 rounded-[4px] transition-opacity group-hover:opacity-80"
                    style={{ width: `calc(${(step.count / max) * 100}% - 4px)`, background: STEP_COLORS[index] }}
                  />
                )}
              </span>
              <span className="w-6 shrink-0 text-right text-[13px] font-semibold text-foreground tabular-nums">{step.count}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* nouvelles inscriptions */}
      <section>
        <SectionTitle count={signups.recent.length}>Nouvelles inscriptions</SectionTitle>
        {signups.recent.length === 0 ? (
          <EmptyNote>Aucune inscription pour le moment.</EmptyNote>
        ) : (
          <ul className="mt-1.5 -mx-2">
            {signups.recent.map((r) => (
              <ScheduleRow
                key={r.id}
                href={r.href}
                lead={shortDay(r.createdAt)}
                leadSub={time(r.createdAt)}
                color="#2D50F5"
                title={r.student}
                subtitle={`${r.permit} · ${r.stage}`}
              />
            ))}
          </ul>
        )}
      </section>

      {/* dossiers bloqués */}
      {signups.stalled.length > 0 && (
        <section>
          <SectionTitle count={signups.stalled.length}>À relancer</SectionTitle>
          <ul className="mt-1.5 -mx-2">
            {signups.stalled.map((s) => (
              <ScheduleRow key={s.id} href={s.href} lead={`${s.days} j`} leadSub="sans suite" color="#f59e0b" title={s.student} subtitle={s.reason} />
            ))}
          </ul>
        </section>
      )}

      {signups.stalled.length > 0 && (
        <WarningLink href="/admin/applications?status=DOCUMENTS_PENDING" icon={<Clock3 className="size-4 shrink-0" />}>
          {signups.stalled.length} dossier{signups.stalled.length > 1 ? "s" : ""} sans avancée depuis plus de 7 jours
        </WarningLink>
      )}
    </div>
  );
}
