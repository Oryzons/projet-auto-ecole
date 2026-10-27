import { router } from 'expo-router';
import { Bell, CarFront, LockKeyhole, LogOut, Smartphone } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Avatar, Card, Divider, ListItem, Row, Screen, Section, Stat, Toggle, TopBar } from '@/components/ui';
import { instructor } from '@/data/mock';
import { colors, font } from '@/theme';

export default function MoniteurProfil() {
  const [push, setPush] = useState(true);
  const [mail, setMail] = useState(false);
  return (
    <Screen withTabBar>
      <TopBar title="Profil" back={false} />
      <Row>
        <Avatar name={instructor.name} size={68} />
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 24, fontWeight: '700', color: colors.ink }}>{instructor.name}</Text>
          <Text style={font.small}>{instructor.licence}</Text>
        </View>
      </Row>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Stat label="Heures ce mois" value="112 h" hint="+8 % vs sept." tone="success" />
        <Stat label="Taux de réussite" value="78 %" hint="sur 12 mois" tone="primary" />
      </View>
      <Section title="Véhicule attitré">
        <Card>
          <ListItem icon={CarFront} title="Renault Clio V" subtitle="GH-412-KL · Manuelle · double commande" />
        </Card>
      </Section>
      <Section title="Notifications">
        <Card style={{ paddingVertical: 4 }}>
          <ListItem icon={Smartphone} title="Notifications sur le téléphone" subtitle="Nouvelle réservation, annulation" right={<Toggle value={push} onChange={setPush} />} />
          <Divider />
          <ListItem icon={Bell} title="Récapitulatif par e-mail" subtitle="Planning du lendemain à 19 h" right={<Toggle value={mail} onChange={setMail} />} />
          <Divider />
          <ListItem icon={LockKeyhole} title="Mot de passe et sécurité" chevron onPress={() => {}} />
        </Card>
      </Section>
      <Pressable onPress={() => router.replace('/')}>
        <Row gap={8} style={{ justifyContent: 'center', paddingVertical: 10 }}>
          <LogOut size={16} color={colors.danger} />
          <Text style={{ color: colors.danger, fontWeight: '600' }}>Se déconnecter</Text>
        </Row>
      </Pressable>
    </Screen>
  );
}
