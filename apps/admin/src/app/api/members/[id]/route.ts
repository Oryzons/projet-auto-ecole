import { Role } from "@/lib/db/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getAdminUser } from "@/lib/members";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

async function findMember(id: string, organizationId: string) {
  return prisma.user.findFirst({
    where: { id, organizationId, role: { in: [Role.ADMIN, Role.SKIPPER] } },
  });
}

async function adminCount(organizationId: string) {
  return prisma.user.count({ where: { organizationId, role: Role.ADMIN } });
}

const patchSchema = z.object({ role: z.enum(["ADMIN", "SKIPPER"]) });

/** Change le rôle d'un membre (admin ↔ moniteur). */
export async function PATCH(req: Request, { params }: Params) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const { id } = await params;
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Rôle invalide" }, { status: 400 });
  }
  const member = await findMember(id, admin.organizationId);
  if (!member) {
    return NextResponse.json({ error: "Membre introuvable" }, { status: 404 });
  }
  if (member.id === admin.id && parsed.data.role !== Role.ADMIN) {
    return NextResponse.json({ error: "Vous ne pouvez pas retirer vos propres droits d'administrateur." }, { status: 400 });
  }
  if (member.role === Role.ADMIN && parsed.data.role !== Role.ADMIN && (await adminCount(admin.organizationId)) <= 1) {
    return NextResponse.json({ error: "Il faut au moins un administrateur." }, { status: 400 });
  }
  const updated = await prisma.user.update({
    where: { id },
    data: { role: parsed.data.role },
    select: { id: true, role: true },
  });
  return NextResponse.json({ member: updated });
}

/** Retire un membre de l'équipe. Ses sessions restent, sans auteur. */
export async function DELETE(_req: Request, { params }: Params) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const { id } = await params;
  if (id === admin.id) {
    return NextResponse.json({ error: "Vous ne pouvez pas supprimer votre propre compte ici." }, { status: 400 });
  }
  const member = await findMember(id, admin.organizationId);
  if (!member) {
    return NextResponse.json({ error: "Membre introuvable" }, { status: 404 });
  }
  if (member.role === Role.ADMIN && (await adminCount(admin.organizationId)) <= 1) {
    return NextResponse.json({ error: "Il faut au moins un administrateur." }, { status: 400 });
  }
  try {
    await prisma.user.delete({ where: { id } });
  } catch {
    return NextResponse.json(
      { error: "Ce membre a validé des documents ou envoyé des messages : son compte ne peut pas être supprimé." },
      { status: 409 },
    );
  }
  return NextResponse.json({ ok: true });
}
