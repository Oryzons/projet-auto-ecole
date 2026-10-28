import { Plus } from 'lucide-react-native';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Badge, Button, Card, Divider, Intro, Row, Screen, Section, Toggle, TopBar } from '@/components/ui';
import { absences, weekAvailability } from '@/data/mock';
import { colors, font } from '@/theme';

/** Gestion des disponibilités et des absences */
export default function MoniteurDisponibilites() {
  const [week, setWeek] = useState(() => weekAvailability.map((d) => !d.off));
  return (
    <Screen withTabBar>
      <TopBar title="Disponibilités" back={false} />
      <Intro title="Mes disponibilités" description="Vos créneaux sont proposés aux élèves pour la réservation." />
      <Section title="Semaine type" action="Modifier les horaires">
        <Card style={{ paddingVertical: 4 }}>
          {weekAvailability.map((d, i) => (
            <View key={d.day}>
              {i > 0 ? <Divider /> : null}
              <Row style={{ paddingVertical: 12 }}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={font.h3}>{d.day}</Text>
                  <Text style={[font.tiny, !week[i] && { color: colors.faint }]}>{week[i] ? d.slots : 'Indisponible'}</Text>
                </View>
                <Toggle value={week[i]} onChange={(v) => setWeek((w) => w.map((x, k) => (k === i ? v : x)))} />
              </Row>
            </View>
          ))}
        </Card>
      </Section>
      <Section title="Absences et congés">
        <View style={{ gap: 10 }}>
          {absences.map((a) => (
            <Card key={a.id} style={{ padding: 14 }}>
              <Row>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={font.h3}>{a.label}</Text>
                  <Text style={font.tiny}>{a.range}</Text>
                </View>
                <Badge label={a.status} tone={a.tone} />
              </Row>
            </Card>
          ))}
          <Button variant="secondary" icon={Plus} label="Déclarer une absence" />
        </View>
      </Section>
    </Screen>
  );
}
