import { z } from "zod";

import { vehicleAlerts } from "@/lib/crm";
import type { DbRow } from "@/lib/prisma";

export const VEHICLE_STATUS_LABELS: Record<string, string> = {
  AVAILABLE: "Disponible",
  IN_USE: "En leçon",
  MAINTENANCE: "Au garage",
  OUT_OF_SERVICE: "Hors service",
};
export const VEHICLE_TRANSMISSION_LABELS: Record<string, string> = { MANUAL: "Manuelle", AUTO: "Automatique", MOTO: "Moto" };
export const VEHICLE_FUEL_LABELS: Record<string, string> = { PETROL: "Essence", DIESEL: "Diesel", HYBRID: "Hybride", ELECTRIC: "Électrique" };
export const VEHICLE_PERMIT_LABELS: Record<string, string> = {
  B: "Permis B",
  B_AUTO: "Permis B (boîte auto)",
  A2: "Permis A2",
  A: "Permis A",
  AM: "Permis AM",
};

export const VEHICLE_BODY_LABELS: Record<string, string> = { CITY: "Citadine", COMPACT: "Compacte / berline", SUV: "SUV", MOTO: "Moto" };

/** Silhouette devinée d'après le modèle quand elle n'est pas choisie. */
export function guessBody(name: string, transmission?: string) {
  const n = name.toLowerCase();
  if (transmission === "MOTO" || /\b(mt-?\d+|moto|scooter|cb ?\d+|z ?\d{3}|er-?\d|ninja|duke|tracer|hornet)\b/.test(n)) return "MOTO";
  if (/\b(2008|3008|5008|captur|arkana|austral|kadjar|tiguan|t-roc|t-cross|qashqai|juke|duster|c-hr|rav4|yaris cross|kona|tucson|sportage|niro|model y|puma|kuga|c3 aircross|c5 aircross|x1|q3|suv)\b/.test(n)) return "SUV";
  if (/\b(208|clio|yaris|polo|corsa|c3|sandero|i20|fiesta|twingo|up|aygo|mini|zoe|500|ibiza|fabia|swift|micra|e-208)\b/.test(n)) return "CITY";
  return "COMPACT";
}

/** Teinte approchée à partir du nom de la couleur (« Gris titanium » → gris). */
const COLOR_WORDS: [RegExp, string][] = [
  [/noir|black/, "#2a2e38"],
  [/blanc|white|nacr/, "#f4f5f7"],
  [/argent|silver|alu/, "#c4c9d2"],
  [/gris|grey|gray|anthracite|titan/, "#8a93a3"],
  [/rouge|red|bordeaux/, "#e0413a"],
  [/orange/, "#f08a2c"],
  [/jaune|yellow/, "#f2c230"],
  [/bleu|blue|marine/, "#2d50f5"],
  [/turquoise|cyan/, "#22a7b8"],
  [/\bvert\b|green|kaki/, "#3f9a5f"],
  [/violet|mauve|pourpre/, "#7b5bd6"],
  [/rose|pink/, "#ec6fa4"],
  [/marron|brun|brown|chocolat/, "#7a5236"],
  [/beige|sable|champagne|or\b|gold/, "#d8c6a3"],
];
export function colorHex(color: string | null | undefined) {
  const c = (color ?? "").toLowerCase();
  return COLOR_WORDS.find(([re]) => re.test(c))?.[1] ?? "#e8ecf3";
}

export const MAX_VEHICLE_PHOTOS = 6;

/**
 * Met les tirets d'une immatriculation pendant la saisie : AB123CD → AB-123-CD (format SIV).
 * Les anciens numéros (123 ABC 75) et les saisies atypiques restent tels quels.
 */
export function formatPlate(raw: string) {
  const value = raw.toUpperCase().replace(/[^A-Z0-9 -]/g, "");
  const compact = value.replace(/[ -]/g, "");
  if (!/^[A-Z]{0,2}$|^[A-Z]{2}\d{1,3}$|^[A-Z]{2}\d{3}[A-Z]{1,2}$/.test(compact)) return value;
  // le tiret se place dès que le caractère suivant est tapé, ce qui laisse l'effacement naturel
  return [compact.slice(0, 2), compact.slice(2, 5), compact.slice(5, 7)].filter(Boolean).join("-");
}

const keys = (labels: Record<string, string>) => Object.keys(labels) as [string, ...string[]];
/** Date du formulaire (AAAA-MM-JJ), ou vide. */
const day = z.preprocess(
  (v) => (v === "" || v === undefined ? null : v),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide").nullable(),
);
const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .optional()
    .transform((v) => v || null);

export const vehicleSchema = z.object({
  name: z.string().trim().min(2, "Indiquez la marque et le modèle").max(80),
  plate: z
    .string()
    .trim()
    .toUpperCase()
    .min(4, "Indiquez l'immatriculation")
    .max(15)
    .regex(/^[A-Z0-9 -]+$/, "Immatriculation : lettres, chiffres et tirets"),
  status: z.enum(keys(VEHICLE_STATUS_LABELS)).default("AVAILABLE"),
  transmission: z.enum(keys(VEHICLE_TRANSMISSION_LABELS)).default("MANUAL"),
  fuel: z.enum(keys(VEHICLE_FUEL_LABELS)).default("PETROL"),
  permitCategory: z.enum(keys(VEHICLE_PERMIT_LABELS)).default("B"),
  dualControls: z.boolean().default(true),
  color: text(30),
  vin: text(17),
  firstRegistrationAt: day,
  mileage: z.coerce.number().int().min(0, "Kilométrage invalide").max(2_000_000).default(0),
  nextServiceAt: day,
  nextServiceMileage: z.coerce.number().int().min(0).max(2_000_000).nullable().optional().transform((v) => v ?? null),
  inspectionExpiresAt: day,
  insuranceExpiresAt: day,
  insurer: text(60),
  insurancePolicy: text(40),
  notes: text(2000),
  bodyType: z.preprocess((v) => (v === "" ? null : v), z.enum(keys(VEHICLE_BODY_LABELS)).nullable().optional().transform((v) => v ?? null)),
  photos: z
    .array(z.string().regex(/^data:image\/(jpeg|png|webp);base64,/, "Format de photo non pris en charge").max(3_000_000, "Photo trop lourde"))
    .max(MAX_VEHICLE_PHOTOS, `${MAX_VEHICLE_PHOTOS} photos au maximum`)
    .default([]),
});
export type VehicleInput = z.infer<typeof vehicleSchema>;

const toDay = (value: unknown) => (value ? new Date(value as string).toISOString().slice(0, 10) : null);
/** Les dates sont gardées à 9 h, comme celles de démonstration. */
export const fromDay = (value: string | null) => (value ? new Date(`${value}T09:00:00`) : null);

/** Forme envoyée au navigateur, avec les alertes d'échéance déjà calculées. */
export function serializeVehicle(
  vehicle: DbRow,
  usage?: { lessons: number; tasks: number; current?: { startsAt: string; endsAt: string; student: string | null; instructor: string | null } | null },
) {
  return {
    id: vehicle.id as string,
    name: vehicle.name as string,
    plate: vehicle.plate as string,
    status: vehicle.status as string,
    transmission: vehicle.transmission as string,
    fuel: (vehicle.fuel ?? "PETROL") as string,
    permitCategory: (vehicle.permitCategory ?? "B") as string,
    dualControls: vehicle.dualControls !== false,
    color: (vehicle.color ?? null) as string | null,
    vin: (vehicle.vin ?? null) as string | null,
    firstRegistrationAt: toDay(vehicle.firstRegistrationAt),
    mileage: Number(vehicle.mileage ?? 0),
    nextServiceAt: toDay(vehicle.nextServiceAt),
    nextServiceMileage: (vehicle.nextServiceMileage ?? null) as number | null,
    inspectionExpiresAt: toDay(vehicle.inspectionExpiresAt),
    insuranceExpiresAt: toDay(vehicle.insuranceExpiresAt),
    insurer: (vehicle.insurer ?? null) as string | null,
    insurancePolicy: (vehicle.insurancePolicy ?? null) as string | null,
    notes: (vehicle.notes ?? null) as string | null,
    bodyType: (vehicle.bodyType ?? null) as string | null,
    photos: (vehicle.photos ?? []) as string[],
    alerts: vehicleAlerts(vehicle),
    lessons: usage?.lessons ?? 0,
    openTasks: usage?.tasks ?? 0,
    /** Leçon en cours sur ce véhicule, s'il y en a une. */
    currentLesson: usage?.current ?? null,
  };
}
export type VehicleDto = ReturnType<typeof serializeVehicle>;

/** Données à enregistrer à partir du formulaire validé. */
export function vehicleData(input: VehicleInput) {
  return {
    ...input,
    firstRegistrationAt: fromDay(input.firstRegistrationAt),
    nextServiceAt: fromDay(input.nextServiceAt),
    inspectionExpiresAt: fromDay(input.inspectionExpiresAt),
    insuranceExpiresAt: fromDay(input.insuranceExpiresAt),
  };
}
