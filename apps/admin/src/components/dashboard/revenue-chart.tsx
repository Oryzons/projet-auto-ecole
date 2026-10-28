'use client';

import { useState } from 'react';

import { euro } from '@virage/shared/format';
import { revenueByMonth } from '@virage/shared/mock';

/** Chiffre d'affaires des 6 derniers mois (en milliers d'euros), une seule série */
export function RevenueChart() {
  const [hover, setHover] = useState<number | null>(null);
  const max = 60;
  const ticks = [0, 20, 40, 60];
  const last = revenueByMonth.length - 1;

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr', height: 220 }}>
        {/* axe vertical */}
        <div style={{ position: 'relative' }}>
          {ticks.map((t) => (
            <span key={t} className="small" style={{ position: 'absolute', right: 8, bottom: `${(t / max) * 100}%`, transform: 'translateY(50%)', fontSize: 11 }}>
              {t}k
            </span>
          ))}
        </div>
        <div style={{ position: 'relative' }}>
          {ticks.map((t) => (
            <div key={t} style={{ position: 'absolute', left: 0, right: 0, bottom: `${(t / max) * 100}%`, borderTop: `1px ${t ? 'dashed' : 'solid'} var(--border)` }} />
          ))}
          <div style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: `repeat(${revenueByMonth.length}, 1fr)`, alignItems: 'end' }}>
            {revenueByMonth.map((d, i) => (
              <div
                key={d.m}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                style={{ height: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', cursor: 'default', position: 'relative' }}>
                {i === last ? (
                  <span style={{ position: 'absolute', bottom: `calc(${(d.v / max) * 100}% + 6px)`, fontSize: 12, fontWeight: 700 }}>{euro(d.v * 1000)}</span>
                ) : null}
                <div
                  style={{
                    width: '46%',
                    maxWidth: 44,
                    height: `${(d.v / max) * 100}%`,
                    borderRadius: '4px 4px 0 0',
                    background: 'var(--primary)',
                    opacity: hover === null || hover === i ? 1 : 0.45,
                    transformOrigin: 'bottom',
                    animation: `grow 0.6s ${i * 0.06}s cubic-bezier(.2,.8,.2,1) both`,
                    transition: 'opacity 0.15s ease',
                  }}
                />
                {hover === i ? (
                  <div
                    role="tooltip"
                    style={{
                      position: 'absolute',
                      bottom: `calc(${(d.v / max) * 100}% + 30px)`,
                      padding: '8px 10px',
                      borderRadius: 10,
                      background: 'var(--ink)',
                      color: '#fff',
                      fontSize: 12,
                      whiteSpace: 'nowrap',
                      zIndex: 2,
                      pointerEvents: 'none',
                    }}>
                    <div style={{ opacity: 0.7 }}>{d.m} 2026</div>
                    <strong>{euro(d.v * 1000)}</strong>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `36px repeat(${revenueByMonth.length}, 1fr)`, marginTop: 8 }}>
        <span />
        {revenueByMonth.map((d, i) => (
          <span key={d.m} className="small" style={{ textAlign: 'center', fontWeight: i === last ? 700 : 500, color: i === last ? 'var(--ink)' : undefined }}>
            {d.m}
          </span>
        ))}
      </div>
      <style>{'@keyframes grow { from { transform: scaleY(0); } to { transform: scaleY(1); } }'}</style>
    </div>
  );
}
