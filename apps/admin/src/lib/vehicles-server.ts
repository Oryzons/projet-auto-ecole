import { auth } from "@/lib/auth";
import { prisma, type DbRow } from "@/lib/prisma";
import { taskLinks } from "@/lib/tasks";

export async function adminSession() {
  const session = await auth();
  return session?.user && session.user.role === "ADMIN" ? session : null;
}

/** Leçons à venir et tâches ouvertes de chaque véhicule (affichées sur les fiches et avant suppression). */
export async function vehicleUsage(organizationId: string) {
  const [lessons, tasks] = await Promise.all([
    prisma.drivingLesson.findMany({ where: { organizationId, startsAt: { gte: new Date() } } }),
    prisma.task.findMany({ where: { organizationId } }),
  ]);
  const usage = new Map<string, { lessons: number; tasks: number }>();
  const bump = (id: string, key: "lessons" | "tasks") => {
    const entry = usage.get(id) ?? { lessons: 0, tasks: 0 };
    entry[key] += 1;
    usage.set(id, entry);
  };
  lessons.forEach((lesson: DbRow) => lesson.vehicleId && lesson.status !== "CANCELLED" && bump(lesson.vehicleId, "lessons"));
  tasks
    .filter((task: DbRow) => task.status !== "DONE")
    .forEach((task: DbRow) => taskLinks(task).forEach((link) => link.type === "VEHICLE" && bump(link.id, "tasks")));
  return usage;
}
