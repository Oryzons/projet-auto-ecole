import { NextResponse } from "next/server";

import { prisma, type DbRow } from "@/lib/prisma";
import { getStaffUser, notifyRegistrants, sessionInputSchema } from "@/lib/theory-sessions";

type Params = { params: Promise<{ id: string }> };

async function findSession(id: string, organizationId: string) {
  return prisma.theorySession.findFirst({
    where: { id, organizationId },
    include: {
      registrations: {
        include: { candidate: { select: { id: true, email: true, firstName: true } } },
      },
    },
  });
}

export async function PATCH(req: Request, { params }: Params) {
  const staff = await getStaffUser();
  if (!staff) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const { id } = await params;
  const existing = await findSession(id, staff.organizationId);
  if (!existing) {
    return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
  }

  const parsed = sessionInputSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Données invalides" }, { status: 400 });
  }
  const data = parsed.data;
  if (data.capacity < existing.registrations.length) {
    return NextResponse.json(
      { error: `Déjà ${existing.registrations.length} inscrits : la capacité ne peut pas être inférieure.` },
      { status: 400 },
    );
  }

  const dateChanged = data.startsAt.getTime() !== existing.startsAt.getTime();
  const practicalChanged =
    dateChanged ||
    data.durationMinutes !== existing.durationMinutes ||
    data.location !== existing.location;

  const updated = await prisma.$transaction(async (tx) => {
    // Nouvelle date : le rappel doit repartir.
    if (dateChanged) {
      await tx.sessionRegistration.updateMany({ where: { sessionId: id }, data: { reminderSentAt: null } });
    }
    return tx.theorySession.update({
      where: { id },
      data: { ...data, notes: data.notes || null },
    });
  });

  if (practicalChanged && existing.startsAt.getTime() > Date.now()) {
    await notifyRegistrants(updated, existing.registrations.map((r: DbRow) => r.candidate), false);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { attendanceSecret: _secret, ...safe } = updated;
  return NextResponse.json({ session: safe });
}

/** Supprime une session (administrateur uniquement). */
export async function DELETE(_req: Request, { params }: Params) {
  const staff = await getStaffUser();
  if (!staff || staff.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const { id } = await params;
  const existing = await findSession(id, staff.organizationId);
  if (!existing) {
    return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
  }

  await prisma.theorySession.delete({ where: { id } });
  if (existing.startsAt.getTime() > Date.now()) {
    await notifyRegistrants(existing, existing.registrations.map((r: DbRow) => r.candidate), true);
  }
  return NextResponse.json({ ok: true });
}
