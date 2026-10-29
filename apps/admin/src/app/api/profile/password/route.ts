import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { hashPassword, passwordSchema, verifyPassword } from "@/lib/password";
import { revokePasswordTokens } from "@/lib/password-tokens";
import { prisma } from "@/lib/prisma";
import { rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { resolveDbUser } from "@/lib/session";

const schema = z.object({
  currentPassword: z.string().min(1, "Saisissez votre mot de passe actuel").max(200),
  newPassword: passwordSchema,
});

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }
  const user = await resolveDbUser(session);
  if (!user) {
    return NextResponse.json({ error: "Session expirée" }, { status: 401 });
  }

  const limit = rateLimit(`password-change:${user.id}`, { limit: 5, windowMs: 15 * 60_000 });
  if (!limit.ok) return tooManyRequests(limit.retryAfterSeconds);

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Données invalides" },
      { status: 400 },
    );
  }

  if (!(await verifyPassword(parsed.data.currentPassword, user.passwordHash))) {
    return NextResponse.json({ error: "Mot de passe actuel incorrect" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(parsed.data.newPassword) },
  });
  await revokePasswordTokens(user.id);

  return NextResponse.json({ success: true });
}
