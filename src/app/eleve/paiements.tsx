import { CreditCard, Download, Receipt } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { Badge, Button, Card, Divider, IconBox, Intro, Row, Screen, Section, TopBar } from '@/components/ui';
import { invoices, student } from '@/data/mock';
import { colors, font } from '@/theme';

/** Forfait, heures restantes, paiement en ligne et factures */
export default function ElevePaiements() {
  const b = student.balance;
  return (
    <Screen>
      <TopBar title="Paiements" />
      <Intro title="Forfait et factures" />

      <Card tone="primary" style={{ gap: 12 }}>
        <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600' }}>{student.formula} · Permis B</Text>
        <Text style={{ color: '#fff', fontSize: 32, fontWeight: '800' }}>
          {b.paid} € <Text style={{ fontSize: 16, color: 'rgba(255,255,255,0.75)' }}>réglés sur {b.total} €</Text>
        </Text>
        <View style={{ height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.25)' }}>
          <View style={{ width: `${(b.paid / b.total) * 100}%`, height: 6, borderRadius: 3, backgroundColor: '#fff' }} />
        </View>
        <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>
          Prochaine échéance : {b.due} € le 21 nov. · {b.remainingHours} h de conduite restantes
        </Text>
      </Card>

      <Button label={`Payer ${b.due} € maintenant`} icon={CreditCard} />

      <Section title="Mes factures">
        <Card style={{ paddingVertical: 4 }}>
          {invoices.map((inv, i) => (
            <View key={inv.id}>
              {i > 0 ? <Divider /> : null}
              <Row style={{ paddingVertical: 12 }}>
                <IconBox icon={Receipt} tone={inv.status === 'paid' ? 'success' : 'warning'} size={40} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={font.h3}>{inv.label}</Text>
                  <Text style={font.tiny}>
                    {inv.id} · {inv.date}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Text style={font.h3}>{inv.amount} €</Text>
                  {inv.status === 'paid' ? <Download size={16} color={colors.primary} /> : <Badge label="À venir" tone="warning" />}
                </View>
              </Row>
            </View>
          ))}
        </Card>
      </Section>

      <Section title="Ajouter des heures">
        <Card style={{ gap: 10 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Text style={font.h3}>Pack 5 h de conduite</Text>
            <Text style={[font.h3, { color: colors.primary }]}>275 €</Text>
          </Row>
          <Text style={font.small}>Payable en 1, 3 ou 4 fois sans frais.</Text>
          <Button small variant="secondary" label="Acheter des heures" />
        </Card>
      </Section>
    </Screen>
  );
}
