import { router, type Href } from 'expo-router';
import { ArrowLeft, CheckCheck, Clock3, MessageCircleOff, Phone, Plus, Search, SendHorizontal, X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeInDown, FadeInUp, FadeOut, LinearTransition, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Chips, TopBar } from '@/components/ui';
import { conversations, messages as juliesThread, school, type Conversation } from '@/data/mock';
import { colors, shadow, toneColors, type Tone } from '@/theme';

const ease = Easing.out(Easing.cubic);
const isInstructor = (c: Conversation) => c.role.startsWith('Monit');
const toneOf = (c: Conversation): Tone => (isInstructor(c) ? 'primary' : c.id === 'compta' ? 'warning' : c.id === 'examens' ? 'success' : 'violet');
const initials = (name: string) =>
  name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

function Avatar({ c, size = 48, online }: { c: Conversation; size?: number; online?: boolean }) {
  const t = toneColors[toneOf(c)];
  return (
    <View style={{ alignSelf: 'flex-start' }}>
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: t.fg, fontWeight: '700', fontSize: size * 0.33 }}>{initials(c.name)}</Text>
      </View>
      {online ? <View style={[styles.online, { right: size > 40 ? 0 : -1, bottom: size > 40 ? 1 : 0 }]} /> : null}
    </View>
  );
}

/* ---------- Boîte de réception ---------- */

/** Boîte de réception, partagée par les trois espaces */
export function Inbox({ basePath, intro, tab = false }: { basePath: string; intro: string; tab?: boolean }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [read, setRead] = useState<string[]>([]);

  const list = conversations.map((c) => (read.includes(c.id) ? { ...c, unread: undefined } : c));
  const unreadCount = list.filter((c) => c.unread).length;
  const q = query.trim().toLowerCase();
  const visible = list.filter(
    (c) =>
      (filter === 'all' || (filter === 'unread' && c.unread) || (filter === 'moniteurs' && isInstructor(c)) || (filter === 'equipe' && !isInstructor(c))) &&
      (!q || c.name.toLowerCase().includes(q) || c.last.toLowerCase().includes(q)),
  );
  const featured = list[0];

  const open = (c: Conversation) => {
    setRead((r) => (r.includes(c.id) ? r : [...r, c.id]));
    router.push(`${basePath}/conversation/${c.id}` as Href);
  };

  return (
    <>
      <TopBar title="Messages" onBack={tab ? () => router.navigate(basePath as Href) : undefined} />

      <Animated.View entering={FadeInDown.duration(380).easing(ease)} style={{ gap: 10 }}>
        <Text style={styles.title}>On en parle ?</Text>
        <Text style={styles.subtitle}>
          {unreadCount ? `${unreadCount} conversation${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}. ` : 'Vous êtes à jour. '}
          {intro}
        </Text>
      </Animated.View>

      {/* Contact principal mis en avant */}
      {basePath === '/eleve' && !q && filter === 'all' ? (
        <Animated.View entering={FadeInDown.delay(60).duration(380).easing(ease)}>
          <Pressable onPress={() => open(featured)} style={({ pressed }) => [styles.featured, pressed && { transform: [{ scale: 0.99 }] }]}>
            <View style={styles.featuredTop}>
              <View style={styles.featuredAvatar}>
                <Text style={styles.featuredInitials}>{initials(featured.name)}</Text>
                <View style={[styles.online, { borderColor: colors.primary }]} />
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={styles.featuredName}>{featured.name}</Text>
                <Text style={styles.featuredRole}>Votre monitrice · En ligne</Text>
              </View>
              <View style={styles.featuredBtn}>
                <Text style={styles.featuredBtnText}>Écrire</Text>
              </View>
            </View>
            <View style={styles.featuredBubble}>
              <Text style={styles.featuredLast} numberOfLines={2}>
                {featured.last}
              </Text>
              <Text style={styles.featuredTime}>{featured.date}</Text>
            </View>
          </Pressable>
        </Animated.View>
      ) : null}

      <Animated.View entering={FadeInDown.delay(120).duration(380).easing(ease)} style={{ gap: 12 }}>
        <View style={[styles.search, query.length > 0 && { borderColor: colors.primary }]}>
          <Search size={18} color={colors.muted} strokeWidth={1.9} />
          <TextInput value={query} onChangeText={setQuery} placeholder="Rechercher une personne, un message…" placeholderTextColor={colors.faint} style={styles.searchInput} />
          {query ? (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <X size={16} color={colors.muted} />
            </Pressable>
          ) : null}
        </View>
        <Chips
          value={filter}
          onChange={setFilter}
          items={[
            { key: 'all', label: 'Toutes' },
            { key: 'unread', label: 'Non lues', count: unreadCount },
            { key: 'moniteurs', label: 'Moniteurs' },
            { key: 'equipe', label: 'Équipe Virage' },
          ]}
        />
      </Animated.View>

      <View style={{ gap: 10 }}>
        {visible.length ? (
          visible.map((c, i) => (
            <Animated.View key={c.id} entering={FadeInDown.delay(160 + i * 50).duration(320).easing(ease)} exiting={FadeOut.duration(120)} layout={LinearTransition.duration(220).easing(ease)}>
              <ConversationCard c={c} onPress={() => open(c)} />
            </Animated.View>
          ))
        ) : (
          <Animated.View entering={FadeIn.duration(250)} style={styles.empty}>
            <View style={styles.emptyIcon}>
              <MessageCircleOff size={24} color={colors.primary} strokeWidth={1.8} />
            </View>
            <Text style={styles.emptyTitle}>Aucune conversation</Text>
            <Text style={styles.emptyText}>{q ? 'Essayez un autre nom ou un autre mot.' : 'Rien à lire ici pour le moment.'}</Text>
          </Animated.View>
        )}
      </View>

      <ResponseTime />
    </>
  );
}

function ConversationCard({ c, onPress }: { c: Conversation; onPress: () => void }) {
  const unread = !!c.unread;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, unread && styles.cardUnread, pressed && { transform: [{ scale: 0.985 }] }]}>
      <Avatar c={c} online={c.id === 'julie'} />
      <View style={{ flex: 1, gap: 3 }}>
        <View style={styles.cardTop}>
          <Text style={[styles.cardName, !unread && { fontWeight: '600' }]} numberOfLines={1}>
            {c.name}
          </Text>
          <Text style={[styles.cardTime, unread && { color: colors.primary, fontWeight: '700' }]}>{c.date}</Text>
        </View>
        <Text style={styles.cardRole}>{c.role}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginTop: 2 }}>
          <Text style={[styles.cardLast, unread && { color: colors.ink }]} numberOfLines={2}>
            {c.last}
          </Text>
          {unread ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{c.unread}</Text>
            </View>
          ) : c.read ? (
            <CheckCheck size={16} color={colors.primary} />
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

function ResponseTime() {
  return (
    <View style={styles.response}>
      <Clock3 size={17} color={colors.primary} strokeWidth={1.9} />
      <Text style={styles.responseText}>L’équipe répond en général sous 2 h, du lundi au samedi de 9 h à 19 h.</Text>
    </View>
  );
}

/* ---------- Conversation ---------- */

type Message = { id: string; from: 'me' | 'them'; time: string; text: string; day?: string };

const quickReplies = ['Merci ! 🙏', 'D’accord, à bientôt', 'Je serai en retard', 'Peut-on décaler ?'];
const now = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

/** Fil de conversation */
export function ConversationView({ conversation: c }: { conversation: Conversation }) {
  const initial: Message[] = c.id === 'julie' ? juliesThread : [{ id: 'm0', day: c.date, from: 'them', time: c.date.includes(':') ? c.date : '10:00', text: c.last }];
  const [list, setList] = useState<Message[]>(initial);
  const [draft, setDraft] = useState('');
  const [typing, setTyping] = useState(false);
  const scroll = useRef<{ scrollToEnd: (o?: { animated?: boolean }) => void } | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const online = c.id === 'julie';

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const send = (text: string) => {
    const t = text.trim();
    if (!t) return;
    setList((l) => [...l, { id: `me-${l.length}`, from: 'me', time: now(), text: t }]);
    setDraft('');
    // réponse simulée pour la maquette
    timers.current.forEach(clearTimeout);
    timers.current = [
      setTimeout(() => setTyping(true), 700),
      setTimeout(() => {
        setTyping(false);
        setList((l) => [...l, { id: `them-${l.length}`, from: 'them', time: now(), text: 'Bien reçu, merci ! Je reviens vers vous très vite.' }]);
      }, 2400),
    ];
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} style={styles.headerBtn} hitSlop={6}>
          <ArrowLeft size={20} color={colors.ink} />
        </Pressable>
        <Avatar c={c} size={40} online={online} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.headerName} numberOfLines={1}>
            {c.name}
          </Text>
          <Text style={[styles.headerStatus, online && { color: colors.success }]} numberOfLines={1}>
            {typing ? 'écrit…' : online ? 'En ligne' : `${c.role} · répond sous 2 h`}
          </Text>
        </View>
        <Pressable onPress={() => Linking.openURL(`tel:${school.phone.replace(/\s/g, '')}`)} style={styles.headerBtn} hitSlop={6}>
          <Phone size={18} color={colors.primary} />
        </Pressable>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView ref={scroll as never} contentContainerStyle={styles.thread} onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })} keyboardShouldPersistTaps="handled">
          {list.map((m, i) => {
            const next = list[i + 1];
            const prev = list[i - 1];
            const lastOfGroup = !next || next.from !== m.from || !!next.day;
            const firstOfGroup = !prev || prev.from !== m.from || !!m.day;
            const mine = m.from === 'me';
            return (
              <Animated.View key={m.id} entering={i >= initial.length ? FadeInUp.duration(260).easing(ease) : undefined} style={{ gap: 10 }}>
                {m.day ? (
                  <View style={styles.dayPill}>
                    <Text style={styles.dayText}>{m.day}</Text>
                  </View>
                ) : null}
                <View style={[styles.msgRow, mine && { justifyContent: 'flex-end' }, !firstOfGroup && { marginTop: -6 }]}>
                  {!mine ? <View style={{ width: 28 }}>{lastOfGroup ? <Avatar c={c} size={28} /> : null}</View> : null}
                  <View
                    style={[
                      styles.bubble,
                      mine ? styles.mine : styles.theirs,
                      mine && !lastOfGroup && { borderBottomRightRadius: 8 },
                      !mine && !lastOfGroup && { borderBottomLeftRadius: 8 },
                    ]}>
                    <Text style={[styles.msgText, mine && { color: '#fff' }]}>{m.text}</Text>
                    <View style={styles.meta}>
                      <Text style={[styles.time, mine && { color: 'rgba(255,255,255,0.75)' }]}>{m.time}</Text>
                      {mine ? <CheckCheck size={13} color="rgba(255,255,255,0.85)" /> : null}
                    </View>
                  </View>
                </View>
              </Animated.View>
            );
          })}
          {typing ? (
            <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)} style={styles.msgRow}>
              <Avatar c={c} size={28} />
              <View style={[styles.bubble, styles.theirs, { flexDirection: 'row', gap: 4, paddingVertical: 14 }]}>
                {[0, 1, 2].map((d) => (
                  <TypingDot key={d} delay={d * 150} />
                ))}
              </View>
            </Animated.View>
          ) : null}
        </ScrollView>

        <View style={styles.bottom}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
            {quickReplies.map((r) => (
              <Pressable key={r} onPress={() => send(r)} style={({ pressed }) => [styles.quick, pressed && { backgroundColor: colors.primarySoft }]}>
                <Text style={styles.quickText}>{r}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <View style={styles.composer}>
            <Pressable style={styles.plus} hitSlop={6}>
              <Plus size={20} color={colors.ink} />
            </Pressable>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Votre message…"
              placeholderTextColor={colors.faint}
              style={styles.composeInput}
              multiline
              onSubmitEditing={() => send(draft)}
            />
            <Pressable onPress={() => send(draft)} disabled={!draft.trim()} style={[styles.send, !draft.trim() && { backgroundColor: '#C9D3F7' }]}>
              <SendHorizontal size={18} color="#fff" />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function TypingDot({ delay }: { delay: number }) {
  const o = useSharedValue(0.3);
  useEffect(() => {
    o.value = withDelay(delay, withRepeat(withSequence(withTiming(1, { duration: 300 }), withTiming(0.3, { duration: 300 })), -1));
  }, [delay, o]);
  const style = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={[styles.dot, style]} />;
}

const styles = StyleSheet.create({
  title: { fontSize: 30, fontWeight: '800', color: colors.ink, letterSpacing: -0.8 },
  subtitle: { fontSize: 15, lineHeight: 22, color: colors.muted },

  featured: { gap: 14, padding: 16, borderRadius: 22, backgroundColor: colors.primary, ...shadow.primary },
  featuredTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featuredAvatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  featuredInitials: { color: '#fff', fontWeight: '700', fontSize: 15 },
  featuredName: { color: '#fff', fontSize: 16, fontWeight: '700' },
  featuredRole: { color: 'rgba(255,255,255,0.75)', fontSize: 12.5 },
  featuredBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: '#fff' },
  featuredBtnText: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  featuredBubble: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, padding: 12, borderRadius: 16, borderTopLeftRadius: 6, backgroundColor: 'rgba(255,255,255,0.14)' },
  featuredLast: { flex: 1, color: '#fff', fontSize: 14, lineHeight: 20 },
  featuredTime: { color: 'rgba(255,255,255,0.7)', fontSize: 11.5 },

  search: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 50, paddingHorizontal: 16, borderRadius: 14, backgroundColor: colors.card, borderWidth: 1.5, borderColor: 'transparent', ...shadow.card },
  searchInput: { flex: 1, height: '100%', fontSize: 14.5, color: colors.ink },

  card: { flexDirection: 'row', gap: 14, padding: 16, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: 'transparent', ...shadow.card },
  cardUnread: { borderColor: '#D5DCFD' },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardName: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.ink },
  cardTime: { fontSize: 12, color: colors.faint },
  cardRole: { fontSize: 12, color: colors.faint },
  cardLast: { flex: 1, fontSize: 13.5, lineHeight: 19, color: colors.muted },
  badge: { minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 6, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  online: { position: 'absolute', right: 0, bottom: 1, width: 12, height: 12, borderRadius: 6, backgroundColor: '#22C55E', borderWidth: 2, borderColor: '#fff' },

  empty: { alignItems: 'center', gap: 8, paddingVertical: 32 },
  emptyIcon: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.ink },
  emptyText: { fontSize: 13, color: colors.muted },
  response: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 4 },
  responseText: { flex: 1, fontSize: 12.5, lineHeight: 18, color: colors.muted },

  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 4, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  headerBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  headerName: { fontSize: 16, fontWeight: '700', color: colors.ink },
  headerStatus: { fontSize: 12, color: colors.muted },

  thread: { padding: 16, paddingTop: 18, gap: 14 },
  dayPill: { alignSelf: 'center', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, backgroundColor: '#E8ECF5', marginVertical: 4 },
  dayText: { fontSize: 11.5, fontWeight: '600', color: colors.muted },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  bubble: { maxWidth: '78%', paddingHorizontal: 14, paddingTop: 10, paddingBottom: 8, borderRadius: 20, gap: 4 },
  mine: { backgroundColor: colors.primary, borderBottomRightRadius: 6 },
  theirs: { backgroundColor: colors.card, borderBottomLeftRadius: 6, ...shadow.card },
  msgText: { fontSize: 15, lineHeight: 21, color: colors.ink },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-end' },
  time: { fontSize: 10.5, color: colors.faint },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.muted },

  bottom: { gap: 10, paddingTop: 10, paddingBottom: 8 },
  quick: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  quickText: { fontSize: 13, fontWeight: '600', color: colors.ink },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginHorizontal: 16, padding: 6, borderRadius: 26, backgroundColor: colors.card, ...shadow.card },
  plus: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  composeInput: { flex: 1, minHeight: 40, maxHeight: 120, paddingTop: 10, paddingBottom: 10, fontSize: 15, color: colors.ink },
  send: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
});
