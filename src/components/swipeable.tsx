import type { LucideIcon } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

export type SwipeAction = { label: string; icon: LucideIcon; color: string; onPress: () => void };

type Props = {
  children: ReactNode;
  /** Boutons révélés en glissant vers la gauche ; le dernier (ex. supprimer) part aussi d'un grand geste */
  actions: SwipeAction[];
  radius?: number;
};

const BUTTON = 78;
const spring = { damping: 22, stiffness: 260, mass: 0.8 };
const ease = Easing.out(Easing.cubic);

/**
 * Ligne glissable façon Mail : vers la gauche, les actions apparaissent ;
 * un grand geste déclenche directement la dernière. Le glissement vers la droite
 * est laissé libre pour le retour à la page précédente.
 */
export function SwipeableRow({ children, actions, radius = 20 }: Props) {
  const { width } = useWindowDimensions();
  const x = useSharedValue(0);
  const [open, setOpen] = useState(false);
  const openWidth = actions.length * BUTTON;
  const last = actions[actions.length - 1];

  const close = () => {
    x.value = withSpring(0, spring);
    setOpen(false);
  };
  const dismiss = (run: () => void) => {
    x.value = withTiming(-width, { duration: 220, easing: ease }, (done) => {
      if (done) scheduleOnRN(run);
    });
  };

  const pan = usePanGesture({
    // fermée : seul le geste vers la gauche est capté ; ouverte : les deux sens
    activeOffsetX: open ? [-12, 12] : [-12, 10000],
    failOffsetY: [-10, 10],
    onUpdate: (e) => {
      'worklet';
      const t = (open ? -openWidth : 0) + e.translationX;
      x.value = t > 0 ? t * 0.2 : t;
    },
    onDeactivate: (e) => {
      'worklet';
      const v = x.value + e.velocityX * 0.08;
      if (v < -(openWidth + 110)) {
        x.value = withTiming(-width, { duration: 200, easing: ease }, (done) => {
          if (done) scheduleOnRN(last.onPress);
        });
      } else if (v < -openWidth / 2) {
        x.value = withSpring(-openWidth, spring);
        scheduleOnRN(setOpen, true);
      } else {
        x.value = withSpring(0, spring);
        scheduleOnRN(setOpen, false);
      }
    },
  });

  const rowStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  const actionsStyle = useAnimatedStyle(() => ({ opacity: interpolate(-x.value, [0, 24], [0, 1], 'clamp') }));
  // au-delà de l'ouverture, la dernière action s'étire et prend toute la place
  const lastStyle = useAnimatedStyle(() => ({ width: Math.max(BUTTON - 6, -x.value - (actions.length - 1) * BUTTON - 6) }));

  return (
    <View>
      <Animated.View style={[StyleSheet.absoluteFill, styles.actions, actionsStyle]}>
        {actions.map((a, i) => {
          const Icon = a.icon;
          const isLast = i === actions.length - 1;
          return (
            <Animated.View key={a.label} style={[styles.btnWrap, isLast && lastStyle]}>
              <Pressable
                onPress={() => (isLast ? dismiss(a.onPress) : (a.onPress(), close()))}
                style={[styles.btn, { backgroundColor: a.color, borderRadius: radius - 4 }]}>
                <Icon size={20} color="#fff" strokeWidth={2} />
                <Text style={styles.label} numberOfLines={1}>
                  {a.label}
                </Text>
              </Pressable>
            </Animated.View>
          );
        })}
      </Animated.View>
      <GestureDetector gesture={pan}>
        <Animated.View style={rowStyle}>
          {children}
          {/* ligne ouverte : un appui sur la carte la referme */}
          {open ? <Pressable style={StyleSheet.absoluteFill} onPress={close} /> : null}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'stretch', gap: 6 },
  btnWrap: { width: BUTTON - 6 },
  btn: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 5 },
  label: { color: '#fff', fontSize: 11.5, fontWeight: '700' },
});
