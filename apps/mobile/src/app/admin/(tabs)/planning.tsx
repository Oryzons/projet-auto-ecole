import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Badge, Card, Chips, IconButton, Intro, ListItem, Row, Screen, Section } from '@/components/ui';
import { instructors, planningGrid, planningHours, vehicles } from '@/data/mock';
import { colors, font, radius } from '@/theme';

/** Planning multi-moniteurs et multi-véhicules */
export default function AdminPlanning() {
  const [view, setView] = useState('moniteurs');
  return (
    <Screen withTabBar>
      <Intro title="Planning" />
      <Row style={{ justifyContent: 'space-between' }}>
        <IconButton icon={ChevronLeft} />
        <Text style={font.h3}>Mardi 27 octobre</Text>
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

const styles = StyleSheet.create({
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border },
  hourCell: { width: 44, height: 52, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.subtle },
  cell: { width: 108, height: 52, padding: 4, borderLeftWidth: 1, borderLeftColor: colors.border },
  head: { justifyContent: 'center', paddingHorizontal: 10, backgroundColor: colors.subtle },
  block: { flex: 1, borderRadius: radius.sm, backgroundColor: colors.primarySoft, paddingHorizontal: 8, justifyContent: 'center' },
});
