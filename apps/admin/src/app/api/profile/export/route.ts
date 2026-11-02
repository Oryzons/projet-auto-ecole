import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { resolveDbUser } from "@/lib/session";
import { theoryCourseStatus } from "@/lib/theory-sessions";

/**
 * Droit d'accès et de portabilité (RGPD, art. 15 et 20) :
 * l'utilisateur connecté télécharge toutes les données qui le concernent, en JSON.
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

  const limit = rateLimit(`export:${user.id}`, { limit: 5, windowMs: 60 * 60 * 1000 });
  if (!limit.ok) return tooManyRequests(limit.retryAfterSeconds);

  const organization = await prisma.organization.findUnique({
    where: { id: user.organizationId },
    select: { name: true },
  });

  const applications = await prisma.permitApplication.findMany({
    where: { candidateId: user.id, organizationId: user.organizationId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      permitType: true,
      status: true,
      partnerRate: true,
      partnerCompany: true,
      discountCode: true,
      totalAmount: true,
      archivedAt: true,
      createdAt: true,
      updatedAt: true,
      documents: {
        select: {
          type: true,
          status: true,
          fileName: true,
          fileSize: true,
          mimeType: true,
          rejectionReason: true,
          reviewedAt: true,
          createdAt: true,
        },
      },
      payments: {
        select: {
          amount: true,
          currency: true,
          status: true,
          method: true,
          installmentCount: true,
          installmentIndex: true,
          invoiceNumber: true,
          paidAt: true,
          createdAt: true,
        },
      },
      messages: {
        orderBy: { createdAt: "asc" },
        select: {
          content: true,
          createdAt: true,
          readAt: true,
          sender: { select: { firstName: true, lastName: true, role: true } },
        },
      },
      events: {
        orderBy: { createdAt: "asc" },
        select: { type: true, createdAt: true },
      },
    },
  });

  const registrations = await prisma.sessionRegistration.findMany({
    where: { candidateId: user.id },
    orderBy: { createdAt: "asc" },
    select: {
      reminder: true,
      createdAt: true,
      session: { select: { title: true, location: true, startsAt: true, durationMinutes: true } },
    },
  });

  // Pour l'équipe : messages envoyés dans les dossiers des élèves.
  const sentMessages =
    user.role === "CANDIDATE"
      ? []
      : await prisma.message.findMany({
          where: { senderId: user.id },
          orderBy: { createdAt: "asc" },
          select: { content: true, createdAt: true, applicationId: true },
        });

  // Même règle que le profil : numéro NEPH masqué tant que l'élève n'a pas été noté présent.
  const oedippHidden = user.role === "CANDIDATE" && (await theoryCourseStatus(user.id)).status !== "attended";

  const data = {
    exportedAt: new Date().toISOString(),
    organization: organization?.name ?? null,
    account: {
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      street: user.street,
      postalCode: user.postalCode,
      city: user.city,
      dateOfBirth: user.dateOfBirth,
      oedippNumber: oedippHidden ? null : user.oedippNumber,
      hasProfilePhoto: Boolean(user.profilePhotoUrl),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    applications,
    theorySessions: registrations,
    sentMessages,
  };

  const day = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="virage-mes-donnees-${day}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
