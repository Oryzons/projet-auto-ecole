import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getStaffUser } from "@/lib/theory-sessions";

type Params = { params: Promise<{ id: string; registrationId: string }> };

/** Retire un élève d'une session (administrateur uniquement : un moniteur ne fait qu'ajouter). */
export async function DELETE(_req: Request, { params }: Params) {
  const staff = await getStaffUser();
  if (!staff || staff.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const { id, registrationId } = await params;
  const { count } = await prisma.sessionRegistration.deleteMany({
    where: { id: registrationId, sessionId: id, session: { organizationId: staff.organizationId } },
  });
  if (count === 0) {
    return NextResponse.json({ error: "Inscription introuvable" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
