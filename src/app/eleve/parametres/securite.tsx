import { router } from 'expo-router';
import { Check, ChevronDown, CreditCard, FingerprintPattern, Grid3x3, KeyRound, Laptop, LockKeyhole, LockOpen, ScanFace, ShieldCheck, Smartphone } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';

import { AuthInput } from '@/components/auth';
import { MenuGroup, MenuRow, PageTitle, Switch, settingsStyles as s } from '@/components/settings';
import { CtaButton, Screen, TopBar } from '@/components/ui';
import { MethodOption, UnlockSetup, unlockLabels, type UnlockMethod } from '@/components/unlock';
import { bind, setPrefs, usePrefs } from '@/data/preferences';
import { colors, shadow } from '@/theme';

const initialDevices = [
  { id: 'd1', icon: Smartphone, name: 'iPhone 15', detail: 'Lyon · cet appareil', current: true },
  { id: 'd2', icon: Laptop, name: 'MacBook Air · Safari', detail: 'Lyon · il y a 2 jours' },
  { id: 'd3', icon: Smartphone, name: 'iPad', detail: 'Villeurbanne · il y a 3 semaines' },
];

/** Mot de passe et sécurité */
export default function ReglagesSecurite() {
  const p = usePrefs();
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [devices, setDevices] = useState(initialDevices);
  const [setup, setSetup] = useState<UnlockMethod | null>(null);
  const canSave = current.length >= 4 && next.length >= 8;

  return (
    <Screen>
      <TopBar title="Sécurité" />
      <PageTitle title="Votre compte, protégé." text="Mot de passe, Face ID ou empreinte, et appareils connectés." />

      <Animated.View entering={FadeInDown.delay(60).duration(360)} layout={LinearTransition.duration(240)} style={[styles.card]}>
        <Pressable onPress={() => setEditing((e) => !e)} style={styles.cardHead}>
          <View style={[styles.icon, { backgroundColor: colors.successSoft }]}>
            <KeyRound size={18} color={colors.success} strokeWidth={1.9} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.rowTitle}>Changer le mot de passe</Text>
            <Text style={styles.rowSub}>{saved ? 'Modifié à l’instant' : 'Modifié il y a 3 mois'}</Text>
          </View>
          <View style={{ transform: [{ rotate: editing ? '180deg' : '0deg' }] }}>
            <ChevronDown size={18} color={colors.faint} />
          </View>
        </Pressable>
        {editing ? (
          <Animated.View entering={FadeIn.duration(220)} exiting={FadeOut.duration(120)} style={{ gap: 14, paddingTop: 4 }}>
            <AuthInput label="Mot de passe actuel" icon={LockKeyhole} value={current} onChangeText={setCurrent} secureTextEntry active={current.length > 0} />
            <AuthInput label="Nouveau mot de passe" icon={LockKeyhole} value={next} onChangeText={setNext} secureTextEntry active={next.length > 0} hint="8 caractères minimum, dont une majuscule et un chiffre." />
            <View style={{ opacity: canSave ? 1 : 0.5 }} pointerEvents={canSave ? 'auto' : 'none'}>
              <CtaButton
                label="Enregistrer"
                icon={Check}
                onPress={() => {
                  setSaved(true);
                  setEditing(false);
                  setCurrent('');
                  setNext('');
                }}
              />
            </View>
            <Pressable onPress={() => router.push('/connexion/mot-de-passe-oublie')} style={{ alignSelf: 'center' }} hitSlop={8}>
              <Text style={styles.link}>Mot de passe actuel oublié ?</Text>
            </Pressable>
          </Animated.View>
        ) : null}
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(100).duration(360)} style={{ gap: 10 }}>
        <Text style={styles.groupTitle}>DÉVERROUILLAGE DE L’APPLICATION</Text>
        <View style={[s.card, { padding: 0, gap: 0, overflow: 'hidden' }]}>
          <MethodOption icon={ScanFace} label="Face ID" detail="Reconnaissance du visage" on={p.unlock === 'faceid'} onPress={() => setSetup('faceid')} />
          <View style={styles.sep} />
          <MethodOption icon={FingerprintPattern} label="Empreinte digitale" detail="Touch ID ou capteur Android" on={p.unlock === 'fingerprint'} onPress={() => setSetup('fingerprint')} />
          <View style={styles.sep} />
          <MethodOption icon={Grid3x3} label="Code à 4 chiffres" detail="Propre à l’application" on={p.unlock === 'pin'} onPress={() => setSetup('pin')} />
          <View style={styles.sep} />
          <MethodOption icon={LockOpen} label="Aucune" detail="Mot de passe uniquement" on={p.unlock === 'none'} onPress={() => setPrefs({ unlock: 'none' })} />
        </View>
      </Animated.View>

      {p.unlock !== 'none' ? (
        <Animated.View entering={FadeIn.duration(220)} exiting={FadeOut.duration(150)} layout={LinearTransition.duration(220)}>
          <MenuGroup title={`Utiliser ${unlockLabels[p.unlock]} pour`}>
            <MenuRow icon={Smartphone} tone="success" title="Ouvrir l’application" right={<Switch {...bind(p, 'unlockOnOpen')} />} />
            <MenuRow icon={CreditCard} tone="success" title="Valider un paiement" right={<Switch {...bind(p, 'unlockPayments')} />} />
          </MenuGroup>
        </Animated.View>
      ) : null}

      <Animated.View layout={LinearTransition.duration(220)}>
        <MenuGroup title="Vérification" delay={120}>
          <MenuRow icon={ShieldCheck} tone="success" title="Double authentification" subtitle="Un code à 4 chiffres à chaque nouvel appareil" right={<Switch {...bind(p, 'twoFactor')} />} />
        </MenuGroup>
      </Animated.View>

      <UnlockSetup
        method={setup}
        onCancel={() => setSetup(null)}
        onDone={(m) => {
          setPrefs({ unlock: m });
          setSetup(null);
        }}
      />

      <Animated.View entering={FadeInDown.delay(140).duration(360)} style={{ gap: 10 }}>
        <Text style={styles.groupTitle}>APPAREILS CONNECTÉS</Text>
        <View style={s.card}>
          {devices.map((d, i) => {
            const Icon = d.icon;
            return (
              <Animated.View key={d.id} exiting={FadeOut.duration(150)} layout={LinearTransition.duration(220)} style={[styles.device, i > 0 && styles.deviceSep]}>
                <View style={[styles.icon, { backgroundColor: colors.primarySoft }]}>
                  <Icon size={18} color={colors.primary} strokeWidth={1.9} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.rowTitle}>{d.name}</Text>
                  <Text style={[styles.rowSub, d.current && { color: colors.success, fontWeight: '600' }]}>{d.detail}</Text>
                </View>
                {!d.current ? (
                  <Pressable onPress={() => setDevices((l) => l.filter((x) => x.id !== d.id))} hitSlop={8}>
                    <Text style={[styles.link, { color: colors.danger }]}>Retirer</Text>
                  </Pressable>
                ) : null}
              </Animated.View>
            );
          })}
        </View>
        {devices.length > 1 ? (
          <Pressable onPress={() => setDevices((l) => l.filter((x) => x.current))} style={{ alignSelf: 'center', paddingVertical: 6 }} hitSlop={8}>
            <Text style={[styles.link, { color: colors.danger }]}>Déconnecter tous les autres appareils</Text>
          </Pressable>
        ) : null}
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, borderRadius: 20, backgroundColor: colors.card, gap: 12, ...shadow.card },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  icon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 15, fontWeight: '600', color: colors.ink },
  rowSub: { fontSize: 12.5, color: colors.muted },
  link: { fontSize: 13, fontWeight: '600', color: colors.primary },
  groupTitle: { fontSize: 11, fontWeight: '700', color: colors.muted, letterSpacing: 0.6, paddingHorizontal: 4 },
  device: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: 66 },
  deviceSep: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingTop: 14 },
});
