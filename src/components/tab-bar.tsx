import type { Href } from 'expo-router';
import { TabList, TabSlot, TabTrigger, Tabs, type TabTriggerSlotProps } from 'expo-router/ui';
import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/theme';

export type TabItem = { name: string; href: Href; label: string; icon: LucideIcon; badge?: number };

const spring = LinearTransition.springify().damping(18).stiffness(220);

/**
 * Navigation principale (5 destinations), commune aux trois espaces.
 * Barre flottante : l'onglet actif s'élargit en pastille bleue avec son libellé,
 * les autres n'affichent que leur icône.
 */
export function SpaceTabs({ items }: { items: TabItem[] }) {
  const insets = useSafeAreaInsets();
  return (
    <Tabs>
      <TabSlot style={{ flex: 1 }} />
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

// `ref` est retiré : son type n'est pas compatible avec Pressable et il n'est pas nécessaire ici
function TabButton({ item, isFocused, ref: _ref, ...props }: TabTriggerSlotProps & { item: TabItem }) {
  const { label, icon: Icon, badge } = item;
  return (
    <Pressable {...props} accessibilityLabel={label} hitSlop={4}>
      <Animated.View layout={spring} style={[styles.item, isFocused && styles.itemActive]}>
        <View>
          <Icon size={21} color={isFocused ? '#fff' : colors.muted} strokeWidth={isFocused ? 2.2 : 1.9} />
          {badge && !isFocused ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          ) : null}
        </View>
        {isFocused ? (
          <Animated.Text entering={FadeIn.delay(80).duration(200)} style={styles.label} numberOfLines={1}>
            {label}
          </Animated.Text>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
