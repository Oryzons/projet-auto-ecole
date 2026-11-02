import { X, type LucideIcon } from 'lucide-react-native';
import { useEffect, useState, type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { GestureDetector, GestureHandlerRootView, usePanGesture } from 'react-native-gesture-handler';
import Animated, { Easing, interpolate, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { colors, shadow, toneColors, type Tone } from '@/theme';

/**
 * Panneau latéral, repris du site admin : il arrive de la droite par-dessus l'écran,
 * avec une en-tête (pastille d'icône, titre, sous-titre, croix).
 * On le ferme avec la croix, en touchant le fond, ou en le poussant vers la droite.
 */
export function SidePanel({
  open,
  onClose,
  title,
  subtitle,
  icon: Icon,
  tone = 'primary',
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  tone?: Tone;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const panelWidth = Math.min(width * 0.92, 440);
  const [mounted, setMounted] = useState(open);
  const x = useSharedValue(panelWidth);

  if (open && !mounted) setMounted(true);
  useEffect(() => {
    if (open) {
      x.value = withSpring(0, { damping: 26, stiffness: 240, mass: 0.9 });
    } else if (mounted) {
      x.value = withTiming(panelWidth + 24, { duration: 220, easing: Easing.in(Easing.cubic) }, (done) => {
        if (done) scheduleOnRN(setMounted, false);
      });
    }
  }, [open, mounted, panelWidth, x]);

  const pan = usePanGesture({
    activeOffsetX: [-12, 12],
    failOffsetY: [-14, 14],
    onUpdate: (e) => {
      'worklet';
      const t = e.translationX;
      x.value = t > 0 ? t : t * 0.12;
    },
    onDeactivate: (e) => {
      'worklet';
      if (x.value > panelWidth * 0.3 || e.velocityX > 700) scheduleOnRN(onClose);
      else x.value = withSpring(0, { damping: 26, stiffness: 280 });
    },
  });

  const panel = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  const backdrop = useAnimatedStyle(() => ({ opacity: interpolate(x.value, [0, panelWidth], [1, 0], 'clamp') }));
  const t = toneColors[tone];

  return (
    <Modal visible={mounted} transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdrop]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Fermer le panneau" />
        </Animated.View>

        <GestureDetector gesture={pan}>
          <Animated.View style={[styles.panel, { width: panelWidth, paddingTop: insets.top + 8, paddingBottom: insets.bottom }, panel]}>
            <View style={styles.grip} />
            <View style={styles.head}>
              {Icon ? (
                <View style={[styles.headIcon, { backgroundColor: t.bg }]}>
                  <Icon size={20} color={t.fg} strokeWidth={2} />
                </View>
              ) : null}
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.title} numberOfLines={1}>
                  {title}
                </Text>
                {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
              </View>
              <Pressable onPress={onClose} hitSlop={10} style={({ pressed }) => [styles.close, pressed && { backgroundColor: '#EEF2F7' }]} accessibilityLabel="Fermer">
                <X size={18} color={colors.muted} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
              {children}
            </ScrollView>
            {footer ? <View style={styles.footer}>{footer}</View> : null}
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>
    </Modal>
  );
}

/** Liste « libellé : valeur » encadrée, comme les fiches du site admin */
export function DetailList({ rows }: { rows: { label: string; value: string; tone?: Tone }[] }) {
  return (
    <View style={styles.dl}>
      {rows.map((r, i) => (
        <View key={r.label} style={[styles.dlRow, i > 0 && styles.dlSep]}>
          <Text style={styles.dt}>{r.label}</Text>
          <Text style={[styles.dd, r.tone && { color: toneColors[r.tone].fg }]}>{r.value}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: 'rgba(20,32,60,0.32)' },
  panel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderBottomLeftRadius: 28,
    ...shadow.card,
    shadowOpacity: 0.2,
    shadowRadius: 30,
    shadowOffset: { width: -6, height: 0 },
    elevation: 18,
  },
  grip: { position: 'absolute', left: 6, top: '50%', width: 4, height: 44, marginTop: -22, borderRadius: 2, backgroundColor: '#D3DAE6' },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: colors.ink, letterSpacing: -0.3 },
  subtitle: { fontSize: 13, color: colors.muted, lineHeight: 18 },
  close: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  body: { padding: 20, gap: 20 },
  footer: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8, borderTopWidth: 1, borderTopColor: colors.border, gap: 10 },
  dl: { borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  dlRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingHorizontal: 14, paddingVertical: 11 },
  dlSep: { borderTopWidth: 1, borderTopColor: colors.border },
  dt: { fontSize: 13.5, color: colors.muted },
  dd: { fontSize: 13.5, fontWeight: '600', color: colors.ink, flexShrink: 1, textAlign: 'right' },
});
