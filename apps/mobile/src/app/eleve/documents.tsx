import * as DocumentPicker from 'expo-document-picker';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Check, CircleCheck, CircleX, FileText, Hourglass, ImagePlus, RefreshCw, ShieldCheck, Upload, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
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

import { BottomSheet, settingsStyles as s } from '@/components/settings';
import { Screen, TopBar } from '@/components/ui';
import { updateDoc, useDossier, type DossierDoc } from '@/data/dossier';
import { colors, shadow, toneColors, type Tone } from '@/theme';

const ease = Easing.out(Easing.cubic);
const layout = LinearTransition.duration(260).easing(ease);

const statusInfo: Record<DossierDoc['status'], { label: string; tone: Tone }> = {
  accepted: { label: 'Accepté', tone: 'success' },
  pending: { label: 'En vérification', tone: 'warning' },
  refused: { label: 'Refusé', tone: 'danger' },
  missing: { label: 'À déposer', tone: 'neutral' },
  uploading: { label: 'Envoi en cours', tone: 'primary' },
};

/** Dépôt et suivi des pièces justificatives */
export default function EleveDocuments() {
  const docs = useDossier();
  const [picker, setPicker] = useState<DossierDoc | null>(null);
  const ok = docs.filter((d) => d.status === 'accepted').length;

  /** Simulation : envoi (1,6 s) → vérification → validation par l'équipe (démo : 6 s) */
  const submit = (doc: DossierDoc, file: { uri: string; name: string; isPdf?: boolean }) => {
    updateDoc(doc.id, { status: 'uploading', uri: file.isPdf ? undefined : file.uri, fileName: file.name, isPdf: file.isPdf, note: undefined });
    setTimeout(() => updateDoc(doc.id, { status: 'pending' }), 1700);
    setTimeout(() => updateDoc(doc.id, { status: 'accepted' }), 7500);
  };

  // iOS refuse d'ouvrir l'appareil photo tant que le panneau se ferme encore
  const closeSheet = () => {
    setPicker(null);
    return new Promise((r) => setTimeout(r, 350));
  };

  const fromCamera = async (doc: DossierDoc) => {
    await closeSheet();
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return Alert.alert('Appareil photo', 'Autorisez l’accès à l’appareil photo dans les réglages du téléphone.');
    const r = await ImagePicker.launchCameraAsync({ quality: 0.7, allowsEditing: true });
    if (!r.canceled) submit(doc, { uri: r.assets[0].uri, name: r.assets[0].fileName ?? 'photo.jpg' });
  };
  const fromLibrary = async (doc: DossierDoc) => {
    await closeSheet();
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7, allowsEditing: true });
    if (!r.canceled) submit(doc, { uri: r.assets[0].uri, name: r.assets[0].fileName ?? 'image.jpg' });
  };
  const fromFiles = async (doc: DossierDoc) => {
    await closeSheet();
    const r = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'], copyToCacheDirectory: true });
    if (!r.canceled) {
      const a = r.assets[0];
      submit(doc, { uri: a.uri, name: a.name, isPdf: a.mimeType === 'application/pdf' || a.name.endsWith('.pdf') });
    }
  };

  return (
    <Screen>
      <TopBar title="Mon dossier" />
      <Animated.View entering={FadeInDown.duration(360).easing(ease)} style={{ gap: 8 }}>
        <Text style={styles.title}>Vos documents.</Text>
        <Text style={styles.subtitle}>Prenez-les en photo ou importez-les. L’équipe les vérifie sous 48 h.</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(40).duration(360).easing(ease)} style={styles.summary}>
        <View style={styles.rowBetween}>
          <Text style={styles.summaryTitle}>
            {ok} sur {docs.length} acceptés
          </Text>
          <Text style={styles.summaryPct}>{Math.round((ok / docs.length) * 100)} %</Text>
        </View>
        <View style={styles.segments}>
          {docs.map((d) => (
            <Animated.View key={d.id} layout={layout} style={[styles.segment, { backgroundColor: toneColors[statusInfo[d.status].tone].fg }, d.status === 'missing' && { backgroundColor: colors.input }]} />
          ))}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <ShieldCheck size={15} color={colors.muted} />
          <Text style={styles.small}>Vos fichiers sont chiffrés et transmis uniquement à l’ANTS.</Text>
        </View>
      </Animated.View>

      <View style={{ gap: 12 }}>
        {docs.map((d, i) => (
          <Animated.View key={d.id} entering={FadeInDown.delay(80 + i * 50).duration(320).easing(ease)} layout={layout}>
            <DocCard d={d} onAdd={() => setPicker(d)} />
          </Animated.View>
        ))}
      </View>

      <BottomSheet open={!!picker} onClose={() => setPicker(null)}>
        <Text style={s.sheetTitle}>{picker?.name}</Text>
        <Text style={s.sheetText}>{picker?.hint}. Le document doit être lisible, sans reflet ni coin coupé.</Text>
        <SheetOption icon={Camera} label="Prendre une photo" onPress={() => picker && fromCamera(picker)} />
        <SheetOption icon={ImagePlus} label="Choisir dans mes photos" onPress={() => picker && fromLibrary(picker)} />
        <SheetOption icon={FileText} label="Importer un fichier PDF" onPress={() => picker && fromFiles(picker)} />
        <Pressable onPress={() => setPicker(null)} style={s.secondary}>
          <Text style={s.secondaryText}>Annuler</Text>
        </Pressable>
      </BottomSheet>
    </Screen>
  );
}

function SheetOption({ icon: Icon, label, onPress }: { icon: typeof Camera; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.option, pressed && { backgroundColor: colors.primarySoft }]}>
      <View style={styles.optionIcon}>
        <Icon size={19} color={colors.primary} strokeWidth={1.9} />
      </View>
      <Text style={styles.optionText}>{label}</Text>
    </Pressable>
  );
}

function DocCard({ d, onAdd }: { d: DossierDoc; onAdd: () => void }) {
  const st = statusInfo[d.status];
  const t = toneColors[st.tone];
  const canAdd = d.status === 'missing' || d.status === 'refused';
  return (
    <Animated.View layout={layout} style={[styles.card, d.status === 'refused' && { borderColor: '#F6CFCF' }, d.status === 'accepted' && { borderColor: '#CDEBDD' }]}>
      <View style={styles.cardHead}>
        <Thumb d={d} />
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={styles.docName}>{d.name}</Text>
          <Animated.View key={d.status} entering={FadeIn.duration(220)} style={[styles.badge, { backgroundColor: t.bg }]}>
            <StatusIcon status={d.status} color={t.fg} />
            <Text style={[styles.badgeText, { color: t.fg }]}>{st.label}</Text>
          </Animated.View>
        </View>
      </View>

      {d.status === 'uploading' ? <UploadBar fileName={d.fileName} /> : null}

      {d.status === 'pending' ? (
        <Animated.View entering={FadeIn.duration(250)} exiting={FadeOut.duration(150)} style={[styles.info, { backgroundColor: colors.warningSoft }]}>
          <Text style={[styles.small, { color: colors.warning }]}>
            {d.fileName ? `${d.fileName} · ` : ''}vérification par l’équipe, réponse sous 48 h.
          </Text>
        </Animated.View>
      ) : null}

      {d.status === 'refused' && d.note ? (
        <View style={[styles.info, { backgroundColor: colors.dangerSoft }]}>
          <Text style={[styles.small, { color: colors.danger }]}>Motif : {d.note}</Text>
        </View>
      ) : null}

      {canAdd ? (
        <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(120)} style={{ flexDirection: 'row', gap: 10 }}>
          <Pressable onPress={onAdd} style={({ pressed }) => [styles.btn, styles.btnGhost, pressed && { backgroundColor: colors.primarySoft }]}>
            <Camera size={16} color={colors.primary} />
            <Text style={[styles.btnText, { color: colors.primary }]}>Photo</Text>
          </Pressable>
          <Pressable onPress={onAdd} style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }]}>
            {d.status === 'refused' ? <RefreshCw size={16} color="#fff" /> : <Upload size={16} color="#fff" />}
            <Text style={styles.btnText}>{d.status === 'refused' ? 'Remplacer' : 'Importer'}</Text>
          </Pressable>
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

function Thumb({ d }: { d: DossierDoc }) {
  const t = toneColors[statusInfo[d.status].tone];
  if (d.uri) {
    return (
      <View>
        <Image source={{ uri: d.uri }} style={styles.thumb} contentFit="cover" transition={200} />
        {d.status === 'accepted' ? (
          <Animated.View entering={ZoomIn.springify().damping(12)} style={styles.thumbCheck}>
            <Check size={12} color="#fff" strokeWidth={3} />
          </Animated.View>
        ) : null}
      </View>
    );
  }
  return (
    <View style={[styles.thumb, { backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center' }]}>
      {d.status === 'accepted' ? (
        <Animated.View entering={ZoomIn.springify().damping(12)}>
          <CircleCheck size={22} color={t.fg} strokeWidth={1.9} />
        </Animated.View>
      ) : (
        <FileText size={22} color={t.fg} strokeWidth={1.8} />
      )}
    </View>
  );
}

function StatusIcon({ status, color }: { status: DossierDoc['status']; color: string }) {
  const r = useSharedValue(0);
  useEffect(() => {
    if (status === 'pending') r.value = withRepeat(withSequence(withTiming(180, { duration: 900 }), withTiming(180, { duration: 400 }), withTiming(360, { duration: 900 }), withTiming(360, { duration: 400 })), -1);
    else {
      cancelAnimation(r);
      r.value = 0;
    }
  }, [status, r]);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${r.value}deg` }] }));
  const Icon = status === 'accepted' ? Check : status === 'pending' ? Hourglass : status === 'refused' ? CircleX : status === 'uploading' ? Upload : X;
  return (
    <Animated.View style={style}>
      <Icon size={12} color={color} strokeWidth={2.4} />
    </Animated.View>
  );
}

function UploadBar({ fileName }: { fileName?: string }) {
  const p = useSharedValue(0);
  const [pct, setPct] = useState(0);
  useEffect(() => {
    p.value = withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.cubic) });
    const id = setInterval(() => setPct((v) => Math.min(100, v + 7)), 100);
    return () => clearInterval(id);
  }, [p]);
  const style = useAnimatedStyle(() => ({ transform: [{ scaleX: p.value }] }));
  return (
    <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)} style={{ gap: 8 }}>
      <View style={styles.rowBetween}>
        <Text style={styles.small} numberOfLines={1}>
          {fileName ?? 'Fichier'}
        </Text>
        <Text style={[styles.small, { color: colors.primary, fontWeight: '700' }]}>{pct} %</Text>
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, { transformOrigin: 'left' }, style]} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 30, fontWeight: '800', color: colors.ink, letterSpacing: -0.8 },
  subtitle: { fontSize: 15, lineHeight: 22, color: colors.muted },
  small: { fontSize: 12.5, color: colors.muted, flexShrink: 1 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },

  summary: { gap: 12, padding: 16, borderRadius: 20, backgroundColor: colors.card, ...shadow.card },
  summaryTitle: { fontSize: 16, fontWeight: '700', color: colors.ink },
  summaryPct: { fontSize: 14, fontWeight: '700', color: colors.success },
  segments: { flexDirection: 'row', gap: 4 },
  segment: { flex: 1, height: 6, borderRadius: 3 },

  card: { gap: 14, padding: 16, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: 'transparent', ...shadow.card },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  thumb: { width: 52, height: 52, borderRadius: 14 },
  thumbCheck: { position: 'absolute', right: -4, bottom: -4, width: 20, height: 20, borderRadius: 10, backgroundColor: colors.success, borderWidth: 2, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  docName: { fontSize: 15.5, fontWeight: '700', color: colors.ink },
  badge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 5, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  info: { padding: 12, borderRadius: 12 },
  btn: { flex: 1, height: 44, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.primary },
  btnGhost: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  btnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  track: { height: 6, borderRadius: 3, backgroundColor: '#E9EDF5', overflow: 'hidden' },
  fill: { height: '100%', width: '100%', backgroundColor: colors.primary },

  option: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 16, backgroundColor: colors.card, ...shadow.card },
  optionIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  optionText: { fontSize: 15, fontWeight: '600', color: colors.ink },
});
