import { router } from 'expo-router';
import { Bell, CarFront, MapPin, PenLine } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge, Card, IconButton, Row, Screen, Stat } from '@/components/ui';
import { instructor, instructorDays, instructorLessons } from '@/data/mock';
import { colors, font, radius } from '@/theme';

/** Calendrier personnel des leçons du moniteur */
export default function MoniteurPlanning() {
  const [day, setDay] = useState('tue');
  const todo = instructorLessons.filter((l) => l.status === 'done' && !l.reportDone).length;

  return (
    <Screen withTabBar>
      <Row style={{ justifyContent: 'space-between' }}>
        <View>
          <Text style={font.small}>Mardi 27 octobre</Text>
          <Text style={font.title}>Bonjour Julie</Text>
        </View>
        <IconButton icon={Bell} />
      </Row>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {instructorDays.map((d) => {
          const on = d.key === day;
          return (
            <Pressable key={d.key} onPress={() => setDay(d.key)} style={[styles.day, on && styles.dayOn]}>
              <Text style={[font.tiny, on && { color: 'rgba(255,255,255,0.8)' }]}>{d.day}</Text>
              <Text style={[font.h3, { fontSize: 17 }, on && { color: '#fff' }]}>{d.date}</Text>
              <View style={[styles.dot, on && { backgroundColor: '#fff' }]} />
            </Pressable>
          );
        })}
      </View>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Stat label="Leçons aujourd’hui" value={`${instructorLessons.length}`} hint="6 h de conduite" tone="primary" />
        <Stat label="Comptes rendus" value={`${todo}`} hint="à rédiger" tone="warning" />
      </View>

      <View style={{ gap: 0 }}>
        {instructorLessons.map((l, i) => {
          const done = l.status === 'done';
          const needsReport = done && !l.reportDone;
          return (
            <View key={l.id} style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ width: 46, alignItems: 'flex-end', paddingTop: 16 }}>
                <Text style={[font.h3, { fontSize: 14 }, done && { color: colors.faint }]}>{l.start}</Text>
                <Text style={font.tiny}>{l.end}</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <View style={[styles.rail, i === 0 && { backgroundColor: 'transparent' }]} />
                <View style={[styles.node, done ? { backgroundColor: colors.success } : { borderColor: colors.primary, borderWidth: 2, backgroundColor: '#fff' }]} />
                <View style={[styles.rail, { flex: 1 }, i === instructorLessons.length - 1 && { backgroundColor: 'transparent' }]} />
              </View>
              <Card style={{ flex: 1, marginBottom: 12, gap: 8, padding: 14 }} onPress={() => router.push(`/moniteur/lecon/${l.id}`)}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Text style={font.h3}>{l.student}</Text>
                  {needsReport ? (
                    <Badge label="Compte rendu" tone="warning" icon={PenLine} />
                  ) : done ? (
                    <Badge label="Terminée" tone="success" />
                  ) : (
                    <Badge label={l.type} tone={l.type === 'Examen blanc' ? 'violet' : 'primary'} />
                  )}
                </Row>
                <Row gap={6}>
                  <MapPin size={13} color={colors.muted} />
                  <Text style={font.tiny}>{l.place}</Text>
                </Row>
                <Row gap={6}>
                  <CarFront size={13} color={colors.muted} />
                  <Text style={font.tiny}>
                    {l.vehicle} · {l.hoursDone} h réalisées
                  </Text>
                </Row>
              </Card>
            </View>
          );
        })}
      </View>
      <Text style={[font.tiny, { textAlign: 'center' }]}>Véhicule du jour : {instructor.vehicle}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  day: { width: 50, paddingVertical: 10, borderRadius: radius.md, alignItems: 'center', gap: 3, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  dayOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.primary },
  rail: { width: 2, height: 18, backgroundColor: colors.border },
  node: { width: 12, height: 12, borderRadius: 6 },
});
