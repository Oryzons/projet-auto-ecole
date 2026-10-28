import { router, useLocalSearchParams } from 'expo-router';
import { Check, CircleCheck, Eye, EyeOff, LockKeyhole, LogIn, Sparkles } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { AuthHero, AuthInput, AuthTitle } from '@/components/auth';
import { Steps } from '@/components/choice';
import { CtaButton, Screen, TopBar } from '@/components/ui';
import { student } from '@/data/mock';
import { colors, shadow } from '@/theme';

/** « camille.martin@… » → « Camille » */
const firstNameOf = (email: string) => {
  const part = email.split('@')[0].split(/[._-]/)[0];
  return part ? part[0].toUpperCase() + part.slice(1) : student.firstName;
};

/** Connexion, étape 2 : mot de passe */
export default function ConnexionMotDePasse() {
  const params = useLocalSearchParams<{ email?: string }>();
  const email = params.email || student.email;
  const name = firstNameOf(email);
  const initials = (email.split('@')[0].split(/[._-]/).slice(0, 2).map((p) => p[0] ?? '').join('') || 'V').toUpperCase();

  const [password, setPassword] = useState('virage2026!');
  const [visible, setVisible] = useState(false);
  const [remember, setRemember] = useState(true);

  return (
    <Screen>
      <TopBar title="Connexion" />
      <Steps step={2} total={2} label="Votre espace vous attend" />
      <AuthHero source={require('@/assets/images/connexion-cadenas.jpg')} />
      <AuthTitle title={`Bonjour, ${name}.`} text="Plus qu’un mot de passe avant de retrouver votre liberté." />

      <Animated.View entering={FadeInDown.delay(120).duration(380)} style={{ gap: 18 }}>
        <View style={styles.account}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.email} numberOfLines={1}>
              {email}
            </Text>
            <Pressable onPress={() => router.back()} hitSlop={6}>
              <Text style={styles.link}>Changer d’adresse e-mail</Text>
            </Pressable>
          </View>
          <CircleCheck size={18} color={colors.primary} strokeWidth={1.9} />
        </View>

        <View style={{ gap: 10 }}>
          <AuthInput
            label="Mot de passe"
            icon={LockKeyhole}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!visible}
            autoCapitalize="none"
            autoComplete="current-password"
            active={password.length > 0}
            right={
              <Pressable onPress={() => setVisible((v) => !v)} hitSlop={10}>
                {visible ? <Eye size={18} color={colors.primary} strokeWidth={1.9} /> : <EyeOff size={18} color={colors.primary} strokeWidth={1.9} />}
              </Pressable>
            }
          />
          <Pressable style={{ alignSelf: 'flex-end' }} hitSlop={8}>
            <Text style={styles.link}>Mot de passe oublié ?</Text>
          </Pressable>
        </View>

        <Pressable onPress={() => setRemember((r) => !r)} style={styles.remember} hitSlop={6}>
          <View style={[styles.box, remember && styles.boxOn]}>
            {remember ? (
              <Animated.View entering={FadeIn.duration(150)}>
                <Check size={13} color="#fff" strokeWidth={3} />
              </Animated.View>
            ) : null}
          </View>
          <Text style={styles.small}>Rester connecté sur cet appareil</Text>
        </Pressable>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(180).duration(380)} style={{ gap: 18 }}>
        <View style={{ opacity: password ? 1 : 0.5 }} pointerEvents={password ? 'auto' : 'none'}>
          <CtaButton label="Me connecter" icon={LogIn} onPress={() => router.replace('/eleve')} />
        </View>
        <View style={styles.next}>
          <Sparkles size={15} color={colors.muted} strokeWidth={1.8} />
          <Text style={styles.small}>Votre prochaine étape commence ici.</Text>
        </View>
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  account: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, backgroundColor: colors.card, ...shadow.card },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  email: { fontSize: 14, fontWeight: '700', color: colors.ink },
  link: { fontSize: 12.5, fontWeight: '600', color: colors.primary },
  remember: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  box: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: colors.input, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  boxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  small: { fontSize: 12.5, color: colors.muted },
  next: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
