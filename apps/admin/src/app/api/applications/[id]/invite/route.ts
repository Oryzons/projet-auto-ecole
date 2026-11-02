import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { emailDelivered, sendCandidateInviteEmail } from "@/lib/email";
import { createPasswordToken, passwordLink } from "@/lib/password-tokens";
import { prisma } from "@/lib/prisma";
import { rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { requestOrigin } from "@/lib/request-origin";

/** Renvoie à l'élève un lien pour choisir son mot de passe. */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { id } = await params;
  const app = await prisma.permitApplication.findFirst({
    where: { id, organizationId: session.user.organizationId, archivedAt: null },
    include: { candidate: true },
  });
  if (!app) {
    return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });
  }

  const limit = rateLimit(`invite:${app.candidateId}`, { limit: 3, windowMs: 60 * 60_000 });
  if (!limit.ok) return tooManyRequests(limit.retryAfterSeconds);

  const token = await createPasswordToken(app.candidateId, "ACTIVATION");
  const inviteLink = passwordLink(token, "ACTIVATION", requestOrigin(req));
  const sent = await sendCandidateInviteEmail(
    app.candidate.email,
    `${app.candidate.firstName} ${app.candidate.lastName}`,
    inviteLink,
  );

  return NextResponse.json({ success: true, inviteLink, emailSent: emailDelivered(sent) });
}
