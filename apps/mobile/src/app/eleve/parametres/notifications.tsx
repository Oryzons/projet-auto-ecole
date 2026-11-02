import { Bell, CalendarClock, CreditCard, FileCheck, Mail, Megaphone, MessageCircle, Moon, Smartphone } from 'lucide-react-native';
import { Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { MenuGroup, MenuRow, PageTitle, Segmented, Switch, settingsStyles as s } from '@/components/settings';
import { Screen, TopBar } from '@/components/ui';
import { bind, setPrefs, usePrefs } from '@/data/preferences';
import { colors } from '@/theme';

/** Réglages des notifications */
export default function ReglagesNotifications() {
  const p = usePrefs();
  return (
    <Screen>
      <TopBar title="Notifications" />
      <PageTitle title="Restez informé." text="Choisissez comment et quand Virage vous prévient." />

      <MenuGroup title="Canaux" delay={60}>
        <MenuRow icon={Bell} title="Notifications push" subtitle="Sur ce téléphone" right={<Switch {...bind(p, 'push')} />} />
        <MenuRow icon={Mail} title="E-mail" subtitle="lucas.martin@email.fr" right={<Switch {...bind(p, 'email')} />} />
        <MenuRow icon={Smartphone} title="SMS" subtitle="06 12 34 56 78" right={<Switch {...bind(p, 'sms')} />} />
      </MenuGroup>

      <Animated.View entering={FadeIn.delay(120)} style={{ gap: 10 }}>
        <Text style={{ fontSize: 11, fontWeight: '700', color: colors.muted, letterSpacing: 0.6, paddingHorizontal: 4 }}>RAPPEL AVANT UNE LEÇON</Text>
        <View style={s.card}>
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <CalendarClock size={20} color={colors.primary} strokeWidth={1.9} />
            <Text style={{ flex: 1, fontSize: 14, color: colors.muted }}>On vous rappelle votre leçon, le lieu de départ et le moniteur.</Text>
          </View>
          <Segmented
            value={p.lessonReminder}
            onChange={(v) => setPrefs({ lessonReminder: v })}
            options={[
              { key: 'off', label: 'Jamais' },
              { key: '2h', label: '2 h' },
              { key: '24h', label: '24 h' },
              { key: '48h', label: '48 h' },
            ]}
          />
        </View>
      </Animated.View>

      <MenuGroup title="Me prévenir pour" delay={160}>
        <MenuRow icon={MessageCircle} tone="violet" title="Nouveaux messages" right={<Switch {...bind(p, 'messages')} />} />
        <MenuRow icon={FileCheck} tone="success" title="Suivi de mon dossier" subtitle="Documents acceptés ou refusés" right={<Switch {...bind(p, 'documents')} />} />
        <MenuRow icon={CreditCard} tone="warning" title="Paiements et factures" right={<Switch {...bind(p, 'payments')} />} />
        <MenuRow icon={Megaphone} tone="neutral" title="Actualités de l’auto-école" subtitle="Offres, fermetures, nouveautés" right={<Switch {...bind(p, 'news')} />} />
      </MenuGroup>

      <MenuGroup title="Tranquillité" delay={200}>
        <MenuRow icon={Moon} tone="violet" title="Ne pas déranger" subtitle="De 22 h à 8 h, sauf rappels urgents" right={<Switch {...bind(p, 'quietHours')} />} />
      </MenuGroup>
    </Screen>
  );
}
