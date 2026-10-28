'use client';

import { CalendarPlus, Download, MessageCircle, Plus, Search, Send, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import { euro } from '@virage/shared/format';
import { adminKpis, adminStudents, type AdminStudent } from '@virage/shared/mock';

import { Avatar, Badge, PageHeader } from '@/components/ui';

import s from './eleves.module.css';

const filters = [
  { key: 'all', label: 'Tous', test: () => true },
  { key: 'formation', label: 'En formation', test: (e: AdminStudent) => e.tone === 'primary' },
  { key: 'dossier', label: 'Dossier à compléter', test: (e: AdminStudent) => e.tone === 'warning' || e.tone === 'neutral' },
  { key: 'examen', label: 'Examen', test: (e: AdminStudent) => e.tone === 'success' || e.tone === 'violet' },
  { key: 'impaye', label: 'Solde à régler', test: (e: AdminStudent) => e.balance > 0 },
] as const;

export function StudentsTable() {
  const [filter, setFilter] = useState<(typeof filters)[number]['key']>('all');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<AdminStudent | null>(null);

  const rows = useMemo(() => {
    const f = filters.find((x) => x.key === filter)!;
    const q = query.trim().toLowerCase();
    return adminStudents.filter((e) => f.test(e) && (!q || `${e.name} ${e.licence} ${e.step}`.toLowerCase().includes(q)));
  }, [filter, query]);

  return (
    <>
      <PageHeader
        title="Élèves"
        subtitle={`${adminKpis.activeStudents} élèves actifs · ${adminKpis.docsToReview} dossiers à vérifier`}
        actions={
          <>
            <button className="btn btn-ghost">
              <Download size={16} /> Exporter
            </button>
            <button className="btn btn-primary">
              <Plus size={16} /> Inscrire un élève
            </button>
          </>
        }
      />

      <div className={`card fade-in ${s.table}`}>
        <div className={s.toolbar}>
          <div className={s.chips}>
            {filters.map((f) => {
              const count = adminStudents.filter(f.test).length;
              return (
                <button key={f.key} onClick={() => setFilter(f.key)} className={`${s.chip} ${filter === f.key ? s.chipOn : ''}`}>
                  {f.label} <span>{count}</span>
                </button>
              );
            })}
          </div>
          <label className={s.search}>
            <Search size={15} className="muted" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filtrer…" />
          </label>
        </div>

        <div className={s.scroll}>
          <table>
            <thead>
              <tr>
                <th>Élève</th>
                <th>Formation</th>
                <th>Étape</th>
                <th>Dossier</th>
                <th style={{ textAlign: 'right' }}>Reste à payer</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e, i) => {
                const [done, total] = e.docs.split('/').map(Number);
                return (
                  <tr key={e.id} onClick={() => setOpen(e)} className="fade-in" style={{ animationDelay: `${i * 0.03}s` }}>
                    <td>
                      <div className={s.person}>
                        <Avatar name={e.name} />
                        <div>
                          <strong>{e.name}</strong>
                          <div className="small">{e.id}@email.fr</div>
                        </div>
                      </div>
                    </td>
                    <td>{e.licence}</td>
                    <td>
                      <Badge tone={e.tone}>{e.step}</Badge>
                    </td>
                    <td>
                      <div className={s.docs}>
                        <div className={s.track}>
                          <div style={{ width: `${(done / total) * 100}%`, background: done === total ? 'var(--success)' : 'var(--warning)' }} />
                        </div>
                        <span className="small">{e.docs}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: e.balance ? 'var(--ink)' : 'var(--success)' }}>{e.balance ? euro(e.balance) : 'À jour'}</td>
                  </tr>
                );
              })}
              {!rows.length ? (
                <tr>
                  <td colSpan={5} className="muted" style={{ textAlign: 'center', padding: 40 }}>
                    Aucun élève ne correspond à ce filtre.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fiche élève en panneau latéral */}
      <div className={`${s.backdrop} ${open ? s.backdropOn : ''}`} onClick={() => setOpen(null)} />
      <aside className={`${s.drawer} ${open ? s.drawerOn : ''}`} aria-hidden={!open}>
        {open ? (
          <>
            <button className={s.close} onClick={() => setOpen(null)} aria-label="Fermer">
              <X size={18} />
            </button>
            <div className={s.drawerHead}>
              <Avatar name={open.name} size={64} />
              <h2>{open.name}</h2>
              <p className="muted">{open.licence}</p>
              <Badge tone={open.tone}>{open.step}</Badge>
            </div>
            <div className={s.actions}>
              <button className="btn btn-ghost btn-sm">
                <MessageCircle size={15} /> Message
              </button>
              <button className="btn btn-ghost btn-sm">
                <CalendarPlus size={15} /> Planifier
              </button>
              {open.balance ? (
                <button className="btn btn-ghost btn-sm">
                  <Send size={15} /> Relancer
                </button>
              ) : null}
            </div>
            <dl className={s.facts}>
              <dt>Dossier ANTS</dt>
              <dd>{open.docs} pièces validées</dd>
              <dt>Reste à payer</dt>
              <dd>{open.balance ? euro(open.balance) : 'À jour'}</dd>
              <dt>Moniteur référent</dt>
              <dd>Julie Bernard</dd>
              <dt>Heures de conduite</dt>
              <dd>12 / 20 h</dd>
              <dt>Dernière leçon</dt>
              <dd>Mar. 27 oct. · créneau à gauche</dd>
            </dl>
          </>
        ) : null}
      </aside>
    </>
  );
}
