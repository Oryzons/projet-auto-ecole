import { CarFront, Plus } from 'lucide-react-native';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Avatar, Badge, Button, Card, Chips, IconBox, Intro, Progress, Row, Screen, TopBar } from '@/components/ui';
import { instructors, vehicles } from '@/data/mock';
import { font } from '@/theme';

/** Gestion des moniteurs, véhicules et disponibilités */
export default function AdminEquipe() {
  const [tab, setTab] = useState('moniteurs');
  return (
    <Screen>
      <TopBar title="Équipe" />
      <Intro title="Moniteurs et véhicules" />
      <Chips
        value={tab}
        onChange={setTab}
        items={[
          { key: 'moniteurs', label: 'Moniteurs', count: instructors.length },
          { key: 'vehicules', label: 'Véhicules', count: vehicles.length },
        ]}
      />
      <View style={{ gap: 10 }}>
        {tab === 'moniteurs'
          ? instructors.map((m) => (
              <Card key={m.id} style={{ gap: 10, padding: 14 }}>
                <Row>
                  <Avatar name={m.name} />
                  <View style={{ flex: 1 }}>
                    <Text style={font.h3}>{m.name}</Text>
                    <Text style={font.tiny}>{m.role}</Text>
                  </View>
                  <Badge label={m.today} tone={m.today === 'Absent' ? 'warning' : 'primary'} />
                </Row>
                <Text style={font.tiny}>
                  {m.vehicle} · planning rempli à {Math.round(m.load * 100)} % cette semaine
                </Text>
                <Progress value={m.load} height={4} />
              </Card>
            ))
          : vehicles.map((v) => (
              <Card key={v.id} style={{ padding: 14 }}>
                <Row>
                  <IconBox icon={CarFront} tone={v.tone} />
                  <View style={{ flex: 1 }}>
                    <Text style={font.h3}>{v.name}</Text>
                    <Text style={font.tiny}>
                      {v.plate} · {v.type} · {v.km}
                    </Text>
                  </View>
                  <Badge label={v.status} tone={v.tone} />
                </Row>
              </Card>
            ))}
      </View>
      <Button variant="secondary" icon={Plus} label={tab === 'moniteurs' ? 'Ajouter un moniteur' : 'Ajouter un véhicule'} />
    </Screen>
  );
}
