import { NextResponse } from "next/server";

import { prisma, type DbRow } from "@/lib/prisma";
import { serializeVehicle, vehicleData, vehicleSchema } from "@/lib/vehicles";
import { adminSession as admin, vehicleUsage } from "@/lib/vehicles-server";

export const dynamic = "force-dynamic";

/** Tout le parc automobile de l'auto-école. */
export async function GET() {
  const session = await admin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const organizationId = session.user.organizationId;
  const [vehicles, usage] = await Promise.all([
    prisma.vehicle.findMany({ where: { organizationId }, orderBy: { name: "asc" } }),
    vehicleUsage(organizationId),
  ]);
  return NextResponse.json({ vehicles: vehicles.map((v: DbRow) => serializeVehicle(v, usage.get(v.id))) });
}

/** Ajoute un véhicule au parc. */
export async function POST(req: Request) {
  const session = await admin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const organizationId = session.user.organizationId;

  const parsed = vehicleSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Données invalides" }, { status: 400 });
  const duplicate = await prisma.vehicle.findFirst({ where: { organizationId, plate: parsed.data.plate } });
  if (duplicate) return NextResponse.json({ error: "Un véhicule porte déjà cette immatriculation" }, { status: 409 });

  const vehicle = await prisma.vehicle.create({ data: { organizationId, ...vehicleData(parsed.data) } });
  return NextResponse.json({ vehicle: serializeVehicle(vehicle) }, { status: 201 });
}
