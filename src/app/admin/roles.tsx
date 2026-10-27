import { Check, Minus, Plus } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { Badge, Button, Card, Divider, Intro, Row, Screen, TopBar } from '@/components/ui';
import { permLabels, roles } from '@/data/mock';
import { colors, font } from '@/theme';

/** Gestion des rôles et permissions */
export default function AdminRoles() {
  return (
    <Screen>
      <TopBar title="Rôles" />
      <Intro title="Rôles et permissions" description="Définissez ce que chaque membre de l’équipe peut voir et modifier." />
      <View style={{ gap: 12 }}>
        {roles.map((r) => (
          <Card key={r.id} style={{ gap: 10 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Text style={font.h2}>{r.name}</Text>
              <Badge label={`${r.members} membres`} />
            </Row>
            <Divider />
            {Object.entries(r.perms).map(([k, on]) => (
              <Row key={k} gap={10}>
                {on ? <Check size={16} color={colors.success} /> : <Minus size={16} color={colors.faint} />}
                <Text style={[font.body, { fontSize: 14 }, !on && { color: colors.faint }]}>{permLabels[k]}</Text>
              </Row>
            ))}
          </Card>
        ))}
      </View>
      <Button variant="secondary" icon={Plus} label="Créer un rôle" />
    </Screen>
  );
}
