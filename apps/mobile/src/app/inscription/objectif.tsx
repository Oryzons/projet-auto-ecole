import { router, useLocalSearchParams } from 'expo-router';
import { CalendarDays, Check, ChevronDown, Flag, ShieldCheck, Sparkles, Sun, Sunrise, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut, LinearTransition, useAnimatedStyle, useDerivedValue, withTiming } from 'react-native-reanimated';

import { SelectCard } from '@/components/animated';
import { Steps } from '@/components/choice';
import { CtaButton, Screen, TopBar } from '@/components/ui';
import { colors, font, radius } from '@/theme';

const months = ['Décembre 2026', 'Janvier 2027', 'Février 2027', 'Mars 2027', 'Avril 2027', 'Mai 2027', 'Juin 2027'];

const slots: { key: string; label: string; icon?: LucideIcon }[] = [
  { key: 'semaine', label: 'En semaine', icon: CalendarDays },
  { key: 'weekend', label: 'Le week-end' },
  { key: 'matin', label: 'Le matin', icon: Sunrise },
  { key: 'apresmidi', label: 'L’après-midi', icon: Sun },
];

const rhythms = [
  { key: '1', label: '1 leçon / sem.', title: 'Un rythme tranquille', text: '1 leçon par semaine pour avancer sans pression, à côté de vos études ou de votre travail.' },
  { key: '2', label: '2 leçons / sem.', title: 'Un bon rythme pour progresser', text: '2 leçons par semaine pour garder vos acquis et gagner en confiance.' },
];

/** Inscription · Objectif et disponibilités (dernière étape) — calqué sur la maquette Figma */
export default function InscriptionObjectif() {
  const params = useLocalSearchParams<{ vehicule?: string; permis?: string; formule?: string }>();
  const [goal, setGoal] = useState(months[0]);
  const [open, setOpen] = useState(false);
  const [selSlots, setSelSlots] = useState<string[]>(['semaine', 'apresmidi']);
  const [rhythm, setRhythm] = useState('2');
  const toggle = (k: string) => setSelSlots((l) => (l.includes(k) ? l.filter((x) => x !== k) : [...l, k]));
  const advice = rhythms.find((r) => r.key === rhythm)!;

  return (
    <Screen
      footer={
        <View style={{ gap: 12 }}>
          <CtaButton
            label="Créer mon espace Virage"
            icon={Check}
            onPress={() => router.replace({ pathname: '/inscription/confirmee', params: { ...params, objectif: goal } })}
          />
          <View style={styles.reassure}>
            <ShieldCheck size={14} color={colors.muted} />
            <Text style={font.tiny}>Vous pourrez modifier vos préférences à tout moment.</Text>
          </View>
        </View>
      }>
      <TopBar title="Inscription" />
      <Steps step={4} total={4} label="Votre liberté commence ici" />

      <View style={{ gap: 10 }}>
        <Text style={styles.title}>Le bon rythme,{'\n'}c’est le vôtre.</Text>
        <Text style={[font.body, { color: colors.muted }]}>On adapte votre parcours à votre quotidien.</Text>
      </View>

      {/* Objectif : liste déroulante animée */}
      <Animated.View layout={LinearTransition.duration(220)} style={{ gap: 8 }}>
        <Text style={styles.label}>Mon objectif permis</Text>
        <Pressable onPress={() => setOpen((o) => !o)} style={[styles.select, open && { borderColor: colors.primary }]}>
          <Flag size={18} color={colors.ink} strokeWidth={1.8} />
          <Text style={[font.body, { flex: 1, fontWeight: '500' }]}>{goal}</Text>
          <Chevron open={open} />
        </Pressable>
        {open ? (
          <Animated.View entering={FadeInDown.duration(200)} exiting={FadeOut.duration(150)} style={styles.menu}>
            {months.map((m) => (
              <Pressable
                key={m}
                onPress={() => {
                  setGoal(m);
                  setOpen(false);
                }}
                style={({ pressed }) => [styles.menuItem, pressed && { backgroundColor: colors.subtle }]}>
                <Text style={[font.body, m === goal && { color: colors.primary, fontWeight: '600' }]}>{m}</Text>
                {m === goal ? <Check size={16} color={colors.primary} /> : null}
              </Pressable>
            ))}
          </Animated.View>
        ) : null}
        <Text style={font.tiny}>Un cap motivant, pas une date garantie.</Text>
      </Animated.View>

      <Animated.View layout={LinearTransition.duration(220)} style={{ gap: 10 }}>
        <Text style={styles.label}>Quand êtes-vous disponible ?</Text>
        <View style={styles.grid}>
          {slots.map((s) => (
            <View key={s.key} style={{ width: '48.5%' }}>
              <ToggleChip label={s.label} icon={s.icon} on={selSlots.includes(s.key)} onPress={() => toggle(s.key)} />
            </View>
          ))}
        </View>
      </Animated.View>

      <Animated.View layout={LinearTransition.duration(220)} style={{ gap: 10 }}>
        <Text style={styles.label}>Mon rythme idéal</Text>
        <View style={styles.grid}>
          {rhythms.map((r) => (
            <View key={r.key} style={{ width: '48.5%' }}>
              <ToggleChip label={r.label} on={rhythm === r.key} onPress={() => setRhythm(r.key)} />
            </View>
          ))}
        </View>
      </Animated.View>

      <Animated.View layout={LinearTransition.duration(220)} style={styles.advice}>
        <Sparkles size={20} color={colors.primary} strokeWidth={1.8} />
        <Animated.View key={advice.key} entering={FadeIn.duration(260)} style={{ flex: 1, gap: 4 }}>
          <Text style={[font.h3, { fontSize: 14 }]}>{advice.title}</Text>
          <Text style={[font.small, { lineHeight: 19 }]}>{advice.text}</Text>
        </Animated.View>
      </Animated.View>
    </Screen>
  );
}

/** Pastille à cocher : fond bleu clair, texte bleu et coche animée quand elle est active */
function ToggleChip({ label, icon: Icon, on, onPress }: { label: string; icon?: LucideIcon; on: boolean; onPress: () => void }) {
  return (
    <SelectCard selected={on} onPress={onPress} style={styles.chip}>
      {Icon ? <Icon size={16} color={on ? colors.primary : colors.muted} strokeWidth={1.8} /> : null}
      <Text style={[styles.chipText, on && { color: colors.primary, fontWeight: '700' }]}>{label}</Text>
      {on ? (
        <Animated.View entering={FadeIn.duration(180)}>
          <Check size={15} color={colors.primary} />
        </Animated.View>
      ) : null}
    </SelectCard>
  );
}

function Chevron({ open }: { open: boolean }) {
  const rot = useDerivedValue(() => withTiming(open ? 180 : 0, { duration: 200 }));
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${rot.value}deg` }] }));
  return (
    <Animated.View style={style}>
      <ChevronDown size={18} color={colors.primary} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 30, lineHeight: 35, fontWeight: '800', color: colors.ink, letterSpacing: -0.8 },
  label: { fontSize: 14, fontWeight: '600', color: colors.ink },
  select: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.card,
  },
  menu: { borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, paddingVertical: 6, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 11 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 },
  chip: { height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  chipText: { fontSize: 14, fontWeight: '500', color: colors.muted },
  advice: { flexDirection: 'row', gap: 14, padding: 16, borderRadius: radius.lg, backgroundColor: colors.primarySoft },
  reassure: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
});
