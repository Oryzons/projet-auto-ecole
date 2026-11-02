import { router } from 'expo-router';
import { Bug, ChevronDown, Clock3, Mail, MapPin, MessageCircle, Phone } from 'lucide-react-native';
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, LinearTransition } from 'react-native-reanimated';

import { MenuGroup, MenuRow, PageTitle } from '@/components/settings';
import { Screen, TopBar } from '@/components/ui';
import { school } from '@/data/mock';
import { colors, shadow } from '@/theme';

const faq = [
  { q: 'Comment réserver ou annuler une leçon ?', a: 'Depuis l’onglet Planning. L’annulation est gratuite jusqu’à 48 h avant la leçon.' },
  { q: 'Quand puis-je passer l’examen du code ?', a: 'Dès que vous obtenez au moins 35/40 sur vos 5 dernières séries. L’agence vous inscrit ensuite à une session.' },
  { q: 'Comment ajouter des heures de conduite ?', a: 'Depuis votre profil › Paiements. Les heures sont disponibles immédiatement après le paiement.' },
  { q: 'Mon document a été refusé, que faire ?', a: 'Le motif est indiqué dans Documents. Déposez simplement une nouvelle version.' },
  { q: 'Puis-je changer de moniteur ?', a: 'Oui, écrivez à l’accueil : nous trouverons un moniteur disponible sur vos créneaux.' },
];

/** Aide et contact */
export default function ReglagesAide() {
  const [open, setOpen] = useState(0);
  const tel = () => Linking.openURL(`tel:${school.phone.replace(/\s/g, '')}`);

  return (
    <Screen>
      <TopBar title="Aide et contact" />
      <PageTitle title="On est là." text="Une question sur votre formation ? Trouvez la réponse ou parlez-nous directement." />

      <Animated.View entering={FadeInDown.delay(60).duration(360)} style={styles.contactRow}>
        <ContactTile icon={MessageCircle} label="Message" detail="Réponse sous 2 h" onPress={() => router.push('/eleve/messages')} primary />
        <ContactTile icon={Phone} label="Appeler" detail={school.phone} onPress={tel} />
      </Animated.View>

      <MenuGroup title="Nous trouver" delay={100}>
        <MenuRow icon={MapPin} title="Agence Lyon République" subtitle="12 rue de la République, Lyon 2e" onPress={() => Linking.openURL('https://maps.apple.com/?q=12+rue+de+la+R%C3%A9publique+Lyon')} />
        <MenuRow icon={Clock3} tone="neutral" title="Horaires" subtitle="Lun.–ven. 9 h–19 h · sam. 9 h–13 h" />
        <MenuRow icon={Mail} tone="violet" title="contact@virage-auto.fr" onPress={() => Linking.openURL('mailto:contact@virage-auto.fr')} />
      </MenuGroup>

      <Animated.View entering={FadeInDown.delay(140).duration(360)} style={{ gap: 10 }}>
        <Text style={styles.groupTitle}>QUESTIONS FRÉQUENTES</Text>
        {faq.map((item, i) => {
          const on = open === i;
          return (
            <Animated.View key={item.q} layout={LinearTransition.duration(220)} style={[styles.faq, on && { borderColor: '#D5DCFD' }]}>
              <Pressable onPress={() => setOpen(on ? -1 : i)} style={styles.q}>
                <Text style={styles.qText}>{item.q}</Text>
                <View style={{ transform: [{ rotate: on ? '180deg' : '0deg' }] }}>
                  <ChevronDown size={18} color={on ? colors.primary : colors.muted} />
                </View>
              </Pressable>
              {on ? (
                <Animated.Text entering={FadeIn.delay(60).duration(200)} style={styles.a}>
                  {item.a}
                </Animated.Text>
              ) : null}
            </Animated.View>
          );
        })}
      </Animated.View>

      <MenuGroup delay={180}>
        <MenuRow icon={Bug} tone="warning" title="Signaler un problème" subtitle="Un bug, une erreur dans l’application" onPress={() => Linking.openURL('mailto:support@virage-auto.fr?subject=Problème%20application')} />
      </MenuGroup>
    </Screen>
  );
}

function ContactTile({ icon: Icon, label, detail, onPress, primary }: { icon: typeof Phone; label: string; detail: string; onPress: () => void; primary?: boolean }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.tile, primary && styles.tilePrimary, pressed && { transform: [{ scale: 0.98 }] }]}>
      <View style={[styles.tileIcon, primary && { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
        <Icon size={20} color={primary ? '#fff' : colors.primary} strokeWidth={1.9} />
      </View>
      <Text style={[styles.tileLabel, primary && { color: '#fff' }]}>{label}</Text>
      <Text style={[styles.tileDetail, primary && { color: 'rgba(255,255,255,0.75)' }]}>{detail}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  contactRow: { flexDirection: 'row', gap: 12 },
  tile: { flex: 1, gap: 6, padding: 16, borderRadius: 20, backgroundColor: colors.card, ...shadow.card },
  tilePrimary: { backgroundColor: colors.primary, ...shadow.primary },
  tileIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  tileLabel: { fontSize: 16, fontWeight: '700', color: colors.ink },
  tileDetail: { fontSize: 12.5, color: colors.muted },
  groupTitle: { fontSize: 11, fontWeight: '700', color: colors.muted, letterSpacing: 0.6, paddingHorizontal: 4 },
  faq: { borderRadius: 16, backgroundColor: colors.card, borderWidth: 1, borderColor: 'transparent', overflow: 'hidden' },
  q: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 14 },
  qText: { flex: 1, fontSize: 14.5, fontWeight: '700', color: colors.ink },
  a: { fontSize: 13.5, lineHeight: 20, color: colors.muted, paddingHorizontal: 16, paddingBottom: 16, marginTop: -4 },
});
