import { router, usePathname, type Href } from 'expo-router';
import { TabList, TabSlot, TabTrigger, Tabs, type TabTriggerSlotProps, type TabsDescriptor, type TabsSlotRenderOptions } from 'expo-router/ui';
import type { LucideIcon } from 'lucide-react-native';
import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  FadeIn,
  interpolate,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Screen as NativeScreen } from 'react-native-screens';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { colors } from '@/theme';

export type TabItem = { name: string; href: Href; label: string; icon: LucideIcon; badge?: number };

const ease = Easing.bezier(0.25, 0.1, 0.25, 1);
// changement d'onglet : transition courte et amortie, sans rebond
const pill = LinearTransition.duration(260).easing(ease);

/**
 * Navigation principale (5 destinations), commune aux trois espaces.
 * Barre flottante : l'onglet actif s'élargit en pastille bleue avec son libellé,
 * les autres n'affichent que leur icône. On passe aussi d'un onglet à l'autre en glissant.
 */
export function SpaceTabs({ items }: { items: TabItem[] }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const pathname = usePathname();

  // onglet courant et sens du dernier changement (pour faire glisser la page du bon côté)
  const found = items.findIndex((i) => i.href === pathname);
  const [nav, setNav] = useState({ index: Math.max(found, 0), dir: 0 });
  if (found >= 0 && found !== nav.index) setNav({ index: found, dir: Math.sign(found - nav.index) });
  const index = nav.index;

  // glisser horizontalement sur la page pour passer à l'onglet voisin
  const x = useSharedValue(0);
  useEffect(() => {
    x.value = 0;
  }, [index, x]);

  const goTo = (i: number) => router.navigate(items[i].href);
  const hasPrev = index > 0;
  const hasNext = index < items.length - 1;

  const pan = usePanGesture({
    activeOffsetX: [-18, 18],
    failOffsetY: [-12, 12],
    onUpdate: (e) => {
      'worklet';
      const t = e.translationX;
      const blocked = (t > 0 && !hasPrev) || (t < 0 && !hasNext);
      x.value = blocked ? t * 0.15 : t * 0.6;
    },
    onDeactivate: (e) => {
      'worklet';
      const v = e.translationX + e.velocityX * 0.15;
      const target = v < -SWIPE && hasNext ? index + 1 : v > SWIPE && hasPrev ? index - 1 : -1;
      if (target >= 0) {
        const out = v < 0 ? -width * 0.35 : width * 0.35;
        x.value = withTiming(out, { duration: 140, easing: Easing.in(Easing.quad) }, (done) => {
          if (done) scheduleOnRN(goTo, target);
        });
      } else {
        x.value = withSpring(0, { damping: 22, stiffness: 260 });
      }
    },
  });

  const slotStyle = useAnimatedStyle(() => ({
    opacity: interpolate(Math.abs(x.value), [0, width * 0.35], [1, 0], 'clamp'),
    transform: [{ translateX: x.value }],
  }));

  const renderTab = (descriptor: TabsDescriptor, { isFocused, loaded, detachInactiveScreens }: TabsSlotRenderOptions) => {
    if (!loaded && !isFocused) return null;
    return (
      <NativeScreen
        key={descriptor.route.key}
        enabled={detachInactiveScreens}
        activityState={isFocused ? 2 : 0}
        freezeOnBlur={false}
        style={[styles.screen, isFocused ? styles.focused : styles.unfocused]}>
        <TabEnter focused={isFocused} dir={nav.dir}>
          {descriptor.render()}
        </TabEnter>
      </NativeScreen>
    );
  };

  return (
    <Tabs>
      <GestureDetector gesture={pan}>
        <Animated.View style={[{ flex: 1 }, slotStyle]}>
          <TabSlot style={{ flex: 1 }} renderFn={renderTab} />
        </Animated.View>
      </GestureDetector>
      <TabList style={StyleSheet.flatten([styles.bar, { bottom: Math.max(insets.bottom, 12) }])}>
        {items.map((item) => (
          <TabTrigger key={item.name} name={item.name} href={item.href} asChild>
            <TabButton item={item} />
          </TabTrigger>
        ))}
      </TabList>
    </Tabs>
  );
}

const SWIPE = 70;

/** Arrivée d'un onglet : la page glisse depuis le côté de l'onglet choisi, avec un fondu */
function TabEnter({ focused, dir, children }: { focused: boolean; dir: number; children: ReactNode }) {
  const p = useSharedValue(1);
  const from = useSharedValue(0);
  useEffect(() => {
    if (focused) {
      from.value = dir * 44;
      p.value = 0;
      p.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) });
    }
    // seul le passage à « focused » déclenche l'animation (dir est lu à ce moment-là)
  }, [focused]);
  const style = useAnimatedStyle(() => ({
    opacity: p.value,
    transform: [{ translateX: (1 - p.value) * from.value }, { scale: 0.985 + p.value * 0.015 }],
  }));
  return <Animated.View style={[{ flex: 1 }, style]}>{children}</Animated.View>;
}

// `ref` est retiré : son type n'est pas compatible avec Pressable et il n'est pas nécessaire ici
function TabButton({ item, isFocused, ref: _ref, ...props }: TabTriggerSlotProps & { item: TabItem }) {
  const { label, icon: Icon, badge } = item;
  return (
    <Pressable {...props} accessibilityLabel={label} hitSlop={4}>
      <Animated.View layout={pill} style={[styles.item, isFocused && styles.itemActive]}>
        <View>
          <Icon size={21} color={isFocused ? '#fff' : colors.muted} strokeWidth={isFocused ? 2.2 : 1.9} />
          {badge && !isFocused ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          ) : null}
        </View>
        {isFocused ? (
          <Animated.Text entering={FadeIn.delay(60).duration(180)} style={styles.label} numberOfLines={1}>
            {label}
          </Animated.Text>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, position: 'relative', height: '100%' },
  focused: { zIndex: 1, display: 'flex', flexShrink: 0, flexGrow: 1 },
  unfocused: { zIndex: -1, display: 'none', flexShrink: 1, flexGrow: 0 },
  bar: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: 64,
    paddingHorizontal: 8,
    borderRadius: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderWidth: 1,
    borderColor: 'rgba(20,32,60,0.06)',
    shadowColor: '#14203C',
    shadowOpacity: 0.14,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  item: { height: 48, minWidth: 48, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  itemActive: { backgroundColor: colors.primary, paddingHorizontal: 18 },
  label: { fontSize: 13.5, fontWeight: '700', color: '#fff' },
  badge: {
    position: 'absolute',
    top: -6,
    right: -9,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
});
