'use client';

import { BookOpen, CalendarPlus, Car, Check, Download, FileCheck, Flag, GraduationCap, Mail, MessageCircle, Phone, Search, Send, UserPlus, X, type LucideIcon } from 'lucide-react';
import { useMemo, useState } from 'react';

import { euro } from '@virage/shared/format';
import { adminKpis, adminStudents, type AdminStudent } from '@virage/shared/mock';

import { Avatar, Badge } from '@/components/ui';

import s from './eleves.module.css';

/** Le parcours de l'auto-école, du dossier au permis (chiffres de démo sur 186 élèves) */
const journey: { icon: LucideIcon; label: string; count: number }[] = [
  { icon: FileCheck, label: 'Dossier', count: 12 },
  { icon: BookOpen, label: 'Code', count: 54 },
  { icon: Car, label: 'Conduite', count: 88 },
  { icon: Flag, label: 'Examen', count: 21 },
  { icon: GraduationCap, label: 'Permis obtenu', count: 11 },
];

const filters = [
  { key: 'all', label: 'Tous', test: () => true },
  { key: 'formation', label: 'En formation', test: (e: AdminStudent) => e.tone === 'primary' },
  { key: 'dossier', label: 'Dossier à compléter', test: (e: AdminStudent) => e.tone === 'warning' || e.tone === 'neutral' },
  { key: 'examen', label: 'Examen', test: (e: AdminStudent) => e.tone === 'success' || e.tone === 'violet' },
  { key: 'impaye', label: 'Solde à régler', test: (e: AdminStudent) => e.balance > 0 },
] as const;

const ratio = (a: number, b: number) => (b ? Math.min(1, a / b) : 0);

export function StudentsTable() {
  const [filter, setFilter] = useState<(typeof filters)[number]['key']>('all');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<AdminStudent | null>(null);
  const [sent, setSent] = useState<string | null>(null);

  const rows = useMemo(() => {
    const f = filters.find((x) => x.key === filter)!;
    const q = query.trim().toLowerCase();
    return adminStudents.filter((e) => f.test(e) && (!q || `${e.name} ${e.licence} ${e.step} ${e.instructor}`.toLowerCase().includes(q)));
  }, [filter, query]);

  return (
    <div className={s.page}>
      <header className={s.header} style={{ ['--i' as string]: 0 }}>
        <div>
          <p className={s.eyebrow}>
            {adminKpis.activeStudents} ÉLÈVES ACTIFS · {adminKpis.docsToReview} DOSSIERS À VÉRIFIER
          </p>
          <h1 className={s.title}>Comment vont vos élèves ?</h1>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost">
            <Download size={16} /> Exporter
          </button>
          <button className="btn btn-primary">
            <UserPlus size={16} /> Inscrire un élève
          </button>
        </div>
      </header>

      {/* Parcours, comme le fil de progression de l'app élève */}
      <section className={s.journey} style={{ ['--i' as string]: 1 }}>
        {journey.map((j, i) => (
          <div key={j.label} className={s.stage}>
            {i > 0 ? <span className={s.link} /> : null}
            <span className={`${s.stageIcon} ${i === journey.length - 1 ? s.stageDone : ''}`}>
              <j.icon size={19} strokeWidth={1.9} />
            </span>
            <strong>{j.count}</strong>
            <span>{j.label}</span>
          </div>
        ))}
      </section>

      <div className={s.toolbar} style={{ ['--i' as string]: 2 }}>
        <div className={s.chips}>
          {filters.map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)} className={`${s.chip} ${filter === f.key ? s.chipOn : ''}`}>
              {f.label} <span>{adminStudents.filter(f.test).length}</span>
            </button>
          ))}
        </div>
        <label className={s.search}>
          <Search size={16} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nom, formule, moniteur…" />
        </label>
      </div>

      <section className={s.grid} key={`${filter}-${query}`}>
        {rows.map((e, i) => {
          const [docsDone, docsTotal] = e.docs.split('/').map(Number);
          return (
            <article key={e.id} className={s.card} style={{ ['--c' as string]: i }} onClick={() => setOpen(e)}>
              <div className={s.cardHead}>
                <Avatar name={e.name} size={48} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong className={s.name}>{e.name}</strong>
                  <span className={s.sub}>{e.licence}</span>
                </div>
              </div>
              <Badge tone={e.tone}>{e.step}</Badge>

              <div className={s.bars}>
                <Progress label="Conduite" value={e.hoursTotal ? `${e.hours} / ${e.hoursTotal} h` : '—'} ratio={ratio(e.hours, e.hoursTotal)} />
                <Progress label="Code" value={`${e.code} / 40`} ratio={e.code / 40} tone={e.code >= 35 ? 'success' : 'violet'} />
              </div>

              <div className={s.cardFoot}>
                <span className={`${s.pill} ${docsDone === docsTotal ? s.pillOk : ''}`}>
                  {docsDone === docsTotal ? <Check size={13} /> : <FileCheck size={13} />} Dossier {e.docs}
                </span>
                <span className={s.balance} style={{ color: e.balance ? 'var(--ink)' : 'var(--success)' }}>
                  {e.balance ? `${euro(e.balance)} à régler` : 'À jour'}
                </span>
              </div>
            </article>
          );
        })}
        {!rows.length ? <p className={s.empty}>Aucun élève ne correspond à ce filtre.</p> : null}
      </section>

      {/* Fiche élève */}
      <div className={`${s.backdrop} ${open ? s.backdropOn : ''}`} onClick={() => setOpen(null)} />
      <aside className={`${s.drawer} ${open ? s.drawerOn : ''}`} aria-hidden={!open}>
        {open ? (
          <>
            <button className={s.close} onClick={() => setOpen(null)} aria-label="Fermer">
              <X size={18} />
            </button>
            <div className={s.drawerHead}>
              <Avatar name={open.name} size={72} />
              <h2>{open.name}</h2>
              <span className={s.sub}>{open.licence}</span>
              <Badge tone={open.tone}>{open.step}</Badge>
            </div>

            <div className={s.quick}>
              <button className={s.quickBtn}>
                <MessageCircle size={18} />
                <span>Message</span>
              </button>
              <button className={s.quickBtn}>
                <CalendarPlus size={18} />
                <span>Planifier</span>
              </button>
              <button className={s.quickBtn}>
                <Phone size={18} />
                <span>Appeler</span>
              </button>
            </div>

            <div className={s.panel}>
              <Progress label="Heures de conduite" value={open.hoursTotal ? `${open.hours} / ${open.hoursTotal} h` : 'Code seul'} ratio={ratio(open.hours, open.hoursTotal)} />
              <Progress label="Moyenne au code" value={`${open.code} / 40`} ratio={open.code / 40} tone={open.code >= 35 ? 'success' : 'violet'} />
            </div>

            <ul className={s.facts}>
              <li>
                <span>Moniteur référent</span>
                <strong>{open.instructor}</strong>
              </li>
              <li>
                <span>Dossier ANTS</span>
                <strong>{open.docs} pièces validées</strong>
              </li>
              <li>
                <span>Reste à payer</span>
                <strong style={{ color: open.balance ? 'var(--ink)' : 'var(--success)' }}>{open.balance ? euro(open.balance) : 'À jour'}</strong>
              </li>
              <li>
                <span>Téléphone</span>
                <strong>{open.phone}</strong>
              </li>
              <li>
                <span>E-mail</span>
                <strong>{open.id}@email.fr</strong>
              </li>
            </ul>

            {open.balance ? (
              <button className={`btn ${sent === open.id ? 'tone-success' : 'btn-primary'} ${s.wide}`} onClick={() => setSent(open.id)}>
                {sent === open.id ? <Check size={16} /> : <Send size={16} />}
                {sent === open.id ? 'Relance envoyée' : `Relancer le paiement de ${euro(open.balance)}`}
              </button>
            ) : (
              <button className={`btn btn-ghost ${s.wide}`}>
                <Mail size={16} /> Envoyer un message
              </button>
            )}
          </>
        ) : null}
      </aside>
    </div>
  );
}

function Progress({ label, value, ratio, tone = 'primary' }: { label: string; value: string; ratio: number; tone?: 'primary' | 'success' | 'violet' }) {
  return (
    <div className={s.progress}>
      <div className={s.progressHead}>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <div className={s.track}>
        <span style={{ width: `${ratio * 100}%`, background: `var(--${tone})` }} />
      </div>
    </div>
  );
}
