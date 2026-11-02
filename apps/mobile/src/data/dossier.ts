import { useSyncExternalStore } from 'react';

import type { DocStatus } from '@/data/mock';

/** Pièces du dossier ANTS, avec leur fichier déposé (stockage en mémoire pour la maquette) */
export type DossierDoc = {
  id: string;
  name: string;
  hint: string;
  status: DocStatus | 'uploading';
  note?: string;
  uri?: string;
  fileName?: string;
  isPdf?: boolean;
};

let docs: DossierDoc[] = [
  { id: 'd1', name: 'Pièce d’identité', hint: 'Recto et verso, en cours de validité', status: 'accepted', fileName: 'cni-recto-verso.jpg' },
  { id: 'd2', name: 'Photo e-photo (ANTS)', hint: 'Code photo signature numérique', status: 'accepted', fileName: 'ephoto-code.jpg' },
  { id: 'd3', name: 'Justificatif de domicile', hint: 'De moins de 6 mois', status: 'refused', note: 'Document de plus de 6 mois, merci d’en déposer un récent.', fileName: 'facture-edf-mars.pdf', isPdf: true },
  { id: 'd4', name: 'ASSR 2 ou ASR', hint: 'Attestation de sécurité routière', status: 'pending', fileName: 'assr2.jpg' },
  { id: 'd5', name: 'Attestation JDC', hint: 'Journée défense et citoyenneté', status: 'missing' },
];

const listeners = new Set<() => void>();

export function updateDoc(id: string, next: Partial<DossierDoc>) {
  docs = docs.map((d) => (d.id === id ? { ...d, ...next } : d));
  listeners.forEach((l) => l());
}

export function useDossier() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => docs,
  );
}
