import { CircleCheck, PartyPopper, X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';

import { CheckoutSheet } from '@/components/checkout';
import { buyHours, dismissOffer, euro, halfwayReached, hoursPacks, useBilling, type HoursPack } from '@/data/billing';
import { student } from '@/data/mock';
import { colors, shadow } from '@/theme';

const ease = Easing.out(Easing.cubic);

/**
 * Proposition de racheter des heures, affichée dès que l'élève a réalisé
 * la moitié de son forfait. `dismissible` ajoute « Plus tard » (accueil).
 */
export function HoursOffer({ dismissible = false, delay = 0 }: { dismissible?: boolean; delay?: number }) {
  const billing = useBilling();
  const [pack, setPack] = useState<HoursPack>(hoursPacks[1]);
  const [open, setOpen] = useState(false);
  const [bought, setBought] = useState<HoursPack | null>(null);

  if (!halfwayReached || (dismissible && billing.offerDismissed && !bought)) return null;

  const { done, total } = student.driving;

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(360).easing(ease)} exiting={FadeOut.duration(200)} layout={LinearTransition.duration(250)} style={styles.card}>
      <View style={styles.head}>
        <View style={styles.badge}>
          <PartyPopper size={18} color={colors.violet} strokeWidth={1.9} />
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={styles.title}>Mi-parcours atteint !</Text>
          <Text style={styles.text}>
            {done} h sur {total} réalisées. Il faut en moyenne 30 h pour être prêt : anticipez avec des heures à prix réduit.
          </Text>
        </View>
        {dismissible && !bought ? (
          <Pressable onPress={dismissOffer} hitSlop={10} style={styles.close} accessibilityLabel="Masquer l’offre">
            <X size={16} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${(done / total) * 100}%` }]} />
        <View style={styles.half} />
      </View>

      {bought ? (
        <Animated.View entering={FadeIn.duration(250)} style={styles.bought}>
          <CircleCheck size={20} color={colors.success} />
          <Text style={styles.boughtText}>
            {bought.hours} h ajoutées à votre solde. Vous pouvez les réserver dès maintenant.
          </Text>
        </Animated.View>
      ) : (
        <>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {hoursPacks.map((p) => {
              const on = p.id === pack.id;
              return (
                <Pressable key={p.id} onPress={() => setPack(p)} style={[styles.pack, on && styles.packOn]}>
                  {p.tag ? (
                    <View style={[styles.tag, on && { backgroundColor: colors.primary }]}>
                      <Text style={[styles.tagText, on && { color: '#fff' }]}>{p.tag}</Text>
                    </View>
                  ) : null}
                  <Text style={[styles.hours, on && { color: colors.primary }]}>{p.hours} h</Text>
                  <Text style={styles.price}>{euro(p.price)}</Text>
                  <Text style={[styles.was, !!p.was && { textDecorationLine: 'line-through' }]}>{p.was ? euro(p.was) : `${euro(p.price / p.hours)}/h`}</Text>
                </Pressable>
              );
            })}
          </View>
          <Pressable onPress={() => setOpen(true)} style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }]}>
            <Text style={styles.ctaText}>
              Ajouter {pack.hours} h · {euro(pack.price)}
            </Text>
          </Pressable>
          <Text style={styles.small}>Payable en 1 fois ou en 3 fois sans frais.</Text>
        </>
      )}

      <CheckoutSheet
        open={open}
        onClose={() => setOpen(false)}
        title={`Pack ${pack.hours} h de conduite`}
        detail={`${pack.hours} heures ajoutées à votre forfait, valables 12 mois.`}
        amount={pack.price}
        onPaid={() => {
          buyHours(pack);
          setBought(pack);
        }}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 18, borderRadius: 22, backgroundColor: colors.card, gap: 14, borderWidth: 1.5, borderColor: colors.violetSoft, ...shadow.card },
  head: { flexDirection: 'row', gap: 12 },
  badge: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.violetSoft, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 16.5, fontWeight: '800', color: colors.ink, letterSpacing: -0.3 },
  text: { fontSize: 13, lineHeight: 19, color: colors.muted },
  close: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#EEF2F7', alignItems: 'center', justifyContent: 'center' },
  track: { height: 6, borderRadius: 3, backgroundColor: '#E6EAF8' },
  fill: { height: 6, borderRadius: 3, backgroundColor: colors.violet },
  half: { position: 'absolute', left: '50%', top: -3, width: 2, height: 12, borderRadius: 1, backgroundColor: colors.ink },
  pack: { flex: 1, alignItems: 'center', gap: 2, paddingTop: 16, paddingBottom: 12, borderRadius: 16, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.subtle },
  packOn: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  tag: { position: 'absolute', top: -9, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999, backgroundColor: colors.border },
  tagText: { fontSize: 9.5, fontWeight: '800', color: colors.muted },
  hours: { fontSize: 22, fontWeight: '800', color: colors.ink, letterSpacing: -0.5 },
  price: { fontSize: 13.5, fontWeight: '700', color: colors.ink },
  was: { fontSize: 11, color: colors.faint },
  cta: { height: 50, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', ...shadow.primary },
  ctaText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  small: { fontSize: 12, color: colors.muted, textAlign: 'center', marginTop: -4 },
  bought: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 14, backgroundColor: colors.successSoft },
  boughtText: { flex: 1, fontSize: 13.5, lineHeight: 19, fontWeight: '600', color: colors.success },
});
