import { CircleCheck, CircleX, MapPin, Plus } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { Avatar, Badge, Button, Card, Divider, Intro, Row, Screen, Section, Stat, TopBar } from '@/components/ui';
import { examResults, exams } from '@/data/mock';
import { colors, font } from '@/theme';

/** Gestion des examens et des résultats */
export default function AdminExamens() {
  return (
    <Screen>
      <TopBar title="Examens" />
      <Intro title="Examens et résultats" />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Stat label="Réussite code" value="84 %" hint="12 derniers mois" tone="success" />
        <Stat label="Réussite conduite" value="71 %" hint="1re présentation" tone="primary" />
      </View>
      <Section title="Sessions à venir" action="Ajouter">
        <View style={{ gap: 10 }}>
          {exams.map((x) => (
            <Card key={x.id} style={{ gap: 10, padding: 14 }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Badge label={x.type} tone={x.type === 'Code' ? 'violet' : 'primary'} />
                <Text style={font.tiny}>
                  {x.students.length}/{x.seats} places
                </Text>
              </Row>
              <Text style={font.h2}>{x.date}</Text>
              <Row gap={6}>
                <MapPin size={13} color={colors.muted} />
                <Text style={font.tiny}>{x.place}</Text>
              </Row>
              {x.students.length ? (
                <Row gap={0}>
                  {x.students.map((s, i) => (
                    <View key={s} style={{ marginLeft: i ? -8 : 0, borderRadius: 16, borderWidth: 2, borderColor: colors.card }}>
                      <Avatar name={s} size={30} />
                    </View>
                  ))}
                  <Text style={[font.tiny, { marginLeft: 10, flex: 1 }]} numberOfLines={2}>
                    {x.students.join(', ')}
                  </Text>
                </Row>
              ) : (
                <Button small variant="secondary" icon={Plus} label="Inscrire des élèves" />
              )}
            </Card>
          ))}
        </View>
      </Section>
      <Section title="Derniers résultats">
        <Card style={{ paddingVertical: 4 }}>
          {examResults.map((r, i) => (
            <View key={r.id}>
              {i > 0 ? <Divider /> : null}
              <Row style={{ paddingVertical: 12 }}>
                {r.ok ? <CircleCheck size={20} color={colors.success} /> : <CircleX size={20} color={colors.danger} />}
                <View style={{ flex: 1 }}>
                  <Text style={font.h3}>{r.student}</Text>
                  <Text style={font.tiny}>
                    {r.type} · {r.date}
                  </Text>
                </View>
                <Badge label={r.ok ? 'Reçu' : 'Ajourné'} tone={r.ok ? 'success' : 'danger'} />
              </Row>
            </View>
          ))}
        </Card>
      </Section>
    </Screen>
  );
}
