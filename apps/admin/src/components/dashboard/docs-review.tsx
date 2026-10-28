'use client';

import { Check, FileText, X } from 'lucide-react';
import { useState } from 'react';

import { docsToReview } from '@virage/shared/mock';

import { Avatar } from '@/components/ui';

import s from '@/app/(admin)/dashboard.module.css';

type Decision = 'accepted' | 'refused';

/** Pièces envoyées depuis l'app élève, à valider ou refuser en un clic */
export function DocsReview() {
  const [done, setDone] = useState<Record<string, Decision>>({});
  const left = docsToReview.filter((d) => !done[d.id]).length;

  return (
    <div className={s.section}>
      <div className={s.sectionHead}>
        <h2 className={s.sectionTitle}>À valider</h2>
        <span className={`badge ${left ? 'tone-warning' : 'tone-success'}`}>{left ? `${left} documents` : 'Tout est à jour'}</span>
      </div>
      <div className={s.card}>
        {docsToReview.map((d, i) => {
          const decision = done[d.id];
          return (
            <div key={d.id} className={s.docRow} data-state={decision ?? 'todo'}>
              {i > 0 ? <span className={s.divider} /> : null}
              <Avatar name={d.student} size={40} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className={s.strong}>{d.student}</div>
                <div className="small" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <FileText size={13} /> {d.doc} · {d.sent}
                </div>
              </div>
              {decision ? (
                <span className={`badge ${decision === 'accepted' ? 'tone-success' : 'tone-danger'} fade-in`}>
                  {decision === 'accepted' ? <Check size={13} /> : <X size={13} />}
                  {decision === 'accepted' ? 'Validé' : 'Refusé'}
                </span>
              ) : (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className={s.round} aria-label="Refuser" onClick={() => setDone({ ...done, [d.id]: 'refused' })}>
                    <X size={16} color="var(--danger)" />
                  </button>
                  <button className={`${s.round} ${s.roundOk}`} aria-label="Valider" onClick={() => setDone({ ...done, [d.id]: 'accepted' })}>
                    <Check size={16} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
