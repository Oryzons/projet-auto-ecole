import { Plus } from 'lucide-react-native';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button, Card, Divider, Intro, Row, Screen, Section, Toggle, TopBar } from '@/components/ui';
import { offers, promotions, unitPrices } from '@/data/mock';
import { colors, font } from '@/theme';

/** Gestion des tarifs, forfaits et promotions */
export default function AdminTarifs() {
  const [promo, setPromo] = useState(() => promotions.map((p) => p.active));
  return (
    <Screen>
      <TopBar title="Tarifs" />
      <Intro title="Tarifs et forfaits" />
      <Section title="Forfaits" action="Ajouter">
        <View style={{ gap: 10 }}>
          {offers.map((o) => (
            <Card key={o.id} style={{ gap: 6, padding: 14 }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Text style={[font.h3, { flex: 1 }]}>{o.name}</Text>
                <Text style={[font.h3, { color: colors.primary }]}>{o.price} €</Text>
              </Row>
              <Text style={font.small}>{o.detail}</Text>
              <Text style={font.tiny}>{o.students} élèves inscrits</Text>
            </Card>
          ))}
        </View>
      </Section>
      <Section title="Prestations à l’unité">
        <Card style={{ paddingVertical: 4 }}>
          {unitPrices.map((u, i) => (
            <View key={u.id}>
              {i > 0 ? <Divider /> : null}
              <Row style={{ justifyContent: 'space-between', paddingVertical: 12 }}>
                <Text style={font.body}>{u.name}</Text>
                <Text style={font.h3}>{u.price} €</Text>
              </Row>
            </View>
          ))}
        </Card>
      </Section>
      <Section title="Promotions">
        <Card style={{ paddingVertical: 4 }}>
          {promotions.map((p, i) => (
            <View key={p.id}>
              {i > 0 ? <Divider /> : null}
              <Row style={{ paddingVertical: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={font.h3}>
                    {p.name} · <Text style={{ color: colors.success }}>{p.value}</Text>
                  </Text>
                  <Text style={font.tiny}>{p.until}</Text>
                </View>
                <Toggle value={promo[i]} onChange={(v) => setPromo((x) => x.map((y, k) => (k === i ? v : y)))} />
              </Row>
            </View>
          ))}
        </Card>
        <Button variant="secondary" icon={Plus} label="Créer une promotion" />
      </Section>
    </Screen>
  );
}
