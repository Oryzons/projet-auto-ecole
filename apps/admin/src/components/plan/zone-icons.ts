import { Building2, CalendarClock, Car, Flag, FolderOpen, MessagesSquare, MonitorPlay, UserPlus, Wallet, type LucideIcon } from "lucide-react";

import type { ZoneId } from "@/lib/plan-types";

export const ZONE_ICONS: Record<ZoneId, LucideIcon> = {
  accueil: Building2,
  inscriptions: UserPlus,
  administratif: FolderOpen,
  code: MonitorPlay,
  planning: CalendarClock,
  parc: Car,
  examens: Flag,
  comptabilite: Wallet,
  communication: MessagesSquare,
};
