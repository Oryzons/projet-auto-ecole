import { router, type Href } from 'expo-router';
import {
  BellOff,
  CalendarCheck,
  CalendarClock,
  CheckCheck,
  CreditCard,
  FileCheck,
  FileX,
  GraduationCap,
  MessageCircle,
  Receipt,
  Settings2,
  Sparkles,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';

import { Chips, Screen, TopBar } from '@/components/ui';
import { colors, font, radius, shadow, toneColors, type Tone } from '@/theme';

type Category = 'lecons' | 'dossier' | 'paiements' | 'formation';

type Notification = {
  id: string;
  group: 'Aujourd’hui' | 'Hier' | 'Plus tôt';
  category: Category;
  icon: LucideIcon;
  tone: Tone;
  title: string;
  text: string;
  time: string;
  unread: boolean;
  action?: { label: string; href: Href };
};

/** Données fictives : elles viendront de l'API (et des notifications push) */
const initial: Notification[] = [
  { id: 'n1', group: 'Aujourd’hui', category: 'lecons', icon: CalendarClock, tone: 'primary', title: 'Rappel : leçon demain', text: 'Jeudi 29 oct. · 14:00 avec Julie Bernard, départ Agence Lyon République.', time: '09:30', unread: true, action: { label: 'Voir', href: '/eleve/lecons' } },
  { id: 'n2', group: 'Aujourd’hui', category: 'dossier', icon: FileX, tone: 'danger', title: 'Justificatif de domicile refusé', text: 'Le document date de plus de 6 mois. Déposez-en un plus récent pour compléter votre dossier.', time: '08:12', unread: true, action: { label: 'Déposer', href: '/eleve/documents' } },
  { id: 'n3', group: 'Aujourd’hui', category: 'formation', icon: MessageCircle, tone: 'violet', title: 'Nouveau message de Julie', text: '« Pense à prendre tes lunettes samedi, on part sur le périphérique 🙂 »', time: '07:45', unread: true, action: { label: 'Répondre', href: '/eleve/messages' } },
  { id: 'n4', group: 'Hier', category: 'formation', icon: TrendingUp, tone: 'success', title: 'Compte rendu de leçon disponible', text: 'Créneau et démarrage en côte validés. 2 nouvelles compétences acquises.', time: '18:40', unread: false, action: { label: 'Voir mes acquis', href: '/eleve/progression' } },
  { id: 'n5', group: 'Hier', category: 'lecons', icon: CalendarCheck, tone: 'success', title: 'Leçon confirmée', text: 'Votre réservation du jeudi 29 oct. à 14:00 est confirmée.', time: '11:02', unread: false },
  { id: 'n6', group: 'Hier', category: 'dossier', icon: FileCheck, tone: 'success', title: 'Pièce d’identité acceptée', text: 'Votre pièce d’identité a été validée par l’équipe Virage.', time: '09:15', unread: false },
  { id: 'n7', group: 'Plus tôt', category: 'paiements', icon: CreditCard, tone: 'warning', title: 'Prochaine échéance le 21 nov.', text: '396,67 € seront prélevés pour votre formule Essentiel (2e échéance sur 3).', time: 'Lun.', unread: false, action: { label: 'Mes paiements', href: '/eleve/paiements' } },
  { id: 'n8', group: 'Plus tôt', category: 'paiements', icon: Receipt, tone: 'neutral', title: 'Facture disponible', text: 'Votre facture F-2026-0312 de 396,67 € est disponible.', time: '21 oct.', unread: false },
  { id: 'n9', group: 'Plus tôt', category: 'formation', icon: GraduationCap, tone: 'primary', title: 'Inscription à l’examen du code', text: 'Vous êtes inscrit à la session du jeudi 12 novembre, La Poste Lyon 7.', time: '15 oct.', unread: false },
];

const groups = ['Aujourd’hui', 'Hier', 'Plus tôt'] as const;

/** Centre de notifications de l'élève */
export default function EleveNotifications() {
  const [items, setItems] = useState(initial);
  const [filter, setFilter] = useState('all');

  const unreadCount = items.filter((n) => n.unread).length;
  const visible = items.filter((n) => (filter === 'all' ? true : filter === 'unread' ? n.unread : n.category === filter));

  const markRead = (id: string) => setItems((list) => list.map((n) => (n.id === id ? { ...n, unread: false } : n)));
  const markAll = () => setItems((list) => list.map((n) => ({ ...n, unread: false })));

  return (
    <Screen>
      <TopBar title="Notifications" right={<SettingsButton />} />

      <View style={styles.head}>
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={styles.title}>Quoi de neuf ?</Text>
          <Text style={[font.body, { color: colors.muted }]}>
            {unreadCount ? `${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}` : 'Vous êtes à jour 🎉'}
          </Text>
        </View>
        {unreadCount ? (
          <Pressable onPress={markAll} hitSlop={8} style={styles.markAll}>
            <CheckCheck size={15} color={colors.primary} />
            <Text style={styles.link}>Tout lire</Text>
          </Pressable>
        ) : null}
      </View>

      <Chips
        value={filter}
        onChange={setFilter}
        items={[
          { key: 'all', label: 'Toutes' },
          { key: 'unread', label: 'Non lues', count: unreadCount },
          { key: 'lecons', label: 'Leçons' },
          { key: 'dossier', label: 'Dossier' },
          { key: 'paiements', label: 'Paiements' },
          { key: 'formation', label: 'Formation' },
        ]}
      />

      {visible.length === 0 ? (
        <Animated.View entering={FadeIn.duration(250)} style={styles.empty}>
          <View style={styles.emptyIcon}>
            <BellOff size={26} color={colors.primary} strokeWidth={1.8} />
          </View>
          <Text style={font.h3}>Rien de nouveau ici</Text>
          <Text style={[font.small, { textAlign: 'center' }]}>On vous prévient dès qu’il se passe quelque chose sur votre parcours.</Text>
        </Animated.View>
      ) : (
        groups.map((g) => {
          const list = visible.filter((n) => n.group === g);
          if (!list.length) return null;
          return (
            <Animated.View key={g} layout={LinearTransition.duration(220)} style={{ gap: 10 }}>
              <Text style={styles.group}>{g.toUpperCase()}</Text>
              {list.map((n, i) => (
                <Animated.View
                  key={n.id}
                  entering={FadeInDown.delay(i * 50).duration(300)}
                  exiting={FadeOut.duration(150)}
                  layout={LinearTransition.duration(220)}>
                  <NotificationCard n={n} onPress={() => markRead(n.id)} />
                </Animated.View>
              ))}
            </Animated.View>
          );
        })
      )}

      <Pressable onPress={() => router.push('/eleve/reglages')} style={styles.settingsRow}>
        <Sparkles size={18} color={colors.primary} strokeWidth={1.8} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[font.h3, { fontSize: 14 }]}>Choisissez ce que vous recevez</Text>
          <Text style={font.tiny}>Rappels de leçon, e-mails, SMS : réglez tout dans Paramètres.</Text>
        </View>
      </Pressable>
    </Screen>
  );
}

function NotificationCard({ n, onPress }: { n: Notification; onPress: () => void }) {
  const t = toneColors[n.tone];
  const Icon = n.icon;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, n.unread && styles.cardUnread, pressed && { transform: [{ scale: 0.985 }] }]}>
      <View style={[styles.icon, { backgroundColor: t.bg }]}>
        <Icon size={19} color={t.fg} strokeWidth={1.9} />
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
          <Text style={[styles.cardTitle, !n.unread && { fontWeight: '600' }]} numberOfLines={2}>
            {n.title}
          </Text>
          <Text style={[font.tiny, { marginTop: 2 }, n.unread && { color: colors.primary, fontWeight: '700' }]}>{n.time}</Text>
          {n.unread ? <Animated.View exiting={FadeOut.duration(200)} style={styles.dot} /> : null}
        </View>
        <Text style={[font.small, { lineHeight: 19 }]}>{n.text}</Text>
        {n.action ? (
          <Pressable
            onPress={() => {
              onPress();
              router.push(n.action!.href);
            }}
            style={styles.action}>
            <Text style={styles.actionText}>{n.action.label}</Text>
          </Pressable>
        ) : null}
      </View>
    </Pressable>
  );
}

function SettingsButton() {
  return (
    <Pressable onPress={() => router.push('/eleve/reglages')} style={styles.settingsBtn} hitSlop={6}>
      <Settings2 size={19} color={colors.ink} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  title: { fontSize: 30, fontWeight: '800', color: colors.ink, letterSpacing: -0.8 },
  markAll: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingBottom: 3 },
  link: { fontSize: 13, fontWeight: '600', color: colors.primary },
  group: { fontSize: 11, fontWeight: '700', color: colors.muted, letterSpacing: 0.6, marginTop: 4 },
  card: { flexDirection: 'row', gap: 14, padding: 16, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: 'transparent', ...shadow.card },
  cardUnread: { borderColor: '#D5DCFD' },
  icon: { width: 42, height: 42, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.ink },
  dot: { marginTop: 5, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  action: { alignSelf: 'flex-start', marginTop: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: colors.primarySoft },
  actionText: { fontSize: 12.5, fontWeight: '700', color: colors.primary },
  empty: { alignItems: 'center', gap: 10, paddingVertical: 40, paddingHorizontal: 24 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  settingsRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: radius.lg, backgroundColor: colors.primarySoft },
  settingsBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
});
