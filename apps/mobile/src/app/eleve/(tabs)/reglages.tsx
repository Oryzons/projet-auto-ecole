import { router, type Href } from 'expo-router';
import {
  Accessibility,
  Bell,
  ChevronRight,
  FileText,
  Landmark,
  LifeBuoy,
  LockKeyhole,
  LogOut,
  ScrollText,
  Shield,
  Trash2,
} from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';

import { BottomSheet, MenuGroup, MenuRow, PageTitle, settingsStyles as s } from '@/components/settings';
import { Screen, TopBar } from '@/components/ui';
import { student } from '@/data/mock';
import { colors, shadow } from '@/theme';

const go = (href: Href) => () => router.push(href);

/** Paramètres de l'élève : profil en tête, puis uniquement des menus */
export default function EleveReglages() {
  const [logout, setLogout] = useState(false);
  const fullName = `${student.firstName} ${student.lastName}`;
  const initials = `${student.firstName[0]}${student.lastName[0]}`;

  return (
    <Screen withTabBar>
      <TopBar title="Paramètres" onBack={() => router.navigate('/eleve')} />
      <PageTitle title="Paramètres" />

      {/* Profil : ouvre la page profil */}
      <Animated.View entering={FadeInDown.delay(40).duration(360).easing(Easing.out(Easing.cubic))}>
        <Pressable onPress={go('/eleve/profil')} style={({ pressed }) => [styles.profile, pressed && { transform: [{ scale: 0.99 }] }]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={styles.name} numberOfLines={1}>
              {fullName}
            </Text>
            <Text style={styles.email} numberOfLines={1}>
              {student.email}
            </Text>
            <Text style={styles.link}>Voir mon profil</Text>
          </View>
          <ChevronRight size={20} color={colors.faint} />
        </Pressable>
      </Animated.View>

      <MenuGroup title="Préférences" delay={80}>
        <MenuRow icon={Bell} title="Notifications" subtitle="Rappels, messages, e-mails et SMS" onPress={go('/eleve/parametres/notifications')} />
        <MenuRow icon={Accessibility} tone="violet" title="Accessibilité" subtitle="Taille du texte, contraste, animations" onPress={go('/eleve/parametres/accessibilite')} />
      </MenuGroup>

      <MenuGroup title="Sécurité" delay={120}>
        <MenuRow icon={LockKeyhole} tone="success" title="Mot de passe & sécurité" subtitle="Mot de passe, Face ID, appareils" onPress={go('/eleve/parametres/securite')} />
      </MenuGroup>

      <MenuGroup title="Assistance" delay={160}>
        <MenuRow icon={LifeBuoy} tone="warning" title="Aide et contact" subtitle="Questions fréquentes, nous joindre" onPress={go('/eleve/parametres/aide')} />
      </MenuGroup>

      <MenuGroup title="Informations légales" delay={200}>
        <MenuRow icon={FileText} tone="neutral" title="Conditions générales de vente" onPress={go('/eleve/parametres/legal/cgv')} />
        <MenuRow icon={ScrollText} tone="neutral" title="Conditions générales d’utilisation" onPress={go('/eleve/parametres/legal/cgu')} />
        <MenuRow icon={Shield} tone="neutral" title="Politique de confidentialité" onPress={go('/eleve/parametres/legal/confidentialite')} />
        <MenuRow icon={Landmark} tone="neutral" title="Mentions légales" onPress={go('/eleve/parametres/legal/mentions')} />
      </MenuGroup>

      <MenuGroup delay={240}>
        <MenuRow icon={LogOut} danger title="Se déconnecter" onPress={() => setLogout(true)} right={<View />} />
        <MenuRow icon={Trash2} danger title="Supprimer mon compte" onPress={go('/eleve/parametres/suppression')} />
      </MenuGroup>

      <Text style={styles.version}>Virage · version 1.0.0</Text>

      <BottomSheet open={logout} onClose={() => setLogout(false)}>
        <Text style={s.sheetTitle}>Se déconnecter ?</Text>
        <Text style={s.sheetText}>Vous devrez saisir à nouveau votre e-mail et votre mot de passe pour retrouver votre espace.</Text>
        <Pressable
          onPress={() => {
            setLogout(false);
            router.replace('/');
          }}
          style={s.dangerBtn}>
          <LogOut size={18} color="#fff" />
          <Text style={s.dangerText}>Me déconnecter</Text>
        </Pressable>
        <Pressable onPress={() => setLogout(false)} style={s.secondary}>
          <Text style={s.secondaryText}>Annuler</Text>
        </Pressable>
      </BottomSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  profile: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 22, backgroundColor: colors.card, ...shadow.card },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', ...shadow.primary },
  avatarText: { color: '#fff', fontSize: 22, fontWeight: '700' },
  name: { fontSize: 18, fontWeight: '800', color: colors.ink, letterSpacing: -0.3 },
  email: { fontSize: 13.5, color: colors.muted },
  link: { fontSize: 12.5, fontWeight: '600', color: colors.primary, marginTop: 2 },
  version: { fontSize: 12, color: colors.faint, textAlign: 'center' },
});
