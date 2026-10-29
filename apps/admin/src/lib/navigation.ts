import {
  CalendarDays,
  Car,
  CreditCard,
  FileText,
  FolderOpen,
  LayoutDashboard,
  LifeBuoy,
  ListChecks,
  Map as MapIcon,
  MessagesSquare,
  BarChart3,
  Settings,
  UserRound,
  UsersRound,
  Wallet,
  type LucideIcon,
  ShieldCheck,
} from "lucide-react";

export type NavItem = {
  label: string;
  /** Libellé court pour la barre de navigation mobile. */
  shortLabel?: string;
  href: string;
  icon: LucideIcon;
  /** Affiche le compteur de messages non lus. */
  badge?: "unread";
};

export type NavConfig = {
  role: "ADMIN" | "CANDIDATE" | "SKIPPER";
  home: string;
  primary: NavItem[];
  secondary: NavItem[];
  /** Pages hors menu principal (titre de la barre du haut). */
  extra: NavItem[];
};

export const adminNav: NavConfig = {
  role: "ADMIN",
  home: "/admin/dashboard",
  primary: [
    { label: "Vue d'ensemble", shortLabel: "Plan", href: "/admin/dashboard", icon: MapIcon },
    { label: "Dossiers", href: "/admin/applications", icon: FolderOpen },
    { label: "Tâches", href: "/admin/tasks", icon: ListChecks },
    { label: "Calendrier", href: "/admin/calendar", icon: CalendarDays },
    { label: "Messages", href: "/admin/messages", icon: MessagesSquare, badge: "unread" },
  ],
  secondary: [
    { label: "Véhicules", href: "/admin/vehicles", icon: Car },
    { label: "Finances", href: "/admin/finances", icon: Wallet },
    { label: "Rapports", href: "/admin/reports", icon: BarChart3 },
    { label: "Membres", href: "/admin/members", icon: UsersRound },
    { label: "Paramètres", href: "/admin/settings", icon: Settings },
    { label: "Aide", href: "/admin/help", icon: LifeBuoy },
  ],
  extra: [
    { label: "Mon profil", href: "/admin/profile", icon: UserRound },
    { label: "Données et mentions légales", href: "/admin/privacy", icon: ShieldCheck },
  ],
};

export const candidateNav: NavConfig = {
  role: "CANDIDATE",
  home: "/dashboard",
  primary: [
    { label: "Mon dossier", shortLabel: "Dossier", href: "/dashboard", icon: LayoutDashboard },
    { label: "Documents", href: "/documents", icon: FileText },
    { label: "Paiement", href: "/payment", icon: CreditCard },
    { label: "Calendrier", shortLabel: "Cours", href: "/calendar", icon: CalendarDays },
    { label: "Messages", href: "/messages", icon: MessagesSquare, badge: "unread" },
  ],
  secondary: [{ label: "Mon profil", shortLabel: "Profil", href: "/profile", icon: UserRound }],
  extra: [{ label: "Données et mentions légales", href: "/profile/privacy", icon: ShieldCheck }],
};

/** Moniteur : uniquement le calendrier des cours et son profil. */
export const skipperNav: NavConfig = {
  role: "SKIPPER",
  home: "/admin/calendar",
  primary: [
    { label: "Calendrier", href: "/admin/calendar", icon: CalendarDays },
    { label: "Mon profil", shortLabel: "Profil", href: "/admin/profile", icon: UserRound },
  ],
  secondary: [],
  extra: [{ label: "Données et mentions légales", href: "/admin/privacy", icon: ShieldCheck }],
};

/** Pages autorisées pour un moniteur dans l'espace /admin. */
export const SKIPPER_PATHS = ["/admin/calendar", "/admin/profile", "/admin/privacy"];

export function homeForRole(role: string | undefined) {
  if (role === "ADMIN") return adminNav.home;
  if (role === "SKIPPER") return skipperNav.home;
  return candidateNav.home;
}

export function navForRole(role: string | undefined) {
  if (role === "ADMIN") return adminNav;
  if (role === "SKIPPER") return skipperNav;
  return candidateNav;
}

export function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function findNavItem(config: NavConfig, pathname: string) {
  return [...config.primary, ...config.secondary, ...config.extra].find((item) =>
    isActivePath(pathname, item.href),
  );
}
