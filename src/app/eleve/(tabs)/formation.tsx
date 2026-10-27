import { router } from 'expo-router';
import { ArrowUpRight, CalendarDays, ClipboardCheck, Signpost, TriangleAlert, Zap } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { Badge, Card, Divider, IconBox, Intro, Progress, Row, Screen, Section, TopBar } from '@/components/ui';
import { codeThemes, student, upcomingLessons } from '@/data/mock';
import { colors, font } from '@/theme';

/** Formation : code + parcours de conduite */
export default function EleveFormation() {
  const next = upcomingLessons[0];
  return (
    <Screen withTabBar>
      <TopBar title="Formation" back={false} />
      <Intro title="Ma formation" description="Code de la route et conduite, tout votre parcours." />

      <Card style={{ gap: 14 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Text style={font.h2}>Progression au code</Text>
          <Badge label="Prêt à 82 %" tone="success" />
        </Row>
        <Row style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 34, fontWeight: '800', color: colors.ink, letterSpacing: -1 }}>
            {student.code.score}
            <Text style={{ fontSize: 18, color: colors.faint }}>/{student.code.max}</Text>
          </Text>
          <Text style={font.small}>
            {student.code.series}/{student.code.seriesTotal} séries terminées
          </Text>
        </Row>
        <View style={{ gap: 6 }}>
          <Progress value={student.code.ratio} tone="success" />
          <Text style={font.tiny}>Moyenne des bonnes réponses sur les 5 dernières séries</Text>
        </View>
      </Card>

      <Section title="À poursuivre" action="Tous les thèmes">
        <Card style={{ paddingVertical: 6 }}>
          {codeThemes.map((t, i) => (
            <View key={t.id}>
              {i > 0 ? <Divider /> : null}
              <Row style={{ paddingVertical: 12 }}>
                <IconBox icon={t.icon === 'alert' ? TriangleAlert : Signpost} tone={t.icon === 'alert' ? 'warning' : 'primary'} />
                <View style={{ flex: 1, gap: 6 }}>
                  <Text style={font.h3}>{t.title}</Text>
                  <Text style={font.tiny}>{Math.round(t.progress * 100)} % du thème maîtrisé</Text>
                  <Progress value={t.progress} height={4} tone={t.icon === 'alert' ? 'warning' : 'primary'} />
                </View>
              </Row>
            </View>
          ))}
        </Card>
      </Section>

      <Section title="Entraînements et examens">
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TrainingCard icon={Zap} title="Série rapide" format="20 questions · environ 10 min" action="Lancer une série" />
          <TrainingCard icon={ClipboardCheck} title="Examen blanc" format="40 questions en conditions réelles" action="Démarrer" tone="violet" />
        </View>
      </Section>

      <Section title="Conduite" action="Compétences" onAction={() => router.push('/eleve/progression')}>
        <Card style={{ gap: 14 }}>
          <Row style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <View>
              <Text style={font.tiny}>{student.licence}</Text>
              <Text style={{ fontSize: 28, fontWeight: '800', color: colors.ink }}>
                {student.driving.done} h <Text style={{ fontSize: 15, color: colors.faint }}>/ {student.driving.total} h</Text>
              </Text>
            </View>
            <Badge label={`${student.driving.skills}/${student.driving.skillsTotal} acquis validés`} tone="success" />
          </Row>
          <View style={{ gap: 6 }}>
            <Progress value={student.driving.done / student.driving.total} />
            <Text style={font.tiny}>{student.balance.remainingHours} h restantes sur le forfait</Text>
          </View>
          <Divider />
          <Row>
            <CalendarDays size={20} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={font.h3}>
                {next.day} {next.date} · {next.start}
              </Text>
              <Text style={font.small}>Avec votre monitrice {next.instructor}</Text>
            </View>
          </Row>
        </Card>
      </Section>
    </Screen>
  );
}

function TrainingCard({ icon, title, format, action, tone = 'primary' }: { icon: typeof Zap; title: string; format: string; action: string; tone?: 'primary' | 'violet' }) {
  return (
    <Card style={{ flex: 1, gap: 12 }}>
      <IconBox icon={icon} tone={tone} size={38} />
      <View style={{ gap: 4 }}>
        <Text style={font.h3}>{title}</Text>
        <Text style={font.tiny}>{format}</Text>
      </View>
      <Pressable>
        <Row gap={4}>
          <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}>{action}</Text>
          <ArrowUpRight size={14} color={colors.primary} />
        </Row>
      </Pressable>
    </Card>
  );
}
