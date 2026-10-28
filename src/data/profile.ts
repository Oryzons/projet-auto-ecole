import { useSyncExternalStore } from 'react';

/**
 * Choix faits pendant l'inscription (voiture ou moto, permis, formule, objectif).
 * Simple stockage en mémoire pour la maquette : il sera remplacé par le profil
 * renvoyé par l'API quand le backend sera branché.
 */
export type Profile = {
  vehicule: 'voiture' | 'moto';
  permis: string;
  formule: string;
  objectif: string;
};

let profile: Profile = {
  vehicule: 'voiture',
  permis: 'Permis B · Manuelle',
  formule: 'Essentiel · 20 h + code inclus',
  objectif: 'Décembre 2026',
};

const listeners = new Set<() => void>();

export function setProfile(next: Partial<Profile>) {
  profile = { ...profile, ...next };
  listeners.forEach((l) => l());
}

export function useProfile() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => profile,
  );
}
