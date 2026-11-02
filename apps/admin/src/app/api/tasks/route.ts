import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeTask, taskCreateSchema, taskRelationData, type TaskLink } from "@/lib/tasks";

export const dynamic = "force-dynamic";

async function admin() {
  const session = await auth();
  return session?.user && session.user.role === "ADMIN" ? session : null;
}

/** Toutes les tâches de l'auto-école, avec les personnes et entités assignables. */
export async function GET() {
  const session = await admin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const organizationId = session.user.organizationId;

  const [tasks, staff, applications, vehicles] = await Promise.all([
    prisma.task.findMany({ where: { organizationId }, include: { assignee: true }, orderBy: { dueAt: "asc" } }),
    prisma.user.findMany({ where: { organizationId, role: { in: ["ADMIN", "SKIPPER"] } }, orderBy: { firstName: "asc" } }),
    prisma.permitApplication.findMany({ where: { organizationId, archivedAt: null }, include: { candidate: true } }),
    prisma.vehicle.findMany({ where: { organizationId }, orderBy: { name: "asc" } }),
  ]);

  const names = new Map(staff.map((u) => [u.id, { firstName: u.firstName, lastName: u.lastName }]));
  return NextResponse.json({
    tasks: tasks.map((task) => serializeTask(task, names)),
    staff: staff.map((u) => ({ id: u.id, name: `${u.firstName} ${u.lastName}`, role: u.role })),
    applications: applications
      .map((a) => ({ id: a.id, name: `${a.candidate.firstName} ${a.candidate.lastName}` }))
      .sort((a, b) => a.name.localeCompare(b.name, "fr")),
    vehicles: vehicles.map((v) => ({ id: v.id, name: `${v.name} · ${v.plate}` })),
  });
}

export async function POST(req: Request) {
  const session = await admin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const organizationId = session.user.organizationId;

  const parsed = taskCreateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Données invalides" }, { status: 400 });
  }
  const input = parsed.data;

  // élèves, véhicules et responsables doivent appartenir à l'auto-école
  const unique = (ids: string[]) => [...new Set(ids)];
  const links: TaskLink[] = [];
  for (const id of unique(input.applicationIds)) {
    const app = await prisma.permitApplication.findFirst({ where: { id, organizationId }, include: { candidate: true } });
    if (!app) return NextResponse.json({ error: "Élève introuvable" }, { status: 404 });
    links.push({ type: "APPLICATION", id: app.id, label: `${app.candidate.firstName} ${app.candidate.lastName}` });
  }
  for (const id of unique(input.vehicleIds)) {
    const vehicle = await prisma.vehicle.findFirst({ where: { id, organizationId } });
    if (!vehicle) return NextResponse.json({ error: "Véhicule introuvable" }, { status: 404 });
    links.push({ type: "VEHICLE", id: vehicle.id, label: `${vehicle.name} · ${vehicle.plate}` });
  }
  const assigneeIds = unique(input.assigneeIds);
  const team = await prisma.user.findMany({ where: { organizationId, role: { in: ["ADMIN", "SKIPPER"] } } });
  const names = new Map(team.map((u) => [u.id, { firstName: u.firstName, lastName: u.lastName }]));
  if (assigneeIds.some((id) => !names.has(id))) return NextResponse.json({ error: "Responsable introuvable" }, { status: 404 });

  const task = await prisma.task.create({
    data: {
      organizationId,
      title: input.title,
      description: input.description || null,
      category: input.category,
      priority: input.priority,
      status: "TODO",
      ...taskRelationData(assigneeIds, links),
      dueAt: input.dueAt ? new Date(input.dueAt) : null,
      history: [{ at: new Date().toISOString(), userId: session.user.id, action: "Tâche créée" }],
    },
    include: { assignee: true },
  });
  return NextResponse.json({ task: serializeTask(task, names) }, { status: 201 });
}
