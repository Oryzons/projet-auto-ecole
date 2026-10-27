import { BookOpen, CalendarDays, House, MessageCircle, Settings } from 'lucide-react-native';

import { SpaceTabs, type TabItem } from '@/components/tab-bar';

const items: TabItem[] = [
  { name: 'index', href: '/eleve', label: 'Accueil', icon: House },
  { name: 'lecons', href: '/eleve/lecons', label: 'Leçons', icon: CalendarDays },
  { name: 'formation', href: '/eleve/formation', label: 'Formation', icon: BookOpen },
  { name: 'messages', href: '/eleve/messages', label: 'Messages', icon: MessageCircle, badge: 3 },
  { name: 'reglages', href: '/eleve/reglages', label: 'Réglages', icon: Settings },
];

export default function EleveTabs() {
  return <SpaceTabs items={items} />;
}
