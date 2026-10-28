'use client';

import { ChevronRight, FileCheck } from 'lucide-react';
import Link from 'next/link';

import { docsToReview, recentActivity } from '@virage/shared/mock';

import { SidePanel } from '@/components/side-panel';
import { closePanel, usePanel } from '@/lib/panels';

import s from './notifications-panel.module.css';

/** Notifications : pièces à valider et activité du jour */
export function NotificationsPanel() {
  const open = usePanel() === 'notifications';
  return (
    <SidePanel open={open} onClose={closePanel} label="Notifications" width={440}>
      <div>
        <p className={s.eyebrow}>AUJOURD’HUI</p>
        <h2 className={s.title}>Quoi de neuf ?</h2>
      </div>

      <section className={s.section}>
        <h3>Pièces à vérifier</h3>
        <div className={s.card}>
          {docsToReview.map((d) => (
            <Link key={d.id} href="/documents" onClick={closePanel} className={s.row}>
              <span className={`${s.icon} tone-warning`}>
                <FileCheck size={19} />
              </span>
              <span className={s.rowText}>
                <strong>{d.doc}</strong>
                <span>
                  {d.student} · {d.sent}
                </span>
              </span>
              <ChevronRight size={18} className={s.chev} />
            </Link>
          ))}
        </div>
      </section>

      <section className={s.section}>
        <h3>Activité récente</h3>
        <div className={`${s.card} ${s.feed}`}>
          {recentActivity.map((a) => (
            <div key={a.id} className={s.event}>
              <span className={s.bullet} style={{ background: `var(--${a.tone})` }} />
              <p>{a.text}</p>
              <time>{a.time}</time>
            </div>
          ))}
        </div>
      </section>
    </SidePanel>
  );
}
