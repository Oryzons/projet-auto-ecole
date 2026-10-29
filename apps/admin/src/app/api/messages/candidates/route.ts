import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/db/client";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";

  const applications = await prisma.permitApplication.findMany({
    where: {
      organizationId: session.user.organizationId,
      archivedAt: null,
      ...(q
        ? {
            OR: [
              { candidate: { firstName: { contains: q, mode: "insensitive" } } },
              { candidate: { lastName: { contains: q, mode: "insensitive" } } },
              { candidate: { email: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: {
      candidate: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
      _count: { select: { messages: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: q ? 20 : 50,
  });

  const candidates = applications.map((app) => ({
    applicationId: app.id,
    candidate: app.candidate,
    status: app.status,
    messageCount: app._count.messages,
  }));

  return NextResponse.json({ candidates });
}
