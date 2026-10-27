import { router } from 'expo-router';
import { Car, CarFront, CircleCheck, HeartHandshake, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Steps } from '@/components/choice';
import { CtaButton, Screen, TopBar } from '@/components/ui';
import { colors, font, radius } from '@/theme';

const licences: { key: string; title: string; subtitle: string; icon: LucideIcon }[] = [
  { key: 'manuelle', title: 'Permis B · Manuelle', subtitle: 'Le classique, sans limites', icon: CarFront },
  { key: 'auto', title: 'Permis B · Automatique', subtitle: 'La conduite, en toute simplicité', icon: Car },
];

const formulas = [
  { key: 'essentiel', name: 'Essentiel', short: 'Essentiel · 20 h', badge: 'LE BON DÉPART', price: '1 190 €', split: 'ou 3 × 396,67 €', detail: '20 h de conduite + code en ligne inclus', pitch: 'L’essentiel pour bien démarrer' },
  { key: 'serenite', name: 'Sérénité', short: 'Sérénité · 30 h', badge: 'LE PLUS COMPLET', price: '1 590 €', split: 'ou 3 × 530 €', detail: '30 h de conduite + code en ligne + examen blanc inclus', pitch: 'Plus de pratique, plus de confiance' },
];

/** Inscription · Permis et formule (étape 2) — calqué sur la maquette Figma */
export default function InscriptionPermis() {
  const [licence, setLicence] = useState('manuelle');
  const [formula, setFormula] = useState('essentiel');

  return (
    <Screen
      footer={
        <View style={{ gap: 12 }}>
          <CtaButton label="Choisir cette formule" onPress={() => router.push('/inscription/objectif')} />
          <View style={styles.reassure}>
            <HeartHandshake size={14} color={colors.muted} />
            <Text style={font.tiny}>Aucun paiement maintenant. Prenez le temps.</Text>
          </View>
        </View>
      }>
      <TopBar title="Inscription" />
      <Steps step={2} total={3} label="Votre liberté commence ici" />

      <View style={{ gap: 10 }}>
        <Text style={styles.title}>À chacun sa route.</Text>
        <Text style={[font.body, { color: colors.muted }]}>Un permis et une formule qui vous ressemblent.</Text>
      </View>

      <View style={{ gap: 12 }}>
        <Text style={styles.label}>Je choisis mon permis</Text>
        {licences.map((l) => {
          const on = licence === l.key;
          const Icon = l.icon;
          return (
            <Pressable key={l.key} onPress={() => setLicence(l.key)} style={[styles.option, on && styles.optionOn]}>
              <View style={[styles.iconBox, on && styles.iconBoxOn]}>
                <Icon size={20} color={on ? colors.ink : colors.primary} strokeWidth={1.8} />
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={styles.optionTitle}>{l.title}</Text>
                <Text style={font.tiny}>{l.subtitle}</Text>
              </View>
              <Radio on={on} />
            </Pressable>
          );
        })}
      </View>

      <View style={{ gap: 12 }}>
        <Text style={styles.label}>Ma formule de départ</Text>
        {formulas.map((f) =>
          formula === f.key ? (
            <View key={f.key} style={styles.formulaOn}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 19, fontWeight: '700', color: colors.ink }}>{f.name}</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{f.badge}</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
                <Text style={styles.price}>{f.price}</Text>
                <Text style={font.tiny}>{f.split}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <CircleCheck size={16} color={colors.primary} />
                <Text style={{ fontSize: 13, color: colors.ink }}>{f.detail}</Text>
              </View>
            </View>
          ) : (
            <Pressable key={f.key} onPress={() => setFormula(f.key)} style={styles.formula}>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={{ fontSize: 15, fontWeight: '500', color: colors.ink }}>{f.short}</Text>
                <Text style={font.tiny}>{f.pitch}</Text>
              </View>
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.ink }}>{f.price}</Text>
            </Pressable>
          ),
        )}
      </View>
    </Screen>
  );
}

function Radio({ on }: { on: boolean }) {
  return (
    <View style={[styles.radio, on && { borderColor: colors.primary, backgroundColor: colors.primary }]}>
      {on ? <View style={styles.radioDot} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 30, fontWeight: '800', color: colors.ink, letterSpacing: -0.8 },
  label: { fontSize: 14, fontWeight: '600', color: colors.ink },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  optionOn: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  optionTitle: { fontSize: 15, fontWeight: '600', color: colors.ink },
  iconBox: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  iconBoxOn: { backgroundColor: colors.card },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: colors.input, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  formulaOn: { gap: 12, padding: 16, borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.primary, backgroundColor: colors.card },
  formula: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: colors.primarySoft },
  badgeText: { fontSize: 10.5, fontWeight: '700', color: colors.primary, letterSpacing: 0.4 },
  price: { fontSize: 32, fontWeight: '800', color: colors.primary, letterSpacing: -0.8 },
  reassure: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
});
