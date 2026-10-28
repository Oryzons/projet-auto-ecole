import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { Radio, SelectCard } from '@/components/animated';
import { colors, font } from '@/theme';

/** Carte sélectionnable animée (objectif, formule…) */
export function ChoiceCard({
  title,
  subtitle,
  right,
  selected,
  onPress,
}: {
  title: string;
  subtitle?: string;
  right?: string;
  selected?: boolean;
  onPress?: () => void;
}) {
  return (
    <SelectCard selected={!!selected} onPress={onPress} style={styles.card}>
      <Radio on={!!selected} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={font.h3}>{title}</Text>
        {subtitle ? <Text style={font.small}>{subtitle}</Text> : null}
      </View>
      {right ? <Text style={[font.h3, { color: selected ? colors.primary : colors.ink }]}>{right}</Text> : null}
    </SelectCard>
  );
}

/** En-tête d'étape du parcours d'inscription : barre segmentée + libellés */
export function Steps({ step, total, label }: { step: number; total: number; label: string }) {
  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {Array.from({ length: total }, (_, i) => (
          <View key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: '#E3E7F2', overflow: 'hidden' }}>
            {i < step ? <StepFill animate={i === step - 1} /> : null}
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary, letterSpacing: 0.4 }}>
          ÉTAPE {step} SUR {total}
        </Text>
        <Text style={font.tiny}>{label}</Text>
      </View>
    </View>
  );
}

/** Segment rempli ; celui de l'étape en cours se remplit à l'arrivée sur l'écran */
function StepFill({ animate }: { animate: boolean }) {
  const fill = useSharedValue(animate ? 0 : 1);
  useEffect(() => {
    fill.value = withDelay(150, withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }));
  }, [fill]);
  const style = useAnimatedStyle(() => ({ transform: [{ scaleX: fill.value }] }));
  return <Animated.View style={[{ flex: 1, backgroundColor: colors.primary, transformOrigin: 'left' }, style]} />;
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
});
