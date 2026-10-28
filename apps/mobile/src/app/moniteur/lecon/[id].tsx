import { useLocalSearchParams } from 'expo-router';
import { Check, Clock3, MapPin } from 'lucide-react-native';
import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import { RemcGrid } from '@/components/remc';
import { Avatar, Badge, Button, Card, Chip, Row, Screen, Section, TopBar } from '@/components/ui';
import { instructorLessons } from '@/data/mock';
import { colors, font, radius } from '@/theme';

const worked = ['Démarrage en côte', 'Créneau', 'Ronds-points', 'Insertion', 'Contrôles visuels', 'Écoconduite'];

/** Compte rendu après chaque leçon + compétences REMC travaillées */
export default function MoniteurCompteRendu() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const l = instructorLessons.find((x) => x.id === id) ?? instructorLessons[0];
  const [tags, setTags] = useState<string[]>(['Créneau', 'Ronds-points']);
  const [presence, setPresence] = useState<'present' | 'absent'>('present');

  return (
    <Screen footer={<Button label="Valider le compte rendu" icon={Check} />}>
      <TopBar title="Compte rendu" />
      <Card style={{ gap: 12 }}>
        <Row>
          <Avatar name={l.student ?? ''} />
          <View style={{ flex: 1 }}>
            <Text style={font.h2}>{l.student}</Text>
            <Text style={font.tiny}>{l.hoursDone} h de conduite réalisées</Text>
          </View>
          <Badge label={l.type} tone="primary" />
        </Row>
        <Row gap={14}>
          <Row gap={6}>
            <Clock3 size={14} color={colors.muted} />
            <Text style={font.small}>
              {l.start} – {l.end}
            </Text>
          </Row>
          <Row gap={6}>
            <MapPin size={14} color={colors.muted} />
            <Text style={font.small}>{l.place}</Text>
          </Row>
        </Row>
      </Card>

      <Section title="Présence">
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Chip label="Présent" active={presence === 'present'} onPress={() => setPresence('present')} />
          <Chip label="Absent / retard" active={presence === 'absent'} onPress={() => setPresence('absent')} />
        </View>
      </Section>

      <Section title="Points travaillés">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {worked.map((w) => (
            <Chip key={w} label={w} active={tags.includes(w)} onPress={() => setTags((t) => (t.includes(w) ? t.filter((x) => x !== w) : [...t, w]))} />
          ))}
        </View>
      </Section>

      <Section title="Commentaire pour l’élève">
        <TextInput
          multiline
          placeholder="Ce qui s’est bien passé, ce qu’il faut retravailler…"
          placeholderTextColor={colors.faint}
          defaultValue="Bonne maîtrise du créneau. Encore un peu d’hésitation à l’entrée des ronds-points : regarder plus tôt à gauche."
          style={{ minHeight: 110, borderRadius: radius.md, borderWidth: 1, borderColor: colors.input, backgroundColor: colors.card, padding: 14, fontSize: 15, color: colors.ink, textAlignVertical: 'top' }}
        />
      </Section>

      <Section title="Compétences REMC">
        <Text style={font.small}>Touchez un niveau pour mettre à jour le livret de l’élève.</Text>
        <RemcGrid editable />
      </Section>
    </Screen>
  );
}
