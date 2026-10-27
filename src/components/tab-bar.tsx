import type { Href } from 'expo-router';
import { TabList, TabSlot, TabTrigger, Tabs, type TabTriggerSlotProps } from 'expo-router/ui';
import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/theme';

export type TabItem = { name: string; href: Href; label: string; icon: LucideIcon; badge?: number };

/** Navigation principale (5 destinations), commune aux trois espaces */
export function SpaceTabs({ items }: { items: TabItem[] }) {
  const insets = useSafeAreaInsets();
  return (
    <Tabs>
      <TabSlot style={{ flex: 1 }} />
      <TabList style={StyleSheet.flatten([styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }])}>
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
    <Pressable {...props} style={styles.item}>
      <View style={[styles.pill, isFocused && { backgroundColor: colors.primarySoft }]}>
        <Icon size={21} color={isFocused ? colors.primary : colors.faint} strokeWidth={isFocused ? 2.3 : 2} />
        {badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>
      <Text style={[styles.label, isFocused && { color: colors.primary, fontWeight: '700' }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 10,
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  item: { width: 74, alignItems: 'center', gap: 4 },
  pill: { width: 52, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 11, fontWeight: '500', color: colors.muted },
  badge: {
    position: 'absolute',
    top: 0,
    right: 8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
});
