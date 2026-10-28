import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { PageTitle } from '@/components/settings';
import { Screen, TopBar } from '@/components/ui';
import { legalDocs, type LegalDoc } from '@/data/legal';
import { colors, shadow } from '@/theme';

/** CGV, CGU, confidentialité, mentions légales (textes fictifs) */
export default function LegalPage() {
  const { doc } = useLocalSearchParams<{ doc: LegalDoc }>();
  const d = legalDocs[doc] ?? legalDocs.cgu;
  return (
    <Screen>
      <TopBar title={d.short} />
      <PageTitle title={d.title} text={`Dernière mise à jour : ${d.updated}`} />
      {d.sections.map((s, i) => (
        <Animated.View key={s.heading} entering={FadeInDown.delay(60 + i * 40).duration(320)} style={styles.section}>
          <View style={styles.num}>
            <Text style={styles.numText}>{i + 1}</Text>
          </View>
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={styles.heading}>{s.heading}</Text>
            <Text style={styles.body}>{s.body}</Text>
          </View>
        </Animated.View>
      ))}
      <Text style={styles.foot}>Document fourni à titre d’exemple pour la maquette.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { flexDirection: 'row', gap: 14, padding: 16, borderRadius: 18, backgroundColor: colors.card, ...shadow.card },
  num: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  numText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  heading: { fontSize: 15, fontWeight: '700', color: colors.ink },
  body: { fontSize: 13.5, lineHeight: 20, color: colors.muted },
  foot: { fontSize: 12, color: colors.faint, textAlign: 'center' },
});
