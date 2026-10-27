import { router, useLocalSearchParams } from 'expo-router';
import { MessageCircle } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { RemcGrid } from '@/components/remc';
import { Avatar, Button, Card, Progress, Row, Screen, Section, Stat, TopBar } from '@/components/ui';
import { plannedStudents } from '@/data/mock';
import { font } from '@/theme';

/** Fiche élève vue par le moniteur (progression, sans données de paiement) */
export default function MoniteurFicheEleve() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const s = plannedStudents.find((x) => x.id === id) ?? plannedStudents[0];
  return (
    <Screen>
      <TopBar title="Fiche élève" />
      <Row>
        <Avatar name={s.name} size={60} />
        <View style={{ flex: 1 }}>
          <Text style={font.h2}>{s.name}</Text>
          <Text style={font.small}>{s.licence}</Text>
        </View>
      </Row>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Stat label="Heures" value={s.hours} />
        <Stat label="Prochaine leçon" value={s.next.split(' · ')[1] ?? ''} hint={s.next.split(' · ')[0]} tone="primary" />
      </View>
      <Card style={{ gap: 8 }}>
        <Text style={font.h3}>Progression globale</Text>
        <Progress value={s.progress} />
      </Card>
      <Button variant="secondary" icon={MessageCircle} label="Envoyer un message" onPress={() => router.push('/moniteur/conversation/julie')} />
      <Section title="Livret REMC">
        <RemcGrid />
      </Section>
    </Screen>
  );
}
