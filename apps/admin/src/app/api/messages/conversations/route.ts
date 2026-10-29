import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/db/client";
import { resolveDbUser } from "@/lib/session";
import { sortConversations } from "@/lib/messaging-sync";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const dbUser = await resolveDbUser(session);
  if (!dbUser) {
    return NextResponse.json({ error: "Session expirée" }, { status: 401 });
  }

  const applications = await prisma.permitApplication.findMany({
    where: { organizationId: dbUser.organizationId, archivedAt: null },
    include: {
      candidate: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          profilePhotoUrl: true,
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          sender: { select: { id: true, role: true } },
        },
      },
      _count: { select: { messages: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const unreadCounts = await prisma.message.groupBy({
    by: ["applicationId"],
    where: {
      readAt: null,
      sender: { role: Role.CANDIDATE },
      application: { organizationId: dbUser.organizationId, archivedAt: null },
    },
    _count: true,
  });

  const unreadMap = new Map(
    unreadCounts.map((u) => [u.applicationId, u._count])
  );

  const conversations = sortConversations(
    applications.map((app) => {
      const last = app.messages[0] ?? null;
      return {
        applicationId: app.id,
        candidate: app.candidate,
        status: app.status,
        lastMessage: last
          ? {
              content: last.content,
              createdAt: last.createdAt.toISOString(),
              senderId: last.sender.id,
              senderRole: last.sender.role,
            }
          : null,
        unreadCount: unreadMap.get(app.id) ?? 0,
        messageCount: app._count.messages,
        updatedAt: (last?.createdAt ?? app.updatedAt).toISOString(),
      };
    }),
  );

  return NextResponse.json({ conversations });
}
