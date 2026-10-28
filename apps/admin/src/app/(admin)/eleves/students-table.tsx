'use client';

import { CalendarPlus, Check, ChevronRight, Download, FileCheck, Mail, MessageCircle, Phone, Search, Send, UserPlus } from 'lucide-react';
import { useMemo, useState } from 'react';

import { euro } from '@virage/shared/format';
import { adminKpis, adminStudents, type AdminStudent } from '@virage/shared/mock';

import { PageTop } from '@/components/page-top';
import { RoundButton, SidePanel } from '@/components/side-panel';
import { Avatar, Badge } from '@/components/ui';
import { openPanel } from '@/lib/panels';

import s from './eleves.module.css';

/** Où en sont les 186 élèves, du dossier au permis (chiffres de démo) */
const journey = [
  { label: 'Dossier', count: 12, color: 'var(--warning)' },
  { label: 'Code', count: 54, color: 'var(--violet)' },
  { label: 'Conduite', count: 88, color: 'var(--primary)' },
  { label: 'Examen', count: 21, color: '#7d93ff' },
  { label: 'Permis obtenu', count: 11, color: 'var(--success)' },
];
const journeyTotal = journey.reduce((n, j) => n + j.count, 0);

const filters = [
  { key: 'all', label: 'Tous', test: () => true },
  { key: 'formation', label: 'En formation', test: (e: AdminStudent) => e.tone === 'primary' },
  { key: 'dossier', label: 'Pièces à vérifier', test: (e: AdminStudent) => e.tone === 'warning' || e.tone === 'neutral' },
  { key: 'examen', label: 'Examen', test: (e: AdminStudent) => e.tone === 'success' || e.tone === 'violet' },
  { key: 'impaye', label: 'Impayés', test: (e: AdminStudent) => e.balance > 0 },
] as const;

const ratio = (a: number, b: number) => (b ? Math.min(1, a / b) : 0);

export function StudentsTable() {
  const [filter, setFilter] = useState<(typeof filters)[number]['key']>('all');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<AdminStudent | null>(null);
  const [shown, setShown] = useState<AdminStudent | null>(null);
  const [sent, setSent] = useState<string[]>([]);

  const rows = useMemo(() => {
    const f = filters.find((x) => x.key === filter)!;
    const q = query.trim().toLowerCase();
    return adminStudents.filter((e) => f.test(e) && (!q || `${e.name} ${e.licence} ${e.step} ${e.instructor}`.toLowerCase().includes(q)));
  }, [filter, query]);

  const show = (e: AdminStudent) => {
    setShown(e);
    setOpen(e);
  };

  // la fiche garde son contenu pendant qu'elle se referme
  const e = open ?? shown;

  return (
    <div className={s.page}>
      <PageTop eyebrow={`${adminKpis.activeStudents} élèves actifs · ${adminKpis.docsToReview} dossiers à vérifier`} title="Élèves">
        <RoundButton label="Exporter la liste">
          <Download size={18} />
        </RoundButton>
      </PageTop>

      {/* Le parcours : une seule barre, comme les étapes de l'app */}
      <section className={s.journey} style={{ ['--i' as string]: 1 }}>
        <div className={s.journeyHead}>
          <div>
            <h2 className={s.h2}>Où en sont vos élèves</h2>
            <p className={s.muted}>Du dossier au permis, sur {journeyTotal} élèves</p>
          </div>
          <span className="badge tone-success">+11 ce mois</span>
        </div>
        <div className={s.bar}>
          {journey.map((j, i) => (
            <span key={j.label} style={{ flexGrow: j.count, background: j.color, ['--d' as string]: `${i * 80}ms` }} />
          ))}
        </div>
        <div className={s.legend}>
          {journey.map((j) => (
            <div key={j.label}>
              <span className={s.swatch} style={{ background: j.color }} />
              <span className={s.muted}>{j.label}</span>
              <strong>{j.count}</strong>
            </div>
          ))}
        </div>
      </section>

      <div className={s.tools} style={{ ['--i' as string]: 2 }}>
        <label className={s.search}>
          <Search size={19} />
          <input value={query} onChange={(ev) => setQuery(ev.target.value)} placeholder="Nom, formule, moniteur…" />
        </label>
        <div className={s.chips}>
          {filters.map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)} className={`${s.chip} ${filter === f.key ? s.chipOn : ''}`}>
              {f.label}
              <span>{adminStudents.filter(f.test).length}</span>
            </button>
          ))}
        </div>
      </div>

      <section className={s.list} key={`${filter}-${query}`}>
        {rows.map((st, i) => {
          const [docsDone, docsTotal] = st.docs.split('/').map(Number);
          return (
            <button key={st.id} className={s.card} style={{ ['--c' as string]: i }} onClick={() => show(st)}>
              <div className={s.cardHead}>
                <Avatar name={st.name} size={46} />
                <span className={s.who}>
                  <strong>{st.name}</strong>
                  <span>{st.licence}</span>
                </span>
                <Badge tone={st.tone}>{st.step}</Badge>
              </div>

              <div className={s.progress}>
                <div className={s.progressHead}>
                  <span>Conduite</span>
                  <strong>{st.hoursTotal ? `${st.hours} / ${st.hoursTotal} h` : 'Code seul'}</strong>
                </div>
                <div className={s.track}>
                  <span style={{ width: `${ratio(st.hours, st.hoursTotal) * 100}%` }} />
                </div>
              </div>

              <div className={s.cardFoot}>
                <span className={s.muted}>
                  <FileCheck size={14} style={{ color: docsDone === docsTotal ? 'var(--success)' : 'var(--warning)' }} />
                  Pièces {st.docs}
                  {st.instructor !== '—' ? ` · ${st.instructor}` : ''}
                </span>
                <span className={st.balance ? s.due : s.paid}>{st.balance ? `Reste ${euro(st.balance)}` : 'À jour'}</span>
              </div>
            </button>
          );
        })}

        {!rows.length ? (
          <div className={s.empty}>
            <p>Aucun élève ne correspond.</p>
            <button className={s.emptyBtn} onClick={() => openPanel('inscription')}>
              <UserPlus size={17} /> Inscrire un élève
            </button>
          </div>
        ) : null}
      </section>

      {/* Fiche élève, dans un panneau qui glisse depuis la droite */}
      <SidePanel open={!!open} onClose={() => setOpen(null)} label="Fiche élève" width={460}>
        {e ? (
          <>
            <div className={s.profile}>
              <Avatar name={e.name} size={76} />
              <h2>{e.name}</h2>
              <span className={s.muted}>{e.licence}</span>
              <Badge tone={e.tone}>{e.step}</Badge>
            </div>

            <div className={s.quick}>
              <button>
                <MessageCircle size={20} />
                Message
              </button>
              <button>
                <CalendarPlus size={20} />
                Planifier
              </button>
              <button>
                <Phone size={20} />
                Appeler
              </button>
            </div>

            <div className={s.box}>
              <h3 className={s.h3}>Progression</h3>
              <Meter label="Heures de conduite" value={e.hoursTotal ? `${e.hours} / ${e.hoursTotal} h` : 'Code seul'} ratio={ratio(e.hours, e.hoursTotal)} />
              <Meter label="Moyenne au code" value={`${e.code} / 40`} ratio={e.code / 40} color={e.code >= 35 ? 'var(--success)' : 'var(--violet)'} />
            </div>

            <div className={`${s.box} ${s.facts}`}>
              <Fact label="Moniteur référent" value={e.instructor} />
              <Fact label="Dossier ANTS" value={`${e.docs} pièces validées`} />
              <Fact label="Téléphone" value={e.phone} />
              <Fact label="E-mail" value={`${e.id}@email.fr`} />
            </div>

            {e.balance ? (
              <div className={s.pay}>
                <div>
                  <span className={s.muted}>Reste à payer</span>
                  <strong>{euro(e.balance)}</strong>
                </div>
                <button className={sent.includes(e.id) ? s.payDone : s.payBtn} onClick={() => setSent((l) => [...l, e.id])}>
                  {sent.includes(e.id) ? <Check size={17} /> : <Send size={16} />}
                  {sent.includes(e.id) ? 'Relance envoyée' : 'Relancer'}
                </button>
              </div>
            ) : (
              <div className={`${s.pay} ${s.payOk}`}>
                <div>
                  <span className={s.muted}>Paiements</span>
                  <strong>À jour</strong>
                </div>
                <button className={s.payGhost}>
                  <Mail size={16} /> Facture
                  <ChevronRight size={15} />
                </button>
              </div>
            )}
          </>
        ) : null}
      </SidePanel>
    </div>
  );
}

function Meter({ label, value, ratio, color = 'var(--primary)' }: { label: string; value: string; ratio: number; color?: string }) {
  return (
    <div className={s.progress}>
      <div className={s.progressHead}>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <div className={s.track}>
        <span style={{ width: `${ratio * 100}%`, background: color }} />
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className={s.fact}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
