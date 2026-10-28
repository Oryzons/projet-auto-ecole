import { router } from 'expo-router';
import { ArrowLeft, ArrowRight, ChevronRight, CircleQuestionMark, type LucideIcon } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { ScrollView as GHScrollView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HelpSheet } from '@/components/help-sheet';
import { colors, font, radius, shadow, space, toneColors, type Tone } from '@/theme';

/* ---------- Mise en page ---------- */

type ScreenProps = {
  children: ReactNode;
  /** Barre fixe en bas de l'écran (bouton principal, zone de saisie…) */
  footer?: ReactNode;
  scroll?: boolean;
  /** Les écrans d'onglets laissent la place à la barre de navigation */
  withTabBar?: boolean;
};

export function Screen({ children, footer, scroll = true, withTabBar = false }: ScreenProps) {
  const content = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.scroll, withTabBar && { paddingBottom: 120 }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.scroll, { flex: 1 }]}>{children}</View>
  );
  return (
    <SafeAreaView style={styles.screen} edges={withTabBar ? ['top'] : ['top', 'bottom']}>
      {content}
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </SafeAreaView>
  );
}

/** Barre de navigation : retour, titre du parcours, aide */
export function TopBar({
  title,
  back = true,
  onBack,
  right,
}: {
  title?: string;
  back?: boolean;
  /** Action du bouton retour (par défaut : page précédente) */
  onBack?: () => void;
  right?: ReactNode;
}) {
  return (
    <View style={styles.topBar}>
      {back ? (
        <IconButton icon={ArrowLeft} onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/')))} />
      ) : (
        <View style={{ width: 40 }} />
      )}
      {title ? <Text style={styles.topBarTitle}>{title}</Text> : <View />}
      {right ?? <HelpButton />}
    </View>
  );
}

/** Bouton « ? » : ouvre l'aide de la page dans un panneau qui descend du haut */
function HelpButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <IconButton icon={CircleQuestionMark} onPress={() => setOpen(true)} />
      <HelpSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}

export function IconButton({
  icon: Icon,
  onPress,
  tone = 'neutral',
}: {
  icon: LucideIcon;
  onPress?: () => void;
  tone?: 'neutral' | 'primary';
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [
        styles.iconButton,
        tone === 'primary' && { backgroundColor: colors.primary, borderColor: colors.primary },
        pressed && { opacity: 0.7 },
      ]}>
      <Icon size={20} color={tone === 'primary' ? colors.onPrimary : colors.ink} />
    </Pressable>
  );
}

/** Grand titre + description en tête d'écran */
export function Intro({ title, description, eyebrow }: { title: string; description?: string; eyebrow?: string }) {
  return (
    <View style={{ gap: 8 }}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={font.title}>{title}</Text>
      {description ? <Text style={[font.body, { color: colors.muted, lineHeight: 22 }]}>{description}</Text> : null}
    </View>
  );
}

export function Section({
  title,
  action,
  onAction,
  children,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
  children: ReactNode;
}) {
  return (
    <View style={{ gap: space.md }}>
      <View style={styles.sectionHead}>
        <Text style={font.h2}>{title}</Text>
        {action ? (
          <Pressable onPress={onAction} hitSlop={8}>
            <Text style={styles.link}>{action}</Text>
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

export function Card({
  children,
  style,
  onPress,
  tone,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  tone?: 'default' | 'primary' | 'soft';
}) {
  const toneStyle =
    tone === 'primary'
      ? { backgroundColor: colors.primary, borderColor: colors.primary }
      : tone === 'soft'
        ? { backgroundColor: colors.primarySoft, borderColor: colors.primarySoft }
        : null;
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.card, toneStyle, style, pressed && { opacity: 0.85 }]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, toneStyle, style]}>{children}</View>;
}

export function Divider({ inset = 0 }: { inset?: number }) {
  return <View style={{ height: 1, backgroundColor: colors.border, marginLeft: inset }} />;
}

export function Row({ children, gap = space.md, style }: { children: ReactNode; gap?: number; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>;
}

/* ---------- Éléments ---------- */

export function Badge({ label, tone = 'neutral', icon: Icon }: { label: string; tone?: Tone; icon?: LucideIcon }) {
  const c = toneColors[tone];
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      {Icon ? <Icon size={12} color={c.fg} /> : null}
      <Text style={[styles.badgeText, { color: c.fg }]}>{label}</Text>
    </View>
  );
}

export function Progress({ value, tone = 'primary', height = 6 }: { value: number; tone?: Tone; height?: number }) {
  const pct = Math.max(0, Math.min(1, value));
  return (
    <View style={{ height, borderRadius: height, backgroundColor: '#E8EEF6', overflow: 'hidden' }}>
      <View style={{ width: `${pct * 100}%`, height, borderRadius: height, backgroundColor: toneColors[tone].fg }} />
    </View>
  );
}

export function Avatar({ name, size = 44, tone = 'primary' }: { name: string; size?: number; tone?: Tone }) {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const c = toneColors[tone];
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: c.fg, fontWeight: '700', fontSize: size * 0.36 }}>{initials}</Text>
    </View>
  );
}

export function IconBox({ icon: Icon, tone = 'primary', size = 42 }: { icon: LucideIcon; tone?: Tone; size?: number }) {
  const c = toneColors[tone];
  return (
    <View style={{ width: size, height: size, borderRadius: radius.md, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center' }}>
      <Icon size={size * 0.48} color={c.fg} />
    </View>
  );
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon: Icon,
  small,
  style,
}: {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  icon?: LucideIcon;
  small?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const v = {
    primary: { bg: colors.primary, fg: colors.onPrimary, border: colors.primary },
    secondary: { bg: colors.card, fg: colors.ink, border: colors.input },
    ghost: { bg: 'transparent', fg: colors.primary, border: 'transparent' },
    danger: { bg: colors.dangerSoft, fg: colors.danger, border: colors.dangerSoft },
  }[variant];
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        small && { height: 40, paddingHorizontal: 14 },
        { backgroundColor: v.bg, borderColor: v.border },
        variant === 'primary' && shadow.primary,
        pressed && { opacity: 0.8, transform: [{ scale: 0.99 }] },
        style,
      ]}>
      {Icon ? <Icon size={small ? 16 : 18} color={v.fg} /> : null}
      <Text style={[styles.buttonText, small && { fontSize: 14 }, { color: v.fg }]}>{label}</Text>
    </Pressable>
  );
}

/** Bouton d'action principal des parcours : libellé à gauche, flèche à droite */
export function CtaButton({ label, onPress, icon: Icon = ArrowRight }: { label: string; onPress?: () => void; icon?: LucideIcon }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.cta, shadow.primary, pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] }]}>
      <Text style={[styles.buttonText, { color: colors.onPrimary }]}>{label}</Text>
      <Icon size={20} color={colors.onPrimary} />
    </Pressable>
  );
}

export function Field({ label, hint, ...props }: TextInputProps & { label: string; hint?: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput placeholderTextColor={colors.faint} style={styles.input} {...props} />
      {hint ? <Text style={font.tiny}>{hint}</Text> : null}
    </View>
  );
}

export function Chip({ label, active, onPress, count }: { label: string; active?: boolean; onPress?: () => void; count?: number }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && { color: colors.onPrimary }]}>{label}</Text>
      {count !== undefined ? (
        <View style={[styles.chipCount, active && { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
          <Text style={[styles.chipCountText, active && { color: colors.onPrimary }]}>{count}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export function Chips({ items, value, onChange }: { items: { key: string; label: string; count?: number }[]; value: string; onChange: (k: string) => void }) {
  return (
    // ScrollView de gesture-handler : le défilement des filtres reste prioritaire sur le glissement entre onglets
    <GHScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
      {items.map((i) => (
        <Chip key={i.key} label={i.label} count={i.count} active={value === i.key} onPress={() => onChange(i.key)} />
      ))}
    </GHScrollView>
  );
}

/** Ligne de liste : icône, titre, sous-titre et élément à droite */
export function ListItem({
  icon,
  tone,
  avatar,
  title,
  subtitle,
  right,
  onPress,
  chevron,
}: {
  icon?: LucideIcon;
  tone?: Tone;
  avatar?: string;
  title: string;
  subtitle?: string;
  right?: ReactNode;
  onPress?: () => void;
  chevron?: boolean;
}) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [styles.listItem, pressed && { opacity: 0.6 }]}>
      {avatar ? <Avatar name={avatar} size={40} tone={tone} /> : icon ? <IconBox icon={icon} tone={tone} size={40} /> : null}
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={font.h3} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={font.small} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
      {chevron ? <ChevronRight size={18} color={colors.faint} /> : null}
    </Pressable>
  );
}

export function Stat({ label, value, hint, tone = 'neutral' }: { label: string; value: string; hint?: string; tone?: Tone }) {
  return (
    <Card style={{ flex: 1, gap: 4, padding: 14 }}>
      <Text style={font.tiny}>{label}</Text>
      <Text style={{ fontSize: 22, fontWeight: '700', color: colors.ink, letterSpacing: -0.4 }}>{value}</Text>
      {hint ? <Text style={[font.tiny, { color: toneColors[tone].fg, fontWeight: '600' }]}>{hint}</Text> : null}
    </Card>
  );
}

export function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <Pressable
      onPress={() => onChange(!value)}
      style={{ width: 40, height: 24, borderRadius: 12, padding: 3, backgroundColor: value ? colors.primary : colors.input, alignItems: value ? 'flex-end' : 'flex-start' }}>
      <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: '#fff' }} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 32, gap: 24 },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  topBar: { height: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topBarTitle: { fontSize: 15, fontWeight: '700', color: colors.ink },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: { fontSize: 12, fontWeight: '700', color: colors.primary, textTransform: 'uppercase', letterSpacing: 1 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  link: { fontSize: 13, fontWeight: '600', color: colors.primary },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    ...shadow.card,
  },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 4, borderRadius: radius.pill },
  badgeText: { fontSize: 11, fontWeight: '700' },
  button: {
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: { fontSize: 16, fontWeight: '600' },
  cta: {
    height: 54,
    borderRadius: 14,
    paddingHorizontal: 18,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: { fontSize: 13, fontWeight: '600', color: colors.ink },
  input: {
    height: 50,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.input,
    backgroundColor: colors.card,
    paddingHorizontal: 14,
    fontSize: 15,
    color: colors.ink,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 34,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.ink },
  chipCount: { minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 5, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  chipCountText: { fontSize: 11, fontWeight: '700', color: colors.primary },
  listItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
});
