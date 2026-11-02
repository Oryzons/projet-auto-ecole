import { router } from 'expo-router';
import { Check, Download, Trash2, TriangleAlert } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { BottomSheet, PageTitle, settingsStyles as s } from '@/components/settings';
import { Screen, TopBar } from '@/components/ui';
import { colors, shadow } from '@/theme';

const consequences = [
  'Vos leçons réservées seront annulées.',
  'Votre progression au code et en conduite sera effacée.',
  'Les heures non utilisées restent régies par votre contrat : l’agence vous contactera.',
  'Vos factures restent conservées le temps imposé par la loi.',
];

/** Suppression du compte élève */
export default function SuppressionCompte() {
  const [ok, setOk] = useState(false);
  const [confirm, setConfirm] = useState(false);

  return (
    <Screen>
      <TopBar title="Supprimer mon compte" />
      <PageTitle title="Vous partez déjà ?" text="La suppression est définitive. Prenez le temps de lire ce qui va se passer." />

      <Animated.View entering={FadeInDown.delay(60).duration(360)} style={styles.warning}>
        <View style={styles.warnIcon}>
          <TriangleAlert size={20} color={colors.danger} strokeWidth={1.9} />
        </View>
        <View style={{ flex: 1, gap: 10 }}>
          {consequences.map((c) => (
            <View key={c} style={{ flexDirection: 'row', gap: 8 }}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.warnText}>{c}</Text>
            </View>
          ))}
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(100).duration(360)}>
        <Pressable style={styles.export}>
          <Download size={18} color={colors.primary} />
          <Text style={styles.exportText}>Télécharger mes données avant de partir</Text>
        </Pressable>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(140).duration(360)} style={{ gap: 16 }}>
        <Pressable onPress={() => setOk((v) => !v)} style={styles.check} hitSlop={6}>
          <View style={[styles.box, ok && styles.boxOn]}>
            {ok ? (
              <Animated.View entering={FadeIn.duration(150)}>
                <Check size={13} color="#fff" strokeWidth={3} />
              </Animated.View>
            ) : null}
          </View>
          <Text style={styles.checkText}>J’ai compris que mon compte et mes données de formation seront supprimés.</Text>
        </Pressable>
        <View style={{ opacity: ok ? 1 : 0.45 }} pointerEvents={ok ? 'auto' : 'none'}>
          <Pressable onPress={() => setConfirm(true)} style={s.dangerBtn}>
            <Trash2 size={18} color="#fff" />
            <Text style={s.dangerText}>Supprimer mon compte</Text>
          </Pressable>
        </View>
        <Pressable onPress={() => router.back()} style={s.secondary}>
          <Text style={s.secondaryText}>Garder mon compte</Text>
        </Pressable>
      </Animated.View>

      <BottomSheet open={confirm} onClose={() => setConfirm(false)}>
        <Text style={s.sheetTitle}>Dernière confirmation</Text>
        <Text style={s.sheetText}>Votre compte Virage sera supprimé immédiatement. Cette action ne peut pas être annulée.</Text>
        <Pressable
          onPress={() => {
            setConfirm(false);
            router.dismissAll();
            router.replace('/');
          }}
          style={s.dangerBtn}>
          <Text style={s.dangerText}>Oui, supprimer définitivement</Text>
        </Pressable>
        <Pressable onPress={() => setConfirm(false)} style={s.secondary}>
          <Text style={s.secondaryText}>Annuler</Text>
        </Pressable>
      </BottomSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  warning: { flexDirection: 'row', gap: 14, padding: 16, borderRadius: 20, backgroundColor: colors.dangerSoft, borderWidth: 1, borderColor: '#F6CFCF' },
  warnIcon: { width: 36, height: 36, borderRadius: 11, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  bullet: { fontSize: 14, color: colors.danger, lineHeight: 20 },
  warnText: { flex: 1, fontSize: 13.5, lineHeight: 20, color: colors.ink },
  export: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, borderRadius: 16, backgroundColor: colors.card, ...shadow.card },
  exportText: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.primary },
  check: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  box: { width: 22, height: 22, borderRadius: 7, borderWidth: 1.5, borderColor: colors.input, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  boxOn: { backgroundColor: colors.danger, borderColor: colors.danger },
  checkText: { flex: 1, fontSize: 13.5, lineHeight: 20, color: colors.ink },
});
