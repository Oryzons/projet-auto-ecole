import { NextResponse } from "next/server";

import { cuid } from "@/lib/db/engine";
import { prisma } from "@/lib/prisma";
import { DOCUMENT_DUE_FIELD, journalEntrySchema, VEHICLE_DOCUMENT_LABELS, vehicleDocumentSchema, type VehicleDocument } from "@/lib/vehicle-history";
import { fromDay } from "@/lib/vehicles";
import { adminSession as admin, journalEntry, vehicleHistory } from "@/lib/vehicles-server";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

async function load(params: Params["params"]) {
  const session = await admin();
  if (!session) return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) } as const;
  const { id } = await params;
  const vehicle = await prisma.vehicle.findFirst({ where: { id, organizationId: session.user.organizationId } });
  if (!vehicle) return { error: NextResponse.json({ error: "Véhicule introuvable" }, { status: 404 }) } as const;
  return { session, vehicle, author: `${session.user.firstName} ${session.user.lastName}` } as const;
}

const DATE = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });

/** Leçons passées avec leur compte rendu, documents et journal du véhicule. */
export async function GET(_req: Request, { params }: Params) {
  const ctx = await load(params);
  if ("error" in ctx) return ctx.error;
  return NextResponse.json(await vehicleHistory(ctx.vehicle, ctx.session.user.organizationId));
}

/** Ajoute un document (`entry: "document"`) ou une entrée au journal (`entry: "journal"`). */
export async function POST(req: Request, { params }: Params) {
  const ctx = await load(params);
  if ("error" in ctx) return ctx.error;
  const { vehicle, author, session } = ctx;
  const body = await req.json().catch(() => null);

  if (body?.entry === "journal") {
    const parsed = journalEntrySchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Données invalides" }, { status: 400 });
    const at = parsed.data.at ? fromDay(parsed.data.at)! : new Date();
    await prisma.vehicle.update({ where: { id: vehicle.id }, data: { journal: [...(vehicle.journal ?? []), journalEntry(parsed.data.kind, parsed.data.comment, author, at)] } });
  } else {
    const parsed = vehicleDocumentSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Données invalides" }, { status: 400 });
    const doc: VehicleDocument = { id: cuid(), ...parsed.data, addedAt: new Date().toISOString(), addedBy: author };
    const label = parsed.data.title || VEHICLE_DOCUMENT_LABELS[parsed.data.type];
    const lines = [`Document ajouté : ${label}${parsed.data.expiresAt ? `, valable jusqu'au ${DATE.format(fromDay(parsed.data.expiresAt)!)}` : ""}`];
    if (parsed.data.comment) lines.push(parsed.data.comment);
    // une nouvelle attestation d'assurance ou un nouveau contrôle technique met l'échéance de la fiche à jour
    const dueField = DOCUMENT_DUE_FIELD[parsed.data.type];
    const due = dueField && parsed.data.expiresAt ? { [dueField]: fromDay(parsed.data.expiresAt) } : {};
    if (dueField && parsed.data.expiresAt) lines.push("Échéance de la fiche mise à jour");
    await prisma.vehicle.update({
      where: { id: vehicle.id },
      data: { ...due, documents: [...(vehicle.documents ?? []), doc], journal: [...(vehicle.journal ?? []), journalEntry("DOCUMENT", lines.join("\n"), author)] },
    });
  }
  const fresh = await prisma.vehicle.findFirst({ where: { id: vehicle.id } });
  return NextResponse.json(await vehicleHistory(fresh, session.user.organizationId), { status: 201 });
}

/** Retire un document (`?document=…`) ; le retrait est consigné dans le journal. */
export async function DELETE(req: Request, { params }: Params) {
  const ctx = await load(params);
  if ("error" in ctx) return ctx.error;
  const { vehicle, author, session } = ctx;
  const docId = new URL(req.url).searchParams.get("document");
  const doc = ((vehicle.documents ?? []) as VehicleDocument[]).find((d) => d.id === docId);
  if (!doc) return NextResponse.json({ error: "Document introuvable" }, { status: 404 });
  await prisma.vehicle.update({
    where: { id: vehicle.id },
    data: {
      documents: (vehicle.documents as VehicleDocument[]).filter((d) => d.id !== docId),
      journal: [...(vehicle.journal ?? []), journalEntry("DOCUMENT", `Document retiré : ${doc.title || VEHICLE_DOCUMENT_LABELS[doc.type]}`, author)],
    },
  });
  const fresh = await prisma.vehicle.findFirst({ where: { id: vehicle.id } });
  return NextResponse.json(await vehicleHistory(fresh, session.user.organizationId));
}
