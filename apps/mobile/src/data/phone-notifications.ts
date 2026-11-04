import * as Notifications from 'expo-notifications';
import { router, type Href } from 'expo-router';
import { Platform } from 'react-native';

import { documents, instructorWeek, invoices, student, upcomingLessons } from '@/data/mock';
import type { Preferences } from '@/data/preferences';

/**
 * Notifications sur le téléphone (bannière iOS / Android), programmées
 * localement à partir des mêmes données que le site admin : rappels de leçon,
 * pièces refusées, échéance à régler, comptes rendus du moniteur.
 *
 * Elles marchent dans Expo Go. Les notifications envoyées par le serveur
 * (push) viendront avec le backend Supabase et une build EAS.
 */

const supported = Platform.OS === 'ios' || Platform.OS === 'android';

if (supported) {
  // afficher la bannière même quand l'appli est ouverte
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: true }),
  });
}

type Planned = { title: string; body: string; at: number; url: Href };

/** Demande l'autorisation, une seule fois ; renvoie true si l'utilisateur accepte */
export async function enablePhoneNotifications() {
  if (!supported) return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const asked = await Notifications.requestPermissionsAsync({ ios: { allowAlert: true, allowBadge: true, allowSound: true } });
  if (asked.granted && Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', { name: 'Virage', importance: Notifications.AndroidImportance.HIGH });
  }
  return asked.granted;
}

const REMINDER_MS = { off: 0, '2h': 2 * 3600_000, '24h': 24 * 3600_000, '48h': 48 * 3600_000 } as const;

/** Décale hors des heures calmes (22 h – 8 h) si l'élève l'a demandé */
const outsideQuietHours = (at: number) => {
  const d = new Date(at);
  if (d.getHours() >= 22) d.setDate(d.getDate() + 1);
  if (d.getHours() >= 22 || d.getHours() < 8) d.setHours(8, 30, 0, 0);
  return d.getTime();
};

async function replaceAll(list: Planned[]) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  const now = Date.now();
  for (const n of list) {
    if (n.at <= now + 5_000) continue;
    await Notifications.scheduleNotificationAsync({
      content: { title: n.title, body: n.body, data: { url: n.url }, sound: true },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(n.at) },
    });
  }
}

/** Programme les notifications de l'élève connecté selon ses réglages */
export async function scheduleStudentNotifications(p: Preferences) {
  if (!supported) return;
  if (!p.push) return Notifications.cancelAllScheduledNotificationsAsync();
  if (!(await enablePhoneNotifications())) return;
  const now = Date.now();
  const quiet = (at: number) => (p.quietHours ? outsideQuietHours(at) : at);
  const list: Planned[] = [];

  if (p.lessonReminder !== 'off') {
    for (const l of upcomingLessons) {
      if (!l.at) continue;
      const at = l.at - REMINDER_MS[p.lessonReminder];
      list.push({
        title: p.lessonReminder === '2h' ? `Leçon à ${l.start}` : `Leçon ${p.lessonReminder === '24h' ? 'demain' : `${l.day.toLowerCase()} ${l.date}`} à ${l.start}`,
        body: `Avec ${l.instructor}, départ ${l.place}. Pensez à votre livret d’apprentissage.`,
        at: p.lessonReminder === '2h' ? at : quiet(at),
        url: '/eleve',
      });
    }
  }
  if (p.documents) {
    const refused = documents.filter((d) => d.status === 'refused');
    if (refused.length) {
      list.push({
        title: 'Une pièce de votre dossier est refusée',
        body: `${refused[0]!.name} : ${refused[0]!.note ?? 'merci d’en déposer une nouvelle.'}`,
        at: quiet(now + 60_000),
        url: '/eleve/documents',
      });
    }
  }
  if (p.payments) {
    const due = invoices.find((i) => i.status === 'due');
    if (due) list.push({ title: 'Échéance à venir', body: `${due.label} : ${due.amount} € à régler.`, at: quiet(now + 3 * 3600_000), url: '/eleve/paiements' });
  }
  await replaceAll(list);
}

/** Programme les notifications du moniteur connecté : 15 min avant chaque leçon et compte rendu après */
export async function scheduleInstructorNotifications() {
  if (!supported) return;
  if (!(await enablePhoneNotifications())) return;
  const list: Planned[] = [];
  for (const l of instructorWeek) {
    if (!l.at) continue;
    list.push({ title: `Leçon à ${l.start} · ${l.student}`, body: `${l.place} · ${l.vehicle}. ${l.hoursDone} h déjà faites.`, at: l.at - 15 * 60_000, url: `/moniteur/lecon/${l.id}` });
    const end = l.at + (Number(l.end.slice(0, 2)) * 60 + Number(l.end.slice(3)) - (Number(l.start.slice(0, 2)) * 60 + Number(l.start.slice(3)))) * 60_000;
    list.push({ title: 'Compte rendu à rédiger', body: `Leçon de ${l.student} terminée : notez les points travaillés.`, at: end + 5 * 60_000, url: `/moniteur/lecon/${l.id}` });
  }
  await replaceAll(list);
}

/** Notification d'essai, quelques secondes après l'appui (le temps de verrouiller le téléphone) */
export async function sendTestNotification(delaySeconds = 5) {
  if (!supported) return false;
  if (!(await enablePhoneNotifications())) return false;
  const next = upcomingLessons[0];
  await Notifications.scheduleNotificationAsync({
    content: {
      title: next ? `Leçon à ${next.start} avec ${next.instructor.split(' ')[0]}` : 'Virage',
      body: next ? `${student.firstName}, rendez-vous ${next.place}. Touchez pour voir le détail.` : 'Les notifications fonctionnent.',
      data: { url: '/eleve' },
      sound: true,
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: delaySeconds },
  });
  return true;
}

/** Ouvre le bon écran quand on touche une notification */
export function listenToNotificationTaps() {
  if (!supported) return () => {};
  const open = (r: Notifications.NotificationResponse | null) => {
    const url = r?.notification.request.content.data?.url;
    if (typeof url === 'string') router.push(url as Href);
  };
  const last = Notifications.getLastNotificationResponse();
  if (last) open(last);
  const sub = Notifications.addNotificationResponseReceivedListener(open);
  return () => sub.remove();
}
