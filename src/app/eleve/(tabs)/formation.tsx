import { router } from 'expo-router';
import {
  BookOpen,
  CalendarDays,
  Car,
  Check,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Flag,
  MapPin,
  Sparkles,
  Target,
  ThumbsUp,
  TrendingUp,
  Zap,
  type LucideIcon,
} from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';

import { Segmented } from '@/components/settings';
import { Screen, TopBar } from '@/components/ui';
import { journey, lessonHistory, type LessonReport } from '@/data/formation';
import { remc, student, upcomingLessons } from '@/data/mock';
import { useProfile } from '@/data/profile';
import { colors, shadow, toneColors, type Tone } from '@/theme';

const ease = Easing.out(Easing.cubic);
const layout = LinearTransition.duration(240).easing(ease);

const typeInfo: Record<LessonReport['type'], { label: string; icon: LucideIcon; tone: Tone }> = {
  conduite: { label: 'Conduite', icon: Car, tone: 'primary' },
  code: { label: 'Code', icon: BookOpen, tone: 'violet' },
  evaluation: { label: 'Évaluation', icon: ClipboardCheck, tone: 'warning' },
};
const moodInfo: Record<LessonReport['mood'], { label: string; tone: Tone }> = {
  top: { label: 'Excellente séance', tone: 'success' },
  bien: { label: 'Bonne séance', tone: 'primary' },
  progres: { label: 'En progrès', tone: 'warning' },
};

/** Ma formation : progression, prochaine étape et historique des leçons avec débriefs */
export default function EleveFormation() {
  const profile = useProfile();
  const [filter, setFilter] = useState<'all' | 'conduite' | 'code'>('all');
  const [open, setOpen] = useState<string | null>(lessonHistory[0].id);
  const next = upcomingLessons[0];
  const d = student.driving;
  const lessons = lessonHistory.filter((l) => filter === 'all' || (filter === 'code' ? l.type === 'code' : l.type !== 'code'));

  // part de compétences REMC maîtrisées
  const allSkills = remc.flatMap((c) => c.items);
  const mastered = allSkills.filter((s) => s.level === 3).length;

  return (
    <Screen withTabBar>
      <TopBar title="Ma formation" onBack={() => router.navigate('/eleve')} />

      <Animated.View entering={FadeInDown.duration(360).easing(ease)} style={{ gap: 8 }}>
        <Text style={styles.title}>Votre parcours.</Text>
        <Text style={styles.subtitle}>
          {profile.permis} · objectif {profile.objectif.toLowerCase()}
        </Text>
      </Animated.View>

      {/* Étapes du parcours */}
      <Animated.View entering={FadeInDown.delay(40).duration(360).easing(ease)} style={styles.journey}>
        {journey.map((j, i) => (
          <View key={j.key} style={{ flex: 1, alignItems: 'center', gap: 8 }}>
            <View style={styles.journeyLineWrap}>
              <View style={[styles.journeyLine, { opacity: i === 0 ? 0 : 1 }, j.state !== 'todo' && { backgroundColor: colors.primary }]} />
              <View style={[styles.journeyDot, j.state === 'done' && styles.dotDone, j.state === 'current' && styles.dotCurrent]}>
                {j.state === 'done' ? <Check size={12} color="#fff" strokeWidth={3} /> : null}
              </View>
              <View style={[styles.journeyLine, { opacity: i === journey.length - 1 ? 0 : 1 }, journey[i + 1]?.state !== 'todo' && j.state !== 'todo' && { backgroundColor: colors.primary }]} />
            </View>
            <Text style={[styles.journeyLabel, j.state !== 'todo' && { color: colors.ink }]}>{j.label}</Text>
          </View>
        ))}
      </Animated.View>

      {/* Conduite */}
      <Animated.View entering={FadeInDown.delay(80).duration(360).easing(ease)} style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={{ gap: 4 }}>
            <Text style={styles.heroKicker}>CONDUITE</Text>
            <Text style={styles.heroValue}>
              {d.done} h <Text style={styles.heroTotal}>/ {d.total} h</Text>
            </Text>
          </View>
          <View style={styles.heroBadge}>
            <TrendingUp size={14} color="#fff" />
            <Text style={styles.heroBadgeText}>{Math.round((d.done / d.total) * 100)} %</Text>
          </View>
        </View>
        <View style={styles.segments}>
          {Array.from({ length: d.total }, (_, i) => (
            <View key={i} style={[styles.segment, i < d.done && { backgroundColor: '#fff' }]} />
          ))}
        </View>
        <View style={styles.heroStats}>
          <HeroStat label="Restantes" value={`${student.balance.remainingHours} h`} />
          <View style={styles.heroSep} />
          <HeroStat label="Compétences" value={`${mastered}/${allSkills.length}`} />
          <View style={styles.heroSep} />
          <HeroStat label="Leçons" value={`${lessonHistory.filter((l) => l.type !== 'code').length}`} />
        </View>
      </Animated.View>

      {/* Prochaine étape */}
      <Animated.View entering={FadeInDown.delay(120).duration(360).easing(ease)}>
        <Pressable onPress={() => router.navigate('/eleve/lecons')} style={({ pressed }) => [styles.next, pressed && { transform: [{ scale: 0.99 }] }]}>
          <View style={[styles.icon, { backgroundColor: colors.primarySoft }]}>
            <CalendarDays size={19} color={colors.primary} strokeWidth={1.9} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.small}>Prochaine leçon</Text>
            <Text style={styles.nextTitle}>
              {next.day} {next.date} · {next.start}
            </Text>
            <Text style={styles.small}>Avec {next.instructor} · on travaillera le créneau à gauche</Text>
          </View>
          <ChevronRight size={18} color={colors.faint} />
        </Pressable>
      </Animated.View>

      {/* Code */}
      <Animated.View entering={FadeInDown.delay(160).duration(360).easing(ease)} style={styles.card}>
        <View style={styles.rowBetween}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={[styles.icon, { backgroundColor: colors.violetSoft }]}>
              <BookOpen size={19} color={colors.violet} strokeWidth={1.9} />
            </View>
            <View style={{ gap: 2 }}>
              <Text style={styles.cardTitle}>Code de la route</Text>
              <Text style={styles.small}>Examen le jeudi 12 nov.</Text>
            </View>
          </View>
          <View style={[styles.pill, { backgroundColor: colors.successSoft }]}>
            <Text style={[styles.pillText, { color: colors.success }]}>Prêt à {Math.round(student.code.ratio * 100)} %</Text>
          </View>
        </View>
        <View style={styles.codeRow}>
          <Text style={styles.codeScore}>
            {student.code.score}
            <Text style={styles.codeMax}>/{student.code.max}</Text>
          </Text>
          <Text style={[styles.small, { flex: 1, textAlign: 'right' }]}>
            Moyenne des 5 dernières séries{'\n'}
            {student.code.series}/{student.code.seriesTotal} séries terminées
          </Text>
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${student.code.ratio * 100}%`, backgroundColor: colors.success }]} />
          <View style={styles.target} />
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Action icon={Zap} label="Série rapide" />
          <Action icon={Target} label="Examen blanc" />
        </View>
      </Animated.View>

      {/* Compétences */}
      <Animated.View entering={FadeInDown.delay(200).duration(360).easing(ease)}>
        <Pressable onPress={() => router.push('/eleve/progression')} style={({ pressed }) => [styles.card, pressed && { transform: [{ scale: 0.99 }] }]}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>Mes compétences</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={styles.link}>Livret complet</Text>
              <ChevronRight size={15} color={colors.primary} />
            </View>
          </View>
          {remc.map((c) => {
            const ratio = c.items.reduce((s, i) => s + i.level, 0) / (c.items.length * 3);
            return (
              <View key={c.id} style={{ gap: 6 }}>
                <View style={styles.rowBetween}>
                  <Text style={styles.skillLabel} numberOfLines={1}>
                    <Text style={{ color: colors.primary, fontWeight: '800' }}>{c.code} </Text>
                    {c.title}
                  </Text>
                  <Text style={styles.skillPct}>{Math.round(ratio * 100)} %</Text>
                </View>
                <View style={[styles.track, { height: 6 }]}>
                  <View style={[styles.fill, { width: `${ratio * 100}%` }]} />
                </View>
              </View>
            );
          })}
        </Pressable>
      </Animated.View>

      {/* Historique */}
      <Animated.View entering={FadeInDown.delay(240).duration(360).easing(ease)} style={{ gap: 14 }}>
        <View style={styles.rowBetween}>
          <Text style={styles.h2}>Mes leçons passées</Text>
          <Text style={styles.small}>{lessons.reduce((s, l) => s + l.hours, 0)} h</Text>
        </View>
        <Segmented
          value={filter}
          onChange={setFilter}
          options={[
            { key: 'all', label: 'Toutes' },
            { key: 'conduite', label: 'Conduite' },
            { key: 'code', label: 'Code' },
          ]}
        />
      </Animated.View>

      <View style={{ gap: 12 }}>
        {lessons.map((l, i) => (
          <Animated.View key={l.id} entering={FadeInDown.delay(i * 50).duration(300).easing(ease)} exiting={FadeOut.duration(120)} layout={layout}>
            <LessonCard l={l} open={open === l.id} onPress={() => setOpen(open === l.id ? null : l.id)} />
          </Animated.View>
        ))}
      </View>
    </Screen>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, gap: 2 }}>
      <Text style={styles.heroStatValue}>{value}</Text>
      <Text style={styles.heroStatLabel}>{label}</Text>
    </View>
  );
}

function Action({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <Pressable style={({ pressed }) => [styles.action, pressed && { backgroundColor: colors.primarySoft }]}>
      <Icon size={16} color={colors.primary} />
      <Text style={styles.actionText}>{label}</Text>
    </Pressable>
  );
}

/** Leçon passée : résumé, puis débrief du moniteur au toucher */
function LessonCard({ l, open, onPress }: { l: LessonReport; open: boolean; onPress: () => void }) {
  const t = typeInfo[l.type];
  const m = moodInfo[l.mood];
  const tone = toneColors[t.tone];
  const Icon = t.icon;
  return (
    <Animated.View layout={layout} style={[styles.lesson, open && { borderColor: '#D5DCFD' }]}>
      <Pressable onPress={onPress} style={styles.lessonHead}>
        <View style={styles.date}>
          <Text style={styles.dateDay}>{l.weekday}</Text>
          <Text style={styles.dateNum}>{l.date.split(' ')[0]}</Text>
          <Text style={styles.dateDay}>{l.date.split(' ')[1]}</Text>
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon size={13} color={tone.fg} strokeWidth={2} />
            <Text style={[styles.typeText, { color: tone.fg }]}>
              {t.label} · {l.hours} h
            </Text>
          </View>
          <Text style={styles.lessonTitle}>{l.title}</Text>
          <Text style={styles.small}>
            {l.start}–{l.end} · {l.instructor}
          </Text>
        </View>
        <View style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}>
          <ChevronDown size={18} color={open ? colors.primary : colors.faint} />
        </View>
      </Pressable>

      {open ? (
        <Animated.View entering={FadeIn.delay(60).duration(220)} exiting={FadeOut.duration(100)} style={styles.debrief}>
          <View style={[styles.pill, { alignSelf: 'flex-start', backgroundColor: toneColors[m.tone].bg }]}>
            <ThumbsUp size={12} color={toneColors[m.tone].fg} />
            <Text style={[styles.pillText, { color: toneColors[m.tone].fg }]}>{m.label}</Text>
          </View>
          <View style={styles.quote}>
            <Text style={styles.quoteText}>« {l.debrief} »</Text>
            <Text style={styles.quoteAuthor}>— {l.instructor}</Text>
          </View>
          <TagGroup icon={Sparkles} title="Points forts" items={l.strengths} tone="success" />
          <TagGroup icon={Flag} title="À travailler" items={l.toWork} tone="warning" />
          {l.validated?.length ? <TagGroup icon={Check} title="Compétences validées" items={l.validated} tone="primary" /> : null}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <MapPin size={13} color={colors.faint} />
            <Text style={styles.small}>{l.place}</Text>
          </View>
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

function TagGroup({ icon: Icon, title, items, tone }: { icon: LucideIcon; title: string; items: string[]; tone: Tone }) {
  const t = toneColors[tone];
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Icon size={14} color={t.fg} strokeWidth={2} />
        <Text style={styles.tagTitle}>{title}</Text>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {items.map((i) => (
          <View key={i} style={[styles.tag, { backgroundColor: t.bg }]}>
            <Text style={[styles.tagText, { color: t.fg }]}>{i}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 30, fontWeight: '800', color: colors.ink, letterSpacing: -0.8 },
  subtitle: { fontSize: 15, color: colors.muted },
  h2: { fontSize: 19, fontWeight: '800', color: colors.ink, letterSpacing: -0.3 },
  small: { fontSize: 12.5, color: colors.muted },
  link: { fontSize: 13, fontWeight: '600', color: colors.primary },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  icon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  journey: { flexDirection: 'row', paddingVertical: 4 },
  journeyLineWrap: { flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch' },
  journeyLine: { flex: 1, height: 2, backgroundColor: colors.input },
  journeyDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.card, borderWidth: 2, borderColor: colors.input, alignItems: 'center', justifyContent: 'center' },
  dotDone: { backgroundColor: colors.primary, borderColor: colors.primary },
  dotCurrent: { borderColor: colors.primary, borderWidth: 6 },
  journeyLabel: { fontSize: 12, fontWeight: '600', color: colors.faint },

  hero: { gap: 16, padding: 18, borderRadius: 22, backgroundColor: colors.primary, ...shadow.primary },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroKicker: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.7)', letterSpacing: 0.8 },
  heroValue: { fontSize: 34, fontWeight: '800', color: '#fff', letterSpacing: -1 },
  heroTotal: { fontSize: 18, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.18)' },
  heroBadgeText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  segments: { flexDirection: 'row', gap: 3 },
  segment: { flex: 1, height: 8, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.22)' },
  heroStats: { flexDirection: 'row', alignItems: 'center', paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.16)' },
  heroSep: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.16)', marginHorizontal: 12 },
  heroStatValue: { color: '#fff', fontSize: 17, fontWeight: '800' },
  heroStatLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },

  next: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 20, backgroundColor: colors.card, ...shadow.card },
  nextTitle: { fontSize: 15.5, fontWeight: '700', color: colors.ink },

  card: { gap: 14, padding: 16, borderRadius: 20, backgroundColor: colors.card, ...shadow.card },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.ink },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  pillText: { fontSize: 12, fontWeight: '700' },
  codeRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  codeScore: { fontSize: 36, fontWeight: '800', color: colors.ink, letterSpacing: -1 },
  codeMax: { fontSize: 18, color: colors.faint, fontWeight: '600' },
  track: { height: 8, borderRadius: 4, backgroundColor: '#E9EDF5', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4, backgroundColor: colors.primary },
  target: { position: 'absolute', left: '87.5%', top: 0, bottom: 0, width: 2, backgroundColor: colors.ink, opacity: 0.35 },
  action: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 44, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  actionText: { fontSize: 13.5, fontWeight: '700', color: colors.primary },
  skillLabel: { flex: 1, fontSize: 13, color: colors.ink },
  skillPct: { fontSize: 12.5, fontWeight: '700', color: colors.muted },

  lesson: { borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: 'transparent', overflow: 'hidden', ...shadow.card },
  lessonHead: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  date: { width: 52, paddingVertical: 8, borderRadius: 14, backgroundColor: colors.background, alignItems: 'center' },
  dateDay: { fontSize: 10.5, fontWeight: '600', color: colors.faint, textTransform: 'uppercase' },
  dateNum: { fontSize: 20, fontWeight: '800', color: colors.ink, lineHeight: 24 },
  typeText: { fontSize: 11.5, fontWeight: '700' },
  lessonTitle: { fontSize: 15, fontWeight: '700', color: colors.ink },
  debrief: { gap: 14, paddingHorizontal: 16, paddingBottom: 16, paddingTop: 2, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, marginTop: -2 },
  quote: { gap: 6, padding: 14, marginTop: 12, borderRadius: 14, backgroundColor: colors.background, borderLeftWidth: 3, borderLeftColor: colors.primary },
  quoteText: { fontSize: 14, lineHeight: 21, color: colors.ink },
  quoteAuthor: { fontSize: 12, fontWeight: '600', color: colors.muted },
  tagTitle: { fontSize: 12.5, fontWeight: '700', color: colors.ink },
  tag: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  tagText: { fontSize: 12.5, fontWeight: '600' },
});
