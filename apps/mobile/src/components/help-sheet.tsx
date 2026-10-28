import { router, usePathname } from 'expo-router';
import { ChevronDown, CircleQuestionMark, MessageCircle, Phone, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { GestureDetector, GestureHandlerRootView, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  FadeIn,
  LinearTransition,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { helpFor } from '@/data/help';
import { school } from '@/data/mock';
import { colors, shadow } from '@/theme';

const ease = Easing.out(Easing.cubic);

/**
 * Aide contextuelle : panneau qui descend du haut de l'écran.
 * On le ferme en touchant le fond, la croix, ou en le remontant du doigt.
 */
export function HelpSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [mounted, setMounted] = useState(open);
  const [expanded, setExpanded] = useState(0);
  const y = useSharedValue(-height);
  const help = helpFor(pathname);
  const space = pathname.split('/')[1];

  // ouverture : on monte la modale puis le panneau descend ; fermeture : il remonte puis on démonte
  if (open && !mounted) setMounted(true);
  useEffect(() => {
    if (open) {
      setExpanded(0);
      y.value = withSpring(0, { damping: 24, stiffness: 220, mass: 0.9 });
    } else if (mounted) {
      y.value = withTiming(-height, { duration: 240, easing: Easing.in(Easing.cubic) }, (done) => {
        if (done) scheduleOnRN(setMounted, false);
      });
    }
  }, [open, mounted, height, y]);

  const pan = usePanGesture({
    activeOffsetY: [-10, 10],
    onUpdate: (e) => {
      'worklet';
      const t = e.translationY;
      y.value = t < 0 ? t : t * 0.15;
    },
    onDeactivate: (e) => {
      'worklet';
      if (y.value < -80 || e.velocityY < -600) scheduleOnRN(onClose);
      else y.value = withSpring(0, { damping: 24, stiffness: 260 });
    },
  });

  const panel = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  const backdrop = useAnimatedStyle(() => ({ opacity: interpolate(y.value, [-height * 0.6, 0], [0, 1], 'clamp') }));

  const contact = () => {
    onClose();
    if (space === 'eleve') router.push('/eleve/messages');
    else if (space === 'moniteur') router.push('/moniteur/messages');
    else Linking.openURL(`tel:${school.phone.replace(/\s/g, '')}`);
  };

  return (
    <Modal visible={mounted} transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdrop]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Fermer l’aide" />
        </Animated.View>

        <GestureDetector gesture={pan}>
          <Animated.View style={[styles.panel, { paddingTop: insets.top + 14, maxHeight: height * 0.86 }, panel]}>
            <View style={styles.head}>
              <View style={styles.headIcon}>
                <CircleQuestionMark size={22} color={colors.primary} strokeWidth={1.9} />
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={styles.kicker}>AIDE</Text>
                <Text style={styles.title}>{help.title}</Text>
              </View>
              <Pressable onPress={onClose} hitSlop={10} style={styles.close}>
                <X size={18} color={colors.ink} />
              </Pressable>
            </View>
            <Text style={styles.intro}>{help.intro}</Text>

            <ScrollView style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 8 }} showsVerticalScrollIndicator={false}>
              {help.items.map((item, i) => {
                const on = expanded === i;
                return (
                  <Animated.View key={item.q} layout={LinearTransition.duration(220).easing(ease)} style={[styles.item, on && styles.itemOn]}>
                    <Pressable onPress={() => setExpanded(on ? -1 : i)} style={styles.q}>
                      <Text style={styles.qText}>{item.q}</Text>
                      <View style={{ transform: [{ rotate: on ? '180deg' : '0deg' }] }}>
                        <ChevronDown size={18} color={on ? colors.primary : colors.muted} />
                      </View>
                    </Pressable>
                    {on ? (
                      <Animated.Text entering={FadeIn.delay(60).duration(200)} style={styles.a}>
                        {item.a}
                      </Animated.Text>
                    ) : null}
                  </Animated.View>
                );
              })}
            </ScrollView>

            <Pressable onPress={contact} style={({ pressed }) => [styles.contact, pressed && { opacity: 0.85 }]}>
              {space === 'eleve' || space === 'moniteur' ? (
                <MessageCircle size={18} color="#fff" strokeWidth={2} />
              ) : (
                <Phone size={18} color="#fff" strokeWidth={2} />
              )}
              <Text style={styles.contactText}>
                {space === 'eleve' || space === 'moniteur' ? 'Écrire à l’auto-école' : `Appeler le ${school.phone}`}
              </Text>
            </Pressable>

            <View style={styles.handle} />
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: 'rgba(20,32,60,0.35)' },
  panel: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 14,
    backgroundColor: colors.background,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    ...shadow.card,
    shadowOpacity: 0.18,
    shadowRadius: 30,
    elevation: 16,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  kicker: { fontSize: 10.5, fontWeight: '700', color: colors.primary, letterSpacing: 0.8 },
  title: { fontSize: 20, fontWeight: '800', color: colors.ink, letterSpacing: -0.4 },
  close: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  intro: { fontSize: 14, lineHeight: 20, color: colors.muted },
  item: { borderRadius: 16, backgroundColor: colors.card, borderWidth: 1, borderColor: 'transparent', overflow: 'hidden' },
  itemOn: { borderColor: '#D5DCFD' },
  q: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 14 },
  qText: { flex: 1, fontSize: 14.5, fontWeight: '700', color: colors.ink },
  a: { fontSize: 13.5, lineHeight: 20, color: colors.muted, paddingHorizontal: 16, paddingBottom: 16, marginTop: -4 },
  contact: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 50, borderRadius: 14, backgroundColor: colors.primary },
  contactText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  handle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: '#C9D2E3', marginTop: 2 },
});
