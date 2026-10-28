'use client';

import { useSyncExternalStore } from 'react';

/** Panneaux qui glissent depuis la droite, ouvrables depuis n'importe quelle page */
export type PanelName = 'inscription' | 'notifications' | null;

let current: PanelName = null;
const listeners = new Set<() => void>();

export function openPanel(name: PanelName) {
  current = name;
  listeners.forEach((l) => l());
}

export const closePanel = () => openPanel(null);

export function usePanel() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => current,
    () => null,
  );
}
