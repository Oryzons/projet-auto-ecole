import { z } from "zod";

import { TaskCategory, TaskPriority, TaskStatus } from "@/lib/db/client";
import { prisma, type DbRow } from "@/lib/prisma";

export const taskCreateSchema = z.object({
  title: z.string().trim().min(2, "Donnez un titre à la tâche").max(140),
  description: z.string().trim().max(2000).optional().nullable(),
  category: z.enum(Object.values(TaskCategory) as [string, ...string[]]),
  priority: z.enum(Object.values(TaskPriority) as [string, ...string[]]).default("NORMAL"),
  assigneeIds: z.array(z.string().min(1)).max(20).default([]),
  dueAt: z.string().datetime({ offset: true }).optional().nullable(),
  applicationIds: z.array(z.string().min(1)).max(50).default([]),
  vehicleIds: z.array(z.string().min(1)).max(50).default([]),
});

export const taskUpdateSchema = z.object({
  status: z.enum(Object.values(TaskStatus) as [string, ...string[]]).optional(),
  priority: z.enum(Object.values(TaskPriority) as [string, ...string[]]).optional(),
  assigneeIds: z.array(z.string().min(1)).max(20).optional(),
  dueAt: z.string().datetime({ offset: true }).nullable().optional(),
});

export type TaskLink = { type: "APPLICATION" | "VEHICLE"; id: string; label: string };

/** Responsables d'une tâche (les anciennes tâches n'en avaient qu'un, dans `assigneeId`). */
export function taskAssigneeIds(task: DbRow): string[] {
  if (Array.isArray(task.assigneeIds) && task.assigneeIds.length) return task.assigneeIds as string[];
  return task.assigneeId ? [task.assigneeId as string] : [];
}

/** Élèves et véhicules liés (les anciennes tâches n'en avaient qu'un, dans `entity*`). */
export function taskLinks(task: DbRow): TaskLink[] {
  if (Array.isArray(task.links) && task.links.length) return task.links as TaskLink[];
  return task.entityType && task.entityId ? [{ type: task.entityType, id: task.entityId, label: task.entityLabel ?? "" }] : [];
}

export const linkHref = (link: TaskLink) => (link.type === "APPLICATION" ? `/admin/applications/${link.id}` : null);

/** Champs à enregistrer : la liste complète, et le premier élément dans les anciens champs (plan, filtres). */
export function taskRelationData(assigneeIds: string[], links: TaskLink[]) {
  return {
    assigneeIds,
    assigneeId: assigneeIds[0] ?? null,
    links,
    entityType: links[0]?.type ?? null,
    entityId: links[0]?.id ?? null,
    entityLabel: links[0]?.label ?? null,
  };
}

type StaffNames = Map<string, { firstName: string; lastName: string }>;

/** Forme renvoyée au navigateur : dates en ISO, responsables et liens des élèves ou véhicules liés. */
export function serializeTask(task: DbRow, staff?: StaffNames) {
  const assignees = taskAssigneeIds(task)
    .map((id) => {
      const user = staff?.get(id) ?? (task.assignee?.id === id ? task.assignee : null);
      return user ? { id, name: `${user.firstName} ${user.lastName}` } : null;
    })
    .filter((a): a is { id: string; name: string } => a !== null);
  const links = taskLinks(task).map((link) => ({ ...link, href: linkHref(link) }));
  return {
    id: task.id as string,
    title: task.title as string,
    description: task.description as string | null,
    category: task.category as string,
    priority: task.priority as string,
    status: task.status as string,
    dueAt: task.dueAt ? new Date(task.dueAt).toISOString() : null,
    completedAt: task.completedAt ? new Date(task.completedAt).toISOString() : null,
    createdAt: new Date(task.createdAt).toISOString(),
    assignees,
    assignee: assignees[0] ?? null,
    links,
    entityType: (links[0]?.type ?? null) as string | null,
    entityId: links[0]?.id ?? null,
    entityLabel: links[0]?.label ?? null,
    href: links[0]?.href ?? null,
    history: (task.history ?? []) as { at: string; userId: string | null; action: string }[],
  };
}
export type TaskDto = ReturnType<typeof serializeTask>;

/** Prénoms et noms de l'équipe, pour afficher les responsables. */
export async function staffNames(organizationId: string): Promise<StaffNames> {
  const users = await prisma.user.findMany({ where: { organizationId, role: { in: ["ADMIN", "SKIPPER"] } } });
  return new Map(users.map((u: DbRow) => [u.id as string, { firstName: u.firstName as string, lastName: u.lastName as string }]));
}
