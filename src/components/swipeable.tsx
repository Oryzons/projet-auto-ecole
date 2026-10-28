import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

type SwipeAction = { label: string; icon: LucideIcon; color: string };

type Props = {
  children: ReactNode;
  /** Action révélée en glissant vers la droite (fond à gauche) */
  right: SwipeAction;
  /** Action révélée en glissant vers la gauche (fond à droite) */
  left: SwipeAction;
  onSwipeRight: () => void;
  onSwipeLeft: () => void;
  /** Vers la gauche : la ligne sort de l'écran avant l'appel (ex. suppression) */
  dismissLeft?: boolean;
  radius?: number;
};

const THRESHOLD = 88;
const back = { damping: 20, stiffness: 240, mass: 0.8 };

/** Ligne glissable : une action de chaque côté, déclenchée au-delà d'un seuil */
export function SwipeableRow({ children, right, left, onSwipeRight, onSwipeLeft, dismissLeft = false, radius = 20 }: Props) {
  const { width } = useWindowDimensions();
  const x = useSharedValue(0);

  const pan = usePanGesture({
    activeOffsetX: [-12, 12],
    failOffsetY: [-10, 10],
    onUpdate: (e) => {
      'worklet';
      // léger frein au-delà du seuil pour un rendu plus « physique »
      const t = e.translationX;
      const abs = Math.abs(t);
      x.value = abs > THRESHOLD * 1.4 ? Math.sign(t) * (THRESHOLD * 1.4 + (abs - THRESHOLD * 1.4) * 0.35) : t;
    },
    onDeactivate: (e) => {
      'worklet';
      const t = x.value + e.velocityX * 0.05;
      if (t >= THRESHOLD) {
        x.value = withSpring(0, back);
        scheduleOnRN(onSwipeRight);
      } else if (t <= -THRESHOLD) {
        if (dismissLeft) {
          x.value = withTiming(-width, { duration: 220, easing: Easing.out(Easing.cubic) }, (done) => {
            if (done) scheduleOnRN(onSwipeLeft);
          });
        } else {
          x.value = withSpring(0, back);
          scheduleOnRN(onSwipeLeft);
        }
      } else {
        x.value = withSpring(0, back);
      }
    },
  });

  const rowStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  const rightBg = useAnimatedStyle(() => ({ opacity: x.value > 0 ? 1 : 0 }));
  const leftBg = useAnimatedStyle(() => ({ opacity: x.value < 0 ? 1 : 0 }));
  const rightIcon = useAnimatedStyle(() => {
    const p = interpolate(x.value, [0, THRESHOLD], [0, 1], 'clamp');
    return { opacity: p, transform: [{ scale: 0.7 + p * 0.3 + (x.value >= THRESHOLD ? 0.08 : 0) }] };
  });
  const leftIcon = useAnimatedStyle(() => {
    const p = interpolate(-x.value, [0, THRESHOLD], [0, 1], 'clamp');
    return { opacity: p, transform: [{ scale: 0.7 + p * 0.3 + (-x.value >= THRESHOLD ? 0.08 : 0) }] };
  });

  const RightIcon = right.icon;
  const LeftIcon = left.icon;

  return (
    <View>
      <Animated.View style={[StyleSheet.absoluteFill, styles.bg, { borderRadius: radius, backgroundColor: right.color }, rightBg]}>
        <Animated.View style={[styles.action, rightIcon]}>
          <RightIcon size={20} color="#fff" strokeWidth={2} />
          <Text style={styles.label}>{right.label}</Text>
        </Animated.View>
      </Animated.View>
      <Animated.View
        style={[StyleSheet.absoluteFill, styles.bg, { borderRadius: radius, backgroundColor: left.color, justifyContent: 'flex-end' }, leftBg]}>
        <Animated.View style={[styles.action, leftIcon]}>
          <LeftIcon size={20} color="#fff" strokeWidth={2} />
          <Text style={styles.label}>{left.label}</Text>
        </Animated.View>
      </Animated.View>
      <GestureDetector gesture={pan}>
        <Animated.View style={rowStyle}>{children}</Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 22 },
  action: { alignItems: 'center', gap: 4, minWidth: 64 },
  label: { color: '#fff', fontSize: 11.5, fontWeight: '700' },
});
