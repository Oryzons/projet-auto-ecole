import { router, type Href } from 'expo-router';
import { Camera, Check, CreditCard, FileCheck, Flag, GraduationCap, Pencil, Signature, TrendingUp } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';

import { MenuGroup, MenuRow } from '@/components/settings';
import { Screen, TopBar } from '@/components/ui';
import { student } from '@/data/mock';
import { useProfile } from '@/data/profile';
import { colors, shadow } from '@/theme';

const fields = [
  { key: 'firstName', label: 'Prénom' },
  { key: 'lastName', label: 'Nom' },
  { key: 'email', label: 'Adresse e-mail' },
  { key: 'phone', label: 'Téléphone' },
  { key: 'birthDate', label: 'Date de naissance' },
  { key: 'address', label: 'Adresse postale' },
] as const;

type Info = Record<(typeof fields)[number]['key'], string>;

/** Profil de l'élève : identité modifiable, formation et accès au dossier */
export default function EleveProfil() {
  const profile = useProfile();
  const [info, setInfo] = useState<Info>({
    firstName: student.firstName,
    lastName: student.lastName,
    email: student.email,
    phone: student.phone,
    birthDate: student.birthDate,
    address: student.address,
  });
  const [draft, setDraft] = useState(info);
  const [editing, setEditing] = useState(false);
  const go = (href: Href) => () => router.push(href);

  return (
    <Screen>
      <TopBar
        title="Mon profil"
        right={
          <Pressable
            onPress={() => {
              if (editing) setInfo(draft);
              else setDraft(info);
              setEditing((e) => !e);
            }}
            style={[styles.editBtn, editing && { backgroundColor: colors.primary, borderColor: colors.primary }]}
            hitSlop={6}>
            {editing ? <Check size={18} color="#fff" /> : <Pencil size={17} color={colors.ink} />}
          </Pressable>
        }
      />

      <Animated.View entering={FadeInDown.duration(380)} style={styles.hero}>
        <View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {info.firstName[0]}
              {info.lastName[0]}
            </Text>
          </View>
          <Pressable style={styles.camera} hitSlop={6}>
            <Camera size={15} color="#fff" />
          </Pressable>
        </View>
        <Text style={styles.name}>
          {info.firstName} {info.lastName}
        </Text>
        <View style={styles.badge}>
          <View style={styles.badgeDot} />
          <Text style={styles.badgeText}>{student.status}</Text>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(60).duration(380)} style={{ gap: 10 }}>
        <View style={styles.groupHead}>
          <Text style={styles.groupTitle}>INFORMATIONS PERSONNELLES</Text>
          {editing ? (
            <Animated.View entering={FadeIn} exiting={FadeOut}>
              <Pressable onPress={() => setEditing(false)} hitSlop={8}>
                <Text style={styles.cancel}>Annuler</Text>
              </Pressable>
            </Animated.View>
          ) : null}
        </View>
        <Animated.View layout={LinearTransition.duration(220)} style={styles.card}>
          {fields.map((f, i) => (
            <View key={f.key} style={[styles.field, i > 0 && styles.fieldSep]}>
              <Text style={styles.label}>{f.label}</Text>
              {editing ? (
                <TextInput
                  value={draft[f.key]}
                  onChangeText={(v) => setDraft((d) => ({ ...d, [f.key]: v }))}
                  style={styles.input}
                  autoCapitalize={f.key === 'email' ? 'none' : 'words'}
                  keyboardType={f.key === 'email' ? 'email-address' : f.key === 'phone' ? 'phone-pad' : 'default'}
                />
              ) : (
                <Text style={styles.value}>{info[f.key]}</Text>
              )}
            </View>
          ))}
        </Animated.View>
      </Animated.View>

      <MenuGroup title="Ma formation" delay={100}>
        <MenuRow icon={GraduationCap} title={profile.permis} subtitle={profile.formule} />
        <MenuRow icon={Flag} tone="success" title={`Objectif : ${profile.objectif}`} subtitle={`Dossier n° ${student.fileNumber}`} />
        <MenuRow icon={TrendingUp} tone="violet" title="Mes acquis" subtitle={`${student.driving.done}/${student.driving.total} h de conduite`} onPress={go('/eleve/progression')} />
      </MenuGroup>

      <MenuGroup title="Mon dossier" delay={140}>
        <MenuRow icon={FileCheck} tone="warning" title="Documents" subtitle="1 document à remplacer" onPress={go('/eleve/documents')} />
        <MenuRow icon={Signature} tone="neutral" title="Contrat de formation" onPress={go('/eleve/contrat')} />
        <MenuRow icon={CreditCard} tone="success" title="Paiements et factures" subtitle={`Prochaine échéance : ${student.balance.due} €`} onPress={go('/eleve/paiements')} />
      </MenuGroup>
    </Screen>
  );
}

const styles = StyleSheet.create({
  editBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  hero: { alignItems: 'center', gap: 10, paddingVertical: 6 },
  avatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', ...shadow.primary },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: '700' },
  camera: { position: 'absolute', right: -2, bottom: -2, width: 32, height: 32, borderRadius: 16, backgroundColor: colors.ink, borderWidth: 3, borderColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 24, fontWeight: '800', color: colors.ink, letterSpacing: -0.5, marginTop: 6 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: colors.warningSoft },
  badgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.warning },
  badgeText: { fontSize: 12, fontWeight: '600', color: colors.warning },
  groupHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4 },
  groupTitle: { fontSize: 11, fontWeight: '700', color: colors.muted, letterSpacing: 0.6 },
  cancel: { fontSize: 13, fontWeight: '600', color: colors.danger },
  card: { paddingHorizontal: 16, borderRadius: 20, backgroundColor: colors.card, ...shadow.card },
  field: { paddingVertical: 12, gap: 4 },
  fieldSep: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  label: { fontSize: 12, color: colors.faint },
  value: { fontSize: 15, fontWeight: '500', color: colors.ink },
  input: { fontSize: 15, fontWeight: '500', color: colors.ink, paddingVertical: 6, paddingHorizontal: 10, marginHorizontal: -10, borderRadius: 10, backgroundColor: colors.background },
});
