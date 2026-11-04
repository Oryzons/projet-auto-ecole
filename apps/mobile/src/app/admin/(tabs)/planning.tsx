import { Check, ChevronLeft, ChevronRight, Hourglass, X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeOut, LinearTransition } from 'react-native-reanimated';

import { Badge, Card, Chips, IconButton, Intro, ListItem, Row, Screen, Section } from '@/components/ui';
import { acceptRequest, refuseRequest, useLessonRequests, type LessonRequest } from '@/data/lesson-requests';
import { instructors, planningGrid, planningHours, vehicles } from '@/data/mock';

const todayLabel = (() => {
  const t = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  return t.charAt(0).toUpperCase() + t.slice(1);
})();
import { colors, font, radius } from '@/theme';

/** Planning multi-moniteurs et multi-véhicules */
export default function AdminPlanning() {
  const [view, setView] = useState('moniteurs');
  const requests = useLessonRequests();
  const pending = requests.filter((r) => r.status === 'pending');
  return (
    <Screen withTabBar>
      <Intro title="Planning" />

      {/* Demandes de cours envoyées par les élèves depuis l'app */}
      <Section title={`Demandes de cours${pending.length ? ` (${pending.length})` : ''}`}>
        {pending.length ? (
          <View style={{ gap: 10 }}>
            {pending.map((r) => (
              <RequestCard key={r.id} r={r} />
            ))}
          </View>
        ) : (
          <Card style={{ padding: 14 }}>
            <Text style={font.small}>Aucune demande en attente. Les nouvelles demandes des élèves arrivent ici.</Text>
          </Card>
        )}
      </Section>
      <Row style={{ justifyContent: 'space-between' }}>
        <IconButton icon={ChevronLeft} />
        <Text style={font.h3}>{todayLabel}</Text>
        <IconButton icon={ChevronRight} />
      </Row>
      <Chips
        value={view}
        onChange={setView}
        items={[
          { key: 'moniteurs', label: 'Moniteurs' },
          { key: 'vehicules', label: 'Véhicules' },
        ]}
      />

      {view === 'moniteurs' ? (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View>
              <View style={styles.row}>
                <View style={styles.hourCell} />
                {instructors.map((m) => (
                  <View key={m.id} style={[styles.cell, styles.head]}>
                    <Text style={[font.h3, { fontSize: 13 }]}>{m.name.split(' ')[0]}</Text>
                    <Text style={font.tiny}>{m.today}</Text>
                  </View>
                ))}
              </View>
              {planningHours.map((h) => (
                <View key={h} style={styles.row}>
                  <View style={styles.hourCell}>
                    <Text style={font.tiny}>{h}h</Text>
                  </View>
                  {instructors.map((m) => {
                    const slot = planningGrid[m.id]?.[h];
                    return (
                      <View key={m.id} style={styles.cell}>
                        {slot === 'off' ? (
                          <View style={[styles.block, { backgroundColor: '#F1F3F7' }]}>
                            <Text style={[font.tiny, { color: colors.faint }]}>Absent</Text>
                          </View>
                        ) : slot ? (
                          <View style={[styles.block, slot.type ? { backgroundColor: colors.violetSoft } : null]}>
                            <Text style={{ fontSize: 12, fontWeight: '700', color: slot.type ? colors.violet : colors.primaryStrong }} numberOfLines={1}>
                              {slot.student}
                            </Text>
                            {slot.type ? <Text style={{ fontSize: 10, color: colors.violet }}>{slot.type}</Text> : null}
                          </View>
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>
          </ScrollView>
        </Card>
      ) : (
        <View style={{ gap: 10 }}>
          {vehicles.map((v) => (
            <Card key={v.id} style={{ padding: 14 }}>
              <ListItem title={`${v.name} · ${v.plate}`} subtitle={`${v.type} · ${v.km}`} right={<Badge label={v.status} tone={v.tone} />} />
            </Card>
          ))}
        </View>
      )}

      <Section title="Charge des moniteurs">
        <Card style={{ gap: 12 }}>
          {instructors.map((m) => (
            <View key={m.id} style={{ gap: 6 }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Text style={font.h3}>{m.name}</Text>
                <Text style={font.tiny}>{Math.round(m.load * 100)} %</Text>
              </Row>
              <View style={{ height: 6, borderRadius: 3, backgroundColor: '#E8EEF6' }}>
                <View style={{ width: `${m.load * 100}%`, height: 6, borderRadius: 3, backgroundColor: m.load > 0.8 ? colors.warning : colors.primary }} />
              </View>
            </View>
          ))}
        </Card>
      </Section>
    </Screen>
  );
}

function RequestCard({ r }: { r: LessonRequest }) {
  const d = new Date(r.at);
  const day = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  const h = (n: number) => `${String(n).padStart(2, '0')}:00`;
  const ago = Math.max(1, Math.round((Date.now() - r.sentAt) / 60_000));
  return (
    <Animated.View exiting={FadeOut.duration(200)} layout={LinearTransition.duration(220)}>
      <Card style={{ gap: 12, padding: 14 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={font.h3}>{r.studentName}</Text>
            <Text style={font.small}>
              {day.charAt(0).toUpperCase() + day.slice(1)} · {h(d.getHours())} – {h(d.getHours() + r.hours)}
            </Text>
            <Text style={font.tiny}>
              Avec {r.instructor} · {r.place} · demandé il y a {ago < 60 ? `${ago} min` : `${Math.round(ago / 60)} h`}
            </Text>
          </View>
          <Badge label="En attente" tone="warning" icon={Hourglass} />
        </Row>
        <Row gap={8}>
          <Pressable onPress={() => refuseRequest(r.id)} style={[styles.btn, styles.btnRefuse]}>
            <X size={16} color={colors.danger} />
            <Text style={[styles.btnText, { color: colors.danger }]}>Refuser</Text>
          </Pressable>
          <Pressable onPress={() => acceptRequest(r.id)} style={[styles.btn, styles.btnAccept]}>
            <Check size={16} color="#fff" />
            <Text style={[styles.btnText, { color: '#fff' }]}>Accepter</Text>
          </Pressable>
        </Row>
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  btn: { flex: 1, height: 42, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  btnAccept: { backgroundColor: colors.success },
  btnRefuse: { backgroundColor: colors.dangerSoft },
  btnText: { fontSize: 14, fontWeight: '700' },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border },
  hourCell: { width: 44, height: 52, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.subtle },
  cell: { width: 108, height: 52, padding: 4, borderLeftWidth: 1, borderLeftColor: colors.border },
  head: { justifyContent: 'center', paddingHorizontal: 10, backgroundColor: colors.subtle },
  block: { flex: 1, borderRadius: radius.sm, backgroundColor: colors.primarySoft, paddingHorizontal: 8, justifyContent: 'center' },
});
