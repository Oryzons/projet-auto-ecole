import { router } from 'expo-router';
import { Check, ChevronDown, FileSignature, Lock, ShieldCheck } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeInDown, LinearTransition, ZoomIn } from 'react-native-reanimated';

import { ContractDownload } from '@/components/contract-download';
import { SignaturePad, type SignatureData } from '@/components/signature-pad';
import { CtaButton, Screen, TopBar } from '@/components/ui';
import { contractArticles, contractHtml } from '@/data/contrat-pdf';
import { student } from '@/data/mock';
import { useProfile } from '@/data/profile';
import { colors, shadow } from '@/theme';

const ease = Easing.out(Easing.cubic);

const articles = contractArticles;

/** Contrat de formation : lecture, signature au doigt, acceptation obligatoire */
export default function EleveContrat() {
  const profile = useProfile();
  const [hasSignature, setHasSignature] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [signed, setSigned] = useState<string | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [signature, setSignature] = useState<SignatureData>();
  const [expanded, setExpanded] = useState(false);
  const ready = hasSignature && accepted;

  const sign = () => {
    const d = new Date();
    setSigned(`${d.toLocaleDateString('fr-FR')} à ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`);
  };

  return (
    <Screen scrollEnabled={!drawing}>
      <TopBar title="Contrat" />
      <Animated.View entering={FadeInDown.duration(360).easing(ease)} style={{ gap: 8 }}>
        <Text style={styles.title}>{signed ? 'Contrat signé.' : 'Votre contrat.'}</Text>
        <Text style={styles.subtitle}>{signed ? 'Une copie vous a été envoyée par e-mail.' : 'Relisez-le, signez avec votre doigt, puis validez.'}</Text>
      </Animated.View>

      {signed ? (
        <Animated.View entering={ZoomIn.springify().damping(14)} style={styles.success}>
          <View style={styles.successIcon}>
            <Check size={30} color="#fff" strokeWidth={2.6} />
          </View>
          <Text style={styles.successTitle}>Signé le {signed}</Text>
          <Text style={[styles.small, { textAlign: 'center' }]}>Signature électronique horodatée et sécurisée. Délai de rétractation : 14 jours.</Text>
        </Animated.View>
      ) : null}

      {/* Récapitulatif */}
      <Animated.View entering={FadeInDown.delay(40).duration(360).easing(ease)} layout={LinearTransition.duration(220)} style={styles.card}>
        <Line label="Élève" value={`${student.firstName} ${student.lastName}`} />
        <Line label="Formation" value={profile.permis} />
        <Line label="Formule" value={profile.formule} />
        <Line label="Prix total TTC" value="1 350 €" strong />
        <Line label="Modalités" value="3 × 450 € sans frais" />
        <View style={styles.divider} />
        {(expanded ? articles : articles.slice(0, 2)).map((a, i) => (
          <Animated.View key={a.title} entering={FadeIn.duration(200)} style={{ gap: 4 }}>
            <Text style={styles.articleTitle}>
              Article {i + 1} · {a.title}
            </Text>
            <Text style={styles.articleBody}>{a.body}</Text>
          </Animated.View>
        ))}
        <Pressable onPress={() => setExpanded((e) => !e)} style={styles.more} hitSlop={6}>
          <Text style={styles.link}>{expanded ? 'Réduire' : `Lire les ${articles.length} articles`}</Text>
          <View style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}>
            <ChevronDown size={16} color={colors.primary} />
          </View>
        </Pressable>
        <ContractDownload getHtml={() => contractHtml({ permis: profile.permis, formule: profile.formule, signature: signed ? signature : undefined, signedAt: signed })} signed={!!signed} />
      </Animated.View>

      {/* Signature */}
      <Animated.View entering={FadeInDown.delay(80).duration(360).easing(ease)} style={{ gap: 10 }}>
        <Text style={styles.h2}>Votre signature</Text>
        <SignaturePad onChange={setHasSignature} onDrawing={setDrawing} onData={setSignature} disabled={!!signed} />
      </Animated.View>

      {!signed ? (
        <Animated.View entering={FadeInDown.delay(120).duration(360).easing(ease)} style={{ gap: 18 }}>
          <Pressable onPress={() => setAccepted((a) => !a)} style={styles.accept} hitSlop={6}>
            <View style={[styles.box, accepted && styles.boxOn]}>
              {accepted ? (
                <Animated.View entering={ZoomIn.duration(160)}>
                  <Check size={14} color="#fff" strokeWidth={3} />
                </Animated.View>
              ) : null}
            </View>
            <Text style={styles.acceptText}>J’ai lu et j’accepte le contrat de formation et les conditions générales de vente.</Text>
          </Pressable>

          <View style={{ opacity: ready ? 1 : 0.45 }} pointerEvents={ready ? 'auto' : 'none'}>
            <CtaButton label="Signer le contrat" icon={ready ? FileSignature : Lock} onPress={sign} />
          </View>
          {!ready ? (
            <Animated.Text entering={FadeIn} style={[styles.small, { textAlign: 'center' }]}>
              {!hasSignature && !accepted ? 'Signez et cochez la case pour continuer.' : !hasSignature ? 'Il manque votre signature.' : 'Cochez la case pour continuer.'}
            </Animated.Text>
          ) : null}
        </Animated.View>
      ) : (
        <Animated.View entering={FadeIn.delay(200)}>
          <CtaButton label="Retour à mon profil" onPress={() => router.back()} />
        </Animated.View>
      )}

      <View style={styles.secure}>
        <ShieldCheck size={15} color={colors.muted} />
        <Text style={styles.small}>Signature électronique conforme au règlement eIDAS.</Text>
      </View>
    </Screen>
  );
}

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.line}>
      <Text style={styles.small}>{label}</Text>
      <Text style={[styles.lineValue, strong && { color: colors.primary, fontSize: 16 }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 30, fontWeight: '800', color: colors.ink, letterSpacing: -0.8 },
  subtitle: { fontSize: 15, lineHeight: 22, color: colors.muted },
  h2: { fontSize: 18, fontWeight: '800', color: colors.ink, letterSpacing: -0.3 },
  small: { fontSize: 12.5, color: colors.muted, flexShrink: 1 },
  link: { fontSize: 13, fontWeight: '600', color: colors.primary },
  card: { gap: 12, padding: 16, borderRadius: 20, backgroundColor: colors.card, ...shadow.card },
  line: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  lineValue: { flexShrink: 1, fontSize: 14, fontWeight: '700', color: colors.ink, textAlign: 'right' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  articleTitle: { fontSize: 13.5, fontWeight: '700', color: colors.ink },
  articleBody: { fontSize: 13, lineHeight: 19, color: colors.muted },
  more: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  accept: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  box: { width: 24, height: 24, borderRadius: 7, borderWidth: 1.5, borderColor: colors.input, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  boxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  acceptText: { flex: 1, fontSize: 13.5, lineHeight: 20, color: colors.ink },
  success: { alignItems: 'center', gap: 10, padding: 20, borderRadius: 22, backgroundColor: colors.successSoft },
  successIcon: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center' },
  successTitle: { fontSize: 16, fontWeight: '800', color: colors.success },
  secure: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' },
});
