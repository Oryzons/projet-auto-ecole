import { router } from 'expo-router';
import { CircleCheck, ClipboardCheck, Mail, ShieldCheck, UserRound } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';

import { AuthHero, AuthInput, AuthTitle } from '@/components/auth';
import { Steps } from '@/components/choice';
import { Button, CtaButton, Screen, TopBar } from '@/components/ui';
import { student } from '@/data/mock';
import { colors } from '@/theme';

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

/** Connexion, étape 1 : adresse e-mail */
export default function ConnexionEmail() {
  const [email, setEmail] = useState(student.email);
  const [demo, setDemo] = useState(false);
  const valid = isEmail(email);

  return (
    <Screen>
      <TopBar title="Connexion" />
      <Steps step={1} total={2} label="Votre espace vous attend" />
      {/* appui long sur le visuel : accès démo aux espaces moniteur et administration */}
      <AuthHero source={require('@/assets/images/connexion-volant.jpg')} onLongPress={() => setDemo((d) => !d)} />
      <AuthTitle title={'On reprend\nla route ?'} text={'Votre parcours est là où vous l’avez laissé.\nCommençons par votre adresse e-mail.'} />

      <Animated.View entering={FadeInDown.delay(120).duration(380)} style={{ gap: 18 }}>
        <AuthInput
          label="Adresse e-mail"
          icon={Mail}
          value={email}
          onChangeText={setEmail}
          placeholder="prenom.nom@email.fr"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          active={email.length > 0}
          hint="L’adresse utilisée lors de votre inscription."
          right={
            valid ? (
              <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)}>
                <CircleCheck size={18} color={colors.primary} strokeWidth={1.9} />
              </Animated.View>
            ) : null
          }
        />
        <View style={styles.secure}>
          <ShieldCheck size={15} color={colors.muted} strokeWidth={1.8} />
          <Text style={styles.small}>Votre espace personnel, en toute sécurité.</Text>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(180).duration(380)} style={{ gap: 18 }}>
        <View style={{ opacity: valid ? 1 : 0.5 }} pointerEvents={valid ? 'auto' : 'none'}>
          <CtaButton label="Continuer" onPress={() => router.push({ pathname: '/connexion/mot-de-passe', params: { email: email.trim() } })} />
        </View>
        <View style={styles.signup}>
          <Text style={styles.small}>Nouveau chez Virage ?</Text>
          <Pressable onPress={() => router.push('/inscription/identite')} hitSlop={8}>
            <Text style={styles.link}>S’inscrire</Text>
          </Pressable>
        </View>
      </Animated.View>

      {demo ? (
        <Animated.View entering={FadeInDown.duration(250)} style={{ flexDirection: 'row', gap: 8 }}>
          <Button small variant="secondary" icon={UserRound} label="Moniteur" style={{ flex: 1 }} onPress={() => router.push('/moniteur')} />
          <Button small variant="secondary" icon={ClipboardCheck} label="Administration" style={{ flex: 1.4 }} onPress={() => router.push('/admin')} />
        </Animated.View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  secure: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  small: { fontSize: 12.5, color: colors.muted },
  signup: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  link: { fontSize: 12.5, fontWeight: '600', color: colors.primary },
});
