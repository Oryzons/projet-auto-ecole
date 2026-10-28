import { ArrowUpRight, BookOpenCheck, CalendarClock, Download, TrendingUp, TriangleAlert, UsersRound, Wallet, type LucideIcon } from 'lucide-react';
import Link from 'next/link';

import { euro } from '@virage/shared/format';
import { adminKpis, exams, instructors, planningGrid, planningHours, recentActivity } from '@virage/shared/mock';
import type { Tone } from '@virage/shared/theme';

import { DocsReview } from '@/components/dashboard/docs-review';
import { RevenueChart } from '@/components/dashboard/revenue-chart';
import { Avatar, PageHeader } from '@/components/ui';

import s from './dashboard.module.css';

// la date du jour est calculée à chaque visite
export const dynamic = 'force-dynamic';

export default function Dashboard() {
  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  const k = adminKpis;

  return (
    <>
      <PageHeader
        title="Bonjour Sophie"
        subtitle={`${today.charAt(0).toUpperCase()}${today.slice(1)} · ${k.lessonsToday} leçons au planning aujourd’hui`}
        actions={
          <button className="btn btn-ghost">
            <Download size={16} /> Exporter
          </button>
        }
      />

      <section className={s.kpis}>
        <Kpi icon={Wallet} tone="primary" label="Chiffre d’affaires d’octobre" value={euro(k.revenueMonth)} trend={k.revenueDelta} delay={0} />
        <Kpi icon={TriangleAlert} tone="danger" label="Impayés" value={euro(k.unpaid)} hint={`${k.unpaidCount} élèves à relancer`} delay={1} />
        <Kpi icon={UsersRound} tone="violet" label="Élèves actifs" value={String(k.activeStudents)} hint={`${k.docsToReview} dossiers à vérifier`} delay={2} />
        <Kpi icon={BookOpenCheck} tone="success" label="Taux de réussite" value={`${Math.round(k.successRate * 100)} %`} hint="Moyenne nationale : 59 %" delay={3} />
      </section>

      <section className={s.row}>
        <div className="card fade-in" style={{ animationDelay: '0.08s' }}>
          <div className="card-head">
            <div>
              <h2 className="card-title">Chiffre d’affaires</h2>
              <p className="small" style={{ margin: '2px 0 0' }}>
                6 derniers mois, encaissements TTC
              </p>
            </div>
            <span className="badge tone-success">
              <TrendingUp size={13} /> {k.revenueDelta}
            </span>
          </div>
          <RevenueChart />
        </div>
        <DocsReview />
      </section>

      <section className={s.row}>
        <div className="card fade-in" style={{ animationDelay: '0.16s' }}>
          <div className="card-head">
            <h2 className="card-title">Planning du jour</h2>
            <Link href="/planning" className="link" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              Ouvrir le planning <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className={s.timeline}>
            <div className={s.hours}>
              <span />
              {planningHours.map((h) => (
                <span key={h}>{h}h</span>
              ))}
            </div>
            {instructors.map((m) => {
              const day = planningGrid[m.id] ?? {};
              return (
                <div key={m.id} className={s.lane}>
                  <div className={s.who}>
                    <Avatar name={m.name} size={30} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{m.name.split(' ')[0]}</div>
                      <div className="small" style={{ fontSize: 11.5 }}>{m.today}</div>
                    </div>
                  </div>
                  {planningHours.map((h) => {
                    const slot = day[h];
                    if (slot === 'off') return <span key={h} className={s.off} />;
                    if (!slot) return <span key={h} className={s.free} />;
                    return (
                      <span key={h} className={`${s.slot} ${slot.type ? s.slotExam : ''}`} title={`${h}h · ${slot.student}${slot.type ? ` · ${slot.type}` : ''}`}>
                        {slot.student}
                      </span>
                    );
                  })}
                </div>
              );
            })}
          </div>
          <div className={s.legend}>
            <span>
              <i className={s.slot} /> Leçon
            </span>
            <span>
              <i className={`${s.slot} ${s.slotExam}`} /> Examen blanc
            </span>
            <span>
              <i className={s.off} /> Absent
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="card-head">
              <h2 className="card-title">Prochains examens</h2>
              <CalendarClock size={18} className="muted" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {exams.map((x) => (
                <div key={x.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span className={`badge ${x.type === 'Code' ? 'tone-violet' : 'tone-primary'}`} style={{ width: 74, justifyContent: 'center' }}>
                    {x.type}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600 }}>{x.date}</div>
                    <div className="small">{x.place}</div>
                  </div>
                  <span className="small" style={{ fontWeight: 700, color: x.students.length >= x.seats ? 'var(--success)' : 'var(--warning)' }}>
                    {x.students.length}/{x.seats} places
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="card fade-in" style={{ animationDelay: '0.24s' }}>
            <div className="card-head">
              <h2 className="card-title">Activité récente</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {recentActivity.map((a) => (
                <div key={a.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span className={`tone-${a.tone}`} style={{ width: 8, height: 8, borderRadius: 4, marginTop: 6, flexShrink: 0, background: `var(--${a.tone === 'neutral' ? 'muted' : a.tone})` }} />
                  <span style={{ flex: 1 }}>{a.text}</span>
                  <span className="small">{a.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function Kpi({ icon: Icon, tone, label, value, hint, trend, delay }: { icon: LucideIcon; tone: Tone; label: string; value: string; hint?: string; trend?: string; delay: number }) {
  return (
    <div className="card fade-in" style={{ animationDelay: `${delay * 0.04}s`, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="small" style={{ fontWeight: 600 }}>
          {label}
        </span>
        <span className={`tone-${tone}`} style={{ width: 34, height: 34, borderRadius: 10, display: 'grid', placeItems: 'center' }}>
          <Icon size={17} strokeWidth={2} />
        </span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.8, lineHeight: 1 }}>{value}</div>
      {trend ? (
        <span className="small" style={{ color: 'var(--success)', fontWeight: 700 }}>
          ↑ {trend}
        </span>
      ) : (
        <span className="small">{hint}</span>
      )}
    </div>
  );
}
