import { router } from 'expo-router';
import { Bell, CircleCheck, FileCheck, FilePlus, Flag, LockKeyhole, LogOut, MessageCircle, Plus, TrendingUp } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Avatar, Badge, Card, Divider, ListItem, Progress, Row, Screen, Section, Toggle, TopBar } from '@/components/ui';
import { docStatus, documents, student } from '@/data/mock';
import { colors, font } from '@/theme';

/** Paramètres / profil élève */
export default function EleveReglages() {
  const [notif, setNotif] = useState(true);
  const fullName = `${student.firstName} ${student.lastName}`;

  return (
    <Screen withTabBar>
      <TopBar title="Mon compte" back={false} />

      <Section title="Profil" action="Modifier">
        <Row>
          <Avatar name={fullName} size={68} />
          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 24, fontWeight: '700', color: colors.ink }}>{fullName}</Text>
            <Badge label={student.status} tone="warning" />
          </View>
        </Row>
      </Section>

      <Section title="Informations personnelles" action="Modifier">
        <Card style={{ gap: 14 }}>
          <Info label="Adresse e-mail" value={student.email} />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Info label="Date de naissance" value={student.birthDate} />
            </View>
            <View style={{ flex: 1 }}>
              <Info label="Téléphone" value={student.phone} />
            </View>
          </View>
          <Info label="Adresse postale" value={student.address} />
        </Card>
      </Section>

      <Card style={{ gap: 14 }} tone="soft">
        <Row style={{ justifyContent: 'space-between' }}>
          <Text style={font.h2}>Progression du parcours</Text>
          <TrendingUp size={20} color={colors.primary} />
        </Row>
        <View style={{ gap: 8 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Text style={font.small}>Code · bonnes réponses</Text>
            <Text style={font.h3}>{Math.round(student.code.ratio * 100)} %</Text>
          </Row>
          <Progress value={student.code.ratio} tone="success" />
        </View>
        <View style={{ gap: 8 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Text style={font.small}>Conduite · heures réalisées</Text>
            <Text style={font.h3}>
              {student.driving.done}/{student.driving.total} h
            </Text>
          </Row>
          <Progress value={student.driving.done / student.driving.total} />
        </View>
      </Card>

      <Section title="Mon permis et ma formule" action="Modifier">
        <Card style={{ gap: 12 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Text style={font.h3}>{student.licence}</Text>
            <Text style={[font.small, { color: colors.primary, fontWeight: '600' }]}>{student.formula}</Text>
          </Row>
          <Row style={{ justifyContent: 'space-between' }}>
            <Text style={font.small}>Dossier</Text>
            <Text style={[font.small, { color: colors.ink }]}>{student.fileNumber}</Text>
          </Row>
          <Divider />
          <Row gap={8}>
            <Flag size={15} color={colors.primary} />
            <Text style={font.small}>{student.goalDate}</Text>
          </Row>
          <Text style={font.body}>{student.availability}</Text>
        </Card>
      </Section>

      <Section title="Documents administratifs" action="Tout voir" onAction={() => router.push('/eleve/documents')}>
        <Card style={{ paddingVertical: 4 }}>
          {documents.slice(0, 3).map((d, i) => {
            const s = docStatus[d.status];
            const ok = d.status === 'accepted';
            return (
              <View key={d.id}>
                {i > 0 ? <Divider /> : null}
                <ListItem
                  icon={ok ? FileCheck : FilePlus}
                  tone={s.tone}
                  title={d.name}
                  subtitle={s.label}
                  right={ok ? <CircleCheck size={17} color={colors.success} /> : <Plus size={17} color={colors.primary} />}
                  onPress={() => router.push('/eleve/documents')}
                />
              </View>
            );
          })}
        </Card>
      </Section>

      <Section title="Réglages du compte">
        <Card style={{ paddingVertical: 4 }}>
          <ListItem icon={Bell} title="Notifications e-mail et SMS" right={<Toggle value={notif} onChange={setNotif} />} />
          <Divider />
          <ListItem icon={LockKeyhole} title="Mot de passe et sécurité" chevron onPress={() => {}} />
          <Divider />
          <ListItem icon={MessageCircle} title="Aide et contact" chevron onPress={() => router.push('/eleve/messages')} />
        </Card>
        <Pressable onPress={() => router.replace('/')}>
          <Row gap={8} style={{ justifyContent: 'center', paddingVertical: 10 }}>
            <LogOut size={16} color={colors.danger} />
            <Text style={{ color: colors.danger, fontWeight: '600' }}>Se déconnecter</Text>
          </Row>
        </Pressable>
      </Section>
    </Screen>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ gap: 3 }}>
      <Text style={font.tiny}>{label}</Text>
      <Text style={[font.body, { fontWeight: '500' }]}>{value}</Text>
    </View>
  );
}
