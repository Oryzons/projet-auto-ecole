import { Check } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, font, radius } from '@/theme';

/** Carte sélectionnable (formule, type de permis…) */
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
    <Pressable onPress={onPress} style={[styles.card, selected && styles.selected]}>
      <View style={[styles.radio, selected && styles.radioOn]}>{selected ? <Check size={14} color="#fff" strokeWidth={3} /> : null}</View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={font.h3}>{title}</Text>
        {subtitle ? <Text style={font.small}>{subtitle}</Text> : null}
      </View>
      {right ? <Text style={[font.h3, { color: selected ? colors.primary : colors.ink }]}>{right}</Text> : null}
    </Pressable>
  );
}

/** En-tête d'étape du parcours d'inscription : barre segmentée + libellés */
export function Steps({ step, total, label }: { step: number; total: number; label: string }) {
  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {Array.from({ length: total }, (_, i) => (
          <View key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i < step ? colors.primary : '#E3E7F2' }} />
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

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  selected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: colors.input, alignItems: 'center', justifyContent: 'center' },
  radioOn: { backgroundColor: colors.primary, borderColor: colors.primary },
});
