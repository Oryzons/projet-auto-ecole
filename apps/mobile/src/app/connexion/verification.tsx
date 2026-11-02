import { router, useLocalSearchParams } from 'expo-router';
import { ShieldCheck } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { VerifyCode } from '@/components/otp';
import { Screen, TopBar } from '@/components/ui';
import { student } from '@/data/mock';
import { markDeviceVerified } from '@/data/session';
import { colors } from '@/theme';

/** Première connexion sur un appareil : vérification par code à 4 chiffres */
export default function ConnexionVerification() {
  const { email } = useLocalSearchParams<{ email?: string }>();
  return (
    <Screen>
      <TopBar title="Vérification" />
      <Animated.View entering={FadeInDown.duration(360)}>
        <VerifyCode
          destination={email || student.email}
          onSuccess={() => {
            markDeviceVerified();
            router.dismissAll();
            router.replace('/eleve');
          }}
        />
      </Animated.View>
      <View style={styles.note}>
        <ShieldCheck size={16} color={colors.muted} strokeWidth={1.8} />
        <Text style={styles.noteText}>Première connexion sur cet appareil : on vérifie que c’est bien vous. Vous n’aurez plus à le faire ensuite.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  note: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  noteText: { flex: 1, fontSize: 12.5, lineHeight: 18, color: colors.muted },
});
