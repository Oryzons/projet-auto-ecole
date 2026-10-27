import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { ChoiceCard, Steps } from '@/components/choice';
import { Button, Chips, Intro, Screen, Section, TopBar } from '@/components/ui';
import { offers } from '@/data/mock';

const licences = [
  { key: 'B', label: 'Permis B' },
  { key: 'AAC', label: 'Conduite accompagnée' },
  { key: 'B78', label: 'Boîte auto' },
  { key: 'A2', label: 'Moto A2' },
];

export default function InscriptionPermis() {
  const [licence, setLicence] = useState('B');
  const [offer, setOffer] = useState('o1');
  return (
    <Screen footer={<Button label="Continuer" onPress={() => router.push('/inscription/objectif')} />}>
      <TopBar title="Inscription" />
      <Steps step={2} total={3} label="Permis et formule" />
      <Intro title="Quel permis visez-vous ?" description="Choisissez votre permis puis la formule qui vous correspond. Vous pourrez ajouter des heures plus tard." />
      <Chips items={licences} value={licence} onChange={setLicence} />
      <Section title="Formules">
        <View style={{ gap: 10 }}>
          {offers.slice(0, 4).map((o) => (
            <ChoiceCard key={o.id} title={o.name} subtitle={o.detail} right={`${o.price} €`} selected={offer === o.id} onPress={() => setOffer(o.id)} />
          ))}
        </View>
      </Section>
    </Screen>
  );
}
