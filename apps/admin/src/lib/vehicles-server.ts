import { auth } from "@/lib/auth";
import { prisma, type DbRow } from "@/lib/prisma";
import { taskLinks } from "@/lib/tasks";

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
