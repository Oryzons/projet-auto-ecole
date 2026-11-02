import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import { ArrowUpRight, Bell, BookOpen, CalendarClock, CalendarPlus, CarFront, Files, Flag, MapPin, MessageCircle, Motorbike, Navigation, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AnimatedBar, ListCard, PressableScale, SectionLabel, StatStrip, TimeRow } from '@/components/blocks';
import { HoursOffer } from '@/components/hours-offer';
import { DetailList, SidePanel } from '@/components/panel';
import { Button, Screen } from '@/components/ui';
import { useRemainingHours } from '@/data/billing';
import { documents, student, upcomingLessons } from '@/data/mock';
import { useProfile } from '@/data/profile';
import { colors, font, radius, shadow } from '@/theme';

const enter = (i: number) => FadeInDown.delay(60 + i * 70).duration(380);

/** Tableau de bord élève — calqué sur la maquette Figma */
export default function EleveAccueil() {
  const profile = useProfile();
  const moto = profile.vehicule === 'moto';
  const next = upcomingLessons[0];
  // « Décembre 2026 » → « décembre » et « Déc. 2026 »
  const [month = '', year = ''] = profile.objectif.split(' ');
  const remaining = useRemainingHours();
  const docsToDo = documents.filter((d) => d.status === 'refused' || d.status === 'missing').length;
  const [panel, setPanel] = useState<(typeof upcomingLessons)[number] | null>(null);
  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase();

  return (
    <Screen withTabBar>
      <View style={styles.header}>
        <View style={{ gap: 4 }}>
          <Text style={styles.date}>{today}</Text>
          <Text style={styles.hello}>Ça roule, {student.firstName} ?</Text>
        </View>
        <Pressable style={styles.bell} onPress={() => router.push('/eleve/notifications')}>
          <Bell size={20} color={colors.ink} />
          <View style={styles.bellDot} />
        </Pressable>
      </View>

      {/* Carte objectif : voiture ou moto selon le permis choisi */}
      <Animated.View entering={enter(0)} style={styles.hero}>
        <View style={{ gap: 10, width: '58%' }}>
          <Text style={styles.heroEyebrow}>{profile.permis.toUpperCase()}</Text>
          <Text style={styles.heroTitle}>Cap sur {month.toLowerCase()}.</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Flag size={13} color="rgba(255,255,255,0.85)" />
            <Text style={styles.heroSub}>
              Votre objectif · {month.slice(0, 3)}. {year}
            </Text>
          </View>
        </View>
        {moto ? (
          <View style={styles.vehicleFallback}>
            <Motorbike size={92} color="rgba(255,255,255,0.95)" strokeWidth={1.3} />
          </View>
        ) : (
          <Image source={require('@/assets/images/vehicule-voiture.png')} style={styles.vehicle} contentFit="contain" />
        )}
      </Animated.View>

      <Animated.View entering={enter(1)}>
        <StatStrip
          items={[
            { label: 'Leçons prévues', value: `${upcomingLessons.length}`, onPress: () => router.push('/eleve/lecons') },
            { label: 'Heures en crédit', value: `${remaining} h`, tone: 'primary', onPress: () => router.push('/eleve/paiements') },
            { label: 'Pièces à fournir', value: `${docsToDo}`, tone: docsToDo ? 'warning' : 'neutral', onPress: () => router.push('/eleve/documents') },
          ]}
        />
      </Animated.View>

      <Animated.View entering={enter(2)} style={{ gap: 12 }}>
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Chaque étape compte</Text>
          <Pressable onPress={() => router.push('/eleve/progression')}>
            <Text style={styles.link}>Tout voir</Text>
          </Pressable>
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <ProgressCard icon={BookOpen} label="Code de la route" value="82" unit="%" caption="de bonnes réponses" progress={0.82} action="Lancer une série" href="/eleve/formation" />
          <ProgressCard
            icon={moto ? Motorbike : CarFront}
            label="Conduite"
            value="12"
            unit="/ 20 h"
            caption="8 h restant à réaliser"
            progress={0.6}
            action="Voir mes acquis"
            href="/eleve/progression"
          />
        </View>
      </Animated.View>

      <Animated.View entering={enter(3)} style={{ gap: 12 }}>
        <Text style={styles.sectionTitle}>Votre prochain rendez-vous</Text>
        <PressableScale style={styles.card} scale={0.98} onPress={() => setPanel(next)} accessibilityLabel="Voir le détail du rendez-vous">
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <View style={styles.dateBox}>
              <Text style={styles.dateDay}>{next.date.split(' ')[0]}</Text>
              <Text style={styles.dateMonth}>{next.date.split(' ')[1]?.toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1, gap: 5 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.ink }}>
                {dayLong(next.day)} · {next.start} – {next.end}
              </Text>
              <Text style={font.small}>
                Avec {next.instructor} · {moto ? 'Moto A2' : 'Manuelle'}
              </Text>
              <View style={styles.confirmed}>
                <Text style={styles.confirmedText}>CONFIRMÉE</Text>
              </View>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.sectionHead}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <MapPin size={15} color={colors.muted} />
              <Text style={font.small}>{next.place}</Text>
            </View>
            <Text style={styles.link}>Détails</Text>
          </View>
        </PressableScale>
      </Animated.View>

      {upcomingLessons.length > 1 ? (
        <Animated.View entering={enter(4)} style={{ gap: 8 }}>
          <SectionLabel count={upcomingLessons.length - 1}>Ensuite</SectionLabel>
          <ListCard>
            {upcomingLessons.slice(1).map((l) => (
              <TimeRow
                key={l.id}
                time={l.start}
                sub={`${l.day} ${l.date.split(' ')[0]}`}
                color={l.type === 'Code' ? colors.violet : colors.primary}
                title={l.type === 'Code' ? 'Séance de code' : `Conduite avec ${l.instructor.split(' ')[0]}`}
                detail={l.place}
                onPress={() => setPanel(l)}
              />
            ))}
          </ListCard>
        </Animated.View>
      ) : null}

      <Animated.View entering={enter(5)} style={{ gap: 12 }}>
        <Text style={styles.sectionTitle}>À portée de main</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Shortcut icon={CalendarPlus} label="Réserver" primary href="/eleve/lecons" />
          <Shortcut icon={Files} label="Documents" href="/eleve/documents" />
          <Shortcut icon={MessageCircle} label="Mon aide" href="/eleve/messages" />
        </View>
      </Animated.View>

      {/* Proposition de rachat d'heures dès la moitié du forfait */}
      <HoursOffer dismissible delay={200} />

      <SidePanel
        open={!!panel}
        onClose={() => setPanel(null)}
        icon={panel?.type === 'Code' ? BookOpen : moto ? Motorbike : CarFront}
        tone={panel?.type === 'Code' ? 'violet' : 'primary'}
        title={panel ? (panel.type === 'Code' ? 'Séance de code' : 'Leçon de conduite') : ''}
        subtitle={panel ? `${dayLong(panel.day)} ${panel.date} · ${panel.start} – ${panel.end}` : undefined}
        footer={
          <>
            <Button
              label="Itinéraire vers le rendez-vous"
              icon={Navigation}
              onPress={() => panel && Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${panel.place}, Lyon`)}`)}
            />
            <Button variant="secondary" label="Déplacer ou annuler" icon={CalendarClock} onPress={() => (setPanel(null), router.push('/eleve/lecons'))} />
          </>
        }>
        {panel ? (
          <>
            <DetailList
              rows={[
                { label: 'Horaire', value: `${panel.start} – ${panel.end}` },
                { label: panel.type === 'Code' ? 'Salle' : 'Moniteur', value: panel.instructor },
                { label: 'Rendez-vous', value: panel.place },
                ...(panel.vehicle ? [{ label: 'Véhicule', value: panel.vehicle }] : []),
                { label: 'Statut', value: 'Confirmée', tone: 'success' as const },
              ]}
            />
            <Text style={[font.small, { lineHeight: 19 }]}>
              Annulation gratuite jusqu’à 48 h avant. Pensez à votre livret d’apprentissage et à une pièce d’identité.
            </Text>
          </>
        ) : null}
      </SidePanel>
    </Screen>
  );
}

function ProgressCard({
  icon: Icon,
  label,
  value,
  unit,
  caption,
  progress,
  action,
  href,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  unit: string;
  caption: string;
  progress: number;
  action: string;
  href: Href;
}) {
  return (
    <View style={[styles.card, { flex: 1, padding: 16, gap: 10 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Icon size={17} color={colors.ink} strokeWidth={1.8} />
        <Text style={{ fontSize: 13.5, color: colors.ink }}>{label}</Text>
      </View>
      <View style={{ gap: 2 }}>
        <Text style={styles.bigValue}>
          {value} <Text style={styles.unit}>{unit}</Text>
        </Text>
        <Text style={font.tiny}>{caption}</Text>
      </View>
      <AnimatedBar value={progress} height={5} delay={250} />
      <Pressable onPress={() => router.push(href)} style={styles.sectionHead}>
        <Text style={[styles.link, { fontWeight: '500' }]}>{action}</Text>
        <ArrowUpRight size={15} color={colors.primary} />
      </Pressable>
    </View>
  );
}

function Shortcut({ icon: Icon, label, primary, href }: { icon: LucideIcon; label: string; primary?: boolean; href: Href }) {
  return (
    <PressableScale onPress={() => router.push(href)} scale={0.95} style={[styles.shortcut, primary && styles.shortcutPrimary]}>
      <Icon size={22} color={primary ? '#fff' : colors.primary} strokeWidth={1.8} />
      <Text style={[styles.shortcutText, primary && { color: '#fff' }]}>{label}</Text>
    </PressableScale>
  );
}

const DAYS: Record<string, string> = { 'Lun.': 'Lundi', 'Mar.': 'Mardi', 'Mer.': 'Mercredi', 'Jeu.': 'Jeudi', 'Ven.': 'Vendredi', 'Sam.': 'Samedi', 'Dim.': 'Dimanche' };
const dayLong = (d: string) => DAYS[d] ?? d;

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8 },
  date: { fontSize: 11, fontWeight: '600', color: colors.muted, letterSpacing: 0.4 },
  hello: { fontSize: 26, fontWeight: '800', color: colors.ink, letterSpacing: -0.6 },
  bell: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', ...shadow.card },
  bellDot: { position: 'absolute', top: 10, right: 11, width: 7, height: 7, borderRadius: 4, backgroundColor: colors.primary, borderWidth: 1.5, borderColor: '#fff' },
  hero: { height: 170, borderRadius: 24, backgroundColor: colors.primary, padding: 20, justifyContent: 'center', overflow: 'hidden' },
  heroEyebrow: { fontSize: 10.5, fontWeight: '700', color: 'rgba(255,255,255,0.85)', letterSpacing: 0.5 },
  heroTitle: { fontSize: 30, lineHeight: 33, fontWeight: '800', color: '#fff', letterSpacing: -0.8 },
  heroSub: { fontSize: 12, color: 'rgba(255,255,255,0.9)' },
  vehicle: { position: 'absolute', right: -18, bottom: 26, width: 172, height: 94 },
  vehicleFallback: { position: 'absolute', right: 8, bottom: 22, width: 130, alignItems: 'center' },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 19, fontWeight: '700', color: colors.ink, letterSpacing: -0.3 },
  link: { fontSize: 13, fontWeight: '600', color: colors.primary },
  card: { backgroundColor: colors.card, borderRadius: 20, padding: 18, ...shadow.card },
  bigValue: { fontSize: 30, fontWeight: '800', color: colors.ink, letterSpacing: -0.8 },
  unit: { fontSize: 13, fontWeight: '500', color: colors.muted, letterSpacing: 0 },
  dateBox: { width: 56, height: 64, borderRadius: radius.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  dateDay: { fontSize: 22, fontWeight: '800', color: colors.primary },
  dateMonth: { fontSize: 10, fontWeight: '700', color: colors.primary },
  confirmed: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: colors.successSoft, marginTop: 2 },
  confirmedText: { fontSize: 10.5, fontWeight: '700', color: colors.success, letterSpacing: 0.4 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 14 },
  shortcut: { flex: 1, height: 92, borderRadius: 18, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', gap: 10, ...shadow.card },
  shortcutPrimary: { backgroundColor: colors.primary },
  shortcutText: { fontSize: 13, fontWeight: '600', color: colors.ink },
});
