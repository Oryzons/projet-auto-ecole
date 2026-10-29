import { NextResponse } from "next/server";

import { prisma, type DbRow } from "@/lib/prisma";
import { taskLinks, taskRelationData, taskAssigneeIds } from "@/lib/tasks";
import { serializeVehicle, vehicleData, vehicleSchema } from "@/lib/vehicles";

import { adminSession as admin, vehicleUsage } from "@/lib/vehicles-server";

type Params = { params: Promise<{ id: string }> };

/** Modifie toutes les informations d'un véhicule. */
export async function PATCH(req: Request, { params }: Params) {
  const session = await admin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const organizationId = session.user.organizationId;
  const { id } = await params;

  const vehicle = await prisma.vehicle.findFirst({ where: { id, organizationId } });
  if (!vehicle) return NextResponse.json({ error: "Véhicule introuvable" }, { status: 404 });

  const parsed = vehicleSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Données invalides" }, { status: 400 });
  const duplicate = await prisma.vehicle.findFirst({ where: { organizationId, plate: parsed.data.plate, id: { not: id } } });
  if (duplicate) return NextResponse.json({ error: "Un véhicule porte déjà cette immatriculation" }, { status: 409 });

  const updated = await prisma.vehicle.update({ where: { id }, data: vehicleData(parsed.data) });

  // le nom affiché dans les tâches liées suit la modification
  const label = `${updated.name} · ${updated.plate}`;
  const tasks = await prisma.task.findMany({ where: { organizationId } });
  for (const task of tasks as DbRow[]) {
    const links = taskLinks(task);
    if (!links.some((link) => link.type === "VEHICLE" && link.id === id)) continue;
    const next = links.map((link) => (link.type === "VEHICLE" && link.id === id ? { ...link, label } : link));
    await prisma.task.update({ where: { id: task.id }, data: taskRelationData(taskAssigneeIds(task), next) });
  }

  const usage = await vehicleUsage(organizationId);
  return NextResponse.json({ vehicle: serializeVehicle(updated, usage.get(id)) });
}

/**
 * Supprime un véhicule et tout ce qui le concerne : il disparaît des leçons (qui restent, sans véhicule)
 * et des tâches liées. Irréversible.
 */
export async function DELETE(_req: Request, { params }: Params) {
  const session = await admin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const organizationId = session.user.organizationId;
  const { id } = await params;

  const vehicle = await prisma.vehicle.findFirst({ where: { id, organizationId } });
  if (!vehicle) return NextResponse.json({ error: "Véhicule introuvable" }, { status: 404 });

  await prisma.drivingLesson.updateMany({ where: { organizationId, vehicleId: id }, data: { vehicleId: null } });
  const tasks = await prisma.task.findMany({ where: { organizationId } });
  for (const task of tasks as DbRow[]) {
    const links = taskLinks(task);
    if (!links.some((link) => link.type === "VEHICLE" && link.id === id)) continue;
    const next = links.filter((link) => !(link.type === "VEHICLE" && link.id === id));
    await prisma.task.update({
      where: { id: task.id },
      data: {
        ...taskRelationData(taskAssigneeIds(task), next),
        history: [...(task.history ?? []), { at: new Date().toISOString(), userId: session.user.id, action: `Véhicule ${vehicle.name} supprimé` }],
      },
    });
  }
  await prisma.vehicle.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
