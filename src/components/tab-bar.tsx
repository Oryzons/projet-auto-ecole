import type { Href } from 'expo-router';
import { TabList, TabSlot, TabTrigger, Tabs, type TabTriggerSlotProps, type TabsDescriptor, type TabsSlotRenderOptions } from 'expo-router/ui';
import type { LucideIcon } from 'lucide-react-native';
import { useEffect, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Screen as NativeScreen } from 'react-native-screens';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/theme';

export type TabItem = { name: string; href: Href; label: string; icon: LucideIcon; badge?: number };

const ease = Easing.bezier(0.25, 0.1, 0.25, 1);
// changement d'onglet : transition courte et amortie, sans rebond
const pill = LinearTransition.duration(260).easing(ease);

/**
 * Navigation principale (5 destinations), commune aux trois espaces.
 * Barre flottante : l'onglet actif s'élargit en pastille bleue avec son libellé,
 * les autres n'affichent que leur icône.
 */
export function SpaceTabs({ items }: { items: TabItem[] }) {
  const insets = useSafeAreaInsets();
  return (
    <Tabs>
      <TabSlot style={{ flex: 1 }} renderFn={renderTab} />
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

/** Rendu d'un onglet : même logique que celui d'expo-router, avec un fondu à l'arrivée */
function renderTab(descriptor: TabsDescriptor, { isFocused, loaded, detachInactiveScreens }: TabsSlotRenderOptions) {
  if (!loaded && !isFocused) return null;
  return (
    <NativeScreen
      key={descriptor.route.key}
      enabled={detachInactiveScreens}
      activityState={isFocused ? 2 : 0}
      freezeOnBlur={false}
      style={[styles.screen, isFocused ? styles.focused : styles.unfocused]}>
      <TabFade focused={isFocused}>{descriptor.render()}</TabFade>
    </NativeScreen>
  );
}

function TabFade({ focused, children }: { focused: boolean; children: ReactNode }) {
  const p = useSharedValue(focused ? 0 : 1);
  useEffect(() => {
    if (focused) {
      p.value = 0;
      p.value = withTiming(1, { duration: 240, easing: Easing.out(Easing.cubic) });
    }
  }, [focused, p]);
  const style = useAnimatedStyle(() => ({ opacity: 0.35 + p.value * 0.65, transform: [{ translateY: (1 - p.value) * 8 }] }));
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
