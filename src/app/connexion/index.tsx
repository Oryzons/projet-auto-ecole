import { router } from 'expo-router';
import { ClipboardCheck, UserRound } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { Button, Field, Intro, Screen, TopBar } from '@/components/ui';
import { font } from '@/theme';

export default function ConnexionEmail() {
  return (
    <Screen footer={<Button label="Continuer" onPress={() => router.push('/connexion/mot-de-passe')} />}>
      <TopBar title="Connexion" />
      <Intro title="Bon retour 👋" description="Saisissez l’adresse e-mail utilisée lors de votre inscription." />
      <Field label="Adresse e-mail" placeholder="lucas.martin@email.fr" keyboardType="email-address" autoCapitalize="none" />

      {/* Accès démo aux autres espaces, en attendant la gestion des rôles à la connexion */}
      <View style={{ gap: 8, marginTop: 24 }}>
        <Text style={[font.tiny, { textTransform: 'uppercase', letterSpacing: 1, fontWeight: '700' }]}>Démo · autres espaces</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Button small variant="secondary" icon={UserRound} label="Moniteur" style={{ flex: 1 }} onPress={() => router.push('/moniteur')} />
          <Button small variant="secondary" icon={ClipboardCheck} label="Administration" style={{ flex: 1.4 }} onPress={() => router.push('/admin')} />
        </View>
      </View>
    </Screen>
  );
}
