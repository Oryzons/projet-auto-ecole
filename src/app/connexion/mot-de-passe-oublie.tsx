import { router, useLocalSearchParams } from 'expo-router';
import { Check, CircleCheck, Eye, EyeOff, LockKeyhole, Mail, MailCheck, RotateCcw, Send, ShieldCheck } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeInDown, FadeOut, ZoomIn, useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { AuthHero, AuthInput, AuthTitle } from '@/components/auth';
import { Steps } from '@/components/choice';
import { CtaButton, Screen, TopBar } from '@/components/ui';
import { student } from '@/data/mock';
import { colors, shadow } from '@/theme';

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
const ease = Easing.out(Easing.cubic);

/** Règles du nouveau mot de passe */
const rules = [
  { label: '8 caractères minimum', test: (p: string) => p.length >= 8 },
  { label: 'Une majuscule', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Un chiffre', test: (p: string) => /\d/.test(p) },
  { label: 'Un caractère spécial', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

/**
 * Mot de passe oublié : adresse e-mail → lien envoyé → nouveau mot de passe → terminé.
 * (Le lien reçu par e-mail ouvrira directement l'étape 3 ; ici on la simule.)
 */
export default function MotDePasseOublie() {
  const params = useLocalSearchParams<{ email?: string }>();
  const [step, setStep] = useState<'email' | 'sent' | 'reset' | 'done'>('email');
  const [email, setEmail] = useState(params.email || student.email);
  const [countdown, setCountdown] = useState(0);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!countdown) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const sendLink = () => {
    setStep('sent');
    setCountdown(30);
  };

  const passed = rules.filter((r) => r.test(password)).length;
  const match = confirm.length > 0 && confirm === password;
  const canSave = passed === rules.length && match;
  const stepIndex = { email: 1, sent: 1, reset: 2, done: 2 }[step];

  return (
    <Screen>
      <TopBar
        title="Mot de passe oublié"
        onBack={() => (step === 'sent' ? setStep('email') : step === 'reset' ? setStep('sent') : router.back())}
      />
      {step !== 'done' ? <Steps step={stepIndex} total={2} label={stepIndex === 1 ? 'Vérification' : 'Nouveau mot de passe'} /> : null}

      {step === 'email' ? (
        <Animated.View key="email" entering={FadeInDown.duration(360).easing(ease)} exiting={FadeOut.duration(120)} style={styles.block}>
          <AuthHero source={require('@/assets/images/connexion-cadenas.jpg')} />
          <AuthTitle title="Pas de panique." text="Indiquez votre adresse e-mail : on vous envoie un lien pour choisir un nouveau mot de passe." />
          <AuthInput
            label="Adresse e-mail"
            icon={Mail}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            active={email.length > 0}
            hint="L’adresse utilisée lors de votre inscription."
            right={isEmail(email) ? <CircleCheck size={18} color={colors.primary} strokeWidth={1.9} /> : null}
          />
          <View style={{ opacity: isEmail(email) ? 1 : 0.5 }} pointerEvents={isEmail(email) ? 'auto' : 'none'}>
            <CtaButton label="Recevoir le lien" icon={Send} onPress={sendLink} />
          </View>
          <Pressable onPress={() => router.back()} style={styles.center} hitSlop={8}>
            <Text style={styles.small}>
              Vous vous en souvenez ? <Text style={styles.link}>Se connecter</Text>
            </Text>
          </Pressable>
        </Animated.View>
      ) : null}

      {step === 'sent' ? (
        <Animated.View key="sent" entering={FadeInDown.duration(360).easing(ease)} exiting={FadeOut.duration(120)} style={styles.block}>
          <View style={styles.sentHero}>
            <Animated.View entering={ZoomIn.delay(120).springify().damping(14)} style={styles.sentIcon}>
              <MailCheck size={34} color="#fff" strokeWidth={1.8} />
            </Animated.View>
          </View>
          <AuthTitle title="Vérifiez vos e-mails." text="Si un compte existe avec cette adresse, vous allez recevoir un lien valable 30 minutes." />
          <View style={styles.emailCard}>
            <Mail size={18} color={colors.primary} strokeWidth={1.9} />
            <Text style={styles.emailText} numberOfLines={1}>
              {email.trim()}
            </Text>
            <Pressable onPress={() => setStep('email')} hitSlop={8}>
              <Text style={styles.link}>Modifier</Text>
            </Pressable>
          </View>
          <CtaButton
            label="Ouvrir ma messagerie"
            icon={Mail}
            onPress={() => Linking.openURL(Platform.OS === 'ios' ? 'message://' : 'mailto:').catch(() => {})}
          />
          <Pressable disabled={countdown > 0} onPress={() => setCountdown(30)} style={[styles.resend, countdown > 0 && { opacity: 0.55 }]}>
            <RotateCcw size={15} color={colors.primary} />
            <Text style={styles.link}>{countdown > 0 ? `Renvoyer le lien dans ${countdown} s` : 'Renvoyer le lien'}</Text>
          </Pressable>
          {/* raccourci de démonstration : simule l'ouverture du lien reçu */}
          <Pressable onPress={() => setStep('reset')} style={styles.demo}>
            <Text style={styles.demoText}>Démo : ouvrir le lien reçu</Text>
          </Pressable>
          <Text style={[styles.small, { textAlign: 'center' }]}>Pensez à vérifier vos courriers indésirables.</Text>
        </Animated.View>
      ) : null}

      {step === 'reset' ? (
        <Animated.View key="reset" entering={FadeInDown.duration(360).easing(ease)} exiting={FadeOut.duration(120)} style={styles.block}>
          <AuthTitle title="Nouveau départ." text="Choisissez un mot de passe que vous n’utilisez nulle part ailleurs." />
          <AuthInput
            label="Nouveau mot de passe"
            icon={LockKeyhole}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!visible}
            autoCapitalize="none"
            autoComplete="new-password"
            active={password.length > 0}
            right={
              <Pressable onPress={() => setVisible((v) => !v)} hitSlop={10}>
                {visible ? <Eye size={18} color={colors.primary} strokeWidth={1.9} /> : <EyeOff size={18} color={colors.primary} strokeWidth={1.9} />}
              </Pressable>
            }
          />
          <Strength score={passed} />
          <View style={styles.rules}>
            {rules.map((r) => {
              const ok = r.test(password);
              return (
                <View key={r.label} style={styles.rule}>
                  <View style={[styles.ruleDot, ok && styles.ruleDotOn]}>{ok ? <Check size={11} color="#fff" strokeWidth={3} /> : null}</View>
                  <Text style={[styles.ruleText, ok && { color: colors.ink }]}>{r.label}</Text>
                </View>
              );
            })}
          </View>
          <AuthInput
            label="Confirmer le mot de passe"
            icon={LockKeyhole}
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry={!visible}
            autoCapitalize="none"
            active={confirm.length > 0}
            hint={confirm.length > 0 && !match ? 'Les deux mots de passe ne correspondent pas.' : undefined}
            right={match ? <CircleCheck size={18} color={colors.primary} strokeWidth={1.9} /> : null}
          />
          <View style={{ opacity: canSave ? 1 : 0.5 }} pointerEvents={canSave ? 'auto' : 'none'}>
            <CtaButton label="Enregistrer" icon={ShieldCheck} onPress={() => setStep('done')} />
          </View>
        </Animated.View>
      ) : null}

      {step === 'done' ? (
        <Animated.View key="done" entering={FadeIn.duration(300)} style={[styles.block, { paddingTop: 40 }]}>
          <View style={{ alignItems: 'center', gap: 18 }}>
            <Animated.View entering={ZoomIn.springify().damping(13)} style={[styles.sentIcon, { backgroundColor: colors.success }]}>
              <Check size={34} color="#fff" strokeWidth={2.6} />
            </Animated.View>
            <Text style={[styles.doneTitle]}>C’est tout bon !</Text>
            <Text style={[styles.small, { fontSize: 15, lineHeight: 22, textAlign: 'center' }]}>Votre mot de passe a été modifié. Vous pouvez vous reconnecter dès maintenant.</Text>
          </View>
          <CtaButton
            label="Me connecter"
            onPress={() => router.dismissTo({ pathname: '/connexion/mot-de-passe', params: { email: email.trim() } })}
          />
        </Animated.View>
      ) : null}
    </Screen>
  );
}

const levels = [
  { label: 'Trop faible', color: colors.danger },
  { label: 'Faible', color: colors.danger },
  { label: 'Moyen', color: colors.warning },
  { label: 'Bon', color: colors.primary },
  { label: 'Excellent', color: colors.success },
];

function Strength({ score }: { score: number }) {
  const level = levels[score];
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {[0, 1, 2, 3].map((i) => (
          <Bar key={i} on={i < score} color={level.color} />
        ))}
      </View>
      <Text style={[styles.small, { color: score ? level.color : colors.faint, fontWeight: '600' }]}>{score ? level.label : 'Force du mot de passe'}</Text>
    </View>
  );
}

function Bar({ on, color }: { on: boolean; color: string }) {
  const style = useAnimatedStyle(() => ({
    backgroundColor: withTiming(on ? color : '#E3E7F2', { duration: 220 }),
  }));
  return <Animated.View style={[{ flex: 1, height: 4, borderRadius: 2 }, style]} />;
}

const styles = StyleSheet.create({
  block: { gap: 22 },
  center: { alignItems: 'center' },
  small: { fontSize: 12.5, color: colors.muted },
  link: { fontSize: 13, fontWeight: '600', color: colors.primary },
  sentHero: { width: '100%', aspectRatio: 680 / 372, borderRadius: 18, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  sentIcon: { width: 76, height: 76, borderRadius: 38, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', ...shadow.primary },
  emailCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 16, backgroundColor: colors.card, ...shadow.card },
  emailText: { flex: 1, fontSize: 14.5, fontWeight: '700', color: colors.ink },
  resend: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  demo: { alignSelf: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.input },
  demoText: { fontSize: 11.5, color: colors.faint, fontWeight: '600' },
  rules: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 10 },
  rule: { width: '50%', flexDirection: 'row', alignItems: 'center', gap: 8 },
  ruleDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: colors.input, alignItems: 'center', justifyContent: 'center' },
  ruleDotOn: { backgroundColor: colors.success, borderColor: colors.success },
  ruleText: { fontSize: 12.5, color: colors.muted },
  doneTitle: { fontSize: 30, fontWeight: '800', color: colors.ink, letterSpacing: -0.8 },
});
