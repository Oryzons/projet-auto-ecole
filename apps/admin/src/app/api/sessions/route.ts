import { Role } from "@/lib/db/client";
import { NextResponse } from "next/server";


import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveDbUser } from "@/lib/session";
import { announceSession, candidatePaymentState, getStaffUser, sessionInputSchema } from "@/lib/theory-sessions";

/**
 * Admin et moniteur : toutes les sessions (passées comprises) avec leurs inscrits.
 * Élève : sessions à venir, places restantes et sa propre inscription.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }
  const user = await resolveDbUser(session);
  if (!user) {
    return NextResponse.json({ error: "Session expirée" }, { status: 401 });
  }

  if (user.role === Role.CANDIDATE) {
    const payment = await candidatePaymentState(user.id, user.organizationId);
    const sessions = await prisma.theorySession.findMany({
      where: {
        organizationId: user.organizationId,
        OR: [
          { startsAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, registrations: { some: { candidateId: user.id } } },
          { startsAt: { gte: new Date() } },
        ],
      },
      orderBy: { startsAt: "asc" },
      omit: { createdById: true, attendanceSecret: true },
      include: {
        _count: { select: { registrations: true } },
        registrations: { where: { candidateId: user.id }, select: { id: true, reminder: true, attendedAt: true } },
      },
    });
    return NextResponse.json({
      canRegister: payment.fullyPaid,
      remainingToPay: payment.remaining,
      sessions: sessions.map(({ _count, registrations, ...rest }) => ({
        ...rest,
        registeredCount: _count.registrations,
        myRegistration: registrations[0] ?? null,
      })),
    });
  }

  const sessions = await prisma.theorySession.findMany({
    where: { organizationId: user.organizationId },
    orderBy: { startsAt: "asc" },
    omit: { attendanceSecret: true },
    include: {
      createdBy: { select: { firstName: true, lastName: true } },
      registrations: {
        orderBy: { createdAt: "asc" },
        include: {
          candidate: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        },
      },
    },
  });
  return NextResponse.json({
    sessions: sessions.map((s) => ({ ...s, registeredCount: s.registrations.length })),
  });
}

export async function POST(req: Request) {
  const staff = await getStaffUser();
  if (!staff) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const parsed = sessionInputSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Données invalides" }, { status: 400 });
  }
  if (parsed.data.startsAt.getTime() < Date.now()) {
    return NextResponse.json({ error: "Choisissez une date à venir" }, { status: 400 });
  }

  const created = await prisma.theorySession.create({
    data: {
      ...parsed.data,
      notes: parsed.data.notes || null,
      organizationId: staff.organizationId,
      createdById: staff.id,
    },
  });

  await announceSession(created);
  return NextResponse.json({ session: created }, { status: 201 });
}

