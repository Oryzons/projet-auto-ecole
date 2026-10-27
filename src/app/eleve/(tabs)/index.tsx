import { router } from 'expo-router';
import { Bell, CalendarDays, CarFront, ChevronRight, CreditCard, FilePen, TriangleAlert, Upload } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { Avatar, Badge, Button, Card, Divider, IconButton, ListItem, Progress, Row, Screen, Section, Stat } from '@/components/ui';
import { documents, student, upcomingLessons } from '@/data/mock';
import { colors, font } from '@/theme';

/** Tableau de bord élève */
export default function EleveAccueil() {
  const next = upcomingLessons[0];
  const docsOk = documents.filter((d) => d.status === 'accepted').length;
  const refused = documents.filter((d) => d.status === 'refused').length;

  return (
    <Screen withTabBar>
      <Row style={{ justifyContent: 'space-between' }}>
        <Row gap={10}>
          <Avatar name={`${student.firstName} ${student.lastName}`} />
          <View>
            <Text style={font.small}>Bonjour,</Text>
            <Text style={font.h2}>{student.firstName} 👋</Text>
          </View>
        </Row>
        <IconButton icon={Bell} />
      </Row>

      {/* Prochaine leçon */}
      <Card tone="primary" style={{ gap: 14 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontWeight: '600', fontSize: 13 }}>Prochaine leçon</Text>
          <View style={{ backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 }}>
            <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{next.type}</Text>
          </View>
        </Row>
        <View style={{ gap: 4 }}>
          <Text style={{ color: '#fff', fontSize: 24, fontWeight: '700' }}>
            {next.day} {next.date} · {next.start}
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>
            avec {next.instructor} · {next.place}
          </Text>
        </View>
        <Row gap={8}>
          <CarFront size={16} color="rgba(255,255,255,0.85)" />
          <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>{next.vehicle}</Text>
        </Row>
      </Card>

      {/* Forfait */}
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Stat label="Heures restantes" value={`${student.balance.remainingHours} h`} hint={student.formula} tone="primary" />
        <Stat label="Reste à payer" value={`${student.balance.due} €`} hint="Échéance le 21 nov." tone="warning" />
      </View>

      {refused ? (
        <Card onPress={() => router.push('/eleve/documents')} style={{ backgroundColor: colors.dangerSoft, borderColor: '#F7D4D4' }}>
          <Row>
            <TriangleAlert size={20} color={colors.danger} />
            <View style={{ flex: 1 }}>
              <Text style={[font.h3, { color: colors.danger }]}>1 document refusé</Text>
              <Text style={font.small}>Justificatif de domicile : document trop ancien</Text>
            </View>
            <ChevronRight size={18} color={colors.danger} />
          </Row>
        </Card>
      ) : null}

      {/* Progression */}
      <Section title="Ma progression" action="Détails" onAction={() => router.push('/eleve/progression')}>
        <Card style={{ gap: 14 }}>
          <View style={{ gap: 8 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Text style={font.h3}>Code de la route</Text>
              <Text style={[font.small, { fontWeight: '700', color: colors.ink }]}>{Math.round(student.code.ratio * 100)} %</Text>
            </Row>
            <Progress value={student.code.ratio} tone="success" />
          </View>
          <View style={{ gap: 8 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Text style={font.h3}>Conduite</Text>
              <Text style={[font.small, { fontWeight: '700', color: colors.ink }]}>
                {student.driving.done}/{student.driving.total} h
              </Text>
            </Row>
            <Progress value={student.driving.done / student.driving.total} />
          </View>
        </Card>
      </Section>

      {/* Mon dossier */}
      <Section title="Mon dossier">
        <Card style={{ paddingVertical: 6 }}>
          <ListItem
            icon={Upload}
            title="Pièces justificatives"
            subtitle={`${docsOk}/${documents.length} acceptées`}
            right={<Badge label="Action requise" tone="danger" />}
            onPress={() => router.push('/eleve/documents')}
          />
          <Divider inset={52} />
          <ListItem icon={FilePen} tone="violet" title="Contrat de formation" subtitle="À signer électroniquement" chevron onPress={() => router.push('/eleve/contrat')} />
          <Divider inset={52} />
          <ListItem icon={CreditCard} tone="success" title="Paiements et factures" subtitle={`${student.balance.paid} € réglés sur ${student.balance.total} €`} chevron onPress={() => router.push('/eleve/paiements')} />
        </Card>
      </Section>

      <Button label="Réserver une leçon" icon={CalendarDays} onPress={() => router.push('/eleve/lecons')} />
    </Screen>
  );
}
