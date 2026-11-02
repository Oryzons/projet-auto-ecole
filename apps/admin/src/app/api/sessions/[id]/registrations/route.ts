import { Prisma, Role } from "@/lib/db/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { sendSessionRegistrationEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { getStaffUser, sessionEmailInfo } from "@/lib/theory-sessions";

type Params = { params: Promise<{ id: string }> };

const bodySchema = z.object({ candidateId: z.string().min(1) });

/** Un admin ou un moniteur inscrit lui-même un élève. */
export async function POST(req: Request, { params }: Params) {
  const staff = await getStaffUser();
  if (!staff) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const { id } = await params;
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Choisissez un élève" }, { status: 400 });
  }

  const [session, candidate] = await Promise.all([
    prisma.theorySession.findFirst({
      where: { id, organizationId: staff.organizationId },
      include: { _count: { select: { registrations: true } } },
    }),
    prisma.user.findFirst({
      where: { id: parsed.data.candidateId, organizationId: staff.organizationId, role: Role.CANDIDATE },
    }),
  ]);
  if (!session || !candidate) {
    return NextResponse.json({ error: "Session ou élève introuvable" }, { status: 404 });
  }
  if (session._count.registrations >= session.capacity) {
    return NextResponse.json({ error: "Cette session est complète" }, { status: 409 });
  }

  try {
    const registration = await prisma.sessionRegistration.create({
      data: { sessionId: id, candidateId: candidate.id, reminder: true },
    });
    if (session.startsAt.getTime() > Date.now()) {
      await sendSessionRegistrationEmail(candidate.email, candidate.firstName, sessionEmailInfo(session), true);
    }
    return NextResponse.json({ registration }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Cet élève est déjà inscrit" }, { status: 409 });
    }
    throw error;
  }
}
