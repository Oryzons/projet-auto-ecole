import { router } from 'expo-router';
import {
  CalendarCheck,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Clock,
  MapPin,
  Star,
  type LucideIcon,
} from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';

import { CtaButton, Screen, TopBar } from '@/components/ui';
import { student } from '@/data/mock';
import { colors, font, shadow } from '@/theme';

/* ---------- Données fictives (viendront du planning des moniteurs) ---------- */

const durations = [
  { key: 1, label: '1 heure' },
  { key: 2, label: '2 heures' },
];
const places = [
  { key: 'rep', label: 'Lyon République', address: '12 rue de la République, Lyon 2e' },
  { key: 'jm', label: 'Lyon Jean Macé', address: '12 av. Jean Jaurès, Lyon 7e' },
  { key: 'vil', label: 'Villeurbanne', address: '45 cours Émile Zola, Villeurbanne' },
];
const slotsByPeriod = {
  matin: ['08:00', '09:00', '10:00', '11:00'],
  apres: ['14:00', '15:00', '16:00', '17:00'],
};

const dayNames = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'];
const dayLong = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const monthsShort = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

const firstMonday = new Date(2026, 10, 2);
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const hhmm = (start: string, plus: number) => `${String(Number(start.slice(0, 2)) + plus).padStart(2, '0')}:00`;

/** Créneaux complets : pseudo-aléatoire mais stable pour un jour donné */
const isFull = (date: Date, time: string) => (date.getDate() + Number(time.slice(0, 2))) % 4 === 0;

const ease = Easing.out(Easing.cubic);

/** Réserver une leçon de conduite */
export default function EleveLecons() {
  const [duration, setDuration] = useState(1);
  const [place, setPlace] = useState('rep');
  const [menu, setMenu] = useState<'duration' | 'place' | null>(null);
  const [week, setWeek] = useState(0);
  const [dayIndex, setDayIndex] = useState(0);
  const [period, setPeriod] = useState<'matin' | 'apres'>('apres');
  const [slot, setSlot] = useState<string | null>('16:00');
  const [booked, setBooked] = useState(false);

  const monday = addDays(firstMonday, week * 7);
  const days = dayNames.map((name, i) => {
    const date = addDays(monday, i);
    return { name, date, open: i < 5 };
  });
  const day = days[dayIndex];
  const placeInfo = places.find((p) => p.key === place)!;
  const remaining = student.balance.remainingHours;

  const selectDay = (i: number) => {
    setDayIndex(i);
    setSlot(null);
  };
  const changeWeek = (delta: number) => {
    setWeek((w) => w + delta);
    setDayIndex(0);
    setSlot(null);
  };

  const dateShort = `${day.date.getDate()} ${monthsShort[day.date.getMonth()]}`;

  if (booked && slot) {
    return (
      <Screen withTabBar>
        <TopBar title="Réserver une leçon" onBack={() => setBooked(false)} />
        <Animated.View entering={FadeInDown.duration(380).easing(ease)} style={styles.done}>
          <View style={styles.doneIcon}>
            <Check size={30} color="#fff" strokeWidth={2.6} />
          </View>
          <Text style={styles.title}>C’est réservé !</Text>
          <Text style={[styles.subtitle, { textAlign: 'center' }]}>
            {dayLong[dayIndex]} {day.date.getDate()} {months[day.date.getMonth()]} de {slot} à {hhmm(slot, duration)} avec Julie Bernard, départ {placeInfo.address}.
          </Text>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(120).duration(380).easing(ease)} style={{ gap: 12 }}>
          <CtaButton label="Réserver une autre leçon" icon={CalendarCheck} onPress={() => { setBooked(false); setSlot(null); }} />
          <Pressable onPress={() => router.navigate('/eleve')} style={styles.secondary}>
            <Text style={styles.secondaryText}>Retour à l’accueil</Text>
          </Pressable>
        </Animated.View>
      </Screen>
    );
  }

  return (
    <Screen withTabBar>
      <TopBar title="Réserver une leçon" onBack={() => router.navigate('/eleve')} />

      <View style={{ gap: 10 }}>
        <Text style={styles.title}>On prend le volant ?</Text>
        <Text style={styles.subtitle}>
          Choisissez le moment qui vous va.{'\n'}Il vous reste {remaining} h à réserver sur votre forfait.
        </Text>
      </View>

      {/* Durée et lieu de départ */}
      <View style={{ gap: 8, zIndex: 2 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Select icon={Clock} label={durations.find((d) => d.key === duration)!.label} open={menu === 'duration'} onPress={() => setMenu(menu === 'duration' ? null : 'duration')} />
          <Select icon={MapPin} label={placeInfo.label} open={menu === 'place'} onPress={() => setMenu(menu === 'place' ? null : 'place')} flex chevron />
        </View>
        {menu ? (
          <Animated.View entering={FadeInDown.duration(200).easing(ease)} exiting={FadeOut.duration(120)} style={styles.menu}>
            {(menu === 'duration' ? durations : places).map((o) => {
              const on = menu === 'duration' ? o.key === duration : o.key === place;
              return (
                <Pressable
                  key={o.key}
                  onPress={() => {
                    if (menu === 'duration') setDuration(o.key as number);
                    else setPlace(o.key as string);
                    setMenu(null);
                  }}
                  style={styles.menuItem}>
                  <Text style={[styles.menuText, on && { color: colors.primary }]}>{o.label}</Text>
                  {on ? <Check size={16} color={colors.primary} /> : null}
                </Pressable>
              );
            })}
          </Animated.View>
        ) : null}
      </View>

      {/* Semaine */}
      <View style={{ gap: 14 }}>
        <View style={styles.monthRow}>
          <Text style={styles.h2}>
            {months[day.date.getMonth()][0].toUpperCase() + months[day.date.getMonth()].slice(1)} {day.date.getFullYear()}
          </Text>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <Pressable disabled={week === 0} onPress={() => changeWeek(-1)} hitSlop={8} style={styles.arrow}>
              <ChevronLeft size={20} color={week === 0 ? colors.faint : colors.ink} />
            </Pressable>
            <Pressable disabled={week === 3} onPress={() => changeWeek(1)} hitSlop={8} style={styles.arrow}>
              <ChevronRight size={20} color={week === 3 ? colors.faint : colors.ink} />
            </Pressable>
          </View>
        </View>
        <Animated.View key={week} entering={FadeIn.duration(220)} style={styles.days}>
          {days.map((d, i) => {
            const on = i === dayIndex;
            return (
              <Pressable key={i} disabled={!d.open} onPress={() => selectDay(i)} style={[styles.day, on && styles.dayOn]}>
                <Text style={[styles.dayName, on && { color: 'rgba(255,255,255,0.8)' }]}>{d.name}</Text>
                <Text style={[styles.dayNum, on && { color: '#fff' }, !d.open && { color: '#A3AFC2' }]}>{d.date.getDate()}</Text>
                <View style={[styles.dayDot, on && { backgroundColor: '#fff' }, !d.open && { backgroundColor: 'transparent' }]} />
              </Pressable>
            );
          })}
        </Animated.View>
      </View>

      {/* Créneaux */}
      <View style={{ gap: 14 }}>
        <View style={styles.monthRow}>
          <Text style={styles.h2}>
            {dayLong[dayIndex]} {day.date.getDate()} {months[day.date.getMonth()]}
          </Text>
          <Pressable
            onPress={() => {
              setPeriod(period === 'apres' ? 'matin' : 'apres');
              setSlot(null);
            }}
            hitSlop={8}>
            <Text style={styles.link}>{period === 'apres' ? 'Après-midi' : 'Matin'}</Text>
          </Pressable>
        </View>
        <Animated.View key={`${week}-${dayIndex}-${period}`} entering={FadeIn.duration(220)} style={styles.slots}>
          {slotsByPeriod[period].map((t) => {
            const full = isFull(day.date, t);
            const on = slot === t;
            if (full) {
              return (
                <View key={t} style={[styles.slot, styles.slotFull]}>
                  <Text style={styles.slotFullText}>{t}</Text>
                  <Text style={styles.slotFullHint}>Complet</Text>
                </View>
              );
            }
            return (
              <Pressable key={t} onPress={() => setSlot(t)} style={[styles.slot, on && styles.slotOn]}>
                <Text style={[styles.slotText, on && { color: '#fff' }]}>{t}</Text>
                {on ? (
                  <Animated.View entering={FadeIn.duration(160)}>
                    <Check size={16} color="#fff" strokeWidth={2.4} />
                  </Animated.View>
                ) : null}
              </Pressable>
            );
          })}
        </Animated.View>
      </View>

      {/* Moniteur */}
      <View style={styles.instructor}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>JB</Text>
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={styles.name}>Julie Bernard</Text>
          <Text style={styles.meta}>Votre monitrice · Boîte manuelle</Text>
        </View>
        <Star size={17} color={colors.primary} strokeWidth={1.9} />
        <Text style={styles.rating}>4,9</Text>
      </View>

      {/* Récapitulatif */}
      {slot ? (
        <Animated.View entering={FadeInDown.duration(260).easing(ease)} layout={LinearTransition.duration(220)} style={styles.summary}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.summaryTitle}>
              {slot} – {hhmm(slot, duration)} · {duration} h
            </Text>
            <Text style={styles.included}>Incluse au forfait</Text>
          </View>
          <Text style={styles.summaryText}>{placeInfo.address}</Text>
          <Text style={styles.summaryHint}>Après cette réservation : {remaining - duration} h disponibles.</Text>
        </Animated.View>
      ) : null}

      <Animated.View layout={LinearTransition.duration(220)} style={{ gap: 14 }}>
        {slot ? (
          <CtaButton label={`Confirmer le ${dateShort} à ${slot}`} icon={CalendarCheck} onPress={() => setBooked(true)} />
        ) : (
          <View style={[styles.ctaOff]}>
            <Text style={styles.ctaOffText}>Choisissez un créneau</Text>
          </View>
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 2 }}>
          <CircleCheck size={16} color={colors.muted} strokeWidth={1.8} />
          <Text style={styles.footnote}>Annulation sans frais jusqu’à 48 h avant la leçon.</Text>
        </View>
      </Animated.View>
    </Screen>
  );
}

function Select({ icon: Icon, label, onPress, open, flex, chevron }: { icon: LucideIcon; label: string; onPress: () => void; open: boolean; flex?: boolean; chevron?: boolean }) {
  return (
    <Pressable onPress={onPress} style={[styles.select, flex && { flex: 1 }, open && { borderColor: colors.primary }]}>
      <Icon size={18} color={colors.primary} strokeWidth={1.9} />
      <Text style={[styles.selectText, flex && { flex: 1 }]} numberOfLines={1}>
        {label}
      </Text>
      {chevron ? (
        <View style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}>
          <ChevronDown size={18} color={colors.muted} />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 30, fontWeight: '800', color: colors.ink, letterSpacing: -0.8 },
  subtitle: { fontSize: 15, lineHeight: 23, color: colors.muted },
  h2: { fontSize: 19, fontWeight: '800', color: colors.ink, letterSpacing: -0.3 },
  link: { fontSize: 13, fontWeight: '700', color: colors.primary },

  select: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 50, paddingHorizontal: 14, borderRadius: 14, backgroundColor: colors.card, borderWidth: 1, borderColor: 'transparent', ...shadow.card },
  selectText: { fontSize: 14, fontWeight: '600', color: colors.ink },
  menu: { borderRadius: 14, backgroundColor: colors.card, paddingVertical: 4, borderWidth: 1, borderColor: colors.border, ...shadow.card },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  menuText: { fontSize: 14, fontWeight: '600', color: colors.ink },

  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  arrow: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  days: { flexDirection: 'row', gap: 6 },
  day: { flex: 1, height: 82, borderRadius: 14, alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: colors.card, ...shadow.card },
  dayOn: { backgroundColor: colors.primary, ...shadow.primary },
  dayName: { fontSize: 9.5, fontWeight: '600', color: colors.faint, letterSpacing: 0.3 },
  dayNum: { fontSize: 19, fontWeight: '800', color: colors.ink },
  dayDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.primary },

  slots: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  slot: { width: '48.4%', height: 46, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.input },
  slotOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  slotText: { fontSize: 15, fontWeight: '500', color: colors.ink },
  slotFull: { backgroundColor: '#E9EDF3', borderColor: '#E9EDF3' },
  slotFullText: { fontSize: 14, color: colors.faint, textDecorationLine: 'line-through' },
  slotFullHint: { fontSize: 11, color: colors.faint },

  instructor: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 16, borderRadius: 20, backgroundColor: colors.card, ...shadow.card },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  avatarText: { fontSize: 14, fontWeight: '700', color: colors.primary },
  name: { fontSize: 15, fontWeight: '700', color: colors.ink },
  meta: { fontSize: 12, color: colors.muted },
  rating: { fontSize: 13, fontWeight: '700', color: colors.ink },

  summary: { gap: 6, padding: 16, borderRadius: 16, backgroundColor: '#ECF0FE', borderWidth: 1, borderColor: '#DCE3FC' },
  summaryTitle: { fontSize: 14.5, fontWeight: '700', color: colors.ink },
  included: { fontSize: 12, fontWeight: '600', color: colors.primary },
  summaryText: { fontSize: 12.5, color: colors.muted },
  summaryHint: { fontSize: 11.5, color: colors.muted },

  ctaOff: { height: 54, borderRadius: 14, backgroundColor: '#E3E8F1', alignItems: 'center', justifyContent: 'center' },
  ctaOffText: { fontSize: 15, fontWeight: '700', color: colors.faint },
  footnote: { fontSize: 12, color: colors.muted },

  done: { alignItems: 'center', gap: 12, paddingVertical: 28 },
  doneIcon: { width: 68, height: 68, borderRadius: 34, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  secondary: { height: 50, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { fontSize: 15, fontWeight: '700', color: colors.primary },
});
