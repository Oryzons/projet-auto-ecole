import { Check } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Progress } from '@/components/ui';
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

/** En-tête d'étape du parcours d'inscription */
export function Steps({ step, total, label }: { step: number; total: number; label: string }) {
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={[font.small, { fontWeight: '700', color: colors.primary }]}>
          Étape {step} sur {total}
        </Text>
        <Text style={font.small}>{label}</Text>
      </View>
      <Progress value={step / total} height={5} />
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
