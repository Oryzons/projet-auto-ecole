import { Role } from "@/lib/db/client";
import { NextResponse } from "next/server";

import { emailDelivered, sendMemberInviteEmail } from "@/lib/email";
import { getAdminUser, MEMBER_ROLE_LABELS } from "@/lib/members";
import { createPasswordToken, passwordLink } from "@/lib/password-tokens";
import { prisma } from "@/lib/prisma";
import { rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { requestOrigin } from "@/lib/request-origin";

/** Renvoie l'invitation d'un membre de l'équipe et rend le lien à l'admin. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const { id } = await params;
  const member = await prisma.user.findFirst({
    where: { id, organizationId: admin.organizationId, role: { in: [Role.ADMIN, Role.SKIPPER] } },
  });
  if (!member) {
    return NextResponse.json({ error: "Membre introuvable" }, { status: 404 });
  }

  const limit = rateLimit(`invite:${member.id}`, { limit: 5, windowMs: 60 * 60_000 });
  if (!limit.ok) return tooManyRequests(limit.retryAfterSeconds);

  const token = await createPasswordToken(member.id, "ACTIVATION");
  const inviteLink = passwordLink(token, "ACTIVATION", requestOrigin(req));
  const sent = await sendMemberInviteEmail(
    member.email,
    member.firstName,
    MEMBER_ROLE_LABELS[member.role as "ADMIN" | "SKIPPER"],
    inviteLink,
  );

  return NextResponse.json({ inviteLink, emailSent: emailDelivered(sent) });
}
