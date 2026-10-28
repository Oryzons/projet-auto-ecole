import { router } from 'expo-router';
import { Check, CircleAlert, Lock, Nfc, ShieldCheck } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  FadeIn,
  FadeInDown,
  ZoomIn,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { Spinner } from '@/components/checkout';
import { settingsStyles } from '@/components/settings';
import { Screen, TopBar } from '@/components/ui';
import { euro, getPendingCheckout, setPendingCheckout } from '@/data/billing';
import { student } from '@/data/mock';
import { colors, shadow } from '@/theme';

type Field = 'number' | 'name' | 'exp' | 'cvc';
type Brand = 'visa' | 'mastercard' | 'amex' | 'cb';

const brandOf = (n: string): Brand => (/^4/.test(n) ? 'visa' : /^(5[1-5]|2[2-7])/.test(n) ? 'mastercard' : /^3[47]/.test(n) ? 'amex' : 'cb');

/** Algorithme de Luhn : détecte les fautes de frappe dans le numéro */
const luhn = (n: string) => {
  let sum = 0;
  for (let i = 0; i < n.length; i++) {
    let d = Number(n[n.length - 1 - i]);
    if (i % 2) d = d * 2 > 9 ? d * 2 - 9 : d * 2;
    sum += d;
  }
  return n.length >= 15 && sum % 10 === 0;
};

const expValid = (e: string) => {
  const [m, y] = e.split('/').map(Number);
  if (!m || m > 12 || y === undefined || e.length < 5) return false;
  const now = new Date();
  const yy = now.getFullYear() % 100;
  return y > yy || (y === yy && m >= now.getMonth() + 1);
};

/** Saisie d'une nouvelle carte : carte en 3D qui se remplit en direct et se retourne pour le cryptogramme */
export default function NouvelleCarte() {
  const [pending] = useState(getPendingCheckout);
  const amount = pending?.amount ?? 0;
  const [card, setCard] = useState({ number: '', name: `${student.firstName} ${student.lastName}`.toUpperCase(), exp: '', cvc: '' });
  const [focus, setFocus] = useState<Field | null>(null);
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [save, setSave] = useState(true);
  const [stage, setStage] = useState<'form' | 'processing' | 'done'>('form');

  const digits = card.number.replace(/\s/g, '');
  const brand = brandOf(digits);
  const errors: Partial<Record<Field, string>> = {
    number: luhn(digits) ? undefined : 'Numéro de carte invalide',
    name: card.name.trim().length >= 3 ? undefined : 'Nom du titulaire requis',
    exp: expValid(card.exp) ? undefined : 'Date d’expiration invalide',
    cvc: card.cvc.length >= 3 ? undefined : '3 chiffres au dos de la carte',
  };
  const valid = !Object.values(errors).some(Boolean);
  const show = (f: Field) => touched[f] && focus !== f && errors[f];

  const refs = { name: useRef<{ focus: () => void } | null>(null), exp: useRef<{ focus: () => void } | null>(null), cvc: useRef<{ focus: () => void } | null>(null) };

  useEffect(() => {
    if (stage !== 'processing') return;
    const t = setTimeout(() => {
      setStage('done');
      pending?.onPaid();
      setPendingCheckout(null);
    }, 2400);
    return () => clearTimeout(t);
    // le paiement n'est déclenché qu'une fois
  }, [stage]);

  const blur = (f: Field) => {
    setTouched((t) => ({ ...t, [f]: true }));
    setFocus((cur) => (cur === f ? null : cur));
  };

  if (stage !== 'form') {
    return (
      <Screen scroll={false}>
        <TopBar title="Nouvelle carte" back={stage === 'done'} />
        <View style={styles.center}>
          {stage === 'processing' ? (
            <Animated.View key="p" entering={FadeIn.duration(250)} style={{ alignItems: 'center', gap: 12 }}>
              <Spinner />
              <Text style={styles.centerTitle}>Vérification 3D Secure…</Text>
              <Text style={settingsStyles.sheetText}>Validez le paiement dans l’application de votre banque.</Text>
            </Animated.View>
          ) : (
            <Animated.View key="d" entering={FadeIn.duration(250)} style={{ alignItems: 'center', gap: 12, alignSelf: 'stretch' }}>
              <Animated.View entering={ZoomIn.springify().damping(11)} style={styles.success}>
                <Check size={38} color="#fff" strokeWidth={2.6} />
              </Animated.View>
              <Text style={styles.centerTitle}>{pending ? 'Paiement accepté' : 'Carte enregistrée'}</Text>
              <Text style={[settingsStyles.sheetText, { textAlign: 'center' }]}>
                {pending ? `${euro(amount)} réglés avec la carte •••• ${digits.slice(-4)}.${save ? ' Elle est enregistrée pour vos prochains paiements.' : ''}` : `La carte •••• ${digits.slice(-4)} sera utilisée pour vos prochains paiements.`}
              </Text>
              <Pressable onPress={() => router.back()} style={[styles.pay, { alignSelf: 'stretch', marginTop: 12 }]}>
                <Text style={styles.payText}>Terminer</Text>
              </Pressable>
            </Animated.View>
          )}
        </View>
      </Screen>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen
        footer={
          <View style={{ gap: 10 }}>
            <Pressable
              disabled={!valid}
              onPress={() => setStage('processing')}
              style={({ pressed }) => [styles.pay, !valid && { opacity: 0.45 }, pressed && { transform: [{ scale: 0.99 }] }]}>
              <Lock size={16} color="#fff" />
              <Text style={styles.payText}>{pending ? `Payer ${euro(amount)}` : 'Enregistrer la carte'}</Text>
            </Pressable>
            <View style={styles.secure}>
              <ShieldCheck size={14} color={colors.success} />
              <Text style={styles.secureText}>Paiement chiffré · 3D Secure · aucun frais</Text>
            </View>
          </View>
        }>
        <TopBar title="Nouvelle carte" />
        {pending ? (
          <Animated.View entering={FadeInDown.duration(360)} style={{ gap: 4 }}>
            <Text style={styles.eyebrow}>{pending.title.toUpperCase()}</Text>
            <Text style={styles.amount}>{euro(amount)}</Text>
          </Animated.View>
        ) : null}

        <CreditCard3D card={card} brand={brand} focus={focus} />

        <Animated.View entering={FadeInDown.delay(120).duration(360)} style={{ gap: 14 }}>
          <Input
            label="Numéro de carte"
            value={card.number}
            placeholder="1234 5678 9012 3456"
            keyboardType="number-pad"
            focused={focus === 'number'}
            error={show('number')}
            right={digits ? <BrandMark brand={brand} small /> : null}
            onFocus={() => setFocus('number')}
            onBlur={() => blur('number')}
            onChangeText={(t) => {
              const d = t.replace(/\D/g, '').slice(0, 16);
              setCard({ ...card, number: d.replace(/(\d{4})(?=\d)/g, '$1 ') });
              if (d.length === 16 && luhn(d)) refs.name.current?.focus();
            }}
          />
          <Input
            inputRef={refs.name}
            label="Titulaire de la carte"
            value={card.name}
            placeholder="NOM PRÉNOM"
            autoCapitalize="characters"
            focused={focus === 'name'}
            error={show('name')}
            onFocus={() => setFocus('name')}
            onBlur={() => blur('name')}
            onChangeText={(t) => setCard({ ...card, name: t.toUpperCase().slice(0, 26) })}
          />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Input
                inputRef={refs.exp}
                label="Expiration"
                value={card.exp}
                placeholder="MM/AA"
                keyboardType="number-pad"
                focused={focus === 'exp'}
                error={show('exp')}
                onFocus={() => setFocus('exp')}
                onBlur={() => blur('exp')}
                onChangeText={(t) => {
                  const d = t.replace(/\D/g, '').slice(0, 4);
                  const v = d.replace(/(\d{2})(?=\d)/, '$1/');
                  setCard({ ...card, exp: v });
                  if (expValid(v)) refs.cvc.current?.focus();
                }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                inputRef={refs.cvc}
                label="Cryptogramme"
                value={card.cvc}
                placeholder="123"
                keyboardType="number-pad"
                secureTextEntry
                focused={focus === 'cvc'}
                error={show('cvc')}
                onFocus={() => setFocus('cvc')}
                onBlur={() => blur('cvc')}
                onChangeText={(t) => setCard({ ...card, cvc: t.replace(/\D/g, '').slice(0, 3) })}
              />
            </View>
          </View>

          <Pressable onPress={() => setSave(!save)} style={styles.save}>
            <View style={[styles.check, save && styles.checkOn]}>{save ? <Check size={14} color="#fff" strokeWidth={3} /> : null}</View>
            <Text style={styles.saveText}>Enregistrer cette carte pour mes prochaines échéances</Text>
          </Pressable>
          <Text style={styles.demo}>Démo : 4242 4242 4242 4242, une date future et 3 chiffres.</Text>
        </Animated.View>
      </Screen>
    </KeyboardAvoidingView>
  );
}

function Input({
  label,
  focused,
  error,
  right,
  inputRef,
  ...props
}: React.ComponentProps<typeof TextInput> & { label: string; focused: boolean; error?: string | false; right?: React.ReactNode; inputRef?: React.RefObject<{ focus: () => void } | null> }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.input, focused && { borderColor: colors.primary, borderWidth: 1.5 }, !!error && { borderColor: colors.danger }]}>
        <TextInput ref={inputRef as never} placeholderTextColor={colors.faint} style={styles.inputText} {...props} />
        {right}
      </View>
      {error ? (
        <Animated.View entering={FadeIn.duration(150)} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <CircleAlert size={13} color={colors.danger} />
          <Text style={styles.error}>{error}</Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

/* ---------- Carte 3D ---------- */

const CARD_RATIO = 1.586;

function CreditCard3D({ card, brand, focus }: { card: { number: string; name: string; exp: string; cvc: string }; brand: Brand; focus: Field | null }) {
  const { width } = useWindowDimensions();
  const w = Math.min(width - 40, 380);
  const h = w / CARD_RATIO;
  const flip = useSharedValue(0);
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);

  // la carte se retourne pour le cryptogramme
  useEffect(() => {
    flip.value = withSpring(focus === 'cvc' ? 180 : 0, { damping: 16, stiffness: 120 });
  }, [focus, flip]);

  // on peut l'incliner du doigt
  const pan = usePanGesture({
    runOnJS: true,
    minDistance: 0,
    onUpdate: (e: { translationX: number; translationY: number }) => {
      tiltY.value = Math.max(-18, Math.min(18, e.translationX / 6));
      tiltX.value = Math.max(-14, Math.min(14, -e.translationY / 6));
    },
    onFinalize: () => {
      tiltX.value = withSpring(0, { damping: 10, stiffness: 120 });
      tiltY.value = withSpring(0, { damping: 10, stiffness: 120 });
    },
  });

  const front = useAnimatedStyle(() => ({
    transform: [{ perspective: 1000 }, { rotateX: `${tiltX.value}deg` }, { rotateY: `${flip.value + tiltY.value}deg` }],
    opacity: flip.value > 90 ? 0 : 1,
  }));
  const back = useAnimatedStyle(() => ({
    transform: [{ perspective: 1000 }, { rotateX: `${tiltX.value}deg` }, { rotateY: `${flip.value - 180 + tiltY.value}deg` }],
    opacity: flip.value > 90 ? 1 : 0,
  }));
  const glare = useAnimatedStyle(() => ({
    opacity: interpolate(Math.abs(tiltY.value) + Math.abs(tiltX.value), [0, 25], [0.12, 0.3]),
    transform: [{ translateX: tiltY.value * 6 }, { rotate: '25deg' }],
  }));

  const shown = (card.number.replace(/\s/g, '') + '################').slice(0, 16).replace(/(.{4})(?=.)/g, '$1 ');

  return (
    <GestureDetector gesture={pan}>
      <View style={{ width: w, height: h, alignSelf: 'center', marginVertical: 6 }}>
        <Animated.View style={[styles.face, { width: w, height: h, backfaceVisibility: 'hidden' }, front]}>
          <CardBackground w={w} h={h} brand={brand} />
          <Animated.View style={[styles.glare, { height: h * 2 }, glare]} />
          <View style={styles.faceInner}>
            <View style={styles.rowBetween}>
              <View style={styles.chip}>
                <View style={styles.chipLine} />
                <View style={[styles.chipLine, { top: '62%' }]} />
              </View>
              <Nfc size={22} color="rgba(255,255,255,0.8)" />
            </View>
            <View style={[styles.slot, focus === 'number' && styles.slotOn]}>
              <Text style={[styles.number, { fontSize: w / 16 }]}>
                {shown.split('').map((c, i) => (
                  <Text key={i} style={c === '#' ? { color: 'rgba(255,255,255,0.45)' } : undefined}>
                    {c === '#' ? '•' : c}
                  </Text>
                ))}
              </Text>
            </View>
            <View style={[styles.rowBetween, { alignItems: 'flex-end' }]}>
              <View style={[styles.slot, { flex: 1, marginRight: 12 }, focus === 'name' && styles.slotOn]}>
                <Text style={styles.cardLabel}>TITULAIRE</Text>
                <Text style={styles.cardValue} numberOfLines={1}>
                  {card.name || 'NOM PRÉNOM'}
                </Text>
              </View>
              <View style={[styles.slot, focus === 'exp' && styles.slotOn]}>
                <Text style={styles.cardLabel}>EXPIRE</Text>
                <Text style={styles.cardValue}>{card.exp || 'MM/AA'}</Text>
              </View>
              <View style={{ marginLeft: 12 }}>
                <BrandMark brand={brand} />
              </View>
            </View>
          </View>
        </Animated.View>

        <Animated.View style={[styles.face, { width: w, height: h, position: 'absolute', backfaceVisibility: 'hidden' }, back]}>
          <CardBackground w={w} h={h} brand={brand} />
          <View style={[styles.stripe, { top: h * 0.14 }]} />
          <View style={[styles.signatureRow, { top: h * 0.42 }]}>
            <View style={styles.signature}>
              <Text style={styles.signatureText}>{card.name.split(' ')[0] ?? ''}</Text>
            </View>
            <View style={[styles.cvcBox, focus === 'cvc' && { borderColor: colors.primary }]}>
              <Text style={styles.cvcText}>{card.cvc ? '•'.repeat(card.cvc.length) : 'CVC'}</Text>
            </View>
          </View>
          <Text style={[styles.backHint, { top: h * 0.68 }]}>Les 3 chiffres au dos de votre carte</Text>
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

const palettes: Record<Brand, [string, string, string]> = {
  visa: ['#1B2A6B', '#2D50F5', '#6E8BFF'],
  mastercard: ['#14203C', '#3A2A5E', '#C2410C'],
  amex: ['#0F5257', '#11867A', '#7FD1C5'],
  cb: ['#14203C', '#26365E', '#4C6299'],
};

function CardBackground({ w, h, brand }: { w: number; h: number; brand: Brand }) {
  const [a, b, c] = palettes[brand];
  return (
    <Animated.View key={brand} entering={FadeIn.duration(300)} style={StyleSheet.absoluteFill}>
      <Svg width={w} height={h}>
        <Defs>
          <LinearGradient id={`bg-${brand}`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={a} />
            <Stop offset="0.6" stopColor={b} />
            <Stop offset="1" stopColor={c} />
          </LinearGradient>
        </Defs>
        <Rect width={w} height={h} rx={18} fill={`url(#bg-${brand})`} />
        <Circle cx={w * 0.95} cy={h * 0.05} r={h * 0.7} fill="#fff" opacity={0.07} />
        <Circle cx={w * 0.1} cy={h * 1.05} r={h * 0.55} fill="#fff" opacity={0.05} />
      </Svg>
    </Animated.View>
  );
}

function BrandMark({ brand, small }: { brand: Brand; small?: boolean }) {
  const s = small ? 0.7 : 1;
  if (brand === 'mastercard')
    return (
      <View style={{ flexDirection: 'row', width: 46 * s, height: 28 * s }}>
        <View style={{ width: 28 * s, height: 28 * s, borderRadius: 14 * s, backgroundColor: '#EB001B' }} />
        <View style={{ width: 28 * s, height: 28 * s, borderRadius: 14 * s, backgroundColor: '#F79E1B', opacity: 0.9, marginLeft: -10 * s }} />
      </View>
    );
  const label = brand === 'visa' ? 'VISA' : brand === 'amex' ? 'AMEX' : 'CB';
  return <Text style={{ fontSize: 20 * s, fontWeight: '900', fontStyle: brand === 'visa' ? 'italic' : 'normal', color: small ? colors.primary : '#fff', letterSpacing: 1 }}>{label}</Text>;
}

const mono = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

const styles = StyleSheet.create({
  eyebrow: { fontSize: 11, fontWeight: '700', color: colors.muted, letterSpacing: 0.6 },
  amount: { fontSize: 32, fontWeight: '800', color: colors.ink, letterSpacing: -1 },
  face: { borderRadius: 18, overflow: 'hidden', ...shadow.primary, shadowOpacity: 0.35, shadowRadius: 18 },
  faceInner: { flex: 1, padding: 20, justifyContent: 'space-between' },
  glare: { position: 'absolute', top: '-50%', left: '30%', width: 60, backgroundColor: '#fff' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chip: { width: 44, height: 33, borderRadius: 7, backgroundColor: '#E8C66A', borderWidth: 1, borderColor: '#C9A548', overflow: 'hidden' },
  chipLine: { position: 'absolute', left: 0, right: 0, top: '30%', height: 1, backgroundColor: '#B8953A' },
  slot: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8, borderWidth: 1.5, borderColor: 'transparent' },
  slotOn: { borderColor: 'rgba(255,255,255,0.7)', backgroundColor: 'rgba(255,255,255,0.08)' },
  number: { fontFamily: mono, fontWeight: '700', color: '#fff', letterSpacing: 1 },
  cardLabel: { fontSize: 8.5, fontWeight: '700', color: 'rgba(255,255,255,0.65)', letterSpacing: 0.8 },
  cardValue: { fontSize: 14, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },
  stripe: { position: 'absolute', left: 0, right: 0, height: 42, backgroundColor: '#0B1022' },
  signatureRow: { position: 'absolute', left: 20, right: 20, flexDirection: 'row', alignItems: 'center', gap: 10 },
  signature: { flex: 1, height: 36, borderRadius: 4, backgroundColor: '#F1F3F8', justifyContent: 'center', paddingHorizontal: 10 },
  signatureText: { fontStyle: 'italic', fontSize: 16, color: '#5B6B82' },
  cvcBox: { width: 62, height: 36, borderRadius: 6, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
  cvcText: { fontFamily: mono, fontSize: 15, fontWeight: '700', color: colors.ink },
  backHint: { position: 'absolute', left: 20, fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  label: { fontSize: 13, fontWeight: '600', color: colors.ink },
  input: { height: 52, borderRadius: 14, borderWidth: 1, borderColor: colors.input, backgroundColor: colors.card, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  inputText: { flex: 1, minWidth: 0, height: '100%', fontSize: 16, color: colors.ink },
  error: { fontSize: 12.5, color: colors.danger, fontWeight: '600' },
  save: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  check: { width: 22, height: 22, borderRadius: 7, borderWidth: 2, borderColor: colors.input, alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  saveText: { flex: 1, fontSize: 13.5, color: colors.ink },
  demo: { fontSize: 12, color: colors.muted },
  pay: { height: 56, borderRadius: 16, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, ...shadow.primary },
  payText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  secure: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  secureText: { fontSize: 12, color: colors.muted },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingBottom: 60 },
  centerTitle: { fontSize: 22, fontWeight: '800', color: colors.ink, letterSpacing: -0.4 },
  success: { width: 84, height: 84, borderRadius: 42, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
});
