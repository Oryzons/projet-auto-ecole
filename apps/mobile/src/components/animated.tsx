import type { ReactNode } from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useDerivedValue, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { colors, radius } from '@/theme';

const DURATION = 220;

/**
 * Carte sélectionnable animée : fond et bordure glissent vers le bleu à la sélection,
 * léger rebond à l'appui.
 */
export function SelectCard({
  selected,
  onPress,
  children,
  style,
  selectedBackground = colors.primarySoft,
}: {
  selected: boolean;
  onPress?: () => void;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  selectedBackground?: string;
}) {
  const progress = useDerivedValue(() => withTiming(selected ? 1 : 0, { duration: DURATION }));
  const pressed = useSharedValue(1);

  const animated = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [colors.card, selectedBackground]),
    borderColor: interpolateColor(progress.value, [0, 1], [colors.border, colors.primary]),
    transform: [{ scale: pressed.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => (pressed.value = withSpring(0.975, { damping: 18, stiffness: 320 }))}
      onPressOut={() => (pressed.value = withSpring(1, { damping: 14, stiffness: 260 }))}>
      <Animated.View style={[styles.card, style, animated]}>{children}</Animated.View>
    </Pressable>
  );
}

/** Bouton radio animé : l'anneau se remplit et le point central apparaît en rebond */
export function Radio({ on }: { on: boolean }) {
  const progress = useDerivedValue(() => withTiming(on ? 1 : 0, { duration: DURATION }));
  const dot = useDerivedValue(() => withSpring(on ? 1 : 0, { damping: 12, stiffness: 260 }));

  const ring = useAnimatedStyle(() => ({
    borderColor: interpolateColor(progress.value, [0, 1], [colors.input, colors.primary]),
    backgroundColor: interpolateColor(progress.value, [0, 1], [colors.card, colors.primary]),
  }));
  const center = useAnimatedStyle(() => ({ transform: [{ scale: dot.value }] }));

  return (
    <Animated.View style={[styles.radio, ring]}>
      <Animated.View style={[styles.radioDot, center]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, borderWidth: 1.5 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
});
