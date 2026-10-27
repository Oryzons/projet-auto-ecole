import { router } from 'expo-router';
import { Bell, FileCheck, TrendingUp } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { Badge, Button, Card, Divider, IconButton, ListItem, Row, Screen, Section, Stat } from '@/components/ui';
import { adminKpis, docsToReview, recentActivity, revenueByMonth, school } from '@/data/mock';
import { colors, font, toneColors } from '@/theme';

const euro = (n: number) => `${n.toLocaleString('fr-FR')} €`;

/** Tableau de bord : chiffre d'affaires, impayés, pièces à vérifier, activité */
export default function AdminDashboard() {
  const max = Math.max(...revenueByMonth.map((r) => r.v));
  return (
    <Screen withTabBar>
      <Row style={{ justifyContent: 'space-between' }}>
        <View>
          <Text style={font.small}>
            {school.name} · {school.city}
          </Text>
          <Text style={font.title}>Tableau de bord</Text>
        </View>
        <IconButton icon={Bell} />
      </Row>

      <Card style={{ gap: 16 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <View>
            <Text style={font.small}>Chiffre d’affaires · octobre</Text>
            <Text style={{ fontSize: 32, fontWeight: '800', color: colors.ink, letterSpacing: -1 }}>{euro(adminKpis.revenueMonth)}</Text>
          </View>
          <Badge label={adminKpis.revenueDelta} tone="success" icon={TrendingUp} />
        </Row>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10, height: 110 }}>
          {revenueByMonth.map((r, i) => {
            const last = i === revenueByMonth.length - 1;
            return (
              <View key={r.m} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
                <View style={{ width: '100%', height: (r.v / max) * 84, borderRadius: 6, backgroundColor: last ? colors.primary : colors.primarySoft }} />
                <Text style={[font.tiny, last && { color: colors.ink, fontWeight: '700' }]}>{r.m}</Text>
              </View>
            );
          })}
        </View>
      </Card>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Stat label="Impayés" value={euro(adminKpis.unpaid)} hint={`${adminKpis.unpaidCount} élèves concernés`} tone="danger" />
        <Stat label="Élèves actifs" value={`${adminKpis.activeStudents}`} hint="+11 ce mois" tone="success" />
      </View>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Stat label="Leçons aujourd’hui" value={`${adminKpis.lessonsToday}`} hint="4 moniteurs" tone="primary" />
        <Stat label="Réussite examen" value={`${Math.round(adminKpis.successRate * 100)} %`} hint="Moyenne nationale 59 %" tone="primary" />
      </View>

      <Section title={`Pièces à vérifier (${adminKpis.docsToReview})`} action="Tout voir" onAction={() => router.push('/admin/eleves')}>
        <Card style={{ paddingVertical: 4 }}>
          {docsToReview.map((d, i) => (
            <View key={d.id}>
              {i > 0 ? <Divider /> : null}
              <ListItem icon={FileCheck} tone="warning" title={d.doc} subtitle={`${d.student} · ${d.sent}`} chevron onPress={() => router.push('/admin/eleve/lucas')} />
            </View>
          ))}
        </Card>
      </Section>

      <Section title="Activité récente">
        <Card style={{ gap: 14 }}>
          {recentActivity.map((a) => (
            <Row key={a.id} style={{ alignItems: 'flex-start' }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, marginTop: 6, backgroundColor: toneColors[a.tone].fg }} />
              <Text style={[font.body, { flex: 1, fontSize: 14 }]}>{a.text}</Text>
              <Text style={font.tiny}>{a.time}</Text>
            </Row>
          ))}
        </Card>
      </Section>
      <Button variant="secondary" label="Relancer les impayés" onPress={() => router.push('/admin/finances')} />
    </Screen>
  );
}
