import { useSyncExternalStore } from 'react';

import { student } from '@/data/mock';

/** Paiements de la formation et achats d'heures (stockage en mémoire pour la maquette) */
export type Installment = { id: string; label: string; date: string; amount: number; paid: boolean };
export type Invoice = { id: string; label: string; date: string; amount: number };
export type HoursPack = { id: string; hours: number; price: number; was?: number; tag?: string };

/** Prix de l'heure à l'unité */
export const HOUR_PRICE = 58;

export const hoursPacks: HoursPack[] = [
  { id: 'p2', hours: 2, price: 116 },
  { id: 'p5', hours: 5, price: 275, was: 290, tag: 'Le plus choisi' },
  { id: 'p10', hours: 10, price: 520, was: 580, tag: '−10 %' },
];

type Billing = {
  total: number;
  schedule: Installment[];
  invoices: Invoice[];
  extraHours: number;
  offerDismissed: boolean;
};

let state: Billing = {
  total: 1350,
  schedule: [
    { id: 'e1', label: '1re échéance', date: '21 oct. 2026', amount: 450, paid: true },
    { id: 'e2', label: '2e échéance', date: '21 nov. 2026', amount: 450, paid: false },
    { id: 'e3', label: '3e échéance', date: '21 déc. 2026', amount: 450, paid: false },
  ],
  invoices: [
    { id: 'F-2026-0312', label: 'Forfait 20 h · 1re échéance', date: '21 oct. 2026', amount: 450 },
    { id: 'F-2026-0277', label: 'Frais de dossier', date: '21 sept. 2026', amount: 80 },
  ],
  extraHours: 0,
  offerDismissed: false,
};

const listeners = new Set<() => void>();
const set = (next: Partial<Billing>) => {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
};

let seq = 413;
const today = () => new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
const invoice = (label: string, amount: number): Invoice => ({ id: `F-2026-0${seq++}`, label, date: today(), amount });

export const remainingDue = (b: Billing) => b.schedule.filter((e) => !e.paid).reduce((s, e) => s + e.amount, 0);
export const nextInstallment = (b: Billing) => b.schedule.find((e) => !e.paid);

/** Règle la prochaine échéance */
export function payNext() {
  const next = nextInstallment(state);
  if (!next) return;
  set({
    schedule: state.schedule.map((e) => (e.id === next.id ? { ...e, paid: true, date: today() } : e)),
    invoices: [invoice(`Forfait 20 h · ${next.label}`, next.amount), ...state.invoices],
  });
}

/** Solde toute la formation en une fois */
export function payAll() {
  const due = remainingDue(state);
  if (!due) return;
  set({
    schedule: state.schedule.map((e) => (e.paid ? e : { ...e, paid: true, date: today() })),
    invoices: [invoice('Forfait 20 h · solde de la formation', due), ...state.invoices],
  });
}

/** Réorganise les échéances restantes en n mensualités */
export function reschedule(count: number) {
  const due = remainingDue(state);
  const paid = state.schedule.filter((e) => e.paid);
  const months = ['21 nov. 2026', '21 déc. 2026', '21 janv. 2027', '21 févr. 2027'];
  const part = Math.round((due / count) * 100) / 100;
  const rest = Array.from({ length: count }, (_, i) => ({
    id: `r${count}-${i}`,
    label: `${paid.length + i + 1}e échéance`,
    date: months[i],
    // le centime d'arrondi est porté par la dernière échéance
    amount: i === count - 1 ? Math.round((due - part * (count - 1)) * 100) / 100 : part,
    paid: false,
  }));
  set({ schedule: [...paid, ...rest] });
}

export function buyHours(pack: HoursPack) {
  set({ extraHours: state.extraHours + pack.hours, invoices: [invoice(`Pack ${pack.hours} h de conduite`, pack.price), ...state.invoices] });
}

export function dismissOffer() {
  set({ offerDismissed: true });
}

export function useBilling() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
  );
}

/** Heures de conduite encore disponibles (forfait + heures rachetées) */
export function useRemainingHours() {
  return student.balance.remainingHours + useBilling().extraHours;
}

/** L'offre de rachat apparaît dès la moitié du forfait réalisée */
export const halfwayReached = student.driving.done >= student.driving.total / 2;

/** 1350 → « 1 350 € », 337.5 → « 337,50 € » (sans dépendre de l'Intl du moteur JS) */
export const euro = (n: number) => {
  const [int, dec] = (Number.isInteger(n) ? String(n) : n.toFixed(2)).split('.');
  return `${int.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0')}${dec ? `,${dec}` : ''} €`;
};
