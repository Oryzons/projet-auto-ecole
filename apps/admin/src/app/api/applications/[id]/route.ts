import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma, type DbRow } from "@/lib/prisma";
import { z } from "zod";
import { createCandidateSchema } from "@/lib/candidate-schema";
import { randomBytes } from "crypto";
import { PaymentStatus } from "@/lib/db/client";
import { deleteStoredFiles } from "@/lib/files";
import { hashPassword } from "@/lib/password";
import { publishToAdmins } from "@/lib/sse-broker";
import { findUserByEmail } from "@/lib/users";
import { isFinalStatus, resolveApplicationPrice } from "@/lib/applications";
import { getOrgSettings } from "@/lib/org";
import { theoryCourseStatus } from "@/lib/theory-sessions";
import { sendPendingCodeExamEmails } from "@/lib/code-exam-emails";

async function getApplicationForAdmin(id: string, organizationId: string) {
  return prisma.permitApplication.findFirst({
    where: { id, organizationId, archivedAt: null },
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
      documents: { orderBy: { createdAt: "asc" } },
      payments: { orderBy: { createdAt: "desc" } },
    },
  });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const application = await getApplicationForAdmin(
      id,
      session.user.organizationId,
    );

    if (!application) {
      return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });
    }

    // L'URL de stockage n'est jamais exposée : les fichiers passent par /api/documents/[id]/file.
    const documents = application.documents.map(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ({ fileUrl: _fileUrl, fileKey: _fileKey, ...doc }: DbRow) => doc,
    );
    const theoryCourse = await theoryCourseStatus(application.candidateId);
    return NextResponse.json({ application: { ...application, documents, theoryCourse } });
  } catch (error) {
    console.error("Get application error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const application = await getApplicationForAdmin(
      id,
      session.user.organizationId,
    );

    if (!application) {
      return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });
    }

    const body = await req.json();
    const data = createCandidateSchema.parse(body);

    if (data.email !== application.candidate.email) {
      const existing = await findUserByEmail(session.user.organizationId, data.email);

      if (existing && existing.id !== application.candidateId) {
        return NextResponse.json(
          { error: "Un élève existe déjà avec cet email" },
          { status: 409 },
        );
      }
    }

    await prisma.user.update({
      where: { id: application.candidateId },
      data: {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || null,
        street: data.street,
        postalCode: data.postalCode,
        city: data.city,
        dateOfBirth: new Date(data.dateOfBirth),
        oedippNumber: data.oedippNumber || null,
      },
    });

    // Numéro NEPH renseigné après l'appel : le mail d'inscription au code part maintenant.
    if (data.oedippNumber) {
      await sendPendingCodeExamEmails({ candidateId: application.candidateId }).catch((err) =>
        console.error("[code-exam] envoi après saisie NEPH", err),
      );
    }

    const paid = application.payments.some((p: DbRow) => p.status === PaymentStatus.COMPLETED);
    const priceLocked = paid || isFinalStatus(application.status);
    if (!priceLocked && (data.partnerRate !== application.partnerRate || data.permitType !== application.permitType)) {
      if (data.permitType !== application.permitType) {
        const org = await prisma.organization.findUnique({
          where: { id: session.user.organizationId },
          select: { settings: true },
        });
        if (!getOrgSettings(org?.settings).permitTypes.includes(data.permitType)) {
          return NextResponse.json({ error: "Ce permis n'est pas proposé." }, { status: 400 });
        }
      }
      await prisma.permitApplication.update({
        where: { id },
        data: {
          permitType: data.permitType,
          partnerRate: data.partnerRate,
          totalAmount: await resolveApplicationPrice(
            session.user.organizationId,
            data.partnerRate,
            data.permitType,
            data.partnerRate ? null : { kind: application.discountKind, value: application.discountValue },
          ),
        },
      });
    }

    publishToAdmins(session.user.organizationId, {
      type: "application",
      data: { applicationId: id, action: "updated" },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Données invalides" },
        { status: 400 },
      );
    }
    console.error("Update application error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const application = await getApplicationForAdmin(
      id,
      session.user.organizationId,
    );

    if (!application) {
      return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });
    }

    const candidateId = application.candidateId;
    const hasPayments = application.payments.some(
      (payment: DbRow) => payment.status === PaymentStatus.COMPLETED,
    );
    const profilePhoto = application.candidate.profilePhotoUrl
      ? [{ fileUrl: application.candidate.profilePhotoUrl }]
      : [];

    if (hasPayments) {
      // Les paiements et factures doivent être conservés (obligation comptable) :
      // le dossier est archivé, le compte fermé, et seuls le nom et le prénom
      // sont gardés pour identifier le paiement en comptabilité.
      await prisma.$transaction([
        prisma.document.deleteMany({ where: { applicationId: id } }),
        prisma.message.deleteMany({ where: { applicationId: id } }),
        prisma.passwordToken.deleteMany({ where: { userId: candidateId } }),
        prisma.permitApplication.update({
          where: { id },
          data: { archivedAt: new Date() },
        }),
        prisma.user.update({
          where: { id: candidateId },
          data: {
            email: `supprime-${candidateId}@anonyme.invalid`,
            passwordHash: await hashPassword(randomBytes(32).toString("hex")),
            phone: null,
            profilePhotoUrl: null,
            street: null,
            postalCode: null,
            city: null,
            dateOfBirth: null,
            oedippNumber: null,
          },
        }),
      ]);
    } else {
      await prisma.$transaction([
        prisma.applicationEvent.deleteMany({ where: { userId: candidateId } }),
        prisma.document.updateMany({
          where: { reviewedById: candidateId },
          data: { reviewedById: null },
        }),
        prisma.payment.deleteMany({ where: { applicationId: id } }),
        prisma.permitApplication.delete({ where: { id } }),
        prisma.user.delete({ where: { id: candidateId } }),
      ]);
    }

    // Les fichiers (pièces d'identité…) sont effacés du stockage.
    await deleteStoredFiles([...application.documents, ...profilePhoto]);

    publishToAdmins(session.user.organizationId, {
      type: "application",
      data: { applicationId: id, action: "deleted" },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete application error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
