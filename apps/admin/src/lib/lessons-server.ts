import { prisma, type DbRow } from "@/lib/prisma";
import { getStaffUser } from "@/lib/theory-sessions";
import { findConflicts, type LessonConflict, type LessonDto, type LessonPerson, type LessonsPayload, type LessonVehicle } from "@/lib/lessons";

const person = (u: DbRow | null | undefined): LessonPerson | null => (u ? { id: u.id, firstName: u.firstName, lastName: u.lastName } : null);
const vehicleDto = (v: DbRow | null | undefined): LessonVehicle | null =>
  v ? { id: v.id, name: v.name, plate: v.plate, color: v.color ?? null, transmission: v.transmission, status: v.status } : null;

export function serializeLesson(lesson: DbRow): LessonDto {
  const candidate = lesson.application?.candidate;
  return {
    id: lesson.id,
    startsAt: new Date(lesson.startsAt).toISOString(),
    durationMinutes: Number(lesson.durationMinutes ?? 60),
    status: lesson.status,
    notes: lesson.notes ?? null,
    report: lesson.report ?? null,
    applicationId: lesson.applicationId,
    student: { id: candidate?.id ?? lesson.applicationId, firstName: candidate?.firstName ?? "Élève", lastName: candidate?.lastName ?? "", permitType: lesson.application?.permitType ?? "permis-b" },
    instructor: person(lesson.instructor),
    vehicle: vehicleDto(lesson.vehicle),
  };
}

export const LESSON_INCLUDE = { application: { include: { candidate: true } }, instructor: true, vehicle: true } as const;

/** Admin : tout le planning, modifiable. Moniteur : ses propres leçons, en lecture. */
export async function lessonStaff() {
  const user = await getStaffUser();
  if (!user) return null;
  return { user, canEdit: user.role === "ADMIN" };
}

export async function planningPayload(user: DbRow, canEdit: boolean, from: Date, to: Date): Promise<LessonsPayload> {
  const organizationId = user.organizationId;
  const mine = canEdit ? {} : { instructorId: user.id };
  const [lessons, instructors, vehicles, apps, booked] = await Promise.all([
    prisma.drivingLesson.findMany({
      where: { organizationId, ...mine, startsAt: { gte: from, lt: to } },
      include: LESSON_INCLUDE,
      orderBy: { startsAt: "asc" },
    }),
    prisma.user.findMany({ where: { organizationId, role: "SKIPPER", ...(canEdit ? {} : { id: user.id }) }, orderBy: { firstName: "asc" } }),
    prisma.vehicle.findMany({ where: { organizationId }, orderBy: { name: "asc" } }),
    canEdit
      ? prisma.permitApplication.findMany({ where: { organizationId, archivedAt: null, status: { in: ["PAID", "PAYMENT_PENDING", "DOCUMENTS_REVIEW"] } }, include: { candidate: true } })
      : Promise.resolve([]),
    canEdit ? prisma.drivingLesson.findMany({ where: { organizationId, status: { not: "CANCELLED" } } }) : Promise.resolve([]),
  ]);
  const hours = new Map<string, number>();
  for (const l of booked as DbRow[]) hours.set(l.applicationId, (hours.get(l.applicationId) ?? 0) + Number(l.durationMinutes ?? 60) / 60);
  return {
    lessons: (lessons as DbRow[]).map(serializeLesson),
    instructors: (instructors as DbRow[]).map((u) => person(u)!),
    vehicles: (vehicles as DbRow[]).map((v) => vehicleDto(v)!),
    students: (apps as DbRow[])
      .filter((a) => a.candidate)
      .map((a) => ({
        id: a.candidate.id,
        firstName: a.candidate.firstName,
        lastName: a.candidate.lastName,
        applicationId: a.id,
        permitType: a.permitType,
        instructorId: a.instructorId ?? null,
        hoursPlanned: Number(a.hoursPlanned ?? 20),
        hoursBooked: Math.round((hours.get(a.id) ?? 0) * 10) / 10,
      }))
      .sort((a, b) => a.lastName.localeCompare(b.lastName, "fr")),
    canEdit,
  };
}

/** Vérifie qu'un créneau est libre et que le véhicule roule. Renvoie la liste des problèmes. */
export async function checkSlot(
  organizationId: string,
  slot: { id?: string; startsAt: Date; durationMinutes: number; instructorId: string | null; vehicleId: string | null; applicationId: string },
): Promise<LessonConflict[]> {
  const dayStart = new Date(slot.startsAt.getTime() - 12 * 3_600_000);
  const dayEnd = new Date(slot.startsAt.getTime() + 12 * 3_600_000);
  const [others, users, vehicles, app] = await Promise.all([
    prisma.drivingLesson.findMany({ where: { organizationId, startsAt: { gte: dayStart, lt: dayEnd } } }),
    prisma.user.findMany({ where: { organizationId, role: "SKIPPER" } }),
    prisma.vehicle.findMany({ where: { organizationId } }),
    prisma.permitApplication.findFirst({ where: { id: slot.applicationId }, include: { candidate: true } }),
  ]);
  const conflicts = findConflicts({ ...slot, status: "PLANNED" }, others as DbRow[], {
    instructor: (id) => (users as DbRow[]).find((u) => u.id === id)?.firstName,
    vehicle: (id) => (vehicles as DbRow[]).find((v) => v.id === id)?.name,
    student: () => (app?.candidate ? `${app.candidate.firstName} ${app.candidate.lastName}` : undefined),
  });
  const vehicle = (vehicles as DbRow[]).find((v) => v.id === slot.vehicleId);
  if (vehicle && (vehicle.status === "MAINTENANCE" || vehicle.status === "OUT_OF_SERVICE"))
    conflicts.push({ kind: "vehicle-status", message: `${vehicle.name} est ${vehicle.status === "MAINTENANCE" ? "au garage" : "hors service"}` });
  return conflicts;
}
