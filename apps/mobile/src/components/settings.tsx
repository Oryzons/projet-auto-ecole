import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import { Children, Fragment, useEffect, useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, FadeInDown, interpolate, interpolateColor, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { colors, shadow, toneColors, type Tone } from '@/theme';

const ease = Easing.out(Easing.cubic);

/** Grand titre de page, dans le style des autres écrans */
export function PageTitle({ title, text }: { title: string; text?: string }) {
  return (
    <Animated.View entering={FadeInDown.duration(360).easing(ease)} style={{ gap: 8 }}>
      <Text style={styles.title}>{title}</Text>
      {text ? <Text style={styles.text}>{text}</Text> : null}
    </Animated.View>
  );
}

/** Groupe de lignes de menu, séparées par un trait fin */
export function MenuGroup({ title, children, delay = 0 }: { title?: string; children: ReactNode; delay?: number }) {
  const items = Children.toArray(children).filter(Boolean);
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(360).easing(ease)} style={{ gap: 10 }}>
      {title ? <Text style={styles.groupTitle}>{title.toUpperCase()}</Text> : null}
      <View style={styles.group}>
        {items.map((child, i) => (
          <Fragment key={i}>
            {i > 0 ? <View style={styles.sep} /> : null}
            {child}
          </Fragment>
        ))}
      </View>
    </Animated.View>
  );
}

/** Ligne de menu : icône colorée, libellé, détail, puis chevron / interrupteur / valeur */
export function MenuRow({
  icon: Icon,
  tone = 'primary',
  title,
  subtitle,
  value,
  right,
  onPress,
  danger,
}: {
  icon: LucideIcon;
  tone?: Tone;
  title: string;
  subtitle?: string;
  value?: string;
  right?: ReactNode;
  onPress?: () => void;
  danger?: boolean;
}) {
  const t = toneColors[danger ? 'danger' : tone];
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [styles.row, pressed && { backgroundColor: '#F3F5FA' }]}>
      <View style={[styles.icon, { backgroundColor: t.bg }]}>
        <Icon size={18} color={t.fg} strokeWidth={1.9} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[styles.rowTitle, danger && { color: colors.danger }]}>{title}</Text>
        {subtitle ? <Text style={styles.rowSub}>{subtitle}</Text> : null}
      </View>
      {value ? <Text style={styles.value}>{value}</Text> : null}
      {right ?? (onPress ? <ChevronRight size={18} color={colors.faint} /> : null)}
    </Pressable>
  );
}

/** Interrupteur animé */
export function Switch({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  const p = useSharedValue(value ? 1 : 0);
  useEffect(() => {
    p.value = withSpring(value ? 1 : 0, { damping: 18, stiffness: 260 });
  }, [value, p]);
  const track = useAnimatedStyle(() => ({ backgroundColor: interpolateColor(p.value, [0, 1], [colors.input, colors.primary]) }));
  const knob = useAnimatedStyle(() => ({ transform: [{ translateX: p.value * 20 }] }));
  return (
    <Pressable onPress={() => onChange(!value)} hitSlop={8} accessibilityRole="switch" accessibilityState={{ checked: value }}>
      <Animated.View style={[styles.track, track]}>
        <Animated.View style={[styles.knob, knob]} />
      </Animated.View>
    </Pressable>
  );
}

/** Choix segmenté (ex. taille du texte, délai de rappel) */
export function Segmented<T extends string>({ options, value, onChange }: { options: { key: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <View style={styles.segment}>
      {options.map((o) => {
        const on = o.key === value;
        return (
          <Pressable key={o.key} onPress={() => onChange(o.key)} style={[styles.segItem, on && styles.segOn]}>
            <Text style={[styles.segText, on && { color: colors.primary }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Panneau qui monte du bas, pour les confirmations (déconnexion, suppression…) */
export function BottomSheet({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(open);
  const y = useSharedValue(height);

  if (open && !mounted) setMounted(true);
  useEffect(() => {
    if (open) y.value = withSpring(0, { damping: 24, stiffness: 230, mass: 0.9 });
    else if (mounted)
      y.value = withTiming(height, { duration: 220, easing: Easing.in(Easing.cubic) }, (done) => {
        if (done) scheduleOnRN(setMounted, false);
      });
  }, [open, mounted, height, y]);

  const panel = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  const backdrop = useAnimatedStyle(() => ({ opacity: interpolate(y.value, [height * 0.5, 0], [0, 1], 'clamp') }));

  return (
    <Modal visible={mounted} transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdrop]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <Animated.View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }, panel]}>
        <View style={styles.handle} />
        {children}
      </Animated.View>
    </Modal>
  );
}

export const settingsStyles = StyleSheet.create({
  sheetTitle: { fontSize: 22, fontWeight: '800', color: colors.ink, letterSpacing: -0.5 },
  sheetText: { fontSize: 14.5, lineHeight: 21, color: colors.muted },
  secondary: { height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  secondaryText: { fontSize: 15, fontWeight: '700', color: colors.ink },
  dangerBtn: { height: 54, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10, backgroundColor: colors.danger },
  dangerText: { fontSize: 15.5, fontWeight: '700', color: '#fff' },
  card: { padding: 16, borderRadius: 20, backgroundColor: colors.card, gap: 14, ...shadow.card },
});

const styles = StyleSheet.create({
  title: { fontSize: 30, fontWeight: '800', color: colors.ink, letterSpacing: -0.8 },
  text: { fontSize: 15, lineHeight: 22, color: colors.muted },
  groupTitle: { fontSize: 11, fontWeight: '700', color: colors.muted, letterSpacing: 0.6, paddingHorizontal: 4 },
  group: { borderRadius: 20, backgroundColor: colors.card, overflow: 'hidden', ...shadow.card },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: 66 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 13, minHeight: 60 },
  icon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 15, fontWeight: '600', color: colors.ink },
  rowSub: { fontSize: 12.5, color: colors.muted },
  value: { fontSize: 13.5, color: colors.muted },
  track: { width: 46, height: 26, borderRadius: 13, padding: 3 },
  knob: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', ...shadow.card, shadowOpacity: 0.2 },
  segment: { flexDirection: 'row', padding: 4, borderRadius: 14, backgroundColor: '#E9EDF5' },
  segItem: { flex: 1, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  segOn: { backgroundColor: colors.card, ...shadow.card },
  segText: { fontSize: 13.5, fontWeight: '600', color: colors.muted },
  backdrop: { backgroundColor: 'rgba(20,32,60,0.4)' },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 22, paddingTop: 10, gap: 16, backgroundColor: colors.background, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  handle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: '#C9D2E3', marginBottom: 4 },
});
