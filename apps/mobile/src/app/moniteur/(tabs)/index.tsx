import { router } from 'expo-router';
import { Bell, CalendarClock, CarFront, MapPin, PenLine, User } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { DayTimeline, ListCard, LiveCard, Notice, SectionLabel, StatStrip, TimeRow } from '@/components/blocks';
import { DetailList, SidePanel } from '@/components/panel';
import { Badge, Button, IconButton, Row, Screen } from '@/components/ui';
import { instructor, instructorDays, instructorLessons, plannedStudents } from '@/data/mock';
import { colors, font, radius } from '@/theme';

type Lesson = (typeof instructorLessons)[number];

/** Heure de démonstration : la maquette montre la journée du mardi 27 en début d'après-midi */
const DEMO_NOW = '14:25';
const minutes = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));
const typeColor = (type: string) => (type === 'Examen blanc' ? colors.violet : colors.primary);

/** Calendrier personnel des leçons du moniteur */
export default function MoniteurPlanning() {
  const [day, setDay] = useState('tue');
  const [open, setOpen] = useState<Lesson | null>(null);
  const now = minutes(DEMO_NOW);

  const state = (l: Lesson) => {
    if (l.status === 'done' || minutes(l.end) <= now) return 'done' as const;
    return minutes(l.start) <= now ? ('live' as const) : ('next' as const);
  };
  const live = instructorLessons.filter((l) => state(l) === 'live');
  const upcoming = instructorLessons.filter((l) => state(l) === 'next');
  const done = instructorLessons.filter((l) => state(l) === 'done');
  const reports = done.filter((l) => !l.reportDone).length;
  const totalHours = instructorLessons.reduce((n, l) => n + (minutes(l.end) - minutes(l.start)) / 60, 0);

  const enter = (i: number) => FadeInDown.delay(40 + i * 60).duration(360);

  return (
    <Screen withTabBar>
      <Row style={{ justifyContent: 'space-between' }}>
        <View>
          <Text style={styles.date}>MARDI 27 OCTOBRE</Text>
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

      <Animated.View entering={enter(0)}>
        <StatStrip
          items={[
            { label: 'Leçons', value: `${instructorLessons.length}` },
            { label: 'De conduite', value: `${totalHours} h` },
            { label: 'Comptes rendus', value: `${reports}`, tone: reports ? 'warning' : 'neutral' },
          ]}
        />
      </Animated.View>

      {live.length ? (
        <Animated.View entering={enter(1)} style={{ gap: 10 }}>
          <SectionLabel>En ce moment</SectionLabel>
          {live.map((l) => (
            <LiveCard
              key={l.id}
              title={l.student ?? ""}
              meta={`${l.place} · ${l.vehicle}`}
              remaining={`encore ${minutes(l.end) - now} min`}
              ratio={(now - minutes(l.start)) / (minutes(l.end) - minutes(l.start))}
              onPress={() => setOpen(l)}
            />
          ))}
        </Animated.View>
      ) : upcoming[0] ? (
        <Notice icon={CalendarClock} tone="primary" text={`Prochaine leçon à ${upcoming[0].start} · ${upcoming[0].student}`} onPress={() => setOpen(upcoming[0])} />
      ) : null}

      <Animated.View entering={enter(2)} style={{ gap: 10 }}>
        <SectionLabel>Ma journée</SectionLabel>
        <DayTimeline now={DEMO_NOW} blocks={instructorLessons.map((l) => ({ start: l.start, end: l.end, color: typeColor(l.type), done: state(l) === 'done' }))} />
      </Animated.View>

      {reports > 0 ? (
        <Notice icon={PenLine} text={`${reports} compte rendu à rédiger`} onPress={() => setOpen(done.find((l) => !l.reportDone) ?? null)} />
      ) : null}

      <Animated.View entering={enter(3)} style={{ gap: 8 }}>
        <SectionLabel count={upcoming.length}>À venir</SectionLabel>
        <ListCard>
          {upcoming.map((l) => (
            <TimeRow
              key={l.id}
              time={l.start}
              sub={`${minutes(l.end) - minutes(l.start)} min`}
              color={typeColor(l.type)}
              title={l.student ?? ""}
              detail={`${l.type} · ${l.place}`}
              onPress={() => setOpen(l)}
            />
          ))}
        </ListCard>
      </Animated.View>

      <Animated.View entering={enter(4)} style={{ gap: 8 }}>
        <SectionLabel count={done.length}>Terminées</SectionLabel>
        <ListCard>
          {done.map((l) => (
            <TimeRow
              key={l.id}
              time={l.start}
              sub={`${minutes(l.end) - minutes(l.start)} min`}
              color={typeColor(l.type)}
              title={l.student ?? ""}
              detail={l.place}
              muted={!!l.reportDone}
              right={!l.reportDone ? <Badge label="Compte rendu" tone="warning" icon={PenLine} /> : null}
              onPress={() => setOpen(l)}
            />
          ))}
        </ListCard>
      </Animated.View>

      <Text style={[font.tiny, { textAlign: 'center' }]}>Véhicule du jour : {instructor.vehicle}</Text>

      <SidePanel
        open={!!open}
        onClose={() => setOpen(null)}
        icon={open && state(open) === 'live' ? CarFront : User}
        tone={open && state(open) === 'live' ? 'success' : 'primary'}
        title={open?.student ?? ''}
        subtitle={open ? `${open.type} · ${open.start} – ${open.end}` : undefined}
        footer={
          open ? (
            <>
              {state(open) === 'done' && !open.reportDone ? (
                <Button label="Rédiger le compte rendu" icon={PenLine} onPress={() => (setOpen(null), router.push(`/moniteur/lecon/${open.id}`))} />
              ) : (
                <Button label="Ouvrir la leçon" onPress={() => (setOpen(null), router.push(`/moniteur/lecon/${open.id}`))} />
              )}
              <Button variant="secondary" label="Fiche de l’élève" onPress={() => (setOpen(null), router.push(`/moniteur/eleve/${plannedStudents.find((p) => p.name === open.student)?.id ?? 'lucas'}`))} />
            </>
          ) : null
        }>
        {open ? (
          <>
            {state(open) === 'live' ? (
              <LiveCard
                title="Leçon en cours"
                meta={`Depuis ${open.start}`}
                remaining={`encore ${minutes(open.end) - now} min`}
                ratio={(now - minutes(open.start)) / (minutes(open.end) - minutes(open.start))}
              />
            ) : null}
            <DetailList
              rows={[
                { label: 'Horaire', value: `${open.start} – ${open.end}` },
                { label: 'Lieu de rendez-vous', value: open.place },
                { label: 'Véhicule', value: open.vehicle ?? '—' },
                { label: 'Heures réalisées', value: `${open.hoursDone} h` },
                {
                  label: 'Statut',
                  value: state(open) === 'live' ? 'En cours' : state(open) === 'done' ? (open.reportDone ? 'Terminée' : 'Compte rendu à faire') : 'Prévue',
                  tone: state(open) === 'live' ? 'success' : state(open) === 'done' && !open.reportDone ? 'warning' : undefined,
                },
              ]}
            />
            <Row gap={8} style={{ flexWrap: 'wrap' }}>
              <Badge label={open.type} tone={open.type === 'Examen blanc' ? 'violet' : 'primary'} />
              <Row gap={4}>
                <MapPin size={13} color={colors.muted} />
                <Text style={font.tiny}>{open.place}</Text>
              </Row>
            </Row>
          </>
        ) : null}
      </SidePanel>
    </Screen>
  );
}

const styles = StyleSheet.create({
  date: { fontSize: 11, fontWeight: '600', color: colors.muted, letterSpacing: 0.4 },
  day: { width: 50, paddingVertical: 10, borderRadius: radius.md, alignItems: 'center', gap: 3, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  dayOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.primary },
});
