import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Signal d'activité envoyé par le navigateur : repousse la déconnexion automatique de 8 h. */
export async function POST() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await prisma.user.update({ where: { id: session.user.id }, data: { lastSeenAt: new Date() } });
  return NextResponse.json({ ok: true });
}
