import { Image, type ImageSource } from 'expo-image';
import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { colors } from '@/theme';

/** Visuel des écrans de connexion : même format pour chaque étape */
export function AuthHero({ source, onLongPress }: { source: ImageSource | number; onLongPress?: () => void }) {
  return (
    <Animated.View entering={FadeInDown.duration(380)} style={styles.hero}>
      <Pressable onLongPress={onLongPress} delayLongPress={600} style={StyleSheet.absoluteFill}>
        <Image source={source} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
      </Pressable>
    </Animated.View>
  );
}

/** Titre + sous-titre des écrans de connexion */
export function AuthTitle({ title, text }: { title: string; text: string }) {
  return (
    <Animated.View entering={FadeInDown.delay(60).duration(380)} style={{ gap: 12 }}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.text}>{text}</Text>
    </Animated.View>
  );
}

/** Champ avec icône à gauche et élément à droite (validation, œil…) */
export function AuthInput({ label, icon: Icon, right, active, hint, ...props }: TextInputProps & { label: string; icon: LucideIcon; right?: ReactNode; active?: boolean; hint?: string }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.input, active && styles.inputActive]}>
        <Icon size={18} color={colors.muted} strokeWidth={1.8} />
        <TextInput placeholderTextColor={colors.faint} style={styles.field} {...props} />
        {right}
      </View>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { width: '100%', aspectRatio: 680 / 372, borderRadius: 18, overflow: 'hidden', backgroundColor: '#C9D5E8' },
  title: { fontSize: 34, lineHeight: 39, fontWeight: '800', color: colors.ink, letterSpacing: -1 },
  text: { fontSize: 15.5, lineHeight: 23, color: colors.muted },
  label: { fontSize: 13, fontWeight: '700', color: colors.ink },
  input: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 54, paddingHorizontal: 16, borderRadius: 14, backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.input },
  inputActive: { borderColor: colors.primary },
  field: { flex: 1, height: '100%', fontSize: 15, color: colors.ink },
  hint: { fontSize: 12, color: colors.muted },
});
