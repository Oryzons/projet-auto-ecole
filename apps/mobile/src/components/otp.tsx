import { Check, MailCheck, RotateCcw, Send } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInUp,
  FadeOut,
  FadeOutUp,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { colors, shadow } from '@/theme';

/** Code de démonstration accepté tant que le backend n'est pas branché */
export const DEMO_CODE = '2026';
const LENGTH = 4;

type State = 'idle' | 'error' | 'success';

/** Saisie d'un code à 4 chiffres : cases animées, secousse en cas d'erreur */
export function OtpInput({ value, onChange, state }: { value: string; onChange: (v: string) => void; state: State }) {
  const input = useRef<{ focus: () => void } | null>(null);
  const shake = useSharedValue(0);

  useEffect(() => {
    if (state === 'error') {
      shake.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-8, { duration: 50 }),
        withTiming(8, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      );
    }
  }, [state, shake]);

  // focus après l'animation d'arrivée de l'écran (autoFocus seul est parfois ignoré)
  useEffect(() => {
    const t = setTimeout(() => input.current?.focus(), 400);
    return () => clearTimeout(t);
  }, []);

  const rowStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));

  return (
    <Pressable onPress={() => input.current?.focus()}>
      <Animated.View style={[styles.row, rowStyle]}>
        {Array.from({ length: LENGTH }, (_, i) => (
          <Cell key={i} digit={value[i]} active={i === Math.min(value.length, LENGTH - 1) && state === 'idle'} state={state} />
        ))}
      </Animated.View>
      <TextInput
        ref={input as never}
        value={value}
        onChangeText={(t) => onChange(t.replace(/\D/g, '').slice(0, LENGTH))}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={LENGTH}
        caretHidden
        style={styles.hidden}
      />
    </Pressable>
  );
}

function Cell({ digit, active, state }: { digit?: string; active: boolean; state: State }) {
  const scale = useSharedValue(1);
  useEffect(() => {
    if (digit) scale.value = withSequence(withTiming(1.08, { duration: 90 }), withSpring(1, { damping: 12, stiffness: 300 }));
  }, [digit, scale]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const border = state === 'error' ? colors.danger : state === 'success' ? colors.success : active || digit ? colors.primary : colors.input;
  return (
    <Animated.View
      style={[
        styles.cell,
        { borderColor: border },
        state === 'success' && { backgroundColor: colors.successSoft },
        state === 'error' && { backgroundColor: colors.dangerSoft },
        style,
      ]}>
      {digit ? (
        <Animated.Text entering={FadeIn.duration(120)} style={[styles.digit, state === 'success' && { color: colors.success }, state === 'error' && { color: colors.danger }]}>
          {digit}
        </Animated.Text>
      ) : active ? (
        <Caret />
      ) : null}
    </Animated.View>
  );
}

function Caret() {
  const o = useSharedValue(1);
  useEffect(() => {
    const id = setInterval(() => {
      o.value = withTiming(o.value > 0.5 ? 0 : 1, { duration: 250 });
    }, 500);
    return () => clearInterval(id);
  }, [o]);
  const style = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={[styles.caret, style]} />;
}

/**
 * Bloc de vérification complet : icône, saisie du code, renvoi animé.
 * Appelle onSuccess une fois le bon code saisi.
 */
export function VerifyCode({ destination, onSuccess }: { destination: string; onSuccess: () => void }) {
  const [code, setCode] = useState('');
  const [state, setState] = useState<State>('idle');
  const [countdown, setCountdown] = useState(30);
  const [sentCount, setSentCount] = useState(0);
  const fly = useSharedValue(0);

  useEffect(() => {
    if (!countdown) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  useEffect(() => {
    if (code.length < LENGTH) {
      if (state === 'error') setState('idle');
      return;
    }
    if (code === DEMO_CODE) {
      setState('success');
      const t = setTimeout(onSuccess, 650);
      return () => clearTimeout(t);
    }
    setState('error');
    const t = setTimeout(() => setCode(''), 700);
    return () => clearTimeout(t);
    // seul le code saisi déclenche la vérification
  }, [code]);

  const resend = () => {
    setCountdown(30);
    setCode('');
    setState('idle');
    setSentCount((n) => n + 1);
    // l'enveloppe « part » puis revient
    fly.value = withSequence(
      withTiming(1, { duration: 320, easing: Easing.in(Easing.cubic) }),
      withTiming(-1, { duration: 0 }),
      withSpring(0, { damping: 14, stiffness: 180 }),
    );
  };

  const iconStyle = useAnimatedStyle(() => ({
    opacity: 1 - Math.abs(fly.value) * 0.9,
    transform: [{ translateY: fly.value * -40 }, { translateX: fly.value * 40 }, { rotate: `${fly.value * -18}deg` }, { scale: 1 - Math.abs(fly.value) * 0.3 }],
  }));

  return (
    <View style={{ gap: 22 }}>
      <View style={styles.hero}>
        <Animated.View style={[styles.heroIcon, state === 'success' && { backgroundColor: colors.success }, iconStyle]}>
          {state === 'success' ? (
            <Animated.View entering={ZoomIn.springify().damping(12)}>
              <Check size={34} color="#fff" strokeWidth={2.6} />
            </Animated.View>
          ) : (
            <MailCheck size={34} color="#fff" strokeWidth={1.8} />
          )}
        </Animated.View>
        {sentCount > 0 ? (
          <Animated.View key={sentCount} entering={FadeInUp.duration(280)} exiting={FadeOutUp.duration(200)} style={styles.toast}>
            <Send size={13} color={colors.success} />
            <Text style={styles.toastText}>Nouveau code envoyé</Text>
          </Animated.View>
        ) : null}
      </View>

      <View style={{ gap: 10 }}>
        <Text style={styles.title}>Entrez le code.</Text>
        <Text style={styles.text}>
          Nous avons envoyé un code à 4 chiffres à <Text style={{ color: colors.ink, fontWeight: '700' }}>{destination}</Text>.
        </Text>
      </View>

      <OtpInput value={code} onChange={setCode} state={state} />

      <View style={{ minHeight: 18, alignItems: 'center' }}>
        {state === 'error' ? (
          <Animated.Text entering={FadeIn.duration(150)} exiting={FadeOut.duration(150)} style={[styles.small, { color: colors.danger, fontWeight: '600' }]}>
            Code incorrect, réessayez.
          </Animated.Text>
        ) : state === 'success' ? (
          <Animated.Text entering={FadeIn.duration(150)} style={[styles.small, { color: colors.success, fontWeight: '600' }]}>
            Code vérifié !
          </Animated.Text>
        ) : (
          <Text style={styles.small}>Démo : le code est {DEMO_CODE}</Text>
        )}
      </View>

      <Pressable disabled={countdown > 0} onPress={resend} style={styles.resend}>
        <View style={styles.resendInner}>
          <RotateCcw size={15} color={countdown > 0 ? colors.faint : colors.primary} />
          <Text style={[styles.link, countdown > 0 && { color: colors.faint }]}>
            {countdown > 0 ? `Renvoyer le code dans ${countdown} s` : 'Renvoyer le code'}
          </Text>
        </View>
        <ResendBar countdown={countdown} />
      </Pressable>
    </View>
  );
}

/** Barre qui se vide pendant le délai avant renvoi */
function ResendBar({ countdown }: { countdown: number }) {
  const w = useSharedValue(countdown / 30);
  useEffect(() => {
    w.value = withTiming(countdown / 30, { duration: countdown === 30 ? 250 : 1000, easing: Easing.linear });
  }, [countdown, w]);
  const style = useAnimatedStyle(() => ({ transform: [{ scaleX: w.value }] }));
  return (
    <View style={styles.barTrack}>
      <Animated.View style={[styles.barFill, { transformOrigin: 'left' }, style]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', gap: 12 },
  cell: { width: 64, height: 72, borderRadius: 18, borderWidth: 1.5, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', ...shadow.card },
  digit: { fontSize: 30, fontWeight: '800', color: colors.ink },
  caret: { width: 2, height: 28, borderRadius: 1, backgroundColor: colors.primary },
  hidden: { position: 'absolute', opacity: 0, width: 1, height: 1 },
  hero: { width: '100%', aspectRatio: 680 / 372, borderRadius: 18, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  heroIcon: { width: 76, height: 76, borderRadius: 38, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', ...shadow.primary },
  toast: { position: 'absolute', top: 14, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: '#fff', ...shadow.card },
  toastText: { fontSize: 12.5, fontWeight: '700', color: colors.success },
  title: { fontSize: 34, lineHeight: 39, fontWeight: '800', color: colors.ink, letterSpacing: -1 },
  text: { fontSize: 15.5, lineHeight: 23, color: colors.muted },
  small: { fontSize: 12.5, color: colors.muted },
  link: { fontSize: 13.5, fontWeight: '600', color: colors.primary },
  resend: { alignSelf: 'center', alignItems: 'center', gap: 8 },
  resendInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  barTrack: { width: 160, height: 3, borderRadius: 2, backgroundColor: '#E3E7F2', overflow: 'hidden' },
  barFill: { height: '100%', width: '100%', backgroundColor: colors.primary },
});
