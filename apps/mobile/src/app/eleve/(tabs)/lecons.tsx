import { router } from 'expo-router';
import { CalendarClock, CalendarPlus, Check, Clock, Hourglass, MapPin, Send, X, type LucideIcon } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeInDown, LinearTransition } from 'react-native-reanimated';

import { PressableScale } from '@/components/blocks';
import { CtaButton, Screen, TopBar } from '@/components/ui';
import { useRemainingHours } from '@/data/billing';
import { cancelRequest, isTaken, requestLesson, useLessonRequests, type LessonRequest } from '@/data/lesson-requests';
import { student, upcomingLessons } from '@/data/mock';
import { colors, shadow } from '@/theme';

/* ---------- Réglages des demandes ---------- */

const PLACES = ['Agence Jean Macé', 'Lycée Récamier', 'Place Bellecour', 'Gare Part-Dieu'];
const MORNING = [8, 9, 10, 11];
const AFTERNOON = [14, 15, 16, 17, 18];
const LAST_END = { morning: 12, afternoon: 19 };

const DAY_SHORT = ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM'];
const ease = Easing.out(Easing.cubic);
const pad = (h: number) => `${String(h).padStart(2, '0')}:00`;
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const longDay = (d: Date) => {
  const today = startOfDay(new Date()).getTime();
  const diff = Math.round((startOfDay(d).getTime() - today) / 86_400_000);
  const label = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  if (diff === 0) return `Aujourd’hui · ${label}`;
  if (diff === 1) return `Demain · ${label}`;
  return label.charAt(0).toUpperCase() + label.slice(1);
};

/** Les 14 prochains jours ouvrés (pas le dimanche), à partir de demain */
const DAYS = Array.from({ length: 16 }, (_, i) => {
  const d = startOfDay(new Date());
  d.setDate(d.getDate() + i + 1);
  return d;
}).filter((d) => d.getDay() !== 0);

type Item = { key: string; at: number; end: number; title: string; place: string; status: 'confirmed' | LessonRequest['status']; request?: LessonRequest };

/** Mes leçons : planning des leçons confirmées et des demandes, et formulaire de demande */
export default function EleveLecons() {
  const [tab, setTab] = useState<'planning' | 'demande'>('planning');
  const requests = useLessonRequests();
  const mine = requests.filter((r) => r.mine);
  const pending = mine.filter((r) => r.status === 'pending').length;

  return (
    <Screen withTabBar>
      <TopBar title="Mes leçons" onBack={() => router.navigate('/eleve')} />

      <View style={styles.tabs}>
        <Tab label="Mon planning" active={tab === 'planning'} onPress={() => setTab('planning')} />
        <Tab label="Demander un cours" active={tab === 'demande'} onPress={() => setTab('demande')} badge={pending || undefined} />
      </View>

      {tab === 'planning' ? <Planning requests={mine} onAsk={() => setTab('demande')} /> : <RequestForm requests={requests} onDone={() => setTab('planning')} />}
    </Screen>
  );
}

/* ---------- Planning ---------- */

function Planning({ requests, onAsk }: { requests: LessonRequest[]; onAsk: () => void }) {
  const remaining = useRemainingHours();
  const items: Item[] = useMemo(() => {
    const lessons: Item[] = upcomingLessons
      .filter((l) => l.at)
      .map((l) => ({ key: l.id, at: l.at!, end: l.at! + 3600_000, title: `Conduite avec ${l.instructor.split(' ')[0]}`, place: l.place, status: 'confirmed' as const }));
    const asked: Item[] = requests.map((r) => ({
      key: r.id,
      at: r.at,
      end: r.at + r.hours * 3600_000,
      title: `Conduite avec ${r.instructor.split(' ')[0]}`,
      place: r.place,
      status: r.status === 'accepted' ? 'confirmed' : r.status,
      request: r,
    }));
    return [...lessons, ...asked].sort((a, b) => a.at - b.at);
  }, [requests]);

  const groups = useMemo(() => {
    const map = new Map<number, Item[]>();
    items.forEach((it) => {
      const k = startOfDay(new Date(it.at)).getTime();
      map.set(k, [...(map.get(k) ?? []), it]);
    });
    return [...map.entries()];
  }, [items]);

  const confirmed = items.filter((i) => i.status === 'confirmed').length;
  const waiting = items.filter((i) => i.status === 'pending').length;

  return (
    <>
      <Animated.View entering={FadeInDown.duration(320).easing(ease)} style={styles.summary}>
        <Summary value={`${confirmed}`} label="Confirmées" color={colors.success} />
        <View style={styles.summarySep} />
        <Summary value={`${waiting}`} label="En attente" color={colors.warning} />
        <View style={styles.summarySep} />
        <Summary value={`${remaining} h`} label="À réserver" color={colors.primary} />
      </Animated.View>

      <View style={styles.legend}>
        <Legend color={colors.success} label="Confirmée" />
        <Legend color={colors.warning} label="En attente de l’auto-école" />
        <Legend color={colors.danger} label="Refusée" />
      </View>

      {groups.length === 0 ? (
        <View style={styles.empty}>
          <CalendarClock size={28} color={colors.faint} />
          <Text style={styles.emptyText}>Aucune leçon prévue pour l’instant.</Text>
        </View>
      ) : (
        groups.map(([day, list], gi) => (
          <Animated.View key={day} entering={FadeInDown.delay(60 + gi * 50).duration(320).easing(ease)} layout={LinearTransition.duration(220)} style={{ gap: 8 }}>
            <Text style={styles.dayTitle}>{longDay(new Date(day))}</Text>
            {list.map((it) => (
              <LessonCard key={it.key} item={it} onRetry={onAsk} />
            ))}
          </Animated.View>
        ))
      )}

      <CtaButton label="Demander un cours" icon={CalendarPlus} onPress={onAsk} />
    </>
  );
}

const STATUS = {
  confirmed: { label: 'Confirmée', color: colors.success, bg: colors.successSoft, icon: Check },
  pending: { label: 'En attente', color: colors.warning, bg: colors.warningSoft, icon: Hourglass },
  accepted: { label: 'Confirmée', color: colors.success, bg: colors.successSoft, icon: Check },
  refused: { label: 'Refusée', color: colors.danger, bg: colors.dangerSoft, icon: X },
} as const;

function LessonCard({ item, onRetry }: { item: Item; onRetry: () => void }) {
  const st = STATUS[item.status];
  const start = new Date(item.at);
  const end = new Date(item.end);
  const Icon = st.icon;
  return (
    <View style={[styles.card, item.status === 'refused' && { opacity: 0.85 }]}>
      <View style={styles.timeCol}>
        <Text style={styles.time}>{pad(start.getHours())}</Text>
        <Text style={styles.timeEnd}>{pad(end.getHours())}</Text>
      </View>
      <View style={[styles.bar, { backgroundColor: st.color }]} />
      <View style={{ flex: 1, gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={[styles.badge, { backgroundColor: st.bg }]}>
            <Icon size={11} color={st.color} strokeWidth={2.6} />
            <Text style={[styles.badgeText, { color: st.color }]}>{st.label}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <MapPin size={13} color={colors.muted} />
          <Text style={styles.cardMeta}>{item.place}</Text>
        </View>
        {item.status === 'pending' ? (
          <View style={styles.cardActions}>
            <Text style={styles.cardHint}>L’auto-école confirme sous 24 h</Text>
            <Pressable onPress={() => item.request && cancelRequest(item.request.id)} hitSlop={8}>
              <Text style={[styles.action, { color: colors.danger }]}>Annuler</Text>
            </Pressable>
          </View>
        ) : null}
        {item.status === 'refused' ? (
          <View style={styles.cardActions}>
            <Text style={[styles.cardHint, { flex: 1 }]}>{item.request?.reason}</Text>
            <Pressable onPress={onRetry} hitSlop={8}>
              <Text style={styles.action}>Autre créneau</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </View>
  );
}

/* ---------- Demande de cours ---------- */

function RequestForm({ requests, onDone }: { requests: LessonRequest[]; onDone: () => void }) {
  const remaining = useRemainingHours();
  const [day, setDay] = useState(0);
  const [hour, setHour] = useState<number | null>(null);
  const [hours, setHours] = useState(1);
  const [place, setPlace] = useState(PLACES[0]!);
  const [sent, setSent] = useState<LessonRequest | null>(null);

  const date = DAYS[day]!;
  const free = (d: Date, h: number, len = hours) => {
    const block = h < 12 ? LAST_END.morning : LAST_END.afternoon;
    if (h + len > block) return false;
    for (let k = 0; k < len; k++) if (isTaken(d, h + k, requests)) return false;
    return true;
  };
  const freeCount = (d: Date) => [...MORNING, ...AFTERNOON].filter((h) => free(d, h)).length;

  if (sent) {
    return (
      <Animated.View entering={FadeInDown.duration(380).easing(ease)} style={{ gap: 18 }}>
        <View style={styles.done}>
          <View style={styles.doneIcon}>
            <Hourglass size={28} color="#fff" strokeWidth={2.2} />
          </View>
          <Text style={styles.doneTitle}>Demande envoyée</Text>
          <Text style={styles.doneText}>
            {longDay(new Date(sent.at))} de {pad(new Date(sent.at).getHours())} à {pad(new Date(sent.at).getHours() + sent.hours)} avec {sent.instructor}, départ {sent.place}.
          </Text>
          <View style={[styles.badge, { backgroundColor: colors.warningSoft, alignSelf: 'center', paddingHorizontal: 12, paddingVertical: 6 }]}>
            <Hourglass size={12} color={colors.warning} />
            <Text style={[styles.badgeText, { color: colors.warning, fontSize: 12 }]}>En attente de confirmation</Text>
          </View>
          <Text style={[styles.cardHint, { textAlign: 'center' }]}>Vous recevrez une notification dès que l’auto-école l’aura acceptée.</Text>
        </View>
        <CtaButton label="Voir mon planning" icon={CalendarClock} onPress={onDone} />
        <Pressable onPress={() => (setSent(null), setHour(null))} style={styles.secondary}>
          <Text style={styles.secondaryText}>Faire une autre demande</Text>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <>
      <Text style={styles.intro}>
        Choisissez un créneau avec {student.instructor.split(' ')[0]} : votre demande part à l’auto-école, qui la confirme. Il vous reste <Text style={{ fontWeight: '700', color: colors.ink }}>{remaining} h</Text> sur votre forfait.
      </Text>

      {/* 1. Le jour */}
      <Step n={1} title="Le jour" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 8 }} style={{ marginHorizontal: -2 }}>
        {DAYS.map((d, i) => {
          const n = freeCount(d);
          const on = i === day;
          return (
            <PressableScale key={d.getTime()} scale={0.94} disabled={!n} onPress={() => (setDay(i), setHour(null))} style={[styles.day, on && styles.dayOn, !n && { opacity: 0.45 }]}>
              <Text style={[styles.dayName, on && { color: 'rgba(255,255,255,0.8)' }]}>{DAY_SHORT[d.getDay()]}</Text>
              <Text style={[styles.dayNum, on && { color: '#fff' }]}>{d.getDate()}</Text>
              <Text style={[styles.dayFree, on && { color: 'rgba(255,255,255,0.85)' }]}>{n ? `${n} libre${n > 1 ? 's' : ''}` : 'Complet'}</Text>
            </PressableScale>
          );
        })}
      </ScrollView>

      {/* 2. L'heure */}
      <Step n={2} title={`L’heure · ${longDay(date).replace(/^(Aujourd’hui|Demain) · /, '')}`} />
      <Animated.View key={`${day}-${hours}`} entering={FadeIn.duration(200)} style={{ gap: 12 }}>
        <SlotGroup label="Matin" hours={MORNING} date={date} free={free} value={hour} onChange={setHour} len={hours} />
        <SlotGroup label="Après-midi" hours={AFTERNOON} date={date} free={free} value={hour} onChange={setHour} len={hours} />
      </Animated.View>

      {/* 3. Les détails */}
      <Step n={3} title="Les détails" />
      <View style={{ gap: 10 }}>
        <OptionRow icon={Clock} options={['1 h', '2 h']} value={`${hours} h`} onChange={(v) => (setHours(Number(v[0])), setHour((h) => (h !== null && free(date, h, Number(v[0])) ? h : null)))} />
        <OptionRow icon={MapPin} options={PLACES} value={place} onChange={setPlace} wrap />
      </View>

      {hour !== null ? (
        <Animated.View entering={FadeInDown.duration(260).easing(ease)} style={styles.recap}>
          <Text style={styles.recapTitle}>
            {longDay(date)} · {pad(hour)} – {pad(hour + hours)}
          </Text>
          <Text style={styles.cardMeta}>
            Avec {student.instructor} · départ {place}
          </Text>
        </Animated.View>
      ) : null}

      {hour !== null ? (
        <CtaButton label="Envoyer la demande" icon={Send} onPress={() => setSent(requestLesson(new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour).getTime(), hours, place))} />
      ) : (
        <View style={styles.ctaOff}>
          <Text style={styles.ctaOffText}>Choisissez une heure</Text>
        </View>
      )}
      <Text style={[styles.cardHint, { textAlign: 'center' }]}>La leçon n’est réservée qu’après confirmation de l’auto-école.</Text>
    </>
  );
}

/* ---------- Petits morceaux ---------- */

function Tab({ label, active, onPress, badge }: { label: string; active: boolean; onPress: () => void; badge?: number }) {
  return (
    <Pressable onPress={onPress} style={[styles.tab, active && styles.tabOn]}>
      <Text style={[styles.tabText, active && { color: colors.ink }]}>{label}</Text>
      {badge ? (
        <View style={styles.tabBadge}>
          <Text style={styles.tabBadgeText}>{badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

function Summary({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 2 }}>
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

function Step({ n, title }: { n: number; title: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View style={styles.stepNum}>
        <Text style={styles.stepNumText}>{n}</Text>
      </View>
      <Text style={styles.stepTitle}>{title}</Text>
    </View>
  );
}

function SlotGroup({
  label,
  hours,
  date,
  free,
  value,
  onChange,
  len,
}: {
  label: string;
  hours: number[];
  date: Date;
  free: (d: Date, h: number) => boolean;
  value: number | null;
  onChange: (h: number) => void;
  len: number;
}) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.groupLabel}>{label.toUpperCase()}</Text>
      <View style={styles.slots}>
        {hours.map((h) => {
          const ok = free(date, h);
          const on = value === h;
          return (
            <Pressable key={h} disabled={!ok} onPress={() => onChange(h)} style={[styles.slot, on && styles.slotOn, !ok && styles.slotOff]}>
              <Text style={[styles.slotText, on && { color: '#fff' }, !ok && styles.slotOffText]}>{pad(h)}</Text>
              <Text style={[styles.slotSub, on && { color: 'rgba(255,255,255,0.85)' }]}>{ok ? `→ ${pad(h + len)}` : 'Pris'}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function OptionRow({ icon: Icon, options, value, onChange, wrap }: { icon: LucideIcon; options: string[]; value: string; onChange: (v: string) => void; wrap?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', gap: 10, alignItems: wrap ? 'flex-start' : 'center' }}>
      <View style={styles.optIcon}>
        <Icon size={17} color={colors.primary} />
      </View>
      <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {options.map((o) => {
          const on = o === value;
          return (
            <Pressable key={o} onPress={() => onChange(o)} style={[styles.opt, on && styles.optOn]}>
              <Text style={[styles.optText, on && { color: colors.primary }]}>{o}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', padding: 4, borderRadius: 14, backgroundColor: '#E8ECF4' },
  tab: { flex: 1, height: 40, borderRadius: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  tabOn: { backgroundColor: colors.card, ...shadow.card },
  tabText: { fontSize: 13.5, fontWeight: '700', color: colors.muted },
  tabBadge: { minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 5, backgroundColor: colors.warning, alignItems: 'center', justifyContent: 'center' },
  tabBadgeText: { fontSize: 10.5, fontWeight: '800', color: '#fff' },

  summary: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderRadius: 18, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, ...shadow.card },
  summarySep: { width: 1, height: 30, backgroundColor: colors.border },
  summaryValue: { fontSize: 21, fontWeight: '800', letterSpacing: -0.5 },
  summaryLabel: { fontSize: 11.5, color: colors.muted },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 2 },
  legendText: { fontSize: 11.5, color: colors.muted },

  dayTitle: { fontSize: 13, fontWeight: '700', color: colors.muted, paddingHorizontal: 2, marginTop: 4 },
  card: { flexDirection: 'row', gap: 12, padding: 14, borderRadius: 18, backgroundColor: colors.card, ...shadow.card },
  timeCol: { width: 44, alignItems: 'flex-start', gap: 2 },
  time: { fontSize: 15, fontWeight: '800', color: colors.ink },
  timeEnd: { fontSize: 12, color: colors.faint },
  bar: { width: 3, borderRadius: 2 },
  cardTitle: { flex: 1, fontSize: 14.5, fontWeight: '700', color: colors.ink },
  cardMeta: { fontSize: 12.5, color: colors.muted },
  cardHint: { fontSize: 11.5, color: colors.muted, lineHeight: 16 },
  cardActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 4 },
  action: { fontSize: 12.5, fontWeight: '700', color: colors.primary },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  badgeText: { fontSize: 10.5, fontWeight: '700' },
  empty: { alignItems: 'center', gap: 8, paddingVertical: 28 },
  emptyText: { fontSize: 13.5, color: colors.muted },

  intro: { fontSize: 14, lineHeight: 21, color: colors.muted },
  stepNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { fontSize: 12, fontWeight: '800', color: '#fff' },
  stepTitle: { flex: 1, fontSize: 16, fontWeight: '800', color: colors.ink, letterSpacing: -0.2 },

  day: { width: 62, height: 80, borderRadius: 14, alignItems: 'center', justifyContent: 'center', gap: 2, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  dayOn: { backgroundColor: colors.primary, borderColor: colors.primary, ...shadow.primary },
  dayName: { fontSize: 10, fontWeight: '700', color: colors.faint, letterSpacing: 0.4 },
  dayNum: { fontSize: 20, fontWeight: '800', color: colors.ink },
  dayFree: { fontSize: 9.5, fontWeight: '600', color: colors.success },

  groupLabel: { fontSize: 11, fontWeight: '700', color: colors.muted, letterSpacing: 0.8 },
  slots: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slot: { width: '31.6%', height: 54, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.input },
  slotOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  slotOff: { backgroundColor: '#EEF1F6', borderColor: '#EEF1F6' },
  slotText: { fontSize: 15, fontWeight: '700', color: colors.ink },
  slotOffText: { color: colors.faint, textDecorationLine: 'line-through', fontWeight: '500' },
  slotSub: { fontSize: 10.5, color: colors.faint },

  optIcon: { width: 36, height: 36, borderRadius: 11, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  opt: { paddingHorizontal: 14, height: 36, borderRadius: 999, justifyContent: 'center', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.input },
  optOn: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  optText: { fontSize: 13, fontWeight: '600', color: colors.ink },

  recap: { gap: 4, padding: 14, borderRadius: 16, backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: '#DCE3FC' },
  recapTitle: { fontSize: 14.5, fontWeight: '700', color: colors.ink },
  ctaOff: { height: 54, borderRadius: 14, backgroundColor: '#E3E8F1', alignItems: 'center', justifyContent: 'center' },
  ctaOffText: { fontSize: 15, fontWeight: '700', color: colors.faint },

  done: { alignItems: 'center', gap: 10, paddingVertical: 18 },
  doneIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.warning, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  doneTitle: { fontSize: 26, fontWeight: '800', color: colors.ink, letterSpacing: -0.6 },
  doneText: { fontSize: 14.5, lineHeight: 21, color: colors.muted, textAlign: 'center' },
  secondary: { height: 48, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { fontSize: 15, fontWeight: '700', color: colors.primary },
});
