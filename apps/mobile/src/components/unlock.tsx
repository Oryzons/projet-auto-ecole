import { Check, FingerprintPattern, ScanFace, type LucideIcon } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  LinearTransition,
  ZoomIn,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { OtpInput } from '@/components/otp';
import { BottomSheet, settingsStyles as s } from '@/components/settings';
import type { Preferences } from '@/data/preferences';
import { colors } from '@/theme';

export type UnlockMethod = Preferences['unlock'];

export const unlockLabels: Record<UnlockMethod, string> = {
  faceid: 'Face ID',
  fingerprint: 'Empreinte digitale',
  pin: 'Code à 4 chiffres',
  none: 'Aucune',
};

/**
 * Activation d'une méthode de déverrouillage (simulation) :
 * scan animé pour Face ID / empreinte, double saisie pour le code.
 */
export function UnlockSetup({ method, onDone, onCancel }: { method: UnlockMethod | null; onDone: (m: UnlockMethod) => void; onCancel: () => void }) {
  return (
    <BottomSheet open={!!method && method !== 'none'} onClose={onCancel}>
      {method === 'pin' ? <PinSetup onDone={() => onDone('pin')} /> : method === 'faceid' || method === 'fingerprint' ? <Scan key={method} method={method} onDone={() => onDone(method)} /> : null}
    </BottomSheet>
  );
}

function Scan({ method, onDone }: { method: 'faceid' | 'fingerprint'; onDone: () => void }) {
  const [done, setDone] = useState(false);
  const pulse = useSharedValue(0);
  const sweep = useSharedValue(0);
  const Icon: LucideIcon = method === 'faceid' ? ScanFace : FingerprintPattern;

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 900, easing: Easing.out(Easing.quad) }), -1);
    sweep.value = withRepeat(withSequence(withTiming(1, { duration: 700 }), withTiming(0, { duration: 700 })), -1);
    const t1 = setTimeout(() => {
      cancelAnimation(pulse);
      cancelAnimation(sweep);
      setDone(true);
    }, 2000);
    const t2 = setTimeout(onDone, 3000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
    // la simulation ne se lance qu'une fois à l'ouverture
  }, []);

  const ring = useAnimatedStyle(() => ({ opacity: 1 - pulse.value, transform: [{ scale: 1 + pulse.value * 0.6 }] }));
  const line = useAnimatedStyle(() => ({ transform: [{ translateY: -34 + sweep.value * 68 }] }));

  return (
    <View style={{ gap: 18, alignItems: 'center', paddingVertical: 8 }}>
      <View style={styles.scanWrap}>
        {!done ? <Animated.View style={[styles.ring, ring]} /> : null}
        <Animated.View layout={LinearTransition.duration(200)} style={[styles.scanCircle, done && { backgroundColor: colors.success }]}>
          {done ? (
            <Animated.View entering={ZoomIn.springify().damping(12)}>
              <Check size={40} color="#fff" strokeWidth={2.6} />
            </Animated.View>
          ) : (
            <>
              <Icon size={46} color={colors.primary} strokeWidth={1.6} />
              <Animated.View style={[styles.scanLine, line]} />
            </>
          )}
        </Animated.View>
      </View>
      <Animated.Text key={done ? 'ok' : 'scan'} entering={FadeIn.duration(200)} style={s.sheetTitle}>
        {done ? `${unlockLabels[method]} activé` : method === 'faceid' ? 'Regardez votre téléphone' : 'Posez votre doigt'}
      </Animated.Text>
      <Text style={[s.sheetText, { textAlign: 'center' }]}>
        {done
          ? 'Vous pourrez ouvrir Virage en un instant.'
          : method === 'faceid'
            ? 'Gardez votre visage dans le cadre pendant la vérification.'
            : 'Placez votre doigt sur le capteur jusqu’à la fin de la lecture.'}
      </Text>
    </View>
  );
}

function PinSetup({ onDone }: { onDone: () => void }) {
  const [first, setFirst] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [state, setState] = useState<'idle' | 'error' | 'success'>('idle');

  useEffect(() => {
    if (code.length < 4) {
      if (state === 'error') setState('idle');
      return;
    }
    if (first === null) {
      const t = setTimeout(() => {
        setFirst(code);
        setCode('');
      }, 250);
      return () => clearTimeout(t);
    }
    if (code === first) {
      setState('success');
      const t = setTimeout(onDone, 700);
      return () => clearTimeout(t);
    }
    setState('error');
    const t = setTimeout(() => setCode(''), 700);
    return () => clearTimeout(t);
    // la vérification ne dépend que du code saisi
  }, [code]);

  return (
    <View style={{ gap: 16, paddingBottom: 8 }}>
      <Animated.Text key={first === null ? 'a' : 'b'} entering={FadeIn.duration(200)} exiting={FadeOut.duration(100)} style={s.sheetTitle}>
        {first === null ? 'Choisissez un code' : 'Confirmez le code'}
      </Animated.Text>
      <Text style={s.sheetText}>
        {state === 'error' ? 'Les codes ne correspondent pas, réessayez.' : state === 'success' ? 'Code enregistré !' : 'Il vous sera demandé à l’ouverture de l’application.'}
      </Text>
      <OtpInput value={code} onChange={setCode} state={state} />
    </View>
  );
}

/** Option de méthode dans la liste (bouton radio) */
export function MethodOption({ icon: Icon, label, detail, on, onPress }: { icon: LucideIcon; label: string; detail: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.option, pressed && { backgroundColor: '#F3F5FA' }]}>
      <View style={[styles.optIcon, on && { backgroundColor: colors.primary }]}>
        <Icon size={18} color={on ? '#fff' : colors.primary} strokeWidth={1.9} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.optLabel}>{label}</Text>
        <Text style={styles.optDetail}>{detail}</Text>
      </View>
      <View style={[styles.radio, on && { borderColor: colors.primary }]}>{on ? <Animated.View entering={ZoomIn.duration(180)} style={styles.radioDot} /> : null}</View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scanWrap: { width: 140, height: 140, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: 120, height: 120, borderRadius: 60, borderWidth: 2, borderColor: colors.primary },
  scanCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  scanLine: { position: 'absolute', left: 22, right: 22, height: 2, borderRadius: 1, backgroundColor: colors.primary, opacity: 0.7 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 13 },
  optIcon: { width: 36, height: 36, borderRadius: 11, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  optLabel: { fontSize: 15, fontWeight: '600', color: colors.ink },
  optDetail: { fontSize: 12.5, color: colors.muted },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.input, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
});
