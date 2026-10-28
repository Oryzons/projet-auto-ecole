import type { ReactNode } from 'react';

import { initials } from '@virage/shared/format';
import type { Tone } from '@virage/shared/theme';

const tones: Tone[] = ['primary', 'violet', 'success', 'warning', 'danger'];

/** Couleur d'avatar stable pour un même nom */
export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const tone = tones[[...name].reduce((n, c) => n + c.charCodeAt(0), 0) % tones.length];
  return (
    <span className={`avatar tone-${tone}`} style={{ width: size, height: size, fontSize: size * 0.35 }}>
      {initials(name)}
    </span>
  );
}

export function Badge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return <span className={`badge tone-${tone}`}>{children}</span>;
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="fade-in" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: -0.8 }}>{title}</h1>
        {subtitle ? <p className="muted" style={{ margin: '6px 0 0', fontSize: 14.5 }}>{subtitle}</p> : null}
      </div>
      {actions ? <div style={{ display: 'flex', gap: 10 }}>{actions}</div> : null}
    </div>
  );
}
