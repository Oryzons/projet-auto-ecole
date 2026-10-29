import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveDbUser } from "@/lib/session";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await resolveDbUser(session);
  if (!dbUser) {
    return NextResponse.json({ count: 0 });
  }

  const { id: userId, organizationId, role } = dbUser;
  if (role === "SKIPPER") return NextResponse.json({ count: 0 });

  if (role === "CANDIDATE") {
    const app = await prisma.permitApplication.findFirst({
      where: { candidateId: userId, organizationId },
      select: { id: true },
    });

    if (!app) {
      return NextResponse.json({ count: 0 });
    }

    const count = await prisma.message.count({
      where: {
        applicationId: app.id,
        readAt: null,
        NOT: { senderId: userId },
      },
    });

    return NextResponse.json({ count });
  }

  const count = await prisma.message.count({
    where: {
      readAt: null,
      sender: { role: "CANDIDATE" },
      application: { organizationId, archivedAt: null },
    },
  });

  return NextResponse.json({ count });
}
