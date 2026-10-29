import { z } from "zod";

import { TaskCategory, TaskPriority, TaskStatus } from "@/lib/db/client";
import type { DbRow } from "@/lib/prisma";

export const taskCreateSchema = z.object({
  title: z.string().trim().min(2, "Donnez un titre à la tâche").max(140),
  description: z.string().trim().max(2000).optional().nullable(),
  category: z.enum(Object.values(TaskCategory) as [string, ...string[]]),
  priority: z.enum(Object.values(TaskPriority) as [string, ...string[]]).default("NORMAL"),
  assigneeId: z.string().min(1).optional().nullable(),
  dueAt: z.string().datetime({ offset: true }).optional().nullable(),
  applicationId: z.string().min(1).optional().nullable(),
  vehicleId: z.string().min(1).optional().nullable(),
});

export const taskUpdateSchema = z.object({
  status: z.enum(Object.values(TaskStatus) as [string, ...string[]]).optional(),
  priority: z.enum(Object.values(TaskPriority) as [string, ...string[]]).optional(),
  assigneeId: z.string().min(1).nullable().optional(),
  dueAt: z.string().datetime({ offset: true }).nullable().optional(),
});

/** Forme renvoyée au navigateur : dates en ISO, responsable et lien de l'entité liée. */
export function serializeTask(task: DbRow) {
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
    assignee: task.assignee ? { id: task.assignee.id as string, name: `${task.assignee.firstName} ${task.assignee.lastName}` } : null,
    entityType: task.entityType as string | null,
    entityId: task.entityId as string | null,
    entityLabel: task.entityLabel as string | null,
    href: task.entityType === "APPLICATION" && task.entityId ? `/admin/applications/${task.entityId}` : null,
    history: (task.history ?? []) as { at: string; userId: string | null; action: string }[],
  };
}
export type TaskDto = ReturnType<typeof serializeTask>;
