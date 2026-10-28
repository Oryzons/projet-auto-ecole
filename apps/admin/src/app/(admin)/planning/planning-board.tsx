'use client';

import { CalendarPlus, Car, ChevronLeft, ChevronRight, Clock, MapPin, MessageCircle, MoveRight, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { instructors, planningGrid, planningHours } from '@virage/shared/mock';

import { PageTop } from '@/components/page-top';
import { RoundButton } from '@/components/side-panel';
import { Avatar } from '@/components/ui';

import s from './planning.module.css';

const days = [
  { short: 'LUN', n: 26 },
  { short: 'MAR', n: 27 },
  { short: 'MER', n: 28 },
  { short: 'JEU', n: 29 },
  { short: 'VEN', n: 30 },
  { short: 'SAM', n: 31 },
];
const dayLong = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const TODAY = 2;
const START = 8;
const END = 19;
const SPAN = END - START;

type Instructor = (typeof instructors)[number];
type Lesson = { id: string; who: Instructor; student: string; type: string; start: number; end: number };

/** Données de démo : le planning du jour décalé selon le jour pour varier la semaine */
function lessonsFor(m: Instructor, day: number): Lesson[] | 'off' {
  const grid = planningGrid[m.id] ?? {};
  if (Object.values(grid).every((v) => v === 'off')) return 'off';
  const out: Lesson[] = [];
  planningHours.forEach((_, i) => {
    if (day === 5 && i > 3) return; // samedi : matin seulement
    const h = planningHours[(i + (day - TODAY) * 2 + planningHours.length * 4) % planningHours.length];
    const slot = grid[h];
    if (!slot || slot === 'off') return;
    const start = Number(planningHours[i]);
    const prev = out[out.length - 1];
    // deux heures d'affilée avec le même élève = une leçon de 2 h
    if (prev && prev.student === slot.student && prev.end === start) prev.end = start + 1;
    else out.push({ id: `${m.id}-${day}-${start}`, who: m, student: slot.student, type: slot.type ?? 'Conduite', start, end: start + 1 });
  });
  return out;
}

const pct = (h: number) => `${((h - START) / SPAN) * 100}%`;
const hh = (h: number) => `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.round((h % 1) * 60)).padStart(2, '0')}`;

export function PlanningBoard() {
  const [day, setDay] = useState(TODAY);
  const [only, setOnly] = useState<string | null>(null);
  const [open, setOpen] = useState<Lesson | null>(null);
  const [now, setNow] = useState<number | null>(null);

  // trait « maintenant », mis à jour chaque minute
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setNow(d.getHours() + d.getMinutes() / 60);
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  const lanes = instructors.filter((m) => !only || m.id === only).map((m) => ({ m, lessons: lessonsFor(m, day) }));
  const all = lanes.flatMap((l) => (l.lessons === 'off' ? [] : l.lessons));
  const hours = all.reduce((n, l) => n + l.end - l.start, 0);
  const present = lanes.filter((l) => l.lessons !== 'off').length;
  const fill = present ? Math.round((hours / (present * (day === 5 ? 4 : planningHours.length))) * 100) : 0;
  const showNow = day === TODAY && now !== null && now >= START && now <= END;

  return (
    <div className={s.page}>
      <PageTop eyebrow="Semaine du 26 octobre" title="Qui prend le volant ?">
        <RoundButton label="Ajouter une leçon">
          <CalendarPlus size={19} />
        </RoundButton>
      </PageTop>

      <div className={s.controls} style={{ ['--i' as string]: 1 }}>
        <div className={s.week}>
          <button className={s.arrow} aria-label="Semaine précédente">
            <ChevronLeft size={18} />
          </button>
          {days.map((d, i) => (
            <button key={d.n} onClick={() => setDay(i)} className={`${s.day} ${i === day ? s.dayOn : ''}`}>
              <span>{d.short}</span>
              <strong>{d.n}</strong>
              {i === TODAY ? <i /> : null}
            </button>
          ))}
          <button className={s.arrow} aria-label="Semaine suivante">
            <ChevronRight size={18} />
          </button>
        </div>
        <div className={s.people}>
          <button onClick={() => setOnly(null)} className={`${s.chip} ${!only ? s.chipOn : ''}`}>
            Toute l’équipe
          </button>
          {instructors.map((m) => (
            <button key={m.id} onClick={() => setOnly(only === m.id ? null : m.id)} className={`${s.chip} ${only === m.id ? s.chipOn : ''}`}>
              <Avatar name={m.name} size={22} /> {m.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      <div className={s.summary} style={{ ['--i' as string]: 2 }} key={`sum-${day}-${only}`}>
        <span>
          <strong>{all.length}</strong> leçons {day === TODAY ? 'aujourd’hui' : `le ${dayLong[day]}`}
        </span>
        <span>
          <strong>{hours} h</strong> de conduite
        </span>
        <span>
          <strong>{fill} %</strong> des créneaux remplis
        </span>
      </div>

      <section className={s.board} style={{ ['--i' as string]: 3 }}>
        <div className={s.scale}>
          <span />
          <div className={s.ticks}>
            {Array.from({ length: SPAN + 1 }, (_, i) => (
              <span key={i} style={{ left: pct(START + i) }}>
                {START + i}h
              </span>
            ))}
          </div>
        </div>

        {lanes.map(({ m, lessons }, li) => {
          const off = lessons === 'off';
          const count = off ? 0 : lessons.length;
          return (
            <div key={`${m.id}-${day}`} className={s.lane} style={{ ['--l' as string]: li }}>
              <div className={s.who}>
                <Avatar name={m.name} size={40} />
                <div style={{ minWidth: 0 }}>
                  <strong>{m.name}</strong>
                  <div className={s.whoMeta}>{off ? 'Absent aujourd’hui' : `${count} leçon${count > 1 ? 's' : ''} · ${m.vehicle.split(' · ')[0]}`}</div>
                </div>
              </div>
              <div className={s.track}>
                {Array.from({ length: SPAN - 1 }, (_, i) => (
                  <span key={i} className={s.grid} style={{ left: pct(START + i + 1) }} />
                ))}
                {off ? null : (
                  <span className={s.lunch} style={{ left: pct(12), width: `${(2 / SPAN) * 100}%` }}>
                    Pause
                  </span>
                )}
                {off ? (
                  <span className={s.off}>Absent · congé</span>
                ) : (
                  lessons.map((l, i) => {
                    const live = showNow && now! >= l.start && now! < l.end;
                    return (
                      <button
                        key={l.id}
                        onClick={() => setOpen(l)}
                        className={`${s.lesson} ${l.type !== 'Conduite' ? s.exam : ''} ${live ? s.live : ''}`}
                        style={{ left: pct(l.start), width: `calc(${((l.end - l.start) / SPAN) * 100}% - 4px)`, animationDelay: `${0.15 + li * 0.05 + i * 0.03}s` }}>
                        <strong>{l.student}</strong>
                        <span>{l.end - l.start > 1 ? `${hh(l.start)} – ${hh(l.end)}` : hh(l.start)}</span>
                      </button>
                    );
                  })
                )}
                {showNow ? <span className={s.now} style={{ left: pct(now!) }} /> : null}
              </div>
            </div>
          );
        })}
        {showNow ? (
          <div className={s.nowLabelRow}>
            <span />
            <div style={{ position: 'relative' }}>
              <span className={s.nowLabel} style={{ left: pct(now!) }}>
                {hh(now!)}
              </span>
            </div>
          </div>
        ) : null}
      </section>

      <div className={s.legend} style={{ ['--i' as string]: 4 }}>
        <span>
          <i className={s.dotLesson} /> Conduite
        </span>
        <span>
          <i className={s.dotExam} /> Examen blanc
        </span>
        <span>
          <i className={s.dotNow} /> Maintenant
        </span>
      </div>

      {/* Fiche de la leçon */}
      <div className={`${s.backdrop} ${open ? s.backdropOn : ''}`} onClick={() => setOpen(null)} />
      <aside className={`${s.drawer} ${open ? s.drawerOn : ''}`} aria-hidden={!open}>
        {open ? (
          <>
            <button className={s.close} onClick={() => setOpen(null)} aria-label="Fermer">
              <X size={18} />
            </button>
            <p className={s.eyebrow}>{open.type.toUpperCase()}</p>
            <h2 className={s.drawerTitle}>{open.student}</h2>
            <div className={s.drawerCard}>
              <div className={s.dateBox}>
                <strong>{days[day].n}</strong>
                <span>OCT.</span>
              </div>
              <div>
                <strong style={{ textTransform: 'capitalize' }}>
                  {dayLong[day]} · {hh(open.start)} – {hh(open.end)}
                </strong>
                <div className="small">
                  {open.end - open.start} h · avec {open.who.name}
                </div>
                <span className={s.confirmed}>CONFIRMÉE</span>
              </div>
            </div>
            <ul className={s.facts}>
              <li>
                <Car size={16} /> {open.who.vehicle}
              </li>
              <li>
                <MapPin size={16} /> Agence Lyon République
              </li>
              <li>
                <Clock size={16} /> Réservée depuis l’app élève
              </li>
            </ul>
            <div className={s.drawerActions}>
              <button className="btn btn-ghost">
                <MessageCircle size={16} /> Écrire à l’élève
              </button>
              <button className="btn btn-ghost">
                <MoveRight size={16} /> Déplacer
              </button>
              <button className="btn btn-ghost" style={{ color: 'var(--danger)' }}>
                <Trash2 size={16} /> Annuler la leçon
              </button>
            </div>
          </>
        ) : null}
      </aside>
    </div>
  );
}
