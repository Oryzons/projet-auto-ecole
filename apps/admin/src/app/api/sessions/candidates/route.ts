import { Role } from "@/lib/db/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getStaffUser } from "@/lib/theory-sessions";

/** Élèves inscriptibles à une session (dossier non archivé), pour l'admin et le moniteur. */
export async function GET() {
  const staff = await getStaffUser();
  if (!staff) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const candidates = await prisma.user.findMany({
    where: {
      organizationId: staff.organizationId,
      role: Role.CANDIDATE,
      applications: { some: { archivedAt: null } },
    },
    select: { id: true, firstName: true, lastName: true, email: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
  return NextResponse.json({ candidates });
}
