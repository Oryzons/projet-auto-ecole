import { router, useLocalSearchParams } from 'expo-router';
import { MessageCircle } from 'lucide-react-native';
import { Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AnimatedBar, ListCard, SectionLabel, StatStrip, TimeRow } from '@/components/blocks';
import { RemcGrid } from '@/components/remc';
import { Avatar, Badge, Button, Row, Screen, Section, TopBar } from '@/components/ui';
import { instructorWeek as instructorLessons, plannedStudents } from '@/data/mock';
import { colors, font, toneColors } from '@/theme';

const minutes = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));

/** Fiche élève vue par le moniteur (progression, sans données de paiement) */
export default function MoniteurFicheEleve() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const s = plannedStudents.find((x) => x.id === id) ?? plannedStudents[0];
  const [done, total] = s.hours.replace(' h', '').split('/').map(Number);
  const near = s.progress >= 0.75;
  const tone = near ? toneColors.success : toneColors.primary;
  const lessons = instructorLessons.filter((l) => l.student === s.name);

  return (
    <Screen>
      <TopBar title="Fiche élève" />
      <Animated.View entering={FadeInDown.duration(320)}>
        <Row>
          <Avatar name={s.name} size={60} tone={near ? 'success' : 'primary'} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={font.h2}>{s.name}</Text>
            <Text style={font.small}>{s.licence}</Text>
            <Badge label={near ? 'Prêt pour l’examen blanc' : 'En formation'} tone={near ? 'success' : 'primary'} />
          </View>
        </Row>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(60).duration(320)} style={{ gap: 14 }}>
        <StatStrip
          items={[
            { label: 'Heures faites', value: `${done} h` },
            { label: 'Restantes', value: `${Math.max(0, total - done)} h`, tone: 'primary' },
            { label: 'Progression', value: `${Math.round(s.progress * 100)} %`, tone: near ? 'success' : 'neutral' },
          ]}
        />
        <AnimatedBar value={s.progress} color={tone.fg} height={8} delay={200} />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(120).duration(320)} style={{ gap: 8 }}>
        <SectionLabel count={lessons.length}>Leçons avec vous aujourd’hui</SectionLabel>
        {lessons.length ? (
          <ListCard>
            {lessons.map((l) => (
              <TimeRow
                key={l.id}
                time={l.start}
                sub={`${minutes(l.end) - minutes(l.start)} min`}
                color={l.type === 'Examen blanc' ? colors.violet : colors.primary}
                title={l.type}
                detail={l.place}
                onPress={() => router.push(`/moniteur/lecon/${l.id}`)}
              />
            ))}
          </ListCard>
        ) : (
          <Text style={[font.small, { textAlign: 'center', padding: 14, borderRadius: 14, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.border }]}>Prochaine leçon : {s.next}</Text>
        )}
      </Animated.View>

      <Button variant="secondary" icon={MessageCircle} label="Envoyer un message" onPress={() => router.push('/moniteur/conversation/julie')} />
      <Section title="Livret REMC">
        <RemcGrid />
      </Section>
    </Screen>
  );
}
