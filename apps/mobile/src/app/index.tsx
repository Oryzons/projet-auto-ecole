import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ArrowRight, LogIn, Sparkles } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Logo } from '@/components/logo';
import { colors, shadow } from '@/theme';

/** Écran d'accueil « Bienvenue chez Virage », calqué sur la maquette Figma */
export default function Welcome() {
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} bounces={false}>
        <View style={styles.header}>
          {/* Appui long sur le logo : accès démo aux espaces moniteur et administration */}
          <Pressable onLongPress={() => router.push('/connexion')} delayLongPress={600}>
            <Logo size={27} />
          </Pressable>
          <Text style={styles.tagline}>À VOUS LA ROUTE.</Text>
        </View>

        <View style={styles.hero}>
          <Image source={require('@/assets/images/accueil-route.jpg')} style={StyleSheet.absoluteFill} contentFit="cover" />
          <View style={styles.pill}>
            <Sparkles size={13} color={colors.primary} />
            <Text style={styles.pillText}>La liberté, ça s’apprend.</Text>
          </View>
          <View style={styles.dots}>
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
        </View>

        <View style={{ gap: 14 }}>
          <Text style={styles.title}>Votre permis.{'\n'}Votre nouveau{'\n'}départ.</Text>
          <Text style={styles.subtitle}>Du premier code au premier créneau, avancez à votre rythme. On est à vos côtés.</Text>
        </View>

        <View style={{ flexGrow: 1, minHeight: 24 }} />

        <View style={{ gap: 12 }}>
          <Pressable
            onPress={() => router.push('/inscription/identite')}
            style={({ pressed }) => [styles.button, styles.primary, pressed && styles.pressed]}>
            <Text style={[styles.buttonText, { color: '#fff' }]}>Créer mon compte</Text>
            <ArrowRight size={20} color="#fff" />
          </Pressable>
          <Pressable onPress={() => router.push('/connexion')} style={({ pressed }) => [styles.button, styles.secondary, pressed && styles.pressed]}>
            <Text style={[styles.buttonText, { color: colors.ink }]}>J’ai déjà un compte</Text>
            <LogIn size={20} color={colors.ink} />
          </Pressable>
          <Text style={styles.footnote}>Votre auto-école, toujours dans votre poche.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 14, paddingBottom: 12, gap: 22 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tagline: { fontSize: 10, fontWeight: '600', color: colors.muted, letterSpacing: 0.6 },
  hero: { width: '100%', aspectRatio: 1.255, borderRadius: 26, overflow: 'hidden', backgroundColor: '#DCDDF5' },
  pill: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  pillText: { fontSize: 11.5, fontWeight: '500', color: colors.ink },
  dots: { position: 'absolute', left: 16, bottom: 12, flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.85)' },
  dotActive: { width: 18, backgroundColor: colors.primary },
  title: { fontSize: 44, lineHeight: 47, fontWeight: '800', color: colors.ink, letterSpacing: -1.4 },
  subtitle: { fontSize: 14, lineHeight: 20, color: colors.muted },
  button: {
    height: 52,
    borderRadius: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  primary: { backgroundColor: colors.primary, ...shadow.primary },
  secondary: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  buttonText: { fontSize: 15.5, fontWeight: '600' },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  footnote: { fontSize: 10.5, color: colors.muted, textAlign: 'center', marginTop: 2 },
});
