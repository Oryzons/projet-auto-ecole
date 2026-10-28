import { CalendarDays, CalendarClock, MessageCircle, UserRound, Users } from 'lucide-react-native';

import { SpaceTabs, type TabItem } from '@/components/tab-bar';

const items: TabItem[] = [
  { name: 'index', href: '/moniteur', label: 'Planning', icon: CalendarDays },
  { name: 'eleves', href: '/moniteur/eleves', label: 'Élèves', icon: Users },
  { name: 'disponibilites', href: '/moniteur/disponibilites', label: 'Dispos', icon: CalendarClock },
  { name: 'messages', href: '/moniteur/messages', label: 'Messages', icon: MessageCircle, badge: 2 },
  { name: 'profil', href: '/moniteur/profil', label: 'Profil', icon: UserRound },
];

export default function MoniteurTabs() {
  return <SpaceTabs items={items} />;
}
