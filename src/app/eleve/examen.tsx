import { router } from 'expo-router';
import {
  BellRing,
  BookOpen,
  CalendarPlus,
  Car,
  Check,
  Clock,
  FileText,
  Glasses,
  IdCard,
  Lock,
  MapPin,
  Navigation,
  QrCode,
  Smartphone,
  Trophy,
  type LucideIcon,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';

import { BottomSheet, Segmented, settingsStyles as s } from '@/components/settings';
import { Screen, TopBar } from '@/components/ui';
import { student } from '@/data/mock';
import { colors, shadow } from '@/theme';

const ease = Easing.out(Easing.cubic);

/** Données fictives : viendront de l'inscription ANTS / opérateur d'examen */
const codeExam = {
  date: new Date(2026, 10, 12, 10, 30),
  label: 'Jeudi 12 novembre 2026',
  time: '10:30',
  reminder: 'mardi 10 nov. à 10:30',
  centre: 'La Poste · Lyon 7',
  address: '8 rue de Marseille, 69007 Lyon',
  convocation: 'CNV-26-5841-0912',
  neph: '260769400148',
};

const checklist: { icon: LucideIcon; label: string; detail: string }[] = [
  { icon: IdCard, label: 'Pièce d’identité valide', detail: 'Carte d’identité, passeport ou titre de séjour' },
  { icon: Smartphone, label: 'Convocation', detail: 'Sur votre téléphone ou imprimée' },
  { icon: Glasses, label: 'Lunettes ou lentilles', detail: 'Si elles sont mentionnées sur votre dossier' },
  { icon: Clock, label: 'Arriver 30 min avant', detail: 'Retard = examen perdu et à repayer' },
];

const mockResults = [
  { label: 'Examen blanc n°4', date: '24 oct.', score: 36 },
  { label: 'Examen blanc n°3', date: '18 oct.', score: 33 },
  { label: 'Examen blanc n°2', date: '9 oct.', score: 31 },
];

const drivingPrereqs = [
  { label: 'Code obtenu', done: false },
  { label: '20 h de conduite minimum', done: false, detail: `${student.driving.done} h / 20 h` },
  { label: 'Compétences C1 à C4 validées', done: false, detail: 'Avec votre moniteur' },
  { label: 'Dossier ANTS complet', done: true },
];

/** Mon examen : code et conduite, compte à rebours, convocation, rappel */
export default function EleveExamen() {
  const [tab, setTab] = useState<'code' | 'conduite'>('code');
  const [reminder, setReminder] = useState(false);
  const [checked, setChecked] = useState<string[]>([]);
  const [convocation, setConvocation] = useState(false);
  const bell = useSharedValue(0);

  const toggleReminder = () => {
    const on = !reminder;
    setReminder(on);
    if (on) {
      bell.value = withSequence(
        withTiming(-18, { duration: 80 }),
        withTiming(16, { duration: 100 }),
        withTiming(-12, { duration: 100 }),
        withTiming(8, { duration: 100 }),
        withTiming(0, { duration: 100 }),
      );
    }
  };
  const bellStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${bell.value}deg` }] }));

  const openMaps = () => {
    const q = encodeURIComponent(codeExam.address);
    Linking.openURL(Platform.OS === 'ios' ? `maps://?q=${q}` : `geo:0,0?q=${q}`).catch(() => Linking.openURL(`https://maps.google.com/?q=${q}`));
  };

  return (
    <Screen>
      <TopBar title="Mon examen" />
      <Animated.View entering={FadeInDown.duration(360).easing(ease)} style={{ gap: 8 }}>
        <Text style={styles.title}>Le grand jour approche.</Text>
        <Text style={styles.subtitle}>Tout ce qu’il faut savoir pour vos examens du permis.</Text>
      </Animated.View>

      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { key: 'code', label: 'Code' },
          { key: 'conduite', label: 'Conduite' },
        ]}
      />

      {tab === 'code' ? (
        <Animated.View key="code" entering={FadeIn.duration(250)} exiting={FadeOut.duration(120)} style={{ gap: 22 }}>
          {/* Compte à rebours */}
          <View style={styles.hero}>
            <View style={styles.heroHead}>
              <View style={styles.heroIcon}>
                <BookOpen size={18} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroKicker}>EXAMEN DU CODE</Text>
                <Text style={styles.heroDate}>
                  {codeExam.label} · {codeExam.time}
                </Text>
              </View>
              <View style={styles.heroPill}>
                <Text style={styles.heroPillText}>Inscrit</Text>
              </View>
            </View>
            <Countdown target={codeExam.date} />
          </View>

          {/* Rappel 2 jours avant */}
          <Pressable onPress={toggleReminder} style={({ pressed }) => [styles.reminder, reminder && styles.reminderOn, pressed && { transform: [{ scale: 0.99 }] }]}>
            <Animated.View style={[styles.reminderIcon, reminder && { backgroundColor: '#fff' }, bellStyle]}>
              <BellRing size={20} color={colors.primary} strokeWidth={1.9} />
            </Animated.View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[styles.reminderTitle, reminder && { color: '#fff' }]}>{reminder ? 'Rappel activé' : 'Me rappeler 2 jours avant'}</Text>
              <Animated.Text key={String(reminder)} entering={FadeIn.duration(200)} style={[styles.small, reminder && { color: 'rgba(255,255,255,0.8)' }]}>
                {reminder ? `Notification le ${codeExam.reminder}` : 'Une notification avec la check-list et l’adresse'}
              </Animated.Text>
            </View>
            <View style={[styles.check, reminder && styles.checkOn]}>
              {reminder ? (
                <Animated.View entering={ZoomIn.duration(180)}>
                  <Check size={14} color={colors.primary} strokeWidth={3} />
                </Animated.View>
              ) : null}
            </View>
          </Pressable>

          {/* Lieu et convocation */}
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={[styles.icon, { backgroundColor: colors.primarySoft }]}>
                <MapPin size={18} color={colors.primary} strokeWidth={1.9} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.cardTitle}>{codeExam.centre}</Text>
                <Text style={styles.small}>{codeExam.address}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <SmallAction icon={Navigation} label="Itinéraire" onPress={openMaps} />
              <SmallAction icon={CalendarPlus} label="Calendrier" onPress={() => {}} />
            </View>
            <View style={styles.divider} />
            <Pressable onPress={() => setConvocation(true)} style={styles.row}>
              <View style={[styles.icon, { backgroundColor: colors.violetSoft }]}>
                <QrCode size={18} color={colors.violet} strokeWidth={1.9} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.cardTitle}>Ma convocation</Text>
                <Text style={styles.small}>N° {codeExam.convocation}</Text>
              </View>
              <Text style={styles.link}>Afficher</Text>
            </Pressable>
          </View>

          {/* À apporter */}
          <View style={{ gap: 10 }}>
            <View style={styles.rowBetween}>
              <Text style={styles.h2}>À apporter</Text>
              <Text style={styles.small}>
                {checked.length}/{checklist.length} prêts
              </Text>
            </View>
            <View style={[styles.card, { gap: 0, padding: 0, overflow: 'hidden' }]}>
              {checklist.map((c, i) => {
                const on = checked.includes(c.label);
                const Icon = c.icon;
                return (
                  <Pressable
                    key={c.label}
                    onPress={() => setChecked((l) => (on ? l.filter((x) => x !== c.label) : [...l, c.label]))}
                    style={[styles.item, i > 0 && styles.itemSep]}>
                    <Icon size={18} color={on ? colors.success : colors.muted} strokeWidth={1.9} />
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={[styles.itemTitle, on && { color: colors.faint, textDecorationLine: 'line-through' }]}>{c.label}</Text>
                      <Text style={styles.small}>{c.detail}</Text>
                    </View>
                    <View style={[styles.box, on && styles.boxOn]}>
                      {on ? (
                        <Animated.View entering={ZoomIn.duration(160)}>
                          <Check size={13} color="#fff" strokeWidth={3} />
                        </Animated.View>
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Préparation et résultat */}
          <View style={{ gap: 10 }}>
            <Text style={styles.h2}>Vos examens blancs</Text>
            <View style={styles.card}>
              {mockResults.map((r) => (
                <View key={r.label} style={styles.rowBetween}>
                  <View style={{ gap: 2 }}>
                    <Text style={styles.itemTitle}>{r.label}</Text>
                    <Text style={styles.small}>{r.date}</Text>
                  </View>
                  <View style={[styles.score, { backgroundColor: r.score >= 35 ? colors.successSoft : colors.warningSoft }]}>
                    <Text style={[styles.scoreText, { color: r.score >= 35 ? colors.success : colors.warning }]}>{r.score}/40</Text>
                  </View>
                </View>
              ))}
              <Text style={styles.small}>Il faut au moins 35 bonnes réponses sur 40 le jour de l’examen.</Text>
            </View>
          </View>

          <View style={styles.result}>
            <Trophy size={20} color={colors.warning} strokeWidth={1.9} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.cardTitle}>Résultat</Text>
              <Text style={styles.small}>Disponible ici et par e-mail sous 48 h après l’épreuve. On vous envoie une notification.</Text>
            </View>
          </View>
        </Animated.View>
      ) : (
        <Animated.View key="conduite" entering={FadeIn.duration(250)} exiting={FadeOut.duration(120)} style={{ gap: 22 }}>
          <View style={[styles.hero, { backgroundColor: colors.ink }]}>
            <View style={styles.heroHead}>
              <View style={[styles.heroIcon, { backgroundColor: 'rgba(255,255,255,0.14)' }]}>
                <Car size={18} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroKicker}>EXAMEN DE CONDUITE</Text>
                <Text style={styles.heroDate}>Date estimée : février 2027</Text>
              </View>
              <Lock size={18} color="rgba(255,255,255,0.6)" />
            </View>
            <Text style={styles.heroText}>
              L’auto-école demandera une place à la préfecture quand les conditions ci-dessous seront remplies.
            </Text>
          </View>

          <View style={{ gap: 10 }}>
            <Text style={styles.h2}>Avant de pouvoir passer</Text>
            <View style={[styles.card, { gap: 0, padding: 0, overflow: 'hidden' }]}>
              {drivingPrereqs.map((p, i) => (
                <View key={p.label} style={[styles.item, i > 0 && styles.itemSep]}>
                  <View style={[styles.box, { borderRadius: 11 }, p.done && styles.boxOn]}>{p.done ? <Check size={13} color="#fff" strokeWidth={3} /> : null}</View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.itemTitle}>{p.label}</Text>
                    {p.detail ? <Text style={styles.small}>{p.detail}</Text> : null}
                  </View>
                  <Text style={[styles.small, { color: p.done ? colors.success : colors.faint, fontWeight: '600' }]}>{p.done ? 'Fait' : 'À venir'}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Comment ça se passe ?</Text>
            {[
              ['32 min', 'de conduite avec un inspecteur, dont une partie en autonomie'],
              ['20 pts', 'minimum sur 31 pour réussir, sans erreur éliminatoire'],
              ['48 h', 'pour recevoir le résultat en ligne'],
            ].map(([k, v]) => (
              <View key={k} style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                <Text style={styles.key}>{k}</Text>
                <Text style={[styles.small, { flex: 1, fontSize: 13.5 }]}>{v}</Text>
              </View>
            ))}
          </View>

          <Pressable onPress={() => router.push('/eleve/messages')} style={styles.secondaryBtn}>
            <Text style={styles.secondaryText}>Une question ? Écrire à l’auto-école</Text>
          </Pressable>
        </Animated.View>
      )}

      <BottomSheet open={convocation} onClose={() => setConvocation(false)}>
        <Text style={s.sheetTitle}>Convocation</Text>
        <View style={styles.convoc}>
          <FakeQr />
          <View style={{ gap: 8, alignSelf: 'stretch' }}>
            <ConvLine label="Candidat" value={`${student.firstName} ${student.lastName}`} />
            <ConvLine label="NEPH" value={codeExam.neph} />
            <ConvLine label="Épreuve" value="Code de la route (ETG)" />
            <ConvLine label="Date" value={`${codeExam.label}, ${codeExam.time}`} />
            <ConvLine label="Centre" value={codeExam.centre} />
            <ConvLine label="N°" value={codeExam.convocation} />
          </View>
        </View>
        <Pressable style={s.secondary}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <FileText size={17} color={colors.ink} />
            <Text style={s.secondaryText}>Télécharger le PDF</Text>
          </View>
        </Pressable>
      </BottomSheet>
    </Screen>
  );
}

/** Compte à rebours en direct (jours, heures, minutes, secondes) */
function Countdown({ target }: { target: Date }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, target.getTime() - now);
  const parts = [
    { v: Math.floor(diff / 86400000), l: 'jours' },
    { v: Math.floor(diff / 3600000) % 24, l: 'heures' },
    { v: Math.floor(diff / 60000) % 60, l: 'min' },
    { v: Math.floor(diff / 1000) % 60, l: 'sec' },
  ];
  return (
    <View style={styles.countdown}>
      {parts.map((p) => (
        <View key={p.l} style={styles.countBox}>
          <Animated.Text key={p.v} entering={FadeInDown.duration(220)} style={styles.countValue}>
            {String(p.v).padStart(2, '0')}
          </Animated.Text>
          <Text style={styles.countLabel}>{p.l}</Text>
        </View>
      ))}
    </View>
  );
}

function SmallAction({ icon: Icon, label, onPress }: { icon: LucideIcon; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.smallAction, pressed && { backgroundColor: colors.primarySoft }]}>
      <Icon size={16} color={colors.primary} />
      <Text style={styles.smallActionText}>{label}</Text>
    </Pressable>
  );
}

function ConvLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.rowBetween}>
      <Text style={styles.small}>{label}</Text>
      <Text style={[styles.itemTitle, { fontSize: 13.5 }]}>{value}</Text>
    </View>
  );
}

/** QR code factice (motif stable) pour la maquette */
function FakeQr() {
  const n = 21;
  const cells = Array.from({ length: n * n }, (_, i) => {
    const x = i % n;
    const y = Math.floor(i / n);
    const finder = (a: number, b: number) => x >= a && x < a + 7 && y >= b && y < b + 7 && (x === a || x === a + 6 || y === b || y === b + 6 || (x >= a + 2 && x <= a + 4 && y >= b + 2 && y <= b + 4));
    if (finder(0, 0) || finder(n - 7, 0) || finder(0, n - 7)) return true;
    if ((x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9)) return false;
    return ((x * 7 + y * 13 + x * y) % 5) < 2;
  });
  return (
    <Animated.View layout={LinearTransition} style={styles.qr}>
      {cells.map((on, i) => (
        <View key={i} style={{ width: 7, height: 7, backgroundColor: on ? colors.ink : 'transparent' }} />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 30, fontWeight: '800', color: colors.ink, letterSpacing: -0.8 },
  subtitle: { fontSize: 15, lineHeight: 22, color: colors.muted },
  h2: { fontSize: 18, fontWeight: '800', color: colors.ink, letterSpacing: -0.3 },
  small: { fontSize: 12.5, color: colors.muted },
  link: { fontSize: 13, fontWeight: '700', color: colors.primary },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  icon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  card: { gap: 14, padding: 16, borderRadius: 20, backgroundColor: colors.card, ...shadow.card },
  cardTitle: { fontSize: 15.5, fontWeight: '700', color: colors.ink },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },

  hero: { gap: 18, padding: 18, borderRadius: 22, backgroundColor: colors.primary, ...shadow.primary },
  heroHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  heroKicker: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.7)', letterSpacing: 0.8 },
  heroDate: { fontSize: 15.5, fontWeight: '700', color: '#fff', marginTop: 2 },
  heroPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: '#fff' },
  heroPillText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  heroText: { fontSize: 14, lineHeight: 20, color: 'rgba(255,255,255,0.8)' },
  countdown: { flexDirection: 'row', gap: 8 },
  countBox: { flex: 1, paddingVertical: 12, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', overflow: 'hidden' },
  countValue: { fontSize: 26, fontWeight: '800', color: '#fff', fontVariant: ['tabular-nums'] },
  countLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },

  reminder: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.primarySoft, ...shadow.card },
  reminderOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  reminderIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  reminderTitle: { fontSize: 15.5, fontWeight: '700', color: colors.ink },
  check: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.input, alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: '#fff', borderColor: '#fff' },

  smallAction: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 42, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  smallActionText: { fontSize: 13.5, fontWeight: '700', color: colors.primary },

  item: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 14 },
  itemSep: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  itemTitle: { fontSize: 14.5, fontWeight: '600', color: colors.ink },
  box: { width: 22, height: 22, borderRadius: 7, borderWidth: 1.5, borderColor: colors.input, alignItems: 'center', justifyContent: 'center' },
  boxOn: { backgroundColor: colors.success, borderColor: colors.success },

  score: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  scoreText: { fontSize: 13, fontWeight: '800' },
  result: { flexDirection: 'row', gap: 14, padding: 16, borderRadius: 20, backgroundColor: colors.warningSoft },
  key: { width: 62, fontSize: 16, fontWeight: '800', color: colors.primary },
  secondaryBtn: { height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  secondaryText: { fontSize: 14.5, fontWeight: '700', color: colors.primary },

  convoc: { alignItems: 'center', gap: 18, padding: 18, borderRadius: 20, backgroundColor: colors.card, ...shadow.card },
  qr: { width: 147, height: 147, flexDirection: 'row', flexWrap: 'wrap' },
});
