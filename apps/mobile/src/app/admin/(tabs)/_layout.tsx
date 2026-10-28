import { CalendarDays, Ellipsis, LayoutDashboard, Users, Wallet } from 'lucide-react-native';

import { SpaceTabs, type TabItem } from '@/components/tab-bar';

const items: TabItem[] = [
  { name: 'index', href: '/admin', label: 'Accueil', icon: LayoutDashboard },
  { name: 'eleves', href: '/admin/eleves', label: 'Élèves', icon: Users, badge: 9 },
  { name: 'planning', href: '/admin/planning', label: 'Planning', icon: CalendarDays },
  { name: 'finances', href: '/admin/finances', label: 'Finances', icon: Wallet },
  { name: 'plus', href: '/admin/plus', label: 'Plus', icon: Ellipsis },
];

export default function AdminTabs() {
  return <SpaceTabs items={items} />;
}
