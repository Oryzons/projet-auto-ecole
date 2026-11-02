import { router, type Href } from 'expo-router';
import { CarFront, GraduationCap, LogOut, MessageCircle, Settings, ShieldCheck, Tag } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { Card, Divider, Intro, ListItem, Row, Screen } from '@/components/ui';
import { colors } from '@/theme';

const links: { icon: typeof Tag; tone: 'primary' | 'success' | 'violet' | 'warning' | 'neutral'; title: string; subtitle: string; href: Href }[] = [
  { icon: Tag, tone: 'primary', title: 'Tarifs, forfaits et promotions', subtitle: '5 forfaits · 2 promotions actives', href: '/admin/tarifs' },
  { icon: CarFront, tone: 'success', title: 'Moniteurs et véhicules', subtitle: '4 moniteurs · 4 véhicules', href: '/admin/equipe' },
  { icon: GraduationCap, tone: 'violet', title: 'Examens et résultats', subtitle: 'Prochaine session le 12 nov.', href: '/admin/examens' },
  { icon: ShieldCheck, tone: 'warning', title: 'Rôles et permissions', subtitle: '3 rôles · 9 membres', href: '/admin/roles' },
  { icon: MessageCircle, tone: 'primary', title: 'Messagerie', subtitle: '3 conversations non lues', href: '/admin/messages' },
  { icon: Settings, tone: 'neutral', title: 'Paramètres de l’école', subtitle: 'Coordonnées, mentions de facture, paiement en ligne', href: '/admin' },
];

export default function AdminPlus() {
  return (
    <Screen withTabBar>
      <Intro title="Plus" description="Gestion de l’auto-école" />
      <Card style={{ paddingVertical: 4 }}>
        {links.map((l, i) => (
          <View key={l.title}>
            {i > 0 ? <Divider inset={52} /> : null}
            <ListItem icon={l.icon} tone={l.tone} title={l.title} subtitle={l.subtitle} chevron onPress={() => router.push(l.href)} />
          </View>
        ))}
      </Card>
      <Pressable onPress={() => router.replace('/')}>
        <Row gap={8} style={{ justifyContent: 'center', paddingVertical: 10 }}>
          <LogOut size={16} color={colors.danger} />
          <Text style={{ color: colors.danger, fontWeight: '600' }}>Se déconnecter</Text>
        </Row>
      </Pressable>
    </Screen>
  );
}
