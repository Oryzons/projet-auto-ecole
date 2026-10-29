import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveDbUser } from "@/lib/session";
import { adminChannel, createSSEResponse, userChannel } from "@/lib/sse-broker";

export const dynamic = "force-dynamic";

/**
 * Flux temps réel de l'utilisateur connecté.
 * Un élève ne reçoit que les événements de son propre dossier ;
 * un admin reçoit aussi ceux de son organisation.
 */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const dbUser = await resolveDbUser(session);
  if (!dbUser) {
    return new Response("Unauthorized", { status: 401 });
  }

  const channels =
    dbUser.role === "ADMIN"
      ? [adminChannel(dbUser.organizationId), userChannel(dbUser.id)]
      : [userChannel(dbUser.id)];

  return createSSEResponse(req, channels, {
    userId: dbUser.id,
    // Le flux se ferme si le compte disparaît ou change de rôle (il se rouvrira avec les bons canaux).
    stillAllowed: async () =>
      (await prisma.user.findUnique({ where: { id: dbUser.id }, select: { role: true } }))?.role === dbUser.role,
  });
}
