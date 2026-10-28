import { ArrowDownLeft, ArrowUpRight, Plus, Receipt } from 'lucide-react-native';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Badge, Button, Card, Chips, Divider, IconBox, Intro, Row, Screen, Section, Stat } from '@/components/ui';
import { financeDocs, payments } from '@/data/mock';
import { colors, font } from '@/theme';

const tabs = [
  { key: 'factures', label: 'Factures' },
  { key: 'devis', label: 'Devis' },
  { key: 'avoirs', label: 'Avoirs' },
  { key: 'echeanciers', label: 'Échéanciers' },
] as const;

const euro = (n: number) => `${n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} €`;

/** Factures, devis, avoirs, échéanciers, encaissements et remboursements */
export default function AdminFinances() {
  const [tab, setTab] = useState<string>('factures');
  const docs = financeDocs[tab as keyof typeof financeDocs];
  return (
    <Screen withTabBar>
      <Intro title="Finances" description="Octobre 2026" />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Stat label="Encaissé" value="41 910 €" hint="87 % du facturé" tone="success" />
        <Stat label="À encaisser" value="6 340 €" hint="dont 2 180 € en retard" tone="danger" />
      </View>

      <Section title="Documents">
        <Chips items={[...tabs]} value={tab} onChange={setTab} />
        <Card style={{ paddingVertical: 4 }}>
          {docs.map((d, i) => (
            <View key={d.id}>
              {i > 0 ? <Divider /> : null}
              <Row style={{ paddingVertical: 12 }}>
                <IconBox icon={Receipt} tone={d.tone} size={40} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={font.h3}>{d.who}</Text>
                  <Text style={font.tiny}>
                    {d.id} · {d.date}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Text style={font.h3}>{euro(d.amount)}</Text>
                  <Badge label={d.status} tone={d.tone} />
                </View>
              </Row>
            </View>
          ))}
        </Card>
        <Button variant="secondary" icon={Plus} label={`Nouveau ${tab === 'factures' ? 'document' : tab.slice(0, -1)}`} />
      </Section>

      <Section title="Derniers mouvements" action="Exporter">
        <Card style={{ paddingVertical: 4 }}>
          {payments.map((p, i) => {
            const refund = p.amount < 0;
            return (
              <View key={p.id}>
                {i > 0 ? <Divider /> : null}
                <Row style={{ paddingVertical: 12 }}>
                  <IconBox icon={refund ? ArrowUpRight : ArrowDownLeft} tone={refund ? 'danger' : 'success'} size={36} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={font.h3}>{p.who}</Text>
                    <Text style={font.tiny}>
                      {p.method} · {p.time}
                    </Text>
                  </View>
                  <Text style={[font.h3, { color: refund ? colors.danger : colors.success }]}>
                    {refund ? '' : '+'}
                    {euro(p.amount)}
                  </Text>
                </Row>
              </View>
            );
          })}
        </Card>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Button small variant="secondary" label="Encaisser" style={{ flex: 1 }} />
          <Button small variant="secondary" label="Rembourser" style={{ flex: 1 }} />
          <Button small variant="secondary" label="Paiement 3×/4×" style={{ flex: 1.3 }} />
        </View>
      </Section>
    </Screen>
  );
}
