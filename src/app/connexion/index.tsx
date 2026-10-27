import { router } from 'expo-router';

import { Button, Field, Intro, Screen, TopBar } from '@/components/ui';

export default function ConnexionEmail() {
  return (
    <Screen footer={<Button label="Continuer" onPress={() => router.push('/connexion/mot-de-passe')} />}>
      <TopBar title="Connexion" />
      <Intro title="Bon retour 👋" description="Saisissez l’adresse e-mail utilisée lors de votre inscription." />
      <Field label="Adresse e-mail" placeholder="lucas.martin@email.fr" keyboardType="email-address" autoCapitalize="none" autoFocus />
    </Screen>
  );
}
