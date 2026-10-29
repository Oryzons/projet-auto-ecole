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
});
export type VehicleInput = z.infer<typeof vehicleSchema>;

const toDay = (value: unknown) => (value ? new Date(value as string).toISOString().slice(0, 10) : null);
/** Les dates sont gardées à 9 h, comme celles de démonstration. */
export const fromDay = (value: string | null) => (value ? new Date(`${value}T09:00:00`) : null);

/** Forme envoyée au navigateur, avec les alertes d'échéance déjà calculées. */
export function serializeVehicle(vehicle: DbRow, usage?: { lessons: number; tasks: number }) {
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
    alerts: vehicleAlerts(vehicle),
    lessons: usage?.lessons ?? 0,
    openTasks: usage?.tasks ?? 0,
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
