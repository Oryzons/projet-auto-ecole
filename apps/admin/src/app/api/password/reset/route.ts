import { NextResponse } from "next/server";
import { z } from "zod";

import { hashPassword, passwordSchema } from "@/lib/password";
import { consumePasswordToken, revokePasswordTokens, findValidPasswordToken } from "@/lib/password-tokens";
import { prisma } from "@/lib/prisma";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";

const schema = z.object({
  token: z.string().min(10).max(200),
  password: passwordSchema,
});

/** Vérifie qu'un lien est encore valide (pour afficher le bon écran). */
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token") ?? "";
  const record = await findValidPasswordToken(token);
  if (!record) {
    return NextResponse.json({ valid: false });
  }
  return NextResponse.json({
    valid: true,
    purpose: record.purpose,
    email: record.user.email,
    firstName: record.user.firstName,
  });
}

/** Définit le mot de passe à partir d'un lien d'activation ou de réinitialisation. */
export async function POST(req: Request) {
  const limit = rateLimit(`reset:${clientIp(req.headers)}`, {
    limit: 10,
    windowMs: 15 * 60_000,
  });
  if (!limit.ok) return tooManyRequests(limit.retryAfterSeconds);

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Données invalides" },
      { status: 400 },
    );
  }

  const record = await findValidPasswordToken(parsed.data.token);
  if (!record || !(await consumePasswordToken(record.id))) {
    return NextResponse.json(
      { error: "Ce lien a expiré ou a déjà été utilisé. Demandez-en un nouveau." },
      { status: 400 },
    );
  }

  await prisma.user.update({
    where: { id: record.userId },
    data: { passwordHash: await hashPassword(parsed.data.password) },
  });
  await revokePasswordTokens(record.userId);

  return NextResponse.json({ success: true, email: record.user.email });
}
