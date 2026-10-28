import type { Metadata } from 'next';
import type { CSSProperties, ReactNode } from 'react';

import { colors } from '@virage/shared/theme';

import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Virage · Administration', template: '%s · Virage' },
  description: 'Back-office de l’auto-école Virage',
};

// mêmes couleurs que l'app mobile, exposées en variables CSS
const kebab = (k: string) => k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
const vars = Object.fromEntries(Object.entries(colors).map(([k, v]) => [`--${kebab(k)}`, v])) as CSSProperties;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" style={vars}>
      <body>{children}</body>
    </html>
  );
}
