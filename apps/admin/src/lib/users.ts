import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "@/lib/email-address";

/** Recherche un utilisateur par email sans tenir compte de la casse. */
export function findUserByEmail(organizationId: string, email: string) {
  return prisma.user.findFirst({
    where: {
      organizationId,
      email: { equals: normalizeEmail(email), mode: "insensitive" },
    },
  });
}
