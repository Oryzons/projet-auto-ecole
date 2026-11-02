import { z } from "zod";

import type { LessonReport } from "@/lib/vehicle-history";

export const LESSON_STATUS_LABELS: Record<string, string> = { PLANNED: "Prévue", DONE: "Effectuée", CANCELLED: "Annulée" };
export const LESSON_DURATIONS = [45, 60, 90, 120];

/** Amplitude affichée dans le planning de conduite. */
export const PLANNER_START_HOUR = 7;
export const PLANNER_END_HOUR = 20;

/** Couleur de chaque moniteur dans le planning, dans l'ordre de la liste. */
export const INSTRUCTOR_COLORS = ["#2D50F5", "#0E9F8E", "#E07B16", "#8B5CF6", "#DB2777", "#0891B2"];

export type LessonPerson = { id: string; firstName: string; lastName: string };
export type LessonVehicle = { id: string; name: string; plate: string; color: string | null; transmission: string; status: string };

export type LessonDto = {
  id: string;
  startsAt: string;
  durationMinutes: number;
  status: "PLANNED" | "DONE" | "CANCELLED";
  notes: string | null;
  report: LessonReport | null;
  applicationId: string;
  student: LessonPerson & { permitType: string };
  instructor: LessonPerson | null;
  vehicle: LessonVehicle | null;
};

export type LessonStudent = LessonPerson & {
  applicationId: string;
  permitType: string;
  instructorId: string | null;
  hoursPlanned: number;
  /** Heures déjà faites ou prévues (leçons non annulées). */
  hoursBooked: number;
};

export type LessonsPayload = {
  lessons: LessonDto[];
  instructors: LessonPerson[];
  vehicles: LessonVehicle[];
  students: LessonStudent[];
  canEdit: boolean;
};

export type LessonConflict = { kind: "instructor" | "vehicle" | "student" | "vehicle-status"; message: string };

const id = z.string().min(1);

export const lessonInputSchema = z.object({
  applicationId: id,
  instructorId: id,
  vehicleId: id.nullable().default(null),
  startsAt: z.coerce.date(),
  durationMinutes: z.number().int().min(15).max(240),
  notes: z.string().trim().max(1000).nullable().default(null),
});

export const lessonPatchSchema = z
  .object({
    instructorId: id,
    vehicleId: id.nullable(),
    startsAt: z.coerce.date(),
    durationMinutes: z.number().int().min(15).max(240),
    status: z.enum(["PLANNED", "DONE", "CANCELLED"]),
    notes: z.string().trim().max(1000).nullable(),
  })
  .partial();

export const lessonEnd = (lesson: Pick<LessonDto, "startsAt" | "durationMinutes">) => new Date(lesson.startsAt).getTime() + lesson.durationMinutes * 60_000;

/** Leçon en cours : commencée, pas finie, ni annulée. */
export function isLive(lesson: LessonDto, now = Date.now()) {
  return lesson.status === "PLANNED" && new Date(lesson.startsAt).getTime() <= now && lessonEnd(lesson) > now;
}

/** Le véhicule convient-il au permis préparé ? (moto pour l'A2, boîte auto pour le B auto) */
export function vehicleFits(permitType: string, transmission: string) {
  if (permitType === "a2") return transmission === "MOTO";
  if (permitType === "permis-b-auto") return transmission === "AUTO";
  return transmission === "MANUAL";
}

type Slot = { id?: string; startsAt: Date | string; durationMinutes: number; status: string; instructorId: string | null; vehicleId: string | null; applicationId: string };

/**
 * Créneaux qui se chevauchent avec la leçon proposée : même moniteur, même véhicule ou même élève.
 * Sert côté serveur (refus) et côté formulaire (alerte avant d'enregistrer).
 */
export function findConflicts(
  candidate: Slot,
  others: Slot[],
  names: { instructor?: (id: string) => string | undefined; vehicle?: (id: string) => string | undefined; student?: (id: string) => string | undefined } = {},
): LessonConflict[] {
  const start = new Date(candidate.startsAt).getTime();
  const end = start + candidate.durationMinutes * 60_000;
  const hhmm = (d: Date) => d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const conflicts: LessonConflict[] = [];
  for (const other of others) {
    if (other.id && other.id === candidate.id) continue;
    if (other.status === "CANCELLED") continue;
    const s = new Date(other.startsAt).getTime();
    const e = s + other.durationMinutes * 60_000;
    if (s >= end || e <= start) continue;
    const when = `de ${hhmm(new Date(s))} à ${hhmm(new Date(e))}`;
    if (candidate.instructorId && other.instructorId === candidate.instructorId)
      conflicts.push({ kind: "instructor", message: `${names.instructor?.(candidate.instructorId) ?? "Le moniteur"} a déjà une leçon ${when}` });
    if (candidate.vehicleId && other.vehicleId === candidate.vehicleId)
      conflicts.push({ kind: "vehicle", message: `${names.vehicle?.(candidate.vehicleId) ?? "Le véhicule"} est déjà pris ${when}` });
    if (other.applicationId === candidate.applicationId)
      conflicts.push({ kind: "student", message: `${names.student?.(candidate.applicationId) ?? "L'élève"} a déjà une leçon ${when}` });
  }
  return conflicts;
}
