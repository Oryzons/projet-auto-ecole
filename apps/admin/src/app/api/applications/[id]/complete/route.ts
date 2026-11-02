import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApplicationStatus, EventType } from "@/lib/db/client";
import {
  broadcastApplicationUpdate,
  hasAllRequiredDocumentsApproved,
  logEvent,
} from "@/lib/applications";
import { sendApplicationCompletedEmail } from "@/lib/email";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { id } = await params;

  const app = await prisma.permitApplication.findFirst({
    where: { id, organizationId: session.user.organizationId, archivedAt: null },
    include: { candidate: true, documents: true },
  });

  if (!app) {
    return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });
  }

  if (app.status !== ApplicationStatus.PAID) {
    return NextResponse.json(
      { error: "Le dossier doit être payé avant d'être finalisé" },
      { status: 400 },
    );
  }

  if (!hasAllRequiredDocumentsApproved(app.documents)) {
    return NextResponse.json(
      { error: "Tous les documents obligatoires doivent être validés avant de finaliser le dossier" },
      { status: 400 },
    );
  }

  const { count } = await prisma.permitApplication.updateMany({
    where: { id, status: ApplicationStatus.PAID },
    data: { status: ApplicationStatus.COMPLETED },
  });
  if (count === 0) {
    return NextResponse.json({ success: true });
  }

  await logEvent(id, EventType.COMPLETED, session.user.id);
  await sendApplicationCompletedEmail(
    app.candidate.email,
    `${app.candidate.firstName} ${app.candidate.lastName}`,
  );
  broadcastApplicationUpdate(app, { status: ApplicationStatus.COMPLETED });

  return NextResponse.json({ success: true });
}
