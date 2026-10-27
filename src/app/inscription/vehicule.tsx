import { router } from 'expo-router';
import { CarFront, HeartHandshake, Motorbike, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useDerivedValue, withSpring, withTiming } from 'react-native-reanimated';

import { Radio, SelectCard } from '@/components/animated';
import { Steps } from '@/components/choice';
import { CtaButton, Screen, TopBar } from '@/components/ui';
import { colors, font } from '@/theme';

export type Vehicule = 'voiture' | 'moto';

const choices: { key: Vehicule; title: string; subtitle: string; tags: string; icon: LucideIcon }[] = [
  { key: 'voiture', title: 'Voiture', subtitle: 'Pour la route, la ville et les week-ends.', tags: 'Permis B · Conduite accompagnée · Boîte auto', icon: CarFront },
  { key: 'moto', title: 'Moto', subtitle: 'Pour la liberté sur deux roues.', tags: 'Permis A2 · Formation 125 cm³', icon: Motorbike },
];

/** Inscription · Voiture ou moto (étape 2) */
export default function InscriptionVehicule() {
  const [vehicule, setVehicule] = useState<Vehicule>('voiture');

  return (
    <Screen
      footer={
        <View style={{ gap: 12 }}>
          <CtaButton label="Continuer" onPress={() => router.push({ pathname: '/inscription/permis', params: { vehicule } })} />
          <View style={styles.reassure}>
            <HeartHandshake size={14} color={colors.muted} />
            <Text style={font.tiny}>Vous pourrez changer d’avis à tout moment.</Text>
          </View>
        </View>
      }>
      <TopBar title="Inscription" />
      <Steps step={2} total={4} label="Votre liberté commence ici" />

      <View style={{ gap: 10 }}>
        <Text style={styles.title}>Deux roues ou quatre ?</Text>
        <Text style={[font.body, { color: colors.muted }]}>Choisissez le permis que vous voulez passer.</Text>
      </View>

      <View style={{ gap: 12 }}>
        {choices.map((c) => (
          <SelectCard key={c.key} selected={vehicule === c.key} onPress={() => setVehicule(c.key)} style={styles.card}>
            <View style={styles.cardTop}>
              <IconBubble icon={c.icon} on={vehicule === c.key} />
              <Radio on={vehicule === c.key} />
            </View>
            <View style={{ gap: 4 }}>
              <Text style={styles.cardTitle}>{c.title}</Text>
              <Text style={[font.small, { color: colors.muted }]}>{c.subtitle}</Text>
            </View>
            <Text style={styles.tags}>{c.tags}</Text>
          </SelectCard>
        ))}
      </View>
    </Screen>
  );
}

/** Pastille d'icône : passe au bleu et grossit légèrement quand la carte est choisie */
function IconBubble({ icon: Icon, on }: { icon: LucideIcon; on: boolean }) {
  const progress = useDerivedValue(() => withTiming(on ? 1 : 0, { duration: 220 }));
  const scale = useDerivedValue(() => withSpring(on ? 1.06 : 1, { damping: 12, stiffness: 200 }));
  const style = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [colors.primarySoft, colors.primary]),
    transform: [{ scale: scale.value }],
  }));
  return (
    <Animated.View style={[styles.bubble, style]}>
      <Icon size={30} color={on ? '#fff' : colors.primary} strokeWidth={1.8} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 30, fontWeight: '800', color: colors.ink, letterSpacing: -0.8 },
  card: { padding: 18, gap: 16 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  bubble: { width: 60, height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 20, fontWeight: '700', color: colors.ink },
  tags: { fontSize: 12, fontWeight: '600', color: colors.primary },
  reassure: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
});
