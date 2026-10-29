import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma, type DbRow } from "@/lib/prisma";
import { ApplicationStatus } from "@/lib/db/client";
import { theoryCourseStatuses } from "@/lib/theory-sessions";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const rawStatus = searchParams.get("status");
  const status =
    rawStatus && rawStatus in ApplicationStatus
      ? (rawStatus as ApplicationStatus)
      : null;
  const paid = searchParams.get("paid");

  const applications = await prisma.permitApplication.findMany({
    where: {
      organizationId: session.user.organizationId,
      archivedAt: null,
      ...(status ? { status } : {}),
      ...(paid === "true"
        ? { payments: { some: { status: "COMPLETED" } } }
        : paid === "false"
        ? { payments: { none: { status: "COMPLETED" } } }
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
          profilePhotoUrl: true,
          street: true,
          postalCode: true,
          city: true,
          dateOfBirth: true,
          oedippNumber: true,
        },
      },
      documents: true,
      payments: { orderBy: { createdAt: "desc" } },
      _count: { select: { messages: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const courses = await theoryCourseStatuses([...new Set(applications.map((a) => a.candidateId))]);

  // L'URL de stockage n'est jamais exposée : les fichiers passent par /api/documents/[id]/file.
  return NextResponse.json({
    applications: applications.map((application) => ({
      ...application,
      theoryCourse: courses.get(application.candidateId),
      documents: application.documents.map(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        ({ fileUrl: _fileUrl, fileKey: _fileKey, ...doc }: DbRow) => doc,
      ),
    })),
  });
}
