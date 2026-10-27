import { router } from 'expo-router';
import { Check, FilePen, Upload, CreditCard } from 'lucide-react-native';
import { View } from 'react-native';

import { Button, Card, Divider, Intro, ListItem, Screen } from '@/components/ui';
import { colors, radius } from '@/theme';

export default function InscriptionConfirmee() {
  return (
    <Screen footer={<Button label="Accéder à mon espace" onPress={() => router.replace('/eleve')} />}>
      <View style={{ alignItems: 'center', paddingTop: 40 }}>
        <View style={{ width: 84, height: 84, borderRadius: radius.pill, backgroundColor: colors.successSoft, alignItems: 'center', justifyContent: 'center' }}>
          <Check size={40} color={colors.success} strokeWidth={3} />
        </View>
      </View>
      <Intro title="Votre dossier est créé 🎉" description="Bienvenue chez Virage, Lucas. Il reste trois étapes pour démarrer vos leçons." />
      <Card style={{ paddingVertical: 6 }}>
        <ListItem icon={Upload} title="Déposer vos pièces" subtitle="Identité, photo, justificatif de domicile…" />
        <Divider inset={52} />
        <ListItem icon={FilePen} tone="violet" title="Signer votre contrat" subtitle="Signature électronique en 2 minutes" />
        <Divider inset={52} />
        <ListItem icon={CreditCard} tone="success" title="Régler votre forfait" subtitle="En une fois ou en 3 ou 4 fois sans frais" />
      </Card>
    </Screen>
  );
}
