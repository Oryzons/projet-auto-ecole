import { createHash, randomBytes } from "crypto";
import { PasswordTokenPurpose } from "@/lib/db/client";

import { prisma } from "@/lib/prisma";

const TOKEN_TTL_MS: Record<PasswordTokenPurpose, number> = {
  ACTIVATION: 7 * 24 * 60 * 60 * 1000,
  RESET: 60 * 60 * 1000,
};

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

/** Crée un lien à usage unique et invalide les liens précédents du même type. */
export async function createPasswordToken(
  userId: string,
  purpose: PasswordTokenPurpose,
) {
  const token = randomBytes(32).toString("base64url");

  await prisma.$transaction([
    prisma.passwordToken.deleteMany({ where: { userId, purpose, usedAt: null } }),
    prisma.passwordToken.create({
      data: {
        userId,
        purpose,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + TOKEN_TTL_MS[purpose]),
      },
    }),
  ]);

  return token;
}

/**
 * Lien envoyé par email. Ordre : APP_URL (adresse publique), puis l'adresse
 * utilisée par l'admin qui invite (`origin`), puis NEXTAUTH_URL.
 */
export function passwordLink(token: string, purpose: PasswordTokenPurpose, origin?: string) {
  const base = (process.env.APP_URL || origin || process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/$/, "");
  const path = purpose === "ACTIVATION" ? "/activate" : "/reset-password";
  return `${base}${path}?token=${encodeURIComponent(token)}`;
}

/** Retrouve un lien valide (non expiré, non utilisé). */
export async function findValidPasswordToken(token: string) {
  if (!token || token.length > 200) return null;
  const record = await prisma.passwordToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });
  if (!record || record.usedAt || record.expiresAt < new Date()) return null;
  return record;
}

/** Consomme le lien : renvoie false s'il a déjà servi (requêtes simultanées). */
export async function consumePasswordToken(id: string) {
  const { count } = await prisma.passwordToken.updateMany({
    where: { id, usedAt: null },
    data: { usedAt: new Date() },
  });
  return count === 1;
}

/** Après un changement de mot de passe, plus aucun lien (activation, réinitialisation) ne reste valable. */
export async function revokePasswordTokens(userId: string) {
  await prisma.passwordToken.deleteMany({ where: { userId, usedAt: null } });
}
