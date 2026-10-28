import { CalendarClock, Check, CircleCheck, Download, Receipt, Repeat, Wallet, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeInDown, LinearTransition } from 'react-native-reanimated';

import { CheckoutSheet } from '@/components/checkout';
import { HoursOffer } from '@/components/hours-offer';
import { BottomSheet, PageTitle, Segmented, Switch, settingsStyles } from '@/components/settings';
import { Screen, TopBar } from '@/components/ui';
import { euro, nextInstallment, payAll, payNext, remainingDue, reschedule, useBilling, useRemainingHours } from '@/data/billing';
import { student } from '@/data/mock';
import { colors, shadow } from '@/theme';

const ease = Easing.out(Easing.cubic);
const enter = (i: number) => FadeInDown.delay(i * 50).duration(360).easing(ease);

type Mode = 'next' | 'all';

/** Paiement de la formation : échéance ou solde au choix, échéancier, factures et rachat d'heures */
export default function ElevePaiements() {
  const billing = useBilling();
  const hours = useRemainingHours();
  const [mode, setMode] = useState<Mode>('next');
  const [checkout, setCheckout] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [autoDebit, setAutoDebit] = useState(true);

  const next = nextInstallment(billing);
  const due = remainingDue(billing);
  const paid = billing.total - due;
  const unpaid = billing.schedule.filter((e) => !e.paid);
  const amount = mode === 'next' && next ? next.amount : due;

  return (
    <Screen>
      <TopBar title="Paiements" />
      <PageTitle title="Mes paiements." text={`${student.formula} · ${student.licence} · ${hours} h de conduite disponibles`} />

      {/* Avancement du règlement */}
      <Animated.View entering={enter(1)} style={styles.hero}>
        <Text style={styles.heroEyebrow}>DÉJÀ RÉGLÉ</Text>
        <Text style={styles.heroAmount}>
          {euro(paid)} <Text style={styles.heroTotal}>sur {euro(billing.total)}</Text>
        </Text>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {billing.schedule.map((e) => (
            <Animated.View key={e.id} layout={LinearTransition.duration(260)} style={[styles.segment, { flex: e.amount }, e.paid && { backgroundColor: '#fff' }]} />
          ))}
        </View>
        <Text style={styles.heroSub}>{due ? `Reste ${euro(due)} · ${unpaid.length} échéance${unpaid.length > 1 ? 's' : ''} à venir` : 'Votre formation est entièrement réglée.'}</Text>
      </Animated.View>

      {due ? (
        <Animated.View entering={enter(2)} style={{ gap: 12 }}>
          <Text style={styles.sectionTitle}>Comment souhaitez-vous régler ?</Text>
          {next ? (
            <Option
              icon={CalendarClock}
              on={mode === 'next'}
              onPress={() => setMode('next')}
              title="Régler la prochaine échéance"
              text={`${next.label} prévue le ${next.date}`}
              amount={next.amount}
            />
          ) : null}
          {unpaid.length > 1 ? (
            <Option icon={Wallet} on={mode === 'all'} onPress={() => setMode('all')} title="Tout régler maintenant" text="Soldez votre formation en une fois, sans frais" amount={due} />
          ) : null}
          <Pressable onPress={() => setCheckout(true)} style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] }]}>
            <Text style={styles.ctaText}>Payer {euro(unpaid.length > 1 ? amount : due)}</Text>
          </Pressable>
        </Animated.View>
      ) : (
        <Animated.View entering={ZoomInCard} style={styles.done}>
          <CircleCheck size={22} color={colors.success} />
          <Text style={styles.doneText}>Merci ! Il n’y a plus rien à régler pour votre forfait.</Text>
        </Animated.View>
      )}

      {/* Échéancier */}
      <Animated.View entering={enter(3)} style={{ gap: 12 }}>
        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>Mon échéancier</Text>
          {unpaid.length > 1 ? (
            <Pressable onPress={() => setPlanOpen(true)}>
              <Text style={styles.link}>Modifier</Text>
            </Pressable>
          ) : null}
        </View>
        <View style={styles.card}>
          {billing.schedule.map((e, i) => {
            const isNext = e.id === next?.id;
            return (
              <Animated.View key={e.id} layout={LinearTransition.duration(260)} entering={FadeIn.duration(250)} style={styles.step}>
                <View style={{ alignItems: 'center' }}>
                  <View style={[styles.dot, e.paid && styles.dotPaid, isNext && styles.dotNext]}>{e.paid ? <Check size={12} color="#fff" strokeWidth={3} /> : null}</View>
                  {i < billing.schedule.length - 1 ? <View style={[styles.line, e.paid && { backgroundColor: colors.success }]} /> : null}
                </View>
                <View style={{ flex: 1, gap: 2, paddingBottom: i < billing.schedule.length - 1 ? 18 : 0 }}>
                  <Text style={styles.stepTitle}>{e.label}</Text>
                  <Text style={styles.small}>{e.paid ? `Payée le ${e.date}` : isNext ? `Prélevée le ${e.date}` : e.date}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Text style={styles.stepAmount}>{euro(e.amount)}</Text>
                  {e.paid ? (
                    <Text style={[styles.status, { color: colors.success }]}>Payée</Text>
                  ) : isNext ? (
                    <Text style={[styles.status, { color: colors.primary }]}>Prochaine</Text>
                  ) : (
                    <Text style={styles.status}>À venir</Text>
                  )}
                </View>
              </Animated.View>
            );
          })}
          {due ? (
            <>
              <View style={styles.divider} />
              <View style={styles.rowBetween}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.stepTitle}>Prélèvement automatique</Text>
                  <Text style={styles.small}>Sur Visa •••• 4242, à chaque échéance</Text>
                </View>
                <Switch value={autoDebit} onChange={setAutoDebit} />
              </View>
            </>
          ) : null}
        </View>
      </Animated.View>

      {/* Rachat d'heures */}
      <Animated.View entering={enter(4)} style={{ gap: 12 }}>
        <Text style={styles.sectionTitle}>Racheter des heures</Text>
        <HoursOffer />
      </Animated.View>

      {/* Factures */}
      <Animated.View entering={enter(5)} style={{ gap: 12 }}>
        <Text style={styles.sectionTitle}>Mes factures</Text>
        <View style={[styles.card, { paddingVertical: 4 }]}>
          {billing.invoices.map((inv, i) => (
            <Animated.View key={inv.id} entering={FadeInDown.duration(300)} layout={LinearTransition.duration(260)}>
              {i > 0 ? <View style={styles.sep} /> : null}
              <View style={styles.invoice}>
                <View style={styles.invoiceIcon}>
                  <Receipt size={18} color={colors.success} strokeWidth={1.9} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.stepTitle}>{inv.label}</Text>
                  <Text style={styles.small}>
                    {inv.id} · {inv.date}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Text style={styles.stepAmount}>{euro(inv.amount)}</Text>
                  <Download size={16} color={colors.primary} />
                </View>
              </View>
            </Animated.View>
          ))}
        </View>
      </Animated.View>

      <CheckoutSheet
        open={checkout}
        onClose={() => setCheckout(false)}
        title={mode === 'all' || unpaid.length === 1 ? 'Solde de la formation' : next?.label ?? ''}
        detail={mode === 'all' && unpaid.length > 1 ? `${unpaid.length} échéances réglées en une fois · ${student.formula}` : `${student.formula} · ${student.licence}`}
        amount={unpaid.length > 1 ? amount : due}
        onPaid={() => (mode === 'all' ? payAll() : payNext())}
      />

      <PlanSheet open={planOpen} onClose={() => setPlanOpen(false)} due={due} current={unpaid.length} />
    </Screen>
  );
}

const ZoomInCard = FadeInDown.duration(320);

function Option({ icon: Icon, on, onPress, title, text, amount }: { icon: LucideIcon; on: boolean; onPress: () => void; title: string; text: string; amount: number }) {
  return (
    <Pressable onPress={onPress} style={[styles.option, on && styles.optionOn]}>
      <View style={[styles.optionIcon, on && { backgroundColor: colors.primary }]}>
        <Icon size={18} color={on ? '#fff' : colors.primary} strokeWidth={1.9} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.small}>{text}</Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 6 }}>
        <Text style={[styles.stepAmount, on && { color: colors.primary }]}>{euro(amount)}</Text>
        <View style={[styles.radio, on && styles.radioOn]}>{on ? <View style={styles.radioDot} /> : null}</View>
      </View>
    </Pressable>
  );
}

/** Choix du nombre de mensualités pour le reste à payer */
function PlanSheet({ open, onClose, due, current }: { open: boolean; onClose: () => void; due: number; current: number }) {
  const [count, setCount] = useState(String(current));
  const n = Number(count);
  return (
    <BottomSheet open={open} onClose={onClose}>
      <View style={{ gap: 6 }}>
        <Text style={settingsStyles.sheetTitle}>Modifier l’échéancier</Text>
        <Text style={settingsStyles.sheetText}>Répartissez les {euro(due)} restants sur plusieurs mois, sans frais.</Text>
      </View>
      <Segmented
        options={[
          { key: '2', label: '2 fois' },
          { key: '3', label: '3 fois' },
          { key: '4', label: '4 fois' },
        ]}
        value={count}
        onChange={setCount}
      />
      <View style={[settingsStyles.card, { gap: 10 }]}>
        {Array.from({ length: n }, (_, i) => (
          <Animated.View key={`${n}-${i}`} entering={FadeInDown.delay(i * 40).duration(220)} style={styles.rowBetween}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Repeat size={15} color={colors.muted} />
              <Text style={styles.small}>{['21 nov. 2026', '21 déc. 2026', '21 janv. 2027', '21 févr. 2027'][i]}</Text>
            </View>
            <Text style={styles.stepTitle}>{euro(Math.round((due / n) * 100) / 100)}</Text>
          </Animated.View>
        ))}
      </View>
      <Pressable
        onPress={() => {
          reschedule(n);
          onClose();
        }}
        style={styles.cta}>
        <Text style={styles.ctaText}>Valider {n} mensualités</Text>
      </Pressable>
      <Pressable onPress={onClose} style={settingsStyles.secondary}>
        <Text style={settingsStyles.secondaryText}>Annuler</Text>
      </Pressable>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: 24, backgroundColor: colors.primary, padding: 20, gap: 12, ...shadow.primary },
  heroEyebrow: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.8)', letterSpacing: 0.6 },
  heroAmount: { fontSize: 34, fontWeight: '800', color: '#fff', letterSpacing: -1 },
  heroTotal: { fontSize: 16, fontWeight: '600', color: 'rgba(255,255,255,0.75)', letterSpacing: 0 },
  segment: { height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.28)' },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.9)' },
  sectionTitle: { fontSize: 19, fontWeight: '700', color: colors.ink, letterSpacing: -0.3 },
  link: { fontSize: 13.5, fontWeight: '600', color: colors.primary },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  card: { padding: 18, borderRadius: 20, backgroundColor: colors.card, ...shadow.card },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 18, backgroundColor: colors.card, borderWidth: 1.5, borderColor: 'transparent', ...shadow.card },
  optionOn: { borderColor: colors.primary },
  optionIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.input, alignItems: 'center', justifyContent: 'center' },
  radioOn: { borderColor: colors.primary },
  radioDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.primary },
  cta: { height: 56, borderRadius: 16, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', ...shadow.primary },
  ctaText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  done: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 18, backgroundColor: colors.successSoft },
  doneText: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.success },
  step: { flexDirection: 'row', gap: 14 },
  dot: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.input, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  dotPaid: { backgroundColor: colors.success, borderColor: colors.success },
  dotNext: { borderColor: colors.primary, borderWidth: 6 },
  line: { flex: 1, width: 2, backgroundColor: colors.border, marginVertical: 2 },
  stepTitle: { fontSize: 14.5, fontWeight: '600', color: colors.ink },
  stepAmount: { fontSize: 15, fontWeight: '700', color: colors.ink },
  status: { fontSize: 11.5, fontWeight: '700', color: colors.faint },
  small: { fontSize: 12.5, color: colors.muted },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 16 },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: 54 },
  invoice: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  invoiceIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.successSoft, alignItems: 'center', justifyContent: 'center' },
});
