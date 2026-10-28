import {
  BookOpenCheck,
  CalendarDays,
  Car,
  CreditCard,
  FolderCheck,
  LayoutDashboard,
  MessageCircle,
  Settings,
  ShieldCheck,
  Tags,
  UserRound,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';

export type NavItem = { href: string; label: string; icon: LucideIcon; badge?: number; ready?: boolean };

/** Menu latéral : les pages marquées ready sont dessinées, les autres arrivent */
export const nav: { title: string; items: NavItem[] }[] = [
  {
    title: 'Pilotage',
    items: [
      { href: '/', label: 'Tableau de bord', icon: LayoutDashboard, ready: true },
      { href: '/planning', label: 'Planning', icon: CalendarDays, ready: true },
      { href: '/eleves', label: 'Élèves', icon: UsersRound, ready: true },
      { href: '/moniteurs', label: 'Moniteurs', icon: UserRound },
      { href: '/vehicules', label: 'Véhicules', icon: Car },
    ],
  },
  {
    title: 'Gestion',
    items: [
      { href: '/finances', label: 'Finances', icon: CreditCard },
      { href: '/documents', label: 'Documents', icon: FolderCheck, badge: 9 },
      { href: '/examens', label: 'Examens', icon: BookOpenCheck },
      { href: '/messages', label: 'Messages', icon: MessageCircle, badge: 3 },
    ],
  },
  {
    title: 'Réglages',
    items: [
      { href: '/tarifs', label: 'Offres et tarifs', icon: Tags },
      { href: '/equipe', label: 'Équipe et rôles', icon: ShieldCheck },
      { href: '/parametres', label: 'Paramètres', icon: Settings },
    ],
  },
];

export const allItems = nav.flatMap((g) => g.items);
