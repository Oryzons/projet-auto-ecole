import { router } from 'expo-router';
import { LockKeyhole } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { Avatar, Card, Intro, Progress, Row, Screen, TopBar } from '@/components/ui';
import { plannedStudents } from '@/data/mock';
import { colors, font } from '@/theme';

/** Accès limité : uniquement les élèves planifiés avec ce moniteur */
export default function MoniteurEleves() {
  return (
    <Screen withTabBar>
      <TopBar title="Élèves" back={false} />
      <Intro title="Mes élèves" description="Les élèves que vous avez au planning cette semaine et la suivante." />
      <Row gap={8} style={{ padding: 12, borderRadius: 12, backgroundColor: colors.primarySoft }}>
        <LockKeyhole size={16} color={colors.primary} />
        <Text style={[font.small, { flex: 1, color: colors.primaryStrong }]}>Accès limité aux élèves planifiés. Les données de paiement ne sont pas visibles.</Text>
      </Row>
      <View style={{ gap: 10 }}>
        {plannedStudents.map((s) => (
          <Card key={s.id} onPress={() => router.push(`/moniteur/eleve/${s.id}`)} style={{ gap: 12 }}>
            <Row>
              <Avatar name={s.name} />
              <View style={{ flex: 1 }}>
                <Text style={font.h3}>{s.name}</Text>
                <Text style={font.tiny}>{s.licence}</Text>
              </View>
              <Text style={[font.h3, { fontSize: 14 }]}>{s.hours}</Text>
            </Row>
            <Progress value={s.progress} tone={s.progress > 0.75 ? 'success' : 'primary'} />
            <Text style={font.tiny}>Prochaine leçon : {s.next}</Text>
          </Card>
        ))}
      </View>
    </Screen>
  );
}
