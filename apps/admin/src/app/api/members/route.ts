import { randomBytes } from "crypto";
import { Role } from "@/lib/db/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { normalizeEmail } from "@/lib/email-address";
import { emailDelivered, sendMemberInviteEmail } from "@/lib/email";
import { hashPassword } from "@/lib/password";
import { createPasswordToken, passwordLink } from "@/lib/password-tokens";
import { prisma } from "@/lib/prisma";
import { getAdminUser, MEMBER_ROLE_LABELS } from "@/lib/members";
import { requestOrigin } from "@/lib/request-origin";
import { findUserByEmail } from "@/lib/users";

/** Équipe de l'auto-école : administrateurs et moniteurs. */
export async function GET() {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const members = await prisma.user.findMany({
    where: { organizationId: admin.organizationId, role: { in: [Role.ADMIN, Role.SKIPPER] } },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      role: true,
      profilePhotoUrl: true,
      createdAt: true,
      _count: { select: { createdSessions: true } },
      passwordTokens: { where: { purpose: "ACTIVATION", usedAt: null }, select: { id: true }, take: 1 },
    },
    orderBy: [{ role: "asc" }, { lastName: "asc" }],
  });
  return NextResponse.json({
    currentUserId: admin.id,
    members: members.map(({ passwordTokens, _count, ...m }) => ({
      ...m,
      sessionsCreated: _count.createdSessions,
      pendingActivation: passwordTokens.length > 0,
    })),
  });
}

const inviteSchema = z.object({
  firstName: z.string().trim().min(1, "Indiquez le prénom").max(80),
  lastName: z.string().trim().min(1, "Indiquez le nom").max(80),
  email: z.string().trim().email("Email invalide").max(200).transform(normalizeEmail),
  role: z.enum(["ADMIN", "SKIPPER"]),
});

/** Invite un membre : compte créé sans mot de passe connu, lien d'activation par email. */
export async function POST(req: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const parsed = inviteSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Données invalides" }, { status: 400 });
  }
  const data = parsed.data;

  if (await findUserByEmail(admin.organizationId, data.email)) {
    return NextResponse.json({ error: "Un compte existe déjà avec cet email" }, { status: 409 });
  }

  const member = await prisma.user.create({
    data: {
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
      passwordHash: await hashPassword(randomBytes(32).toString("hex")),
      organizationId: admin.organizationId,
    },
    select: { id: true, firstName: true, lastName: true, email: true, role: true },
  });

  const token = await createPasswordToken(member.id, "ACTIVATION");
  const inviteLink = passwordLink(token, "ACTIVATION", requestOrigin(req));
  const sent = await sendMemberInviteEmail(member.email, member.firstName, MEMBER_ROLE_LABELS[data.role], inviteLink);

  // Le lien est rendu à l'admin pour qu'il puisse le transmettre lui-même (SMS, WhatsApp…).
  return NextResponse.json({ member, inviteLink, emailSent: emailDelivered(sent) }, { status: 201 });
}
