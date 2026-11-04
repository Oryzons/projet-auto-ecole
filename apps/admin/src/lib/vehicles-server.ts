import { auth } from "@/lib/auth";
import { prisma, type DbRow } from "@/lib/prisma";
import { cuid } from "@/lib/db/engine";
import { taskLinks } from "@/lib/tasks";
import { TRACKED_FIELDS, type JournalEntry, type LessonReport, type VehicleDocument, type VehicleHistoryDto } from "@/lib/vehicle-history";
import { VEHICLE_FUEL_LABELS, VEHICLE_PERMIT_LABELS, VEHICLE_STATUS_LABELS, VEHICLE_TRANSMISSION_LABELS } from "@/lib/vehicles";

export async function adminSession() {
  const session = await auth();
  return session?.user && session.user.role === "ADMIN" ? session : null;
}

export type CurrentLesson = { startsAt: string; endsAt: string; student: string | null; instructor: string | null };
export type VehicleUsage = { lessons: number; tasks: number; current: CurrentLesson | null };

const fullName = (u: DbRow | null | undefined) => (u ? `${u.firstName} ${u.lastName}`.trim() : null);

/** Leçons à venir, leçon en cours et tâches ouvertes de chaque véhicule (affichées sur les fiches et avant suppression). */
export async function vehicleUsage(organizationId: string) {
  const now = Date.now();
  const [lessons, tasks] = await Promise.all([
    prisma.drivingLesson.findMany({
      where: { organizationId, startsAt: { gte: new Date(now - 6 * 3_600_000) } },
      include: { application: { include: { candidate: true } }, instructor: true },
    }),
    prisma.task.findMany({ where: { organizationId } }),
  ]);
  const usage = new Map<string, VehicleUsage>();
  const entry = (id: string) => {
    const found = usage.get(id) ?? { lessons: 0, tasks: 0, current: null };
    usage.set(id, found);
    return found;
  };
  lessons.forEach((lesson: DbRow) => {
    if (!lesson.vehicleId || lesson.status === "CANCELLED") return;
    const start = new Date(lesson.startsAt).getTime();
    const end = start + Number(lesson.durationMinutes ?? 60) * 60_000;
    if (start >= now) entry(lesson.vehicleId).lessons += 1;
    else if (end > now)
      entry(lesson.vehicleId).current = {
        startsAt: new Date(start).toISOString(),
        endsAt: new Date(end).toISOString(),
        student: fullName(lesson.application?.candidate),
        instructor: fullName(lesson.instructor),
      };
  });
  tasks
    .filter((task: DbRow) => task.status !== "DONE")
    .forEach((task: DbRow) => taskLinks(task).forEach((link) => link.type === "VEHICLE" && (entry(link.id).tasks += 1)));
  return usage;
}

/* ---------- historique : leçons, documents et journal ---------- */

const DATE = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" });

/** Valeur lisible d'un champ de la fiche, pour le journal des modifications. */
function display(field: string, value: unknown) {
  if (value === null || value === undefined || value === "") return "vide";
  if (value instanceof Date || (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value))) return DATE.format(new Date(value as string));
  if (typeof value === "boolean") return value ? "oui" : "non";
  if (field === "mileage" || field === "nextServiceMileage") return `${Number(value).toLocaleString("fr-FR")} km`;
  const labels: Record<string, Record<string, string>> = {
    status: VEHICLE_STATUS_LABELS,
    transmission: VEHICLE_TRANSMISSION_LABELS,
    fuel: VEHICLE_FUEL_LABELS,
    permitCategory: VEHICLE_PERMIT_LABELS,
  };
  return labels[field]?.[value as string] ?? String(value);
}

const same = (a: unknown, b: unknown) => {
  const norm = (v: unknown) => (v instanceof Date ? v.toISOString().slice(0, 10) : typeof v === "string" && /^\d{4}-\d{2}-\d{2}T/.test(v) ? v.slice(0, 10) : (v ?? null));
  return JSON.stringify(norm(a)) === JSON.stringify(norm(b));
};

/** Résumé des changements entre deux versions de la fiche (« Kilométrage : 68 900 km → 70 100 km »). */
export function describeChanges(before: DbRow, after: Record<string, unknown>) {
  const lines = Object.entries(TRACKED_FIELDS)
    .filter(([field]) => field in after && !same(before[field], after[field]))
    .map(([field, label]) => `${label} : ${display(field, before[field])} → ${display(field, after[field])}`);
  if ("photos" in after && JSON.stringify(before.photos ?? []) !== JSON.stringify(after.photos)) lines.push("Photos mises à jour");
  if ("notes" in after && (before.notes ?? null) !== (after.notes ?? null)) lines.push("Notes modifiées");
  return lines;
}

export function journalEntry(kind: string, text: string, author: string | null, at = new Date()): JournalEntry {
  return { id: cuid(), at: at.toISOString(), kind, text, author };
}

/** Leçons passées du véhicule avec leur compte rendu, documents et journal (problèmes signalés en leçon inclus). */
export async function vehicleHistory(vehicle: DbRow, organizationId: string): Promise<VehicleHistoryDto> {
  const lessons = await prisma.drivingLesson.findMany({
    where: { organizationId, vehicleId: vehicle.id, startsAt: { lte: new Date() } },
    include: { application: { include: { candidate: true } }, instructor: true },
    orderBy: { startsAt: "desc" },
  });
  const rows = (lessons as DbRow[]).map((lesson) => ({
    id: lesson.id as string,
    startsAt: new Date(lesson.startsAt).toISOString(),
    durationMinutes: Number(lesson.durationMinutes ?? 60),
    status: lesson.status as string,
    student: fullName(lesson.application?.candidate),
    instructor: fullName(lesson.instructor),
    report: (lesson.report ?? null) as LessonReport | null,
  }));
  const fromLessons: JournalEntry[] = rows.flatMap((lesson) =>
    (lesson.report?.issues ?? []).map((issue, i) => ({
      id: `${lesson.id}-${i}`,
      at: lesson.report!.submittedAt,
      kind: "LESSON",
      text: `${issue.label}${issue.detail ? ` : ${issue.detail}` : ""}`,
      author: lesson.instructor,
      lessonId: lesson.id,
    })),
  );
  const journal = [...((vehicle.journal ?? []) as JournalEntry[]), ...fromLessons].sort((a, b) => b.at.localeCompare(a.at));
  const documents = [...((vehicle.documents ?? []) as VehicleDocument[])].sort((a, b) => (b.issuedAt ?? b.addedAt).localeCompare(a.issuedAt ?? a.addedAt));
  return { lessons: rows, documents, journal };
}
