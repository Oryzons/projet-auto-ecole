import { FilePen, Signature } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Button, Card, Divider, Intro, Row, Screen, TopBar } from '@/components/ui';
import { student } from '@/data/mock';
import { colors, font, radius } from '@/theme';

/** Signature électronique du contrat de formation */
export default function EleveContrat() {
  const [accepted, setAccepted] = useState(false);
  const [signed, setSigned] = useState(false);

  return (
    <Screen footer={<Button label={signed ? 'Contrat signé ✓' : 'Signer le contrat'} icon={FilePen} onPress={() => accepted && setSigned(true)} />}>
      <TopBar title="Contrat" />
      <Intro title="Contrat de formation" description="Relisez le contrat puis signez-le directement depuis votre téléphone." />
      <Card style={{ gap: 12 }}>
        <Line label="Élève" value={`${student.firstName} ${student.lastName}`} />
        <Line label="Formation" value={`${student.licence} · ${student.formula}`} />
        <Line label="Prix total TTC" value="1 350 €" />
        <Line label="Modalités" value="3 × 450 € sans frais" />
        <Divider />
        <Text style={[font.small, { lineHeight: 20 }]}>
          Le présent contrat est conclu entre l’auto-école Virage et l’élève conformément à l’arrêté du 13 mai 2013 relatif au contrat type
          d’enseignement de la conduite. Il précise le programme de formation, le calendrier prévisionnel, le prix des prestations et les
          conditions d’annulation des leçons…
        </Text>
        <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 13 }}>Lire le contrat complet (PDF)</Text>
      </Card>

      <View style={{ gap: 8 }}>
        <Text style={font.h3}>Votre signature</Text>
        <View style={{ height: 140, borderRadius: radius.lg, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.input, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <Signature size={30} color={signed ? colors.primary : colors.faint} />
          <Text style={font.small}>{signed ? 'Signé le 27/10/2026 à 15:42' : 'Signez ici avec votre doigt'}</Text>
        </View>
      </View>

      <Pressable onPress={() => setAccepted(!accepted)}>
        <Row gap={10} style={{ alignItems: 'flex-start' }}>
          <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: accepted ? colors.primary : colors.input, backgroundColor: accepted ? colors.primary : colors.card }} />
          <Text style={[font.small, { flex: 1 }]}>J’ai lu et j’accepte le contrat de formation et les conditions générales de vente.</Text>
        </Row>
      </Pressable>
    </Screen>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <Row style={{ justifyContent: 'space-between' }}>
      <Text style={font.small}>{label}</Text>
      <Text style={[font.h3, { fontSize: 14 }]}>{value}</Text>
    </Row>
  );
}
