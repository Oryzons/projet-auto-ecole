import { useLocalSearchParams } from 'expo-router';
import { Check, CreditCard, Eye, Mail, Phone, X } from 'lucide-react-native';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { RemcGrid } from '@/components/remc';
import { Avatar, Badge, Button, Card, Chips, Divider, Progress, Row, Screen, Stat, TopBar } from '@/components/ui';
import { adminStudents, docStatus, documents, invoices, student } from '@/data/mock';
import { colors, font } from '@/theme';

/** Fiche élève côté administration : dossier, pièces, paiements, progression */
export default function AdminFicheEleve() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const s = adminStudents.find((x) => x.id === id) ?? adminStudents[0];
  const [tab, setTab] = useState('dossier');

  return (
    <Screen>
      <TopBar title="Fiche élève" />
      <Row>
        <Avatar name={s.name} size={60} tone={s.tone} />
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={font.h2}>{s.name}</Text>
          <Text style={font.small}>{s.licence}</Text>
          <Badge label={s.step} tone={s.tone} />
        </View>
      </Row>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Button small variant="secondary" icon={Phone} label="Appeler" style={{ flex: 1 }} />
        <Button small variant="secondary" icon={Mail} label="Message" style={{ flex: 1 }} />
      </View>
      <Chips
        value={tab}
        onChange={setTab}
        items={[
          { key: 'dossier', label: 'Pièces' },
          { key: 'paiements', label: 'Paiements' },
          { key: 'progression', label: 'Progression' },
          { key: 'infos', label: 'Infos' },
        ]}
      />

      {tab === 'dossier' ? (
        <View style={{ gap: 10 }}>
          {documents.map((d) => {
            const st = docStatus[d.status];
            return (
              <Card key={d.id} style={{ gap: 10, padding: 14 }}>
                <Row>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={font.h3}>{d.name}</Text>
                    <Badge label={st.label} tone={st.tone} />
                  </View>
                  {d.status !== 'missing' ? <Eye size={18} color={colors.primary} /> : null}
                </Row>
                {d.status === 'pending' ? (
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <Button small variant="danger" icon={X} label="Refuser" style={{ flex: 1 }} />
                    <Button small icon={Check} label="Valider" style={{ flex: 1 }} />
                  </View>
                ) : null}
                {d.note ? <Text style={[font.tiny, { color: colors.danger }]}>Motif envoyé : {d.note}</Text> : null}
              </Card>
            );
          })}
        </View>
      ) : null}

      {tab === 'paiements' ? (
        <>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Stat label="Réglé" value={`${student.balance.paid} €`} tone="success" hint="2 échéances sur 3" />
            <Stat label="Reste dû" value={`${s.balance} €`} tone={s.balance ? 'danger' : 'success'} hint={s.balance ? 'Échéance le 21 nov.' : 'À jour'} />
          </View>
          <Card style={{ paddingVertical: 4 }}>
            {invoices.map((inv, i) => (
              <View key={inv.id}>
                {i > 0 ? <Divider /> : null}
                <Row style={{ paddingVertical: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={font.h3}>{inv.label}</Text>
                    <Text style={font.tiny}>
                      {inv.id} · {inv.date}
                    </Text>
                  </View>
                  <Text style={font.h3}>{inv.amount} €</Text>
                </Row>
              </View>
            ))}
          </Card>
          <Button icon={CreditCard} label="Encaisser un paiement" />
        </>
      ) : null}

      {tab === 'progression' ? (
        <>
          <Card style={{ gap: 12 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Text style={font.h3}>Code</Text>
              <Text style={font.small}>{Math.round(student.code.ratio * 100)} %</Text>
            </Row>
            <Progress value={student.code.ratio} tone="success" />
            <Row style={{ justifyContent: 'space-between' }}>
              <Text style={font.h3}>Conduite</Text>
              <Text style={font.small}>
                {student.driving.done}/{student.driving.total} h
              </Text>
            </Row>
            <Progress value={student.driving.done / student.driving.total} />
          </Card>
          <RemcGrid />
        </>
      ) : null}

      {tab === 'infos' ? (
        <Card style={{ gap: 12 }}>
          <Info label="E-mail" value={student.email} />
          <Info label="Téléphone" value={student.phone} />
          <Info label="Naissance" value={student.birthDate} />
          <Info label="Adresse" value={student.address} />
          <Info label="N° de dossier" value={student.fileNumber} />
          <Info label="Disponibilités" value={student.availability} />
        </Card>
      ) : null}
    </Screen>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ gap: 2 }}>
      <Text style={font.tiny}>{label}</Text>
      <Text style={font.body}>{value}</Text>
    </View>
  );
}
