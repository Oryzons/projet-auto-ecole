import { router, type Href } from 'expo-router';
import {
  AlertTriangle,
  Bell,
  BookOpen,
  CalendarClock,
  CalendarPlus,
  CarFront,
  Check,
  ChevronRight,
  Clock3,
  Flag,
  Hourglass,
  MapPin,
  MessageCircle,
  Motorbike,
  Navigation,
  Wallet,
  type LucideIcon,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInRight, useAnimatedProps, useSharedValue, withDelay, withTiming, Easing } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { AnimatedBar, ListCard, PressableScale, SectionLabel, StatStrip, TimeRow } from '@/components/blocks';
import { CarArt } from '@/components/car-art';
import { HoursOffer } from '@/components/hours-offer';
import { DetailList, SidePanel } from '@/components/panel';
import { Button, Screen } from '@/components/ui';
import { useRemainingHours } from '@/data/billing';
import { useLessonRequests } from '@/data/lesson-requests';
import { documents, invoices, student, upcomingLessons, type Lesson } from '@/data/mock';
import { useProfile } from '@/data/profile';
import { colors, font, shadow } from '@/theme';

const enter = (i: number) => FadeInDown.delay(60 + i * 70).duration(380);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/**
 * Tableau de bord élève.
 * Les leçons, le moniteur, le véhicule, les heures et les pièces viennent des
 * données partagées avec le site admin et l'espace moniteur.
 */
export default function EleveAccueil() {
  const profile = useProfile();
  const moto = profile.vehicule === 'moto';
  const next = upcomingLessons[0];
  const later = upcomingLessons.slice(1);
  const [month = ''] = profile.objectif.split(' ');
  const remaining = useRemainingHours();
  const toFix = documents.filter((d) => d.status === 'refused');
  const missing = documents.filter((d) => d.status === 'missing');
  const docsOk = documents.filter((d) => d.status === 'accepted').length;
  const due = invoices.find((i) => i.status === 'due');
  const [panel, setPanel] = useState<Lesson | null>(null);
  const allRequests = useLessonRequests();
  const accepted = allRequests.filter((r) => r.mine && r.status === 'accepted').length;
  const waiting = allRequests.filter((r) => r.mine && r.status === 'pending').length;
  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase();

  // parcours : dossier, code, conduite, examen
  const steps = [
    { label: 'Dossier', value: `${docsOk}/${documents.length}`, ratio: docsOk / documents.length, href: '/eleve/documents' as Href },
    { label: 'Code', value: `${Math.round(student.code.ratio * 100)} %`, ratio: student.code.ratio, href: '/eleve/formation' as Href },
    { label: 'Conduite', value: `${student.driving.done}/${student.driving.total} h`, ratio: student.driving.done / student.driving.total, href: '/eleve/progression' as Href },
  ];
  const overall = steps.reduce((n, s) => n + Math.min(1, s.ratio), 0) / (steps.length + 1);

  return (
    <Screen withTabBar>
      <View style={styles.header}>
        <View style={{ gap: 4, flex: 1 }}>
          <Text style={styles.date}>{today}</Text>
          <Text style={styles.hello}>Ça roule, {student.firstName} ?</Text>
        </View>
        <Pressable style={styles.bell} onPress={() => router.push('/eleve/notifications')} accessibilityLabel="Notifications">
          <Bell size={20} color={colors.ink} />
          <View style={styles.bellDot} />
        </Pressable>
      </View>

      {/* Prochaine leçon : la même que dans le planning du moniteur et de l'auto-école */}
      <Animated.View entering={enter(0)}>
        {next ? (
          <PressableScale style={styles.hero} scale={0.98} onPress={() => setPanel(next)} accessibilityLabel="Voir ma prochaine leçon">
            {moto ? (
              <View style={styles.vehicleFallback}>
                <Motorbike size={96} color="rgba(255,255,255,0.22)" strokeWidth={1.2} />
              </View>
            ) : (
              <Animated.View entering={FadeInRight.delay(150).duration(700).easing(Easing.out(Easing.cubic))} style={styles.vehicle} pointerEvents="none">
                <CarArt width={168} />
              </Animated.View>
            )}
            <View style={styles.heroTop}>
              <Text style={styles.heroEyebrow}>PROCHAINE LEÇON</Text>
              <View style={styles.heroChip}>
                <Clock3 size={12} color="#fff" />
                <Text style={styles.heroChipText}>{countdown(next.at)}</Text>
              </View>
            </View>
            <View style={{ gap: 4, width: '64%' }}>
              <Text style={styles.heroTitle}>{relativeDay(next)}</Text>
              <Text style={styles.heroTime}>
                {next.start} – {next.end}
              </Text>
            </View>
            <View style={styles.heroMeta}>
              <View style={styles.heroAvatar}>
                <Text style={styles.heroAvatarText}>{initials(next.instructor)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroWho} numberOfLines={1}>
                  {next.instructor}
                </Text>
                <Text style={styles.heroWhere} numberOfLines={1}>
                  {next.place} · {next.vehicle?.split(' · ')[0]}
                </Text>
              </View>
              <Pressable
                style={styles.heroGo}
                onPress={() => openMaps(next.place)}
                accessibilityLabel="Itinéraire vers le rendez-vous"
                hitSlop={8}>
                <Navigation size={17} color={colors.primary} />
              </Pressable>
            </View>
          </PressableScale>
        ) : (
          <PressableScale style={[styles.hero, { justifyContent: 'center' }]} onPress={() => router.push('/eleve/lecons')}>
            <Text style={styles.heroEyebrow}>AUCUNE LEÇON PRÉVUE</Text>
            <Text style={styles.heroTitle}>Réservez la suivante.</Text>
            <Text style={styles.heroWhere}>{remaining} h disponibles sur votre forfait</Text>
          </PressableScale>
        )}
      </Animated.View>

      {/* Ce qui bloque le dossier passe avant le reste */}
      {toFix.length || missing.length ? (
        <Animated.View entering={enter(1)}>
          <PressableScale style={styles.alert} scale={0.98} onPress={() => router.push('/eleve/documents')}>
            <View style={styles.alertIcon}>
              <AlertTriangle size={18} color={colors.warning} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.alertTitle}>
                {toFix.length + missing.length} pièce{toFix.length + missing.length > 1 ? 's' : ''} à déposer
              </Text>
              <Text style={styles.alertText} numberOfLines={2}>
                {[...toFix.map((d) => `${d.name} refusé`), ...missing.map((d) => d.name)].join(' · ')}
              </Text>
            </View>
            <ChevronRight size={18} color={colors.warning} />
          </PressableScale>
        </Animated.View>
      ) : null}

      {waiting ? (
        <Animated.View entering={enter(1)}>
          <PressableScale style={styles.waiting} scale={0.98} onPress={() => router.push('/eleve/lecons')}>
            <Hourglass size={17} color={colors.warning} />
            <Text style={styles.waitingText}>
              {waiting} demande{waiting > 1 ? 's' : ''} de cours en attente de confirmation
            </Text>
            <ChevronRight size={17} color={colors.muted} />
          </PressableScale>
        </Animated.View>
      ) : null}

      <Animated.View entering={enter(2)}>
        <StatStrip
          items={[
            { label: 'Leçons prévues', value: `${upcomingLessons.length + accepted}`, onPress: () => router.push('/eleve/lecons') },
            { label: 'Heures à réserver', value: `${remaining} h`, tone: 'primary', onPress: () => router.push('/eleve/lecons') },
            { label: due ? 'À régler' : 'Solde', value: due ? `${due.amount} €` : '0 €', tone: due ? 'warning' : 'success', onPress: () => router.push('/eleve/paiements') },
          ]}
        />
      </Animated.View>

      {/* Parcours vers le permis */}
      <Animated.View entering={enter(3)} style={{ gap: 10 }}>
        <SectionLabel action="Mes acquis" onAction={() => router.push('/eleve/progression')}>
          Mon parcours
        </SectionLabel>
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <Ring value={overall} size={84} stroke={9}>
              <Text style={styles.ringValue}>{Math.round(overall * 100)}%</Text>
              <Text style={styles.ringLabel}>du permis</Text>
            </Ring>
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={styles.cardTitle}>Cap sur {month.toLowerCase()}</Text>
              <Text style={font.small}>
                {student.licence} · {student.formula} avec {student.instructor.split(' ')[0]}
              </Text>
              <View style={styles.goal}>
                <Flag size={12} color={colors.primary} />
                <Text style={styles.goalText}>Objectif {profile.objectif.toLowerCase()}</Text>
              </View>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {steps.map((s, i) => (
              <StepTile key={s.label} {...s} delay={300 + i * 120} />
            ))}
            <StepTile label="Examen" value={`${month.slice(0, 3)}.`} ratio={0} href="/eleve/examen" delay={660} />
          </View>
        </View>
      </Animated.View>

      {later.length ? (
        <Animated.View entering={enter(4)} style={{ gap: 8 }}>
          <SectionLabel count={later.length} action="Planning" onAction={() => router.push('/eleve/lecons')}>
            Ensuite
          </SectionLabel>
          <ListCard>
            {later.map((l) => (
              <TimeRow
                key={l.id}
                time={l.start}
                sub={`${l.day} ${l.date.split(' ')[0]}`}
                color={l.type === 'Code' ? colors.violet : colors.primary}
                title={l.type === 'Code' ? 'Séance de code' : `Conduite avec ${l.instructor.split(' ')[0]}`}
                detail={`${l.place} · ${l.vehicle?.split(' · ')[0] ?? ''}`}
                onPress={() => setPanel(l)}
              />
            ))}
          </ListCard>
        </Animated.View>
      ) : null}

      <Animated.View entering={enter(5)} style={{ gap: 10 }}>
        <SectionLabel>Raccourcis</SectionLabel>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Shortcut icon={CalendarPlus} label="Réserver" primary href="/eleve/lecons" />
          <Shortcut icon={BookOpen} label="Code" href="/eleve/formation" />
          <Shortcut icon={Wallet} label="Paiements" href="/eleve/paiements" />
          <Shortcut icon={MessageCircle} label="Messages" href="/eleve/messages" />
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
        subtitle={panel ? `${relativeDay(panel)} · ${panel.start} – ${panel.end}` : undefined}
        footer={
          <>
            <Button label="Itinéraire vers le rendez-vous" icon={Navigation} onPress={() => panel && openMaps(panel.place)} />
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
            <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
              <MapPin size={14} color={colors.muted} />
              <Text style={[font.small, { flex: 1, lineHeight: 19 }]}>
                Annulation gratuite jusqu’à 48 h avant. Pensez à votre livret d’apprentissage et à une pièce d’identité.
              </Text>
            </View>
          </>
        ) : null}
      </SidePanel>
    </Screen>
  );
}

/* ---------- Morceaux de l'écran ---------- */

function Ring({ value, size, stroke, children }: { value: number; size: number; stroke: number; children?: React.ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withDelay(250, withTiming(value, { duration: 900, easing: Easing.out(Easing.cubic) }));
  }, [progress, value]);
  const animated = useAnimatedProps(() => ({ strokeDashoffset: c * (1 - progress.value) }));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.primarySoft} strokeWidth={stroke} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.primary}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${c} ${c}`}
          animatedProps={animated}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {children}
    </View>
  );
}

function StepTile({ label, value, ratio, href, delay }: { label: string; value: string; ratio: number; href: Href; delay: number }) {
  const done = ratio >= 1;
  return (
    <PressableScale style={styles.step} scale={0.95} onPress={() => router.push(href)} accessibilityLabel={`${label} : ${value}`}>
      {done ? (
        <View style={styles.stepDot}>
          <Check size={11} color="#fff" strokeWidth={3} />
        </View>
      ) : null}
      <Text style={styles.stepValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.stepLabel}>{label}</Text>
      <View style={{ marginTop: 4 }}>
        <AnimatedBar value={Math.min(1, ratio)} height={4} delay={delay} color={done ? colors.success : colors.primary} />
      </View>
    </PressableScale>
  );
}

function Shortcut({ icon: Icon, label, primary, href }: { icon: LucideIcon; label: string; primary?: boolean; href: Href }) {
  return (
    <PressableScale onPress={() => router.push(href)} scale={0.95} style={[styles.shortcut, primary && styles.shortcutPrimary]}>
      <Icon size={21} color={primary ? '#fff' : colors.primary} strokeWidth={1.8} />
      <Text style={[styles.shortcutText, primary && { color: '#fff' }]}>{label}</Text>
    </PressableScale>
  );
}

/* ---------- Formats ---------- */

const DAYS: Record<string, string> = { 'Lun.': 'Lundi', 'Mar.': 'Mardi', 'Mer.': 'Mercredi', 'Jeu.': 'Jeudi', 'Ven.': 'Vendredi', 'Sam.': 'Samedi', 'Dim.': 'Dimanche' };

function relativeDay(l: Lesson) {
  if (l.at) {
    const d = new Date(l.at);
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    const diff = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() - t.getTime()) / 86_400_000);
    if (diff === 0) return 'Aujourd’hui';
    if (diff === 1) return 'Demain';
  }
  return `${DAYS[l.day] ?? l.day} ${l.date}`;
}

function countdown(at?: number) {
  if (!at) return 'Confirmée';
  const min = Math.round((at - Date.now()) / 60_000);
  if (min <= 0) return 'En cours';
  if (min < 60) return `Dans ${min} min`;
  const h = Math.round(min / 60);
  if (h < 48) return `Dans ${h} h`;
  return `Dans ${Math.round(h / 24)} jours`;
}

const initials = (name: string) =>
  name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const openMaps = (place: string) => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place}, Lyon`)}`);

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8 },
  date: { fontSize: 11, fontWeight: '600', color: colors.muted, letterSpacing: 0.4 },
  hello: { fontSize: 26, fontWeight: '800', color: colors.ink, letterSpacing: -0.6 },
  bell: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', ...shadow.card },
  bellDot: { position: 'absolute', top: 10, right: 11, width: 7, height: 7, borderRadius: 4, backgroundColor: colors.primary, borderWidth: 1.5, borderColor: '#fff' },

  hero: { minHeight: 200, borderRadius: 24, backgroundColor: colors.primary, padding: 18, gap: 14, overflow: 'hidden' },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroEyebrow: { fontSize: 10.5, fontWeight: '700', color: 'rgba(255,255,255,0.85)', letterSpacing: 0.6 },
  heroChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.18)' },
  heroChipText: { fontSize: 11.5, fontWeight: '700', color: '#fff' },
  heroTitle: { fontSize: 30, lineHeight: 33, fontWeight: '800', color: '#fff', letterSpacing: -0.8 },
  heroTime: { fontSize: 17, fontWeight: '600', color: 'rgba(255,255,255,0.92)' },
  heroMeta: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.14)' },
  heroAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  heroAvatarText: { fontSize: 13, fontWeight: '800', color: colors.primary },
  heroWho: { fontSize: 14, fontWeight: '700', color: '#fff' },
  heroWhere: { fontSize: 12, color: 'rgba(255,255,255,0.85)' },
  heroGo: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  vehicle: { position: 'absolute', right: 12, top: 56 },
  vehicleFallback: { position: 'absolute', right: 6, top: 30 },

  waiting: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 16, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  waitingText: { flex: 1, fontSize: 13.5, fontWeight: '600', color: colors.ink },
  alert: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 18, backgroundColor: colors.warningSoft, borderWidth: 1, borderColor: '#F6DDB5' },
  alertIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  alertTitle: { fontSize: 14.5, fontWeight: '700', color: colors.ink },
  alertText: { fontSize: 12.5, color: colors.warning },

  card: { backgroundColor: colors.card, borderRadius: 20, padding: 16, ...shadow.card },
  cardTitle: { fontSize: 18, fontWeight: '800', color: colors.ink, letterSpacing: -0.3 },
  ringValue: { fontSize: 20, fontWeight: '800', color: colors.ink, letterSpacing: -0.5 },
  ringLabel: { fontSize: 10, color: colors.muted, marginTop: -2 },
  goal: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, backgroundColor: colors.primarySoft },
  goalText: { fontSize: 11.5, fontWeight: '600', color: colors.primary },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 14 },
  step: { flex: 1, gap: 3 },
  stepDot: { position: 'absolute', right: 0, top: 2, width: 16, height: 16, borderRadius: 8, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center' },
  stepValue: { fontSize: 15, fontWeight: '800', color: colors.ink, letterSpacing: -0.3 },
  stepLabel: { fontSize: 11.5, color: colors.muted },

  shortcut: { flex: 1, height: 80, borderRadius: 18, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', gap: 8, ...shadow.card },
  shortcutPrimary: { backgroundColor: colors.primary },
  shortcutText: { fontSize: 12, fontWeight: '600', color: colors.ink },
});
