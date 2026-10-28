import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { CarFront, Motorbike } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Logo } from '@/components/logo';
import { CtaButton } from '@/components/ui';
import { student } from '@/data/mock';
import { colors, font, radius, shadow } from '@/theme';

/** Arrivée en cascade des blocs de l'écran */
const enter = (i: number) => FadeInDown.delay(150 + i * 90).duration(420);

/** Inscription confirmée — dernière étape avant le tableau de bord élève */
export default function InscriptionConfirmee() {
  const p = useLocalSearchParams<{ vehicule?: string; permis?: string; formule?: string; objectif?: string }>();
  const VehicleIcon = p.vehicule === 'moto' ? Motorbike : CarFront;

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} bounces={false}>
        <View style={styles.header}>
          <Logo size={27} />
          <Animated.View entering={ZoomIn.delay(500).springify()} style={styles.done}>
            <Text style={styles.doneText}>4 / 4 · TERMINÉ</Text>
          </Animated.View>
        </View>

        <Animated.View entering={ZoomIn.duration(500).springify().damping(14)} style={styles.hero}>
          <Image source={require('@/assets/images/confirmation-cle.jpg')} style={StyleSheet.absoluteFill} contentFit="cover" />
        </Animated.View>

        <Animated.View entering={enter(1)} style={{ alignItems: 'center', gap: 10 }}>
          <Text style={styles.eyebrow}>INSCRIPTION CONFIRMÉE</Text>
          <Text style={styles.title}>Bienvenue à bord,{'\n'}{student.firstName} !</Text>
          <Text style={styles.subtitle}>Le premier virage est passé.{'\n'}La suite de l’aventure vous attend.</Text>
        </Animated.View>

        <Animated.View entering={enter(2)} style={styles.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View style={styles.iconBox}>
              <VehicleIcon size={20} color={colors.primary} strokeWidth={1.8} />
            </View>
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={[font.h3, { fontSize: 16 }]}>{p.permis || 'Permis B · Manuelle'}</Text>
              <Text style={font.small}>{p.formule || 'Essentiel · 20 h + code inclus'}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={font.small}>Votre cap</Text>
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.primary }}>{p.objectif || 'Décembre 2026'}</Text>
          </View>
        </Animated.View>

        <View style={{ flexGrow: 1, minHeight: 16 }} />

        <Animated.View entering={enter(3)} style={{ gap: 14 }}>
          <Text style={[font.tiny, { textAlign: 'center', lineHeight: 18 }]}>
            Un lien pour créer votre mot de passe a été envoyé à{'\n'}
            <Text style={{ color: colors.ink }}>{student.email}</Text>
          </Text>
          <CtaButton label="Découvrir mon espace" onPress={() => router.replace('/eleve')} />
          <Pressable hitSlop={8}>
            <Text style={styles.link}>Renvoyer l’e-mail de bienvenue</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 14, paddingBottom: 12, gap: 22 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  done: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: colors.successSoft },
  doneText: { fontSize: 10.5, fontWeight: '700', color: colors.success, letterSpacing: 0.4 },
  hero: { width: '80%', alignSelf: 'center', aspectRatio: 1.43, borderRadius: 24, overflow: 'hidden', backgroundColor: '#C9CBDB' },
  eyebrow: { fontSize: 11, fontWeight: '700', color: colors.primary, letterSpacing: 0.6 },
  title: { fontSize: 30, lineHeight: 35, fontWeight: '800', color: colors.ink, letterSpacing: -0.8, textAlign: 'center' },
  subtitle: { fontSize: 15, lineHeight: 21, color: colors.muted, textAlign: 'center' },
  card: { gap: 14, padding: 18, borderRadius: 20, backgroundColor: colors.card, ...shadow.card },
  iconBox: { width: 42, height: 42, borderRadius: radius.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  divider: { height: 1, backgroundColor: colors.border },
  link: { fontSize: 13.5, fontWeight: '600', color: colors.primary, textAlign: 'center' },
});
