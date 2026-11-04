import { Asset } from 'expo-asset';
import { File, Paths } from 'expo-file-system';
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

type Planned = { title: string; subtitle?: string; body: string; at: number; url: Href };

/**
 * Logo Shift affiché en vignette à droite de la notification (iOS).
 * Dans Expo Go, l'icône en haut à gauche reste celle d'Expo Go : seule une
 * build de l'appli peut la remplacer. La vignette, elle, marche partout.
 * iOS déplace le fichier joint, donc on en copie un neuf à chaque notification.
 */
let logoSource: Promise<string | null> | null = null;
const logoUri = () =>
  (logoSource ??= Asset.fromModule(require('../../assets/images/notification-logo.png'))
    .downloadAsync()
    .then((a) => a.localUri)
    .catch(() => null));

async function logoAttachment(): Promise<Notifications.NotificationContentAttachmentIos[] | undefined> {
  if (Platform.OS !== 'ios') return undefined;
  try {
    const src = await logoUri();
    if (!src) return undefined;
    const copy = new File(Paths.cache, `shift-logo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.png`);
    new File(src).copy(copy);
    return [{ identifier: 'shift-logo', url: copy.uri, type: 'public.png', typeHint: 'public.png' }];
  } catch {
    return undefined;
  }
}

/** Contenu commun : titre court, sous-titre en gras (iOS), texte, logo Shift */
async function content(n: { title: string; subtitle?: string; body: string; url: Href }): Promise<Notifications.NotificationContentInput> {
  const subtitle = Platform.OS === 'ios' ? n.subtitle : undefined;
  // Android n'a pas de sous-titre : on le met en tête du texte
  const body = Platform.OS === 'ios' || !n.subtitle ? n.body : `${n.subtitle}\n${n.body}`;
  return { title: n.title, subtitle, body, data: { url: n.url }, sound: true, attachments: await logoAttachment() };
}

const firstName = (name = '') => name.split(' ')[0] ?? name;
const duration = (start: string, end: string) => {
  const min = Number(end.slice(0, 2)) * 60 + Number(end.slice(3)) - (Number(start.slice(0, 2)) * 60 + Number(start.slice(3)));
  return min % 60 ? `${Math.floor(min / 60)} h ${min % 60}` : `${min / 60} h`;
};

/** Demande l'autorisation, une seule fois ; renvoie true si l'utilisateur accepte */
export async function enablePhoneNotifications() {
  if (!supported) return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const asked = await Notifications.requestPermissionsAsync({ ios: { allowAlert: true, allowBadge: true, allowSound: true } });
  if (asked.granted && Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', { name: 'Shift', importance: Notifications.AndroidImportance.HIGH });
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
      content: await content(n),
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
      const when = p.lessonReminder === '2h' ? `dans 2 h, à ${l.start}` : p.lessonReminder === '24h' ? `demain à ${l.start}` : `${l.day.toLowerCase()} ${l.date} à ${l.start}`;
      list.push({
        title: `🚗 Leçon ${when}`,
        subtitle: `Avec ${l.instructor} · ${duration(l.start, l.end)}`,
        body: `📍 Départ : ${l.place}\n📘 Pensez à votre livret d’apprentissage.`,
        at: p.lessonReminder === '2h' ? at : quiet(at),
        url: '/eleve',
      });
    }
  }
  if (p.documents) {
    const refused = documents.filter((d) => d.status === 'refused');
    if (refused.length) {
      list.push({
        title: '📄 Pièce refusée',
        subtitle: refused[0]!.name,
        body: `${refused[0]!.note ?? 'Merci d’en déposer une nouvelle.'}\nDéposez-la depuis l’appli, c’est rapide.`,
        at: quiet(now + 60_000),
        url: '/eleve/documents',
      });
    }
  }
  if (p.payments) {
    const due = invoices.find((i) => i.status === 'due');
    if (due)
      list.push({
        title: `💳 Échéance de ${due.amount} € à régler`,
        subtitle: due.label,
        body: `À payer avant le ${due.date}. Réglez-la en un geste depuis l’appli.`,
        at: quiet(now + 3 * 3600_000),
        url: '/eleve/paiements',
      });
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
    list.push({
      title: `⏰ Leçon dans 15 min avec ${firstName(l.student)}`,
      subtitle: `${l.start} – ${l.end} · ${l.student}`,
      body: `📍 ${l.place}\n🚘 ${l.vehicle} · ${l.hoursDone} h déjà faites`,
      at: l.at - 15 * 60_000,
      url: `/moniteur/lecon/${l.id}`,
    });
    const end = l.at + (Number(l.end.slice(0, 2)) * 60 + Number(l.end.slice(3)) - (Number(l.start.slice(0, 2)) * 60 + Number(l.start.slice(3)))) * 60_000;
    list.push({
      title: '📝 Compte rendu à rédiger',
      subtitle: `Leçon de ${l.student} terminée`,
      body: 'Notez les points travaillés pendant que c’est frais.',
      at: end + 5 * 60_000,
      url: `/moniteur/lecon/${l.id}`,
    });
  }
  await replaceAll(list);
}

/** Notification d'essai, quelques secondes après l'appui (le temps de verrouiller le téléphone) */
export async function sendTestNotification(delaySeconds = 5) {
  if (!supported) return false;
  if (!(await enablePhoneNotifications())) return false;
  const next = upcomingLessons[0];
  await Notifications.scheduleNotificationAsync({
    content: await content(
      next
        ? {
            title: `🚗 Leçon ${next.day.toLowerCase()} ${next.date} à ${next.start}`,
            subtitle: `Avec ${next.instructor} · ${duration(next.start, next.end)}`,
            body: `📍 Départ : ${next.place}\n${student.firstName}, touchez pour voir le détail.`,
            url: '/eleve',
          }
        : { title: '🔔 Shift', body: 'Les notifications fonctionnent.', url: '/eleve' },
    ),
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: delaySeconds },
  });
  return true;
}

/** Notification immédiate (quelques secondes), si l'utilisateur l'a autorisée */
export async function notifyNow(n: { title: string; subtitle?: string; body: string; url: Href }, delaySeconds = 2) {
  if (!supported) return false;
  const perm = await Notifications.getPermissionsAsync();
  if (!perm.granted) return false;
  await Notifications.scheduleNotificationAsync({
    content: await content(n),
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
