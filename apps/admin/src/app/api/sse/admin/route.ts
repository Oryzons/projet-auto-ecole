import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveDbUser } from "@/lib/session";
import { adminChannel, createSSEResponse, userChannel } from "@/lib/sse-broker";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const dbUser = await resolveDbUser(session);
  if (!dbUser || dbUser.role !== "ADMIN") {
    return new Response("Forbidden", { status: 403 });
  }

  return createSSEResponse(req, [adminChannel(dbUser.organizationId), userChannel(dbUser.id)], {
    userId: dbUser.id,
    stillAllowed: async () =>
      (await prisma.user.findUnique({ where: { id: dbUser.id }, select: { role: true } }))?.role === "ADMIN",
  });
}
