import { router } from 'expo-router';
import { CalendarDays, ChartColumn, ClipboardCheck, ShieldCheck, UserRound } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { Button, Card, ListItem, Screen } from '@/components/ui';
import { colors, font, radius } from '@/theme';

/** Écran « Bienvenue chez Virage » */
export default function Welcome() {
  return (
    <Screen
      footer={
        <View style={{ gap: 10 }}>
          <Button label="Créer mon dossier" onPress={() => router.push('/inscription/identite')} />
          <Button label="J’ai déjà un compte" variant="secondary" onPress={() => router.push('/connexion')} />
        </View>
      }>
      <View style={styles.hero}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>V</Text>
        </View>
        <Text style={styles.brand}>Virage</Text>
        <Text style={[font.title, { textAlign: 'center' }]}>Votre permis,{'\n'}sans détour.</Text>
        <Text style={[font.body, { color: colors.muted, textAlign: 'center', lineHeight: 22 }]}>
          Inscription, leçons, progression et paiements : tout votre parcours au même endroit.
        </Text>
      </View>

      <Card style={{ gap: 2, paddingVertical: 8 }}>
        <ListItem icon={ShieldCheck} title="Dossier 100 % en ligne" subtitle="Pièces, contrat et suivi de validation" />
        <ListItem icon={CalendarDays} tone="success" title="Réservez vos leçons" subtitle="Choisissez le créneau et le moniteur" />
        <ListItem icon={ChartColumn} tone="violet" title="Suivez votre progression" subtitle="Code, heures et compétences REMC" />
      </Card>

      <View style={{ gap: 8 }}>
        <Text style={[font.tiny, { textTransform: 'uppercase', letterSpacing: 1, fontWeight: '700' }]}>Démo · autres espaces</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Button small variant="secondary" icon={UserRound} label="Moniteur" style={{ flex: 1 }} onPress={() => router.push('/moniteur')} />
          <Button small variant="secondary" icon={ClipboardCheck} label="Administration" style={{ flex: 1.4 }} onPress={() => router.push('/admin')} />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: 14, paddingTop: 32 },
  logo: { width: 72, height: 72, borderRadius: radius.xl, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-8deg' }] },
  logoText: { color: '#fff', fontSize: 38, fontWeight: '800', transform: [{ rotate: '8deg' }] },
  brand: { fontSize: 14, fontWeight: '700', color: colors.primary, letterSpacing: 2, textTransform: 'uppercase' },
});
