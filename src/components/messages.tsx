import { router, type Href } from 'expo-router';
import { CheckCheck, Clock3, Paperclip, Search, Send } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, Card, Chips, Divider, Intro, Section, TopBar } from '@/components/ui';
import { conversations, messages, type Conversation } from '@/data/mock';
import { colors, font, radius } from '@/theme';

/** Boîte de réception, partagée par les trois espaces */
export function Inbox({ basePath, intro }: { basePath: string; intro: string }) {
  const [filter, setFilter] = useState('all');
  const unread = conversations.filter((c) => c.unread);
  const others = conversations.filter((c) => !c.unread);
  const open = (c: Conversation) => router.push(`${basePath}/conversation/${c.id}` as Href);

  return (
    <>
      <TopBar title="Messagerie" back={false} />
      <Intro title="Messages" description={intro} />
      <View style={styles.search}>
        <Search size={19} color={colors.faint} />
        <TextInput placeholder="Rechercher une conversation" placeholderTextColor={colors.faint} style={{ flex: 1, fontSize: 15 }} />
      </View>
      <Chips
        value={filter}
        onChange={setFilter}
        items={[
          { key: 'all', label: 'Toutes les conversations' },
          { key: 'unread', label: 'Non lues', count: unread.length },
        ]}
      />
      {unread.length ? (
        <Section title="À lire" action="Tout marquer lu">
          <View style={{ gap: 10 }}>
            {unread.map((c) => (
              <Card key={c.id} onPress={() => open(c)} style={{ padding: 14, borderColor: '#D5DCFD' }}>
                <ConversationRow c={c} />
              </Card>
            ))}
          </View>
        </Section>
      ) : null}
      {filter === 'all' ? (
        <Section title="Conversations récentes">
          <Card style={{ paddingVertical: 4, paddingHorizontal: 14 }}>
            {others.map((c, i) => (
              <View key={c.id}>
                {i > 0 ? <Divider /> : null}
                <Pressable onPress={() => open(c)} style={{ paddingVertical: 12 }}>
                  <ConversationRow c={c} />
                </Pressable>
              </View>
            ))}
          </Card>
        </Section>
      ) : null}
      <ResponseTime />
    </>
  );
}

function ConversationRow({ c }: { c: Conversation }) {
  return (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      <Avatar name={c.name} tone={c.unread ? 'primary' : 'neutral'} />
      <View style={{ flex: 1, gap: 3 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
          <Text style={[font.h3, { flex: 1 }]} numberOfLines={1}>
            {c.name}
          </Text>
          <Text style={[font.tiny, !!c.unread && { color: colors.primary, fontWeight: '700' }]}>{c.date}</Text>
        </View>
        <Text style={font.tiny}>{c.role}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={[font.small, { flex: 1 }, !!c.unread && { color: colors.ink, fontWeight: '500' }]} numberOfLines={2}>
            {c.last}
          </Text>
          {c.unread ? (
            <View style={styles.unread}>
              <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{c.unread}</Text>
            </View>
          ) : c.read ? (
            <CheckCheck size={16} color={colors.primary} />
          ) : null}
        </View>
      </View>
    </View>
  );
}

function ResponseTime() {
  return (
    <View style={styles.response}>
      <Clock3 size={18} color={colors.primary} />
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={[font.h3, { fontSize: 13 }]}>Délai de réponse moyen</Text>
        <Text style={font.small}>L’équipe répond en général sous 2 h, du lundi au samedi de 9 h à 19 h.</Text>
      </View>
    </View>
  );
}

/** Fil de conversation */
export function ConversationView({ name, role }: { name: string; role: string }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 8, gap: 18 }}>
          <TopBar title="Conversation" />
          <Intro title={name} description={role} />
          {messages.map((m) => (
            <View key={m.id} style={{ gap: 12 }}>
              {m.day ? (
                <View style={styles.daySep}>
                  <View style={styles.dayLine} />
                  <Text style={[font.tiny, { fontWeight: '600' }]}>{m.day}</Text>
                  <View style={styles.dayLine} />
                </View>
              ) : null}
              <View style={{ gap: 6, alignItems: m.from === 'me' ? 'flex-end' : 'flex-start' }}>
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'baseline' }}>
                  <Text style={[font.h3, { fontSize: 13 }]}>{m.from === 'me' ? 'Moi' : name}</Text>
                  <Text style={font.tiny}>{m.time}</Text>
                </View>
                <View style={[styles.bubble, m.from === 'me' ? styles.mine : styles.theirs]}>
                  <Text style={{ fontSize: 15, lineHeight: 21, color: m.from === 'me' ? '#fff' : colors.ink }}>{m.text}</Text>
                </View>
              </View>
            </View>
          ))}
          <ResponseTime />
        </ScrollView>
        <View style={styles.composer}>
          <Pressable style={styles.round}>
            <Paperclip size={18} color={colors.ink} />
          </Pressable>
          <TextInput placeholder="Écrivez un message…" placeholderTextColor={colors.faint} style={styles.composeInput} />
          <Pressable style={[styles.round, { backgroundColor: colors.primary, borderColor: colors.primary }]}>
            <Send size={18} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  search: {
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
  },
  unread: { minWidth: 20, height: 20, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  response: { flexDirection: 'row', gap: 12, padding: 16, borderRadius: radius.lg, backgroundColor: colors.primarySoft },
  daySep: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dayLine: { flex: 1, height: 1, backgroundColor: colors.border },
  bubble: { maxWidth: '88%', paddingHorizontal: 14, paddingVertical: 12, borderRadius: radius.lg },
  mine: { backgroundColor: colors.primary, borderTopRightRadius: 4 },
  theirs: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderTopLeftRadius: 4 },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
  round: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  composeInput: { flex: 1, height: 44, borderRadius: 22, backgroundColor: colors.background, paddingHorizontal: 16, fontSize: 15, color: colors.ink },
});
