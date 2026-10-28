import { router } from 'expo-router';
import { Check, CreditCard, Lock, ShieldCheck, Smartphone, type LucideIcon } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeInDown, FadeOut, ZoomIn, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { BottomSheet, settingsStyles } from '@/components/settings';
import { euro, setPendingCheckout } from '@/data/billing';
import { student } from '@/data/mock';
import { colors, shadow } from '@/theme';

type Method = 'applepay' | 'card' | 'new';
type Stage = 'review' | 'processing' | 'done';

const methods: { key: Method; icon: LucideIcon; title: string; sub: string }[] = [
  { key: 'applepay', icon: Smartphone, title: 'Apple Pay', sub: 'Validation avec Face ID' },
  { key: 'card', icon: CreditCard, title: 'Visa •••• 4242', sub: 'Carte enregistrée · exp. 09/28' },
  { key: 'new', icon: CreditCard, title: 'Nouvelle carte', sub: 'Visa, Mastercard, CB' },
];

/**
 * Paiement fictif : choix du moyen de paiement, traitement animé puis confirmation.
 * onPaid est appelé une fois le paiement « accepté ».
 */
export function CheckoutSheet({
  open,
  onClose,
  title,
  detail,
  amount,
  onPaid,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  detail: string;
  amount: number;
  onPaid: () => void;
}) {
  const [method, setMethod] = useState<Method>('applepay');
  const [stage, setStage] = useState<Stage>('review');
  const [step, setStep] = useState(0);
  // montant figé au moment du paiement : la page derrière se met à jour entre-temps
  const [charged, setCharged] = useState(amount);

  // on repart de zéro à chaque ouverture
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setStage('review');
      setStep(0);
    }
  }

  useEffect(() => {
    if (stage !== 'processing') return;
    const t1 = setTimeout(() => setStep(1), 1100);
    const t2 = setTimeout(() => {
      setStage('done');
      onPaid();
    }, 2300);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
    // onPaid n'a besoin d'être appelé qu'une fois par paiement
  }, [stage]);

  const close = stage === 'processing' ? () => {} : onClose;

  return (
    <BottomSheet open={open} onClose={close}>
      {stage === 'review' ? (
        <Animated.View key="review" entering={FadeIn.duration(200)} style={{ gap: 16 }}>
          <View style={{ gap: 4 }}>
            <Text style={styles.eyebrow}>{title.toUpperCase()}</Text>
            <Text style={styles.amount}>{euro(amount)}</Text>
            <Text style={settingsStyles.sheetText}>{detail}</Text>
          </View>

          <View style={styles.methods}>
            {methods.map((m, i) => {
              const on = m.key === method;
              return (
                <View key={m.key}>
                  {i > 0 ? <View style={styles.sep} /> : null}
                  <Pressable onPress={() => setMethod(m.key)} style={styles.method}>
                    <View style={[styles.methodIcon, m.key === 'applepay' && { backgroundColor: colors.ink }]}>
                      <m.icon size={17} color={m.key === 'applepay' ? '#fff' : colors.primary} strokeWidth={1.9} />
                    </View>
                    <View style={{ flex: 1, gap: 1 }}>
                      <Text style={styles.methodTitle}>{m.title}</Text>
                      <Text style={styles.methodSub}>{m.sub}</Text>
                    </View>
                    <View style={[styles.radio, on && styles.radioOn]}>{on ? <View style={styles.radioDot} /> : null}</View>
                  </Pressable>
                </View>
              );
            })}
          </View>


          <Pressable
                        onPress={() => {
              if (method === 'new') {
                // la saisie de la carte se fait sur une page dédiée
                setPendingCheckout({ title, amount, onPaid });
                onClose();
                setTimeout(() => router.push('/eleve/carte'), 250);
                return;
              }
              setCharged(amount);
              setStage('processing');
            }}
            style={({ pressed }) => [styles.pay, method === 'applepay' && { backgroundColor: colors.ink }, pressed && { transform: [{ scale: 0.99 }] }]}>
            {method === 'new' ? <CreditCard size={16} color="#fff" /> : <Lock size={16} color="#fff" />}
            <Text style={styles.payText}>{method === 'applepay' ? `Payer ${euro(amount)} avec Apple Pay` : method === 'new' ? 'Saisir ma carte' : `Payer ${euro(amount)}`}</Text>
          </Pressable>
          <View style={styles.secure}>
            <ShieldCheck size={14} color={colors.success} />
            <Text style={styles.secureText}>Paiement sécurisé · 3D Secure · aucun frais</Text>
          </View>
        </Animated.View>
      ) : stage === 'processing' ? (
        <Animated.View key="processing" entering={FadeIn.duration(200)} style={styles.center}>
          <Spinner />
          <Animated.Text key={step} entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)} style={styles.centerTitle}>
            {step === 0 ? 'Paiement en cours…' : method === 'applepay' ? 'Validation Face ID…' : 'Vérification 3D Secure…'}
          </Animated.Text>
          <Text style={settingsStyles.sheetText}>Ne fermez pas l’application.</Text>
        </Animated.View>
      ) : (
        <Animated.View key="done" entering={FadeIn.duration(200)} style={styles.center}>
          <Animated.View entering={ZoomIn.springify().damping(11)} style={styles.success}>
            <Check size={38} color="#fff" strokeWidth={2.6} />
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(150).duration(300)} style={{ alignItems: 'center', gap: 6 }}>
            <Text style={styles.centerTitle}>Paiement accepté</Text>
            <Text style={[settingsStyles.sheetText, { textAlign: 'center' }]}>
              {euro(charged)} réglés. Votre facture a été envoyée à {student.email}.
            </Text>
          </Animated.View>
          <Pressable onPress={onClose} style={[settingsStyles.secondary, { alignSelf: 'stretch', marginTop: 8 }]}>
            <Text style={settingsStyles.secondaryText}>Terminer</Text>
          </Pressable>
        </Animated.View>
      )}
    </BottomSheet>
  );
}

export function Spinner() {
  const r = useSharedValue(0);
  useEffect(() => {
    r.value = withRepeat(withTiming(360, { duration: 900, easing: Easing.linear }), -1);
  }, [r]);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${r.value}deg` }] }));
  return (
    <View style={styles.spinnerWrap}>
      <Animated.View style={[styles.spinner, style]} />
      <Lock size={22} color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  eyebrow: { fontSize: 11, fontWeight: '700', color: colors.muted, letterSpacing: 0.6 },
  amount: { fontSize: 36, fontWeight: '800', color: colors.ink, letterSpacing: -1 },
  methods: { borderRadius: 18, backgroundColor: colors.card, overflow: 'hidden', ...shadow.card },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: 64 },
  method: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  methodIcon: { width: 38, height: 38, borderRadius: 11, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  methodTitle: { fontSize: 15, fontWeight: '600', color: colors.ink },
  methodSub: { fontSize: 12.5, color: colors.muted },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.input, alignItems: 'center', justifyContent: 'center' },
  radioOn: { borderColor: colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  pay: { height: 56, borderRadius: 16, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, ...shadow.primary },
  payText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  secure: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  secureText: { fontSize: 12, color: colors.muted },
  center: { alignItems: 'center', gap: 12, paddingVertical: 24 },
  centerTitle: { fontSize: 21, fontWeight: '800', color: colors.ink, letterSpacing: -0.4 },
  spinnerWrap: { width: 76, height: 76, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  spinner: { position: 'absolute', width: 76, height: 76, borderRadius: 38, borderWidth: 4, borderColor: colors.primarySoft, borderTopColor: colors.primary },
  success: { width: 84, height: 84, borderRadius: 42, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
});
