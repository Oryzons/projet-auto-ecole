import { auth } from "@/lib/auth";
import { Role, type User } from "@/lib/db/client";
import { prisma } from "@/lib/prisma";

/** Résout l'utilisateur en base — corrige les sessions JWT obsolètes (id invalide). */
export async function resolveDbUser(session: {
  user: { email: string; organizationId: string };
}): Promise<User | null> {
  return prisma.user.findUnique({
    where: {
      email_organizationId: {
        email: session.user.email,
        organizationId: session.user.organizationId,
      },
    },
  });
}

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function requireAdmin() {
  const session = await requireAuth();
  if (session.user.role !== Role.ADMIN) {
    throw new Error("Forbidden");
  }
  return session;
}

export async function requireCandidate() {
  const session = await requireAuth();
  if (session.user.role !== Role.CANDIDATE) {
    throw new Error("Forbidden");
  }
  return session;
}
