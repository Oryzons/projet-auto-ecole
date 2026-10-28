'use client';

import { CalendarPlus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

import { instructors, planningGrid, planningHours, vehicles } from '@virage/shared/mock';

import { Avatar, Badge, PageHeader } from '@/components/ui';

import s from './planning.module.css';

const days = ['Lun. 26', 'Mar. 27', 'Mer. 28', 'Jeu. 29', 'Ven. 30', 'Sam. 31'];
const TODAY = 2;

/** Données de démo : le planning du jour décalé d'une heure par jour pour varier la semaine */
const slotFor = (who: string, day: number, hourIndex: number) => {
  const grid = planningGrid[who] ?? {};
  const h = planningHours[(hourIndex + (day - TODAY) * 2 + planningHours.length * 4) % planningHours.length];
  if (day === 5 && hourIndex > 3) return undefined; // samedi matin seulement
  return grid[h];
};

export function PlanningBoard() {
  const [day, setDay] = useState(TODAY);
  const [only, setOnly] = useState<string | null>(null);
  const shown = instructors.filter((m) => !only || m.id === only);
  const booked = shown.reduce((n, m) => n + planningHours.filter((_, i) => { const x = slotFor(m.id, day, i); return x && x !== 'off'; }).length, 0);

  return (
    <>
      <PageHeader
        title="Planning"
        subtitle={`Semaine du 26 octobre · ${booked} leçons le ${days[day].toLowerCase()}`}
        actions={
          <button className="btn btn-primary">
            <CalendarPlus size={16} /> Ajouter une leçon
          </button>
        }
      />

      <div className={s.bar}>
        <div className={s.week}>
          <button className="btn btn-ghost btn-sm" aria-label="Semaine précédente">
            <ChevronLeft size={16} />
          </button>
          {days.map((d, i) => (
            <button key={d} onClick={() => setDay(i)} className={`${s.day} ${i === day ? s.dayOn : ''}`}>
              {d}
              {i === TODAY ? <i /> : null}
            </button>
          ))}
          <button className="btn btn-ghost btn-sm" aria-label="Semaine suivante">
            <ChevronRight size={16} />
          </button>
        </div>
        <div className={s.people}>
          <button onClick={() => setOnly(null)} className={`${s.person} ${!only ? s.personOn : ''}`}>
            Tous
          </button>
          {instructors.map((m) => (
            <button key={m.id} onClick={() => setOnly(only === m.id ? null : m.id)} className={`${s.person} ${only === m.id ? s.personOn : ''}`}>
              <Avatar name={m.name} size={22} /> {m.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      <div className={s.layout}>
        <div className={`card ${s.board}`} key={`${day}-${only}`}>
          <div className={s.grid} style={{ gridTemplateColumns: `64px repeat(${shown.length}, minmax(150px, 1fr))` }}>
            <span />
            {shown.map((m) => (
              <div key={m.id} className={s.head}>
                <Avatar name={m.name} size={32} />
                <div>
                  <strong>{m.name}</strong>
                  <div className="small">{m.vehicle}</div>
                </div>
              </div>
            ))}
            {planningHours.map((h, hi) => (
              <div key={h} className={s.rowWrap}>
                <span className={s.hour}>{h}:00</span>
                {shown.map((m, mi) => {
                  const slot = slotFor(m.id, day, hi);
                  if (slot === 'off')
                    return (
                      <div key={m.id} className={s.off}>
                        {hi === 0 ? 'Absent' : ''}
                      </div>
                    );
                  if (!slot)
                    return (
                      <button key={m.id} className={s.free} title="Ajouter une leçon">
                        +
                      </button>
                    );
                  return (
                    <div key={m.id} className={`${s.lesson} ${slot.type ? s.exam : ''} fade-in`} style={{ animationDelay: `${(hi + mi) * 0.02}s` }}>
                      <strong>{slot.student}</strong>
                      <span>
                        {h}:00 – {Number(h) + 1}:00 · {slot.type ?? 'Conduite'}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <aside className={s.side}>
          <div className="card">
            <h2 className="card-title" style={{ marginBottom: 14 }}>
              Charge des moniteurs
            </h2>
            {instructors.map((m) => (
              <div key={m.id} className={s.load}>
                <div className={s.loadHead}>
                  <span>{m.name}</span>
                  <strong>{Math.round(m.load * 100)} %</strong>
                </div>
                <div className={s.track}>
                  <div style={{ width: `${m.load * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="card">
            <h2 className="card-title" style={{ marginBottom: 14 }}>
              Véhicules
            </h2>
            {vehicles.map((v) => (
              <div key={v.id} className={s.vehicle}>
                <div>
                  <strong>{v.name}</strong>
                  <div className="small">
                    {v.plate} · {v.type}
                  </div>
                </div>
                <Badge tone={v.tone}>{v.status}</Badge>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </>
  );
}
