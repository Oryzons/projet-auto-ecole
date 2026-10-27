import { router } from 'expo-router';
import { View } from 'react-native';

import { Steps } from '@/components/choice';
import { Button, Field, Intro, Screen, TopBar } from '@/components/ui';

export default function InscriptionIdentite() {
  return (
    <Screen footer={<Button label="Continuer" onPress={() => router.push('/inscription/permis')} />}>
      <TopBar title="Inscription" />
      <Steps step={1} total={3} label="Identité" />
      <Intro title="Faisons connaissance" description="Ces informations serviront à créer votre dossier ANTS et votre contrat de formation." />
      <View style={{ gap: 16 }}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Field label="Prénom" placeholder="Lucas" />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Nom" placeholder="Martin" />
          </View>
        </View>
        <Field label="Date de naissance" placeholder="JJ/MM/AAAA" keyboardType="number-pad" />
        <Field label="Adresse e-mail" placeholder="lucas.martin@email.fr" keyboardType="email-address" autoCapitalize="none" />
        <Field label="Téléphone" placeholder="06 12 34 56 78" keyboardType="phone-pad" hint="Pour recevoir les rappels de leçon par SMS." />
      </View>
    </Screen>
  );
}
