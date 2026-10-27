import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { ChoiceCard, Steps } from '@/components/choice';
import { Button, Chip, Intro, Screen, Section, TopBar } from '@/components/ui';
import { colors, font } from '@/theme';

const goals = [
  { key: '3', title: 'Dès que possible', subtitle: 'Formation intensive, environ 3 mois' },
  { key: '6', title: 'D’ici 6 mois', subtitle: 'Rythme régulier, 1 à 2 leçons par semaine' },
  { key: 'free', title: 'Sans date précise', subtitle: 'J’avance à mon rythme' },
];

const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const moments = ['Matin', 'Midi', 'Après-midi', 'Soir'];

export default function InscriptionObjectif() {
  const [goal, setGoal] = useState('6');
  const [selDays, setSelDays] = useState<string[]>(['Mar', 'Jeu', 'Sam']);
  const [selMoments, setSelMoments] = useState<string[]>(['Soir']);
  const toggle = (list: string[], set: (v: string[]) => void, v: string) => set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  return (
    <Screen footer={<Button label="Créer mon dossier" onPress={() => router.replace('/inscription/confirmee')} />}>
      <TopBar title="Inscription" />
      <Steps step={4} total={4} label="Objectif et disponibilités" />
      <Intro title="Votre objectif" description="On s’en sert pour vous proposer un planning de leçons adapté." />
      <View style={{ gap: 10 }}>
        {goals.map((g) => (
          <ChoiceCard key={g.key} title={g.title} subtitle={g.subtitle} selected={goal === g.key} onPress={() => setGoal(g.key)} />
        ))}
      </View>
      <Section title="Vos disponibilités">
        <Text style={font.small}>Jours</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {days.map((d) => (
            <Chip key={d} label={d} active={selDays.includes(d)} onPress={() => toggle(selDays, setSelDays, d)} />
          ))}
        </View>
        <Text style={font.small}>Moments de la journée</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {moments.map((m) => (
            <Chip key={m} label={m} active={selMoments.includes(m)} onPress={() => toggle(selMoments, setSelMoments, m)} />
          ))}
        </View>
      </Section>
      <Text style={[font.tiny, { color: colors.faint }]}>
        En créant votre dossier, vous acceptez les conditions générales de Virage. Le contrat de formation vous sera proposé à la signature électronique dans votre espace.
      </Text>
    </Screen>
  );
}
