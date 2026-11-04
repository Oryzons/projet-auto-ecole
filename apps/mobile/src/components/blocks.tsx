/**
 * Blocs repris du site admin (panneaux du plan) et adaptés au téléphone :
 * bande de chiffres, titres de rubrique en capitales avec compteur, leçon en cours,
 * lignes horaires avec barre de couleur, frise de la journée, barres animées.
 */
import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import { useEffect, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { colors, shadow, toneColors, type Tone } from '@/theme';

const ease = Easing.out(Easing.cubic);

/** Zone touchable qui s'enfonce légèrement à l'appui (ressort), pour toutes les cartes cliquables */
export function PressableScale({
  onPress,
  onLongPress,
  children,
  style,
  scale = 0.97,
  disabled,
  accessibilityLabel,
}: {
  onPress?: () => void;
  onLongPress?: () => void;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  scale?: number;
  disabled?: boolean;
  accessibilityLabel?: string;
}) {
  const s = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  // la taille dans une rangée (flex, largeur) s'applique à la zone touchable elle-même
  const flat = StyleSheet.flatten(style) ?? {};
  const outer = { flex: flat.flex, width: flat.width, alignSelf: flat.alignSelf } as ViewStyle;
  return (
    <Pressable
      style={outer}
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={accessibilityLabel}
      onPressIn={() => (s.value = withSpring(scale, { damping: 18, stiffness: 380 }))}
      onPressOut={() => (s.value = withSpring(1, { damping: 14, stiffness: 260 }))}>
      <Animated.View style={[style, animated]}>{children}</Animated.View>
    </Pressable>
  );
}

/** Barre de progression qui se remplit à l'affichage */
export function AnimatedBar({
  value,
  color = colors.primary,
  track = '#E6EAF8',
  height = 6,
  delay = 0,
}: {
  value: number;
  color?: string;
  track?: string;
  height?: number;
  delay?: number;
}) {
  const w = useSharedValue(0);
  useEffect(() => {
    w.value = withDelay(delay, withTiming(Math.max(0, Math.min(1, value)), { duration: 800, easing: ease }));
  }, [value, delay, w]);
  const fill = useAnimatedStyle(() => ({ width: `${w.value * 100}%` }));
  return (
    <View style={{ height, borderRadius: height, backgroundColor: track, overflow: 'hidden' }}>
      <Animated.View style={[{ height, borderRadius: height, backgroundColor: color }, fill]} />
    </View>
  );
}

/** Titre de rubrique façon admin : petites capitales grises, compteur à droite */
export function SectionLabel({ children, count, action, onAction }: { children: string; count?: number; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.labelRow}>
      <Text style={styles.label}>{children.toUpperCase()}</Text>
      {action ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={styles.labelAction}>{action}</Text>
        </Pressable>
      ) : count !== undefined ? (
        <View style={styles.count}>
          <Text style={styles.countText}>{count}</Text>
        </View>
      ) : null}
    </View>
  );
}

/** Bande de chiffres clés séparés par des filets (3 ou 4 valeurs) */
export function StatStrip({ items }: { items: { label: string; value: string; tone?: Tone; onPress?: () => void }[] }) {
  return (
    <View style={styles.strip}>
      {items.map((it, i) => (
        <Pressable key={it.label} onPress={it.onPress} disabled={!it.onPress} style={({ pressed }) => [styles.stripCell, i > 0 && styles.stripSep, pressed && { backgroundColor: colors.subtle }]}>
          <Text style={[styles.stripValue, it.tone && it.tone !== 'neutral' && { color: toneColors[it.tone].fg }]} numberOfLines={1} adjustsFontSizeToFit>
            {it.value}
          </Text>
          <Text style={styles.stripLabel} numberOfLines={1}>
            {it.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

/** Tuile d'indicateur avec point de couleur (grille 2 colonnes) */
export function MetricTile({ label, value, hint, tone = 'primary', onPress }: { label: string; value: string; hint?: string; tone?: Tone; onPress?: () => void }) {
  const warn = tone === 'danger' || tone === 'warning';
  return (
    <PressableScale onPress={onPress} disabled={!onPress} style={styles.metric}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <View style={[styles.dot, { backgroundColor: toneColors[tone].fg }]} />
        <Text style={styles.metricLabel} numberOfLines={1}>
          {label}
        </Text>
      </View>
      <Text style={[styles.metricValue, warn && { color: toneColors[tone].fg }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      {hint ? <Text style={styles.metricHint}>{hint}</Text> : null}
    </PressableScale>
  );
}

/** Point vert qui pulse : quelque chose se passe en ce moment */
export function LiveDot({ color = '#10B981' }: { color?: string }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withRepeat(withSequence(withTiming(1, { duration: 1100, easing: Easing.out(Easing.quad) }), withTiming(0, { duration: 0 })), -1);
  }, [p]);
  const ring = useAnimatedStyle(() => ({ opacity: 0.6 * (1 - p.value), transform: [{ scale: 1 + p.value * 1.6 }] }));
  return (
    <View style={{ width: 10, height: 10, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[{ position: 'absolute', width: 10, height: 10, borderRadius: 5, backgroundColor: color }, ring]} />
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
    </View>
  );
}

/** Leçon en cours : point qui pulse, temps restant et barre d'avancement */
export function LiveCard({ title, meta, remaining, ratio, onPress }: { title: string; meta: string; remaining: string; ratio: number; onPress?: () => void }) {
  return (
    <PressableScale onPress={onPress} style={styles.live}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <LiveDot />
        <Text style={styles.liveTitle} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.liveRemaining}>{remaining}</Text>
      </View>
      <Text style={styles.liveMeta}>{meta}</Text>
      <View style={{ marginTop: 10 }}>
        <AnimatedBar value={ratio} color="#10B981" track="#D1F2E3" />
      </View>
    </PressableScale>
  );
}

/** Ligne horaire : heure et durée à gauche, barre de couleur, titre et détail, chevron */
export function TimeRow({
  time,
  sub,
  color = colors.primary,
  title,
  detail,
  right,
  muted,
  onPress,
}: {
  time: string;
  sub?: string;
  color?: string;
  title: string;
  detail?: string;
  right?: ReactNode;
  muted?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [styles.timeRow, muted && { opacity: 0.55 }, pressed && { backgroundColor: '#EEF2F9' }]}>
      <View style={{ width: 46, alignItems: 'flex-end' }}>
        <Text style={styles.time}>{time}</Text>
        {sub ? <Text style={styles.timeSub}>{sub}</Text> : null}
      </View>
      <View style={[styles.timeBar, { backgroundColor: color }]} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.timeTitle} numberOfLines={1}>
          {title}
        </Text>
        {detail ? (
          <Text style={styles.timeDetail} numberOfLines={1}>
            {detail}
          </Text>
        ) : null}
      </View>
      {right}
      {onPress ? <ChevronRight size={16} color={colors.faint} /> : null}
    </Pressable>
  );
}

const toH = (hhmm: string) => Number(hhmm.slice(0, 2)) + Number(hhmm.slice(3, 5)) / 60;

/** Frise de la journée (8 h → 19 h) : un bloc par créneau, trait rouge pour l'heure actuelle */
export function DayTimeline({
  blocks,
  now,
  start = 8,
  end = 19,
}: {
  blocks: { start: string; end: string; color?: string; done?: boolean }[];
  now?: string;
  start?: number;
  end?: number;
}) {
  const pct = (h: number) => `${Math.min(100, Math.max(0, ((h - start) / (end - start)) * 100))}%` as const;
  const ticks = [];
  for (let h = start; h <= end; h += 2) ticks.push(h);
  const nowH = now ? toH(now) : null;
  return (
    <View style={{ gap: 6 }}>
      <View style={styles.track}>
        {blocks.map((b, i) => (
          <TimelineBlock key={i} left={pct(toH(b.start))} width={((toH(b.end) - toH(b.start)) / (end - start)) * 100} color={b.color ?? colors.primary} done={b.done} index={i} />
        ))}
        {nowH !== null && nowH >= start && nowH <= end ? <View style={[styles.nowLine, { left: pct(nowH) }]} /> : null}
      </View>
      <View style={{ height: 14 }}>
        {ticks.map((h) => (
          <Text key={h} style={[styles.tick, { left: pct(h) }]}>
            {h}h
          </Text>
        ))}
      </View>
    </View>
  );
}

function TimelineBlock({ left, width, color, done, index }: { left: `${number}%`; width: number; color: string; done?: boolean; index: number }) {
  const s = useSharedValue(0);
  useEffect(() => {
    s.value = withDelay(120 + index * 70, withTiming(1, { duration: 420, easing: ease }));
  }, [s, index]);
  const anim = useAnimatedStyle(() => ({ opacity: s.value * (done ? 0.4 : 1), transform: [{ scaleY: 0.4 + s.value * 0.6 }] }));
  return <Animated.View style={[styles.block, { left, width: `${width}%`, backgroundColor: color }, anim]} />;
}

/** Bandeau d'information doux (orange, bleu…) avec icône et chevron */
export function Notice({ icon: Icon, text, tone = 'warning', onPress }: { icon: LucideIcon; text: string; tone?: Tone; onPress?: () => void }) {
  const c = toneColors[tone];
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [styles.notice, { backgroundColor: c.bg }, pressed && { opacity: 0.8 }]}>
      <Icon size={17} color={c.fg} />
      <Text style={[styles.noticeText, { color: c.fg }]}>{text}</Text>
      {onPress ? <ChevronRight size={16} color={c.fg} /> : null}
    </Pressable>
  );
}

/** Carte blanche contenant des lignes (TimeRow, ListItem…) */
export function ListCard({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.listCard, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 20 },
  label: { fontSize: 11.5, fontWeight: '700', letterSpacing: 0.8, color: colors.muted },
  labelAction: { fontSize: 13, fontWeight: '600', color: colors.primary },
  count: { minWidth: 22, paddingHorizontal: 7, height: 20, borderRadius: 10, backgroundColor: '#E9EEF5', alignItems: 'center', justifyContent: 'center' },
  countText: { fontSize: 11, fontWeight: '700', color: colors.muted },

  strip: { flexDirection: 'row', borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, overflow: 'hidden', ...shadow.card },
  stripCell: { flex: 1, alignItems: 'center', paddingVertical: 12, paddingHorizontal: 6, gap: 2 },
  stripSep: { borderLeftWidth: 1, borderLeftColor: colors.border },
  stripValue: { fontSize: 21, fontWeight: '800', color: colors.ink, letterSpacing: -0.5 },
  stripLabel: { fontSize: 11.5, color: colors.muted },

  metric: { flex: 1, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, paddingHorizontal: 14, paddingVertical: 12, gap: 4, ...shadow.card },
  dot: { width: 6, height: 6, borderRadius: 3 },
  metricLabel: { fontSize: 12, color: colors.muted, flexShrink: 1 },
  metricValue: { fontSize: 22, fontWeight: '800', color: colors.ink, letterSpacing: -0.5 },
  metricHint: { fontSize: 11.5, color: colors.faint },

  live: { borderRadius: 18, borderWidth: 1, borderColor: '#BFEBD6', backgroundColor: '#EEFAF4', paddingHorizontal: 14, paddingVertical: 12 },
  liveTitle: { flex: 1, fontSize: 14.5, fontWeight: '700', color: colors.ink },
  liveRemaining: { fontSize: 12, fontWeight: '600', color: '#047857' },
  liveMeta: { fontSize: 12.5, color: colors.muted, marginTop: 3, paddingLeft: 18 },

  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14 },
  time: { fontSize: 13.5, fontWeight: '700', color: colors.ink },
  timeSub: { fontSize: 11, color: colors.muted },
  timeBar: { width: 3, height: 34, borderRadius: 2 },
  timeTitle: { fontSize: 14.5, fontWeight: '600', color: colors.ink },
  timeDetail: { fontSize: 12.5, color: colors.muted },

  track: { height: 26, borderRadius: 8, backgroundColor: '#EBEFF6' },
  block: { position: 'absolute', top: 3, bottom: 3, borderRadius: 5, marginLeft: 1 },
  nowLine: { position: 'absolute', top: -4, bottom: -4, width: 2, marginLeft: -1, borderRadius: 1, backgroundColor: '#E5484D' },
  tick: { position: 'absolute', fontSize: 10.5, color: colors.muted, transform: [{ translateX: -8 }] },

  notice: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11 },
  noticeText: { flex: 1, fontSize: 13, fontWeight: '500' },

  listCard: { borderRadius: 20, backgroundColor: colors.card, paddingVertical: 4, paddingHorizontal: 2, borderWidth: 1, borderColor: colors.border, ...shadow.card },
});
