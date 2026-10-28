import { router } from 'expo-router';
import { Plus, Search } from 'lucide-react-native';
import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import { Avatar, Badge, Card, Chips, IconButton, Intro, Row, Screen } from '@/components/ui';
import { adminStudents } from '@/data/mock';
import { colors, font, radius } from '@/theme';

const filters = [
  { key: 'all', label: 'Tous', count: adminStudents.length },
  { key: 'warning', label: 'Pièces à vérifier' },
  { key: 'danger', label: 'Impayés' },
  { key: 'violet', label: 'Examen' },
];

/** Gestion des élèves : dossiers, documents, paiements, progression */
export default function AdminEleves() {
  const [filter, setFilter] = useState('all');
  const list = adminStudents.filter((s) => filter === 'all' || s.tone === filter);
  return (
    <Screen withTabBar>
      <Row style={{ justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <Intro title="Élèves" description="186 dossiers actifs" />
        </View>
        <IconButton icon={Plus} tone="primary" />
      </Row>
      <View style={{ height: 48, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16 }}>
        <Search size={19} color={colors.faint} />
        <TextInput placeholder="Nom, e-mail, n° de dossier…" placeholderTextColor={colors.faint} style={{ flex: 1, fontSize: 15 }} />
      </View>
      <Chips items={filters} value={filter} onChange={setFilter} />
      <View style={{ gap: 10 }}>
        {list.map((s) => (
          <Card key={s.id} onPress={() => router.push(`/admin/eleve/${s.id}`)} style={{ gap: 12, padding: 14 }}>
            <Row>
              <Avatar name={s.name} tone={s.tone} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={font.h3}>{s.name}</Text>
                <Text style={font.tiny}>{s.licence}</Text>
              </View>
              <Badge label={s.step} tone={s.tone} />
            </Row>
            <Row style={{ justifyContent: 'space-between' }}>
              <Text style={font.tiny}>Pièces {s.docs}</Text>
              <Text style={[font.tiny, s.balance > 0 && { color: colors.danger, fontWeight: '700' }]}>{s.balance > 0 ? `Reste ${s.balance} €` : 'À jour des paiements'}</Text>
            </Row>
          </Card>
        ))}
      </View>
    </Screen>
  );
}
