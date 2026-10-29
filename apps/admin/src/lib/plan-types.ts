import type { Tone } from "@/lib/crm";

/** Zones du plan, dans l'ordre de la barre de navigation par zones. */
export const ZONE_IDS = ["accueil", "inscriptions", "administratif", "code", "planning", "parc", "examens", "comptabilite", "communication"] as const;
export type ZoneId = (typeof ZONE_IDS)[number];

/** Catégorie de tâche rattachée à chaque zone (l'accueil reprend toutes les tâches en retard). */
export const ZONE_TASK_CATEGORY: Record<ZoneId, string | null> = {
  accueil: null,
  inscriptions: "INSCRIPTION",
  administratif: "ADMIN",
  code: "CODE",
  planning: "PLANNING",
  parc: "VEHICLE",
  examens: "EXAM",
  comptabilite: "PAYMENT",
  communication: "COMMUNICATION",
};

export type PlanMetric = { label: string; value: string | number; tone: Tone; href?: string };

export type PlanItem = {
  id: string;
  title: string;
  subtitle: string;
  tone: Tone;
  badge?: string;
  /** Lien vers une page (fiche élève, messages…) */
  href?: string;
  /** Détail affiché dans le panneau, sans quitter le plan */
  detail?: { title: string; rows: { label: string; value: string; tone?: Tone }[]; note?: string };
};

export type PlanTask = {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueAt: string | null;
  tone: Tone;
  assignee: string | null;
  entityLabel: string | null;
  href: string | null;
  /** tous les élèves et véhicules liés */
  links?: { label: string; href: string | null }[];
};

export type PlanZone = {
  id: ZoneId;
  title: string;
  subtitle: string;
  /** Nombre affiché sur le badge du plan */
  count: number;
  countLabel: string;
  tone: Tone;
  metrics: PlanMetric[];
  itemsTitle: string;
  items: PlanItem[];
  tasks: PlanTask[];
  page: { label: string; href: string };
};

export type PlanData = {
  generatedAt: string;
  kpis: PlanMetric[];
  zones: PlanZone[];
};

