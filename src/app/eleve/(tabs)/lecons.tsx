import { CalendarDays, Clock3, MapPin, X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar, Badge, Button, Card, Chips, Intro, Row, Screen, Section, Stat, TopBar } from '@/components/ui';
import { bookingDays, bookingSlots, pastLessons, student, upcomingLessons } from '@/data/mock';
import { colors, font, radius } from '@/theme';

/** Réserver une leçon + mes leçons à venir / passées */
export default function EleveLecons() {
  const [tab, setTab] = useState('book');
  const [day, setDay] = useState('29');
  const [slot, setSlot] = useState<string | null>('b5');
  const [instructor, setInstructor] = useState('all');

  const slots = bookingSlots.filter((s) => instructor === 'all' || s.instructor.startsWith(instructor));

  return (
    <Screen withTabBar>
      <TopBar title="Leçons" back={false} />
      <Intro title="Réserver une leçon" description={`Il vous reste ${student.balance.remainingHours} h de conduite sur votre forfait.`} />
      <Chips
        value={tab}
        onChange={setTab}
        items={[
          { key: 'book', label: 'Réserver' },
          { key: 'next', label: 'À venir', count: upcomingLessons.length },
          { key: 'past', label: 'Passées' },
        ]}
      />

      {tab === 'book' ? (
        <>
          <Section title="Choisissez un jour" action="Octobre 2026">
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              {bookingDays.map((d) => {
                const on = d.key === day;
                return (
                  <Pressable key={d.key} onPress={() => setDay(d.key)} style={[styles.day, on && styles.dayOn]}>
                    <Text style={[font.tiny, on && { color: 'rgba(255,255,255,0.8)' }]}>{d.day}</Text>
                    <Text style={[font.h3, { fontSize: 17 }, on && { color: '#fff' }]}>{d.date}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Section>
          <Section title="Moniteur">
            <Chips
              value={instructor}
              onChange={setInstructor}
              items={[
                { key: 'all', label: 'Tous' },
                { key: 'Julie', label: 'Julie B.' },
                { key: 'Karim', label: 'Karim H.' },
                { key: 'Sophie', label: 'Sophie L.' },
              ]}
            />
          </Section>
          <Section title="Créneaux disponibles">
            <View style={{ gap: 8 }}>
              {slots.map((s) => {
                const on = slot === s.id;
                return (
                  <Pressable key={s.id} disabled={!s.free} onPress={() => setSlot(s.id)} style={[styles.slot, on && styles.slotOn, !s.free && { opacity: 0.45 }]}>
                    <Text style={[font.h3, { width: 112 }, on && { color: colors.primary }]}>
                      {s.start} – {s.end}
                    </Text>
                    <Avatar name={s.instructor} size={28} tone={on ? 'primary' : 'neutral'} />
                    <Text style={[font.small, { flex: 1 }]}>{s.instructor}</Text>
                    {!s.free ? <Badge label="Complet" /> : null}
                  </Pressable>
                );
              })}
            </View>
          </Section>
          <Card tone="soft" style={{ gap: 6 }}>
            <Row gap={8}>
              <MapPin size={16} color={colors.primary} />
              <Text style={font.small}>Départ : Agence Jean Macé, 12 av. Jean Jaurès</Text>
            </Row>
            <Row gap={8}>
              <Clock3 size={16} color={colors.primary} />
              <Text style={font.small}>Annulation gratuite jusqu’à 48 h avant</Text>
            </Row>
          </Card>
          <Button label="Confirmer la réservation" icon={CalendarDays} />
        </>
      ) : (
        <View style={{ gap: 10 }}>
          {(tab === 'next' ? upcomingLessons : pastLessons).map((l) => (
            <Card key={l.id} style={{ gap: 12 }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Badge label={l.type} tone={l.type === 'Code' ? 'violet' : 'primary'} />
                {tab === 'past' ? <Badge label="Réalisée" tone="success" /> : null}
              </Row>
              <View style={{ gap: 2 }}>
                <Text style={font.h2}>
                  {l.day} {l.date} · {l.start} – {l.end}
                </Text>
                <Text style={font.small}>
                  {l.instructor} · {l.place}
                </Text>
              </View>
              {tab === 'next' ? <Button small variant="danger" icon={X} label="Annuler la leçon" /> : <Button small variant="secondary" label="Voir le compte rendu" />}
            </Card>
          ))}
        </View>
      )}
      {tab === 'book' ? null : (
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Stat label="Heures réalisées" value={`${student.driving.done} h`} />
          <Stat label="Heures restantes" value={`${student.balance.remainingHours} h`} tone="primary" hint="Ajouter des heures" />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  day: { width: 44, paddingVertical: 10, borderRadius: radius.md, alignItems: 'center', gap: 2, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  dayOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  slot: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: radius.md, backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border },
  slotOn: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
});
