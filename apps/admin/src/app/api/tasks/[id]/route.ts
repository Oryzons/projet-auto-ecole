import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { TASK_PRIORITY_LABELS, TASK_STATUS_LABELS } from "@/lib/crm";
import { prisma } from "@/lib/prisma";
import { serializeTask, taskUpdateSchema } from "@/lib/tasks";

/** Change le statut, la priorité, le responsable ou l'échéance d'une tâche, avec historique. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  const task = await prisma.task.findFirst({ where: { id, organizationId: session.user.organizationId } });
  if (!task) return NextResponse.json({ error: "Tâche introuvable" }, { status: 404 });

  const parsed = taskUpdateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Données invalides" }, { status: 400 });
  const input = parsed.data;

  const data: Record<string, unknown> = {};
  const changes: string[] = [];
  if (input.status && input.status !== task.status) {
    data.status = input.status;
    data.completedAt = input.status === "DONE" ? new Date() : null;
    changes.push(`Statut : ${TASK_STATUS_LABELS[input.status]}`);
  }
  if (input.priority && input.priority !== task.priority) {
    data.priority = input.priority;
    changes.push(`Priorité : ${TASK_PRIORITY_LABELS[input.priority]}`);
  }
  if (input.assigneeId !== undefined && input.assigneeId !== task.assigneeId) {
    if (input.assigneeId) {
      const assignee = await prisma.user.findFirst({ where: { id: input.assigneeId, organizationId: session.user.organizationId } });
      if (!assignee) return NextResponse.json({ error: "Responsable introuvable" }, { status: 404 });
      changes.push(`Confiée à ${assignee.firstName}`);
    } else changes.push("Plus de responsable");
    data.assigneeId = input.assigneeId;
  }
  if (input.dueAt !== undefined) {
    data.dueAt = input.dueAt ? new Date(input.dueAt) : null;
    changes.push(input.dueAt ? "Échéance modifiée" : "Échéance retirée");
  }
  if (!changes.length) return NextResponse.json({ task: serializeTask({ ...task, assignee: null }) });

  const updated = await prisma.task.update({
    where: { id },
    data: { ...data, history: [...(task.history ?? []), ...changes.map((action) => ({ at: new Date().toISOString(), userId: session.user.id, action }))] },
    include: { assignee: true },
  });
  return NextResponse.json({ task: serializeTask(updated) });
}
