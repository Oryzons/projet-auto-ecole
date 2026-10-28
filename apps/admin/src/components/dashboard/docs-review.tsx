'use client';

import { Check, FileText, X } from 'lucide-react';
import { useState } from 'react';

import { docsToReview } from '@virage/shared/mock';

import { Avatar } from '@/components/ui';

type Decision = 'accepted' | 'refused';

/** Pièces envoyées depuis l'app élève, à valider ou refuser */
export function DocsReview() {
  const [done, setDone] = useState<Record<string, Decision>>({});
  const left = docsToReview.filter((d) => !done[d.id]).length;

  return (
    <div className="card fade-in" style={{ animationDelay: '0.12s' }}>
      <div className="card-head">
        <h2 className="card-title">Documents à vérifier</h2>
        <span className={`badge ${left ? 'tone-warning' : 'tone-success'}`}>{left ? `${left} en attente` : 'Tout est à jour'}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {docsToReview.map((d) => {
          const decision = done[d.id];
          return (
            <div
              key={d.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 8px',
                borderRadius: 12,
                background: decision === 'accepted' ? 'var(--success-soft)' : decision === 'refused' ? 'var(--danger-soft)' : 'transparent',
                transition: 'background 0.25s ease',
              }}>
              <Avatar name={d.student} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600 }}>{d.student}</div>
                <div className="small" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <FileText size={13} /> {d.doc} · {d.sent}
                </div>
              </div>
              {decision ? (
                <span className={`badge ${decision === 'accepted' ? 'tone-success' : 'tone-danger'} fade-in`}>{decision === 'accepted' ? 'Validé' : 'Refusé'}</span>
              ) : (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-ghost btn-sm" aria-label="Refuser" onClick={() => setDone({ ...done, [d.id]: 'refused' })}>
                    <X size={15} color="var(--danger)" />
                  </button>
                  <button className="btn btn-sm tone-success" onClick={() => setDone({ ...done, [d.id]: 'accepted' })}>
                    <Check size={15} /> Valider
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
