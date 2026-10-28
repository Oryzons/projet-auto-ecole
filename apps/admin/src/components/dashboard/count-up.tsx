'use client';

import { useEffect, useState } from 'react';

import { euro } from '@virage/shared/format';

/** Chiffre qui défile jusqu'à sa valeur à l'arrivée sur la page */
export function CountUp({ value, format = 'number', duration = 900 }: { value: number; format?: 'number' | 'euro'; duration?: number }) {
  const [n, setN] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setN(value);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setN(Math.round(value * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  return <>{format === 'euro' ? euro(n) : n.toLocaleString('fr-FR')}</>;
}
