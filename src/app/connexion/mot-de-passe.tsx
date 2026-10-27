import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { Avatar, Button, Card, Field, Intro, Row, Screen, TopBar } from '@/components/ui';
import { student } from '@/data/mock';
import { colors, font } from '@/theme';

export default function ConnexionMotDePasse() {
  return (
    <Screen footer={<Button label="Se connecter" onPress={() => router.replace('/eleve')} />}>
      <TopBar title="Connexion" />
      <Intro title="Votre mot de passe" />
      <Card style={{ padding: 14 }}>
        <Row>
          <Avatar name={`${student.firstName} ${student.lastName}`} size={40} />
          <View style={{ flex: 1 }}>
            <Text style={font.h3}>
              {student.firstName} {student.lastName}
            </Text>
            <Text style={font.small}>{student.email}</Text>
          </View>
          <Pressable onPress={() => router.back()}>
            <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 13 }}>Modifier</Text>
          </Pressable>
        </Row>
      </Card>
      <View style={{ gap: 10 }}>
        <Field label="Mot de passe" placeholder="••••••••" secureTextEntry autoFocus />
        <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 13 }}>Mot de passe oublié ?</Text>
      </View>
    </Screen>
  );
}
