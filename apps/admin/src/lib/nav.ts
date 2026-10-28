import {
  BookOpenCheck,
  CalendarDays,
  Car,
  CreditCard,
  FolderCheck,
  House,
  MessageCircle,
  Settings,
  ShieldCheck,
  Tags,
  UserRound,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';

/** short : libellé sous l'icône du menu ; mobile : présent dans la barre du bas sur téléphone */
export type NavItem = { href: string; label: string; short: string; icon: LucideIcon; badge?: number; ready?: boolean; mobile?: boolean };

/** Menu flottant, comme la barre d'onglets de l'app : les pages marquées ready sont dessinées */
export const dock: NavItem[] = [
  { href: '/', label: 'Tableau de bord', short: 'Accueil', icon: House, ready: true, mobile: true },
  { href: '/planning', label: 'Planning', short: 'Planning', icon: CalendarDays, ready: true, mobile: true },
  { href: '/eleves', label: 'Élèves', short: 'Élèves', icon: UsersRound, ready: true, mobile: true },
  { href: '/moniteurs', label: 'Moniteurs', short: 'Moniteurs', icon: UserRound },
  { href: '/vehicules', label: 'Véhicules', short: 'Véhicules', icon: Car },
  { href: '/finances', label: 'Finances', short: 'Finances', icon: CreditCard },
  { href: '/documents', label: 'Documents', short: 'Documents', icon: FolderCheck, badge: 9 },
  { href: '/examens', label: 'Examens', short: 'Examens', icon: BookOpenCheck },
  { href: '/messages', label: 'Messages', short: 'Messages', icon: MessageCircle, badge: 3, mobile: true },
];

/** Réglages : regroupés derrière une seule entrée du menu */
export const settings: NavItem[] = [
  { href: '/parametres', label: 'Paramètres', short: 'Réglages', icon: Settings },
  { href: '/tarifs', label: 'Offres et tarifs', short: 'Tarifs', icon: Tags },
  { href: '/equipe', label: 'Équipe et rôles', short: 'Équipe', icon: ShieldCheck },
];

export const allItems = [...dock, ...settings];
