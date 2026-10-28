import { useSyncExternalStore } from 'react';

/**
 * Réglages de l'élève (notifications, accessibilité, sécurité).
 * Stockage en mémoire pour la maquette, comme le profil.
 */
export type Preferences = {
  push: boolean;
  email: boolean;
  sms: boolean;
  lessonReminder: 'off' | '2h' | '24h' | '48h';
  messages: boolean;
  documents: boolean;
  payments: boolean;
  news: boolean;
  quietHours: boolean;
  textSize: 'S' | 'M' | 'L' | 'XL';
  boldText: boolean;
  highContrast: boolean;
  reduceMotion: boolean;
  captions: boolean;
  /** Méthode de déverrouillage de l'application */
  unlock: 'faceid' | 'fingerprint' | 'pin' | 'none';
  unlockOnOpen: boolean;
  unlockPayments: boolean;
  twoFactor: boolean;
};

let prefs: Preferences = {
  push: true,
  email: true,
  sms: false,
  lessonReminder: '24h',
  messages: true,
  documents: true,
  payments: true,
  news: false,
  quietHours: true,
  textSize: 'M',
  boldText: false,
  highContrast: false,
  reduceMotion: false,
  captions: true,
  unlock: 'none',
  unlockOnOpen: true,
  unlockPayments: true,
  twoFactor: false,
};

const listeners = new Set<() => void>();

export function setPrefs(next: Partial<Preferences>) {
  prefs = { ...prefs, ...next };
  listeners.forEach((l) => l());
}

export function usePrefs() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => prefs,
  );
}

/** Raccourci : interrupteur branché sur une préférence booléenne */
export const bind = <K extends keyof Preferences>(p: Preferences, key: K) => ({
  value: p[key] as boolean,
  onChange: (v: boolean) => setPrefs({ [key]: v } as Partial<Preferences>),
});
