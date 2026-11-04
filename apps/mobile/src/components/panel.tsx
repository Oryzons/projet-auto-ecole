import { X, type LucideIcon } from 'lucide-react-native';
import { useEffect, useState, type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { GestureDetector, GestureHandlerRootView, usePanGesture } from 'react-native-gesture-handler';
import Animated, { Easing, interpolate, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { colors, shadow, toneColors, type Tone } from '@/theme';

/**
 * Panneau pop-up : il descend du haut de l'écran, avec une en-tête
 * (pastille d'icône, titre, sous-titre, croix).
 * On le ferme avec la croix, en touchant le fond, ou en le poussant vers le haut.
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
  const { height } = useWindowDimensions();
  const [mounted, setMounted] = useState(open);
  // p : 0 caché → 1 ouvert ; drag : déplacement du doigt ; h : hauteur réelle du panneau
  const p = useSharedValue(0);
  const drag = useSharedValue(0);
  const h = useSharedValue(height * 0.6);

  if (open && !mounted) setMounted(true);
  useEffect(() => {
    if (open) {
      drag.value = 0;
      // courbe « expo out » : départ vif, arrivée très douce, sans rebond
      p.value = withTiming(1, { duration: 520, easing: ENTER });
    } else if (mounted) {
      // on repart de la position actuelle (y compris pendant un glissement)
      const from = Math.max(0, Math.min(1, p.value + drag.value / (h.value + 40)));
      p.value = from;
      drag.value = 0;
      p.value = withTiming(0, { duration: 180 + 200 * from, easing: EXIT }, (done) => {
        if (done) scheduleOnRN(setMounted, false);
      });
    }
  }, [open, mounted, p, drag, h]);

  const pan = usePanGesture({
    activeOffsetY: [-12, 12],
    failOffsetX: [-14, 14],
    onUpdate: (e) => {
      'worklet';
      const t = e.translationY;
      // vers le haut il suit le doigt, vers le bas il résiste
      drag.value = t < 0 ? t : 22 * Math.log1p(t / 22);
    },
    onDeactivate: (e) => {
      'worklet';
      if (drag.value < -90 || e.velocityY < -600) scheduleOnRN(onClose);
      else drag.value = withSpring(0, { damping: 22, stiffness: 260, mass: 0.8 });
    },
  });

  const panel = useAnimatedStyle(() => ({
    transform: [{ translateY: -(h.value + 40) * (1 - p.value) + drag.value }],
  }));
  const content = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0.35, 1], [0, 1], 'clamp'),
    transform: [{ translateY: interpolate(p.value, [0.35, 1], [-10, 0], 'clamp') }],
  }));
  const backdrop = useAnimatedStyle(() => ({
    opacity: p.value * interpolate(drag.value, [-(h.value + 40), 0], [0, 1], 'clamp'),
  }));
  const t = toneColors[tone];

  return (
    <Modal visible={mounted} transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdrop]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Fermer le panneau" />
        </Animated.View>

        <GestureDetector gesture={pan}>
          <Animated.View onLayout={(e) => (h.value = e.nativeEvent.layout.height)} style={[styles.panel, { paddingTop: insets.top + 8, maxHeight: height * 0.88 }, panel]}>
            <Animated.View style={[{ flexShrink: 1 }, content]}>
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

              <ScrollView style={{ flexShrink: 1 }} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
                {children}
              </ScrollView>
              {footer ? <View style={styles.footer}>{footer}</View> : null}
            </Animated.View>
            <View style={styles.grip} />
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

const ENTER = Easing.bezier(0.16, 1, 0.3, 1);
const EXIT = Easing.bezier(0.55, 0, 0.75, 0.2);

const styles = StyleSheet.create({
  backdrop: { backgroundColor: 'rgba(20,32,60,0.32)' },
  panel: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignSelf: 'center',
    maxWidth: 560,
    backgroundColor: colors.background,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    ...shadow.card,
    shadowOpacity: 0.2,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 8 },
    elevation: 18,
  },
  grip: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    marginTop: 4,
    marginBottom: 10,
    backgroundColor: '#D3DAE6',
  },
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
  headIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.ink,
    letterSpacing: -0.3,
  },
  subtitle: { fontSize: 13, color: colors.muted, lineHeight: 18 },
  close: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { padding: 20, gap: 20 },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 10,
  },
  dl: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  dlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  dlSep: { borderTopWidth: 1, borderTopColor: colors.border },
  dt: { fontSize: 13.5, color: colors.muted },
  dd: {
    fontSize: 13.5,
    fontWeight: '600',
    color: colors.ink,
    flexShrink: 1,
    textAlign: 'right',
  },
});
