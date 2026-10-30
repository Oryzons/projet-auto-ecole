import { z } from "zod";

/* ---------- comptes rendus de leçon ---------- */

export const ISSUE_SEVERITY_LABELS: Record<string, string> = { INFO: "À surveiller", WARNING: "À réparer", URGENT: "Urgent" };
export const FUEL_LEVEL_LABELS: Record<string, string> = { FULL: "Plein", THREE_QUARTERS: "3/4", HALF: "1/2", QUARTER: "1/4", RESERVE: "Réserve" };

/** Compte rendu rempli par le moniteur à la fin d'une leçon. */
export type LessonReport = {
  kmStart: number;
  kmEnd: number;
  fuelLevel: string | null;
  issues: { label: string; severity: string; detail: string | null }[];
  skills: string[];
  comment: string | null;
  submittedAt: string;
};

/* ---------- documents ---------- */

export const VEHICLE_DOCUMENT_LABELS: Record<string, string> = {
  REGISTRATION: "Carte grise",
  INSURANCE: "Attestation d'assurance",
  INSPECTION: "Contrôle technique",
  SERVICE: "Facture d'entretien",
  REPAIR: "Facture de réparation",
  CRIT_AIR: "Vignette Crit'Air",
  CLAIM: "Constat / sinistre",
  OTHER: "Autre document",
};
/** Documents dont la date de fin met à jour l'échéance correspondante de la fiche. */
export const DOCUMENT_DUE_FIELD: Record<string, "insuranceExpiresAt" | "inspectionExpiresAt"> = {
  INSURANCE: "insuranceExpiresAt",
  INSPECTION: "inspectionExpiresAt",
};

const keys = (labels: Record<string, string>) => Object.keys(labels) as [string, ...string[]];
const day = z.preprocess((v) => (v === "" || v === undefined ? null : v), z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide").nullable());
const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .optional()
    .transform((v) => v || null);

export const MAX_DOCUMENT_BYTES = 6_000_000;

export const vehicleDocumentSchema = z.object({
  type: z.enum(keys(VEHICLE_DOCUMENT_LABELS)),
  title: text(80),
  issuedAt: day,
  expiresAt: day,
  comment: text(1000),
  file: z
    .object({
      name: z.string().trim().min(1).max(120),
      dataUrl: z
        .string()
        .regex(/^data:(application\/pdf|image\/(jpeg|png|webp));base64,/, "Fichier PDF ou image uniquement")
        .max(MAX_DOCUMENT_BYTES, "Fichier trop lourd (4 Mo maximum)"),
    })
    .nullable()
    .optional()
    .transform((v) => v ?? null),
});

/* ---------- journal ---------- */

export const JOURNAL_KIND_LABELS: Record<string, string> = {
  NOTE: "Note",
  ISSUE: "Problème",
  REPAIR: "Réparation",
  DOCUMENT: "Document",
  UPDATE: "Modification",
  LESSON: "Signalé en leçon",
};
/** Types qu'on peut saisir à la main (les autres sont ajoutés automatiquement). */
export const MANUAL_JOURNAL_KINDS = ["NOTE", "ISSUE", "REPAIR"] as const;

export const journalEntrySchema = z.object({
  kind: z.enum(MANUAL_JOURNAL_KINDS),
  comment: z.string().trim().min(2, "Écrivez un commentaire").max(1000),
  at: day.optional(),
});

export type JournalEntry = { id: string; at: string; kind: string; text: string; author: string | null; lessonId?: string | null };
export type VehicleDocument = {
  id: string;
  type: string;
  title: string | null;
  issuedAt: string | null;
  expiresAt: string | null;
  comment: string | null;
  file: { name: string; dataUrl: string } | null;
  addedAt: string;
  addedBy: string | null;
};
export type VehicleLessonDto = {
  id: string;
  startsAt: string;
  durationMinutes: number;
  status: string;
  student: string | null;
  instructor: string | null;
  report: LessonReport | null;
};
export type VehicleHistoryDto = { lessons: VehicleLessonDto[]; documents: VehicleDocument[]; journal: JournalEntry[] };

/* ---------- libellés des modifications de la fiche ---------- */

export const TRACKED_FIELDS: Record<string, string> = {
  name: "Modèle",
  plate: "Immatriculation",
  status: "Statut",
  mileage: "Kilométrage",
  color: "Couleur",
  transmission: "Boîte",
  fuel: "Énergie",
  permitCategory: "Permis",
  nextServiceAt: "Prochaine révision",
  nextServiceMileage: "Révision au kilométrage",
  inspectionExpiresAt: "Contrôle technique",
  insuranceExpiresAt: "Assurance",
  insurer: "Assureur",
  dualControls: "Double commande",
};
