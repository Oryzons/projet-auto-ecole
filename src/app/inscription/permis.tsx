import { router, useLocalSearchParams } from 'expo-router';
import { Bike, Car, CarFront, CircleCheck, HeartHandshake, Motorbike, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, LinearTransition } from 'react-native-reanimated';

import { Radio, SelectCard } from '@/components/animated';
import { Steps } from '@/components/choice';
import { CtaButton, Screen, TopBar } from '@/components/ui';
import { colors, font } from '@/theme';

type Licence = { key: string; title: string; subtitle: string; icon: LucideIcon };
type Formula = { key: string; name: string; short: string; badge: string; price: string; split: string; detail: string; pitch: string };

const offers: Record<'voiture' | 'moto', { title: string; licences: Licence[]; formulas: Formula[] }> = {
  voiture: {
    title: 'À chacun sa route.',
    licences: [
      { key: 'manuelle', title: 'Permis B · Manuelle', subtitle: 'Le classique, sans limites', icon: CarFront },
      { key: 'auto', title: 'Permis B · Automatique', subtitle: 'La conduite, en toute simplicité', icon: Car },
    ],
    formulas: [
      { key: 'essentiel', name: 'Essentiel', short: 'Essentiel · 20 h', badge: 'LE BON DÉPART', price: '1 190 €', split: 'ou 3 × 396,67 €', detail: '20 h de conduite + code en ligne inclus', pitch: 'L’essentiel pour bien démarrer' },
      { key: 'serenite', name: 'Sérénité', short: 'Sérénité · 30 h', badge: 'LE PLUS COMPLET', price: '1 590 €', split: 'ou 3 × 530 €', detail: '30 h de conduite + code en ligne + examen blanc inclus', pitch: 'Plus de pratique, plus de confiance' },
    ],
  },
  moto: {
    title: 'À chacun sa trajectoire.',
    licences: [
      { key: 'a2', title: 'Permis A2', subtitle: 'Toutes les motos jusqu’à 35 kW, dès 18 ans', icon: Motorbike },
      { key: '125', title: 'Formation 125 cm³', subtitle: '7 h pour rouler en 125 avec le permis B', icon: Bike },
    ],
    formulas: [
      { key: 'essentiel', name: 'Essentiel', short: 'Essentiel · 20 h', badge: 'LE BON DÉPART', price: '990 €', split: 'ou 3 × 330 €', detail: '20 h plateau et circulation + code moto inclus', pitch: 'L’essentiel pour bien démarrer' },
      { key: 'serenite', name: 'Sérénité', short: 'Sérénité · 28 h', badge: 'LE PLUS COMPLET', price: '1 290 €', split: 'ou 3 × 430 €', detail: '28 h plateau et circulation + code moto + équipement prêté', pitch: 'Plus de pratique, plus de confiance' },
    ],
  },
};

/** Inscription · Permis et formule (étape 3) — calqué sur la maquette Figma */
export default function InscriptionPermis() {
  const { vehicule } = useLocalSearchParams<{ vehicule?: string }>();
  const offer = offers[vehicule === 'moto' ? 'moto' : 'voiture'];
  const [licence, setLicence] = useState(offer.licences[0].key);
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
      <Steps step={3} total={4} label="Votre liberté commence ici" />

      <View style={{ gap: 10 }}>
        <Text style={styles.title}>{offer.title}</Text>
        <Text style={[font.body, { color: colors.muted }]}>Un permis et une formule qui vous ressemblent.</Text>
      </View>

      <View style={{ gap: 12 }}>
        <Text style={styles.label}>Je choisis mon permis</Text>
        {offer.licences.map((l) => {
          const on = licence === l.key;
          const Icon = l.icon;
          return (
            <SelectCard key={l.key} selected={on} onPress={() => setLicence(l.key)} style={styles.option}>
              <View style={[styles.iconBox, on && styles.iconBoxOn]}>
                <Icon size={20} color={on ? colors.ink : colors.primary} strokeWidth={1.8} />
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={styles.optionTitle}>{l.title}</Text>
                <Text style={font.tiny}>{l.subtitle}</Text>
              </View>
              <Radio on={on} />
            </SelectCard>
          );
        })}
      </View>

      <View style={{ gap: 12 }}>
        <Text style={styles.label}>Ma formule de départ</Text>
        {offer.formulas.map((f) => {
          const on = formula === f.key;
          return (
            // La carte change de taille en douceur quand elle se déplie ou se replie
            <Animated.View key={f.key} layout={LinearTransition.springify().damping(20).stiffness(180)}>
              <SelectCard selected={on} onPress={() => setFormula(f.key)} selectedBackground={colors.card} style={styles.formula}>
                {on ? (
                  <Animated.View key="open" entering={FadeIn.duration(260)} style={{ gap: 12 }}>
                    <View style={styles.row}>
                      <Text style={{ fontSize: 19, fontWeight: '700', color: colors.ink }}>{f.name}</Text>
                      <Animated.View entering={FadeInDown.delay(80).duration(260)} style={styles.badge}>
                        <Text style={styles.badgeText}>{f.badge}</Text>
                      </Animated.View>
                    </View>
                    <Animated.View entering={FadeInDown.delay(60).duration(300)} style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
                      <Text style={styles.price}>{f.price}</Text>
                      <Text style={font.tiny}>{f.split}</Text>
                    </Animated.View>
                    <Animated.View entering={FadeInDown.delay(120).duration(300)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <CircleCheck size={16} color={colors.primary} />
                      <Text style={{ fontSize: 13, color: colors.ink, flex: 1 }}>{f.detail}</Text>
                    </Animated.View>
                  </Animated.View>
                ) : (
                  <Animated.View key="closed" entering={FadeIn.duration(220)} style={styles.row}>
                    <View style={{ flex: 1, gap: 3 }}>
                      <Text style={{ fontSize: 15, fontWeight: '500', color: colors.ink }}>{f.short}</Text>
                      <Text style={font.tiny}>{f.pitch}</Text>
                    </View>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: colors.ink }}>{f.price}</Text>
                  </Animated.View>
                )}
              </SelectCard>
            </Animated.View>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 30, fontWeight: '800', color: colors.ink, letterSpacing: -0.8 },
  label: { fontSize: 14, fontWeight: '600', color: colors.ink },
  option: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  optionTitle: { fontSize: 15, fontWeight: '600', color: colors.ink },
  iconBox: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  iconBoxOn: { backgroundColor: colors.card },
  formula: { padding: 16 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: colors.primarySoft },
  badgeText: { fontSize: 10.5, fontWeight: '700', color: colors.primary, letterSpacing: 0.4 },
  price: { fontSize: 32, fontWeight: '800', color: colors.primary, letterSpacing: -0.8 },
  reassure: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
});
