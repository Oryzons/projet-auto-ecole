import { useSyncExternalStore } from 'react';

import { notifyNow } from '@/data/phone-notifications';
import { slotKey, student, takenSlots, upcomingLessons } from '@/data/mock';

/**
 * Demandes de cours : l'élève choisit un créneau, l'auto-école l'accepte ou le
 * refuse depuis l'espace administration. L'élève reçoit une notification.
 * Stockage en mémoire (démo) en attendant le backend Supabase.
 */
export type RequestStatus = 'pending' | 'accepted' | 'refused';
export type LessonRequest = {
  id: string;
  studentName: string;
  /** élève connecté de l'app (les autres sont des demandes de démo) */
  mine: boolean;
  instructor: string;
  /** début de la leçon (horodatage) */
  at: number;
  hours: number;
  place: string;
  status: RequestStatus;
  sentAt: number;
  reason?: string;
};

const atHour = (days: number, hour: number) => {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  d.setDate(d.getDate() + days);
  if (d.getDay() === 0) d.setDate(d.getDate() + 1);
  return d.getTime();
};

let requests: LessonRequest[] = [
  { id: 'rq-1', studentName: 'Sarah Benali', mine: false, instructor: 'Julie Bernard', at: atHour(2, 10), hours: 1, place: 'Agence Jean Macé', status: 'pending', sentAt: Date.now() - 50 * 60_000 },
  { id: 'rq-2', studentName: 'Zoé Lambert', mine: false, instructor: 'Karim Haddad', at: atHour(3, 15), hours: 2, place: 'Lycée Récamier', status: 'pending', sentAt: Date.now() - 3 * 3600_000 },
];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function useLessonRequests() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => requests,
  );
}

const fmt = (at: number) => {
  const d = new Date(at);
  const day = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  return `${day} à ${String(d.getHours()).padStart(2, '0')}:00`;
};

/** L'élève envoie une demande de cours */
export function requestLesson(at: number, hours: number, place: string) {
  const req: LessonRequest = { id: `rq-${Date.now()}`, studentName: `${student.firstName} ${student.lastName}`, mine: true, instructor: student.instructor, at, hours, place, status: 'pending', sentAt: Date.now() };
  requests = [req, ...requests];
  emit();
  // côté auto-école : une nouvelle demande arrive (même téléphone en démo)
  notifyNow('Nouvelle demande de cours', `${req.studentName} demande ${fmt(at)} (${hours} h) avec ${req.instructor.split(' ')[0]}.`, '/admin/planning', 4).catch(() => {});
  return req;
}

/** L'auto-école accepte : la leçon est confirmée et l'élève est prévenu */
export function acceptRequest(id: string) {
  const req = requests.find((r) => r.id === id);
  if (!req) return;
  requests = requests.map((r) => (r.id === id ? { ...r, status: 'accepted' } : r));
  emit();
  if (req.mine) notifyNow('Leçon confirmée ✅', `Votre leçon du ${fmt(req.at)} avec ${req.instructor} est confirmée. Départ ${req.place}.`, '/eleve/lecons', 2).catch(() => {});
}

/** L'auto-école refuse, avec un motif */
export function refuseRequest(id: string, reason = 'Le moniteur n’est plus disponible sur ce créneau.') {
  const req = requests.find((r) => r.id === id);
  if (!req) return;
  requests = requests.map((r) => (r.id === id ? { ...r, status: 'refused', reason } : r));
  emit();
  if (req.mine) notifyNow('Demande de cours refusée', `${fmt(req.at)} : ${reason} Choisissez un autre créneau.`, '/eleve/lecons', 2).catch(() => {});
}

/** L'élève annule sa demande en attente */
export function cancelRequest(id: string) {
  requests = requests.filter((r) => r.id !== id);
  emit();
}

/** Créneau indisponible : déjà une leçon chez le moniteur ou une demande en cours */
export function isTaken(day: Date, hour: number, list: LessonRequest[]) {
  if (takenSlots.includes(slotKey(day, hour))) return true;
  return list.some((r) => r.status !== 'refused' && r.mine && Math.abs(r.at - new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour).getTime()) < r.hours * 3600_000);
}

export const confirmedCount = () => upcomingLessons.length + requests.filter((r) => r.mine && r.status === 'accepted').length;
