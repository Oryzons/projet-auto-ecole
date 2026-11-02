import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { DocumentStatus, EventType, type DocumentType } from "@/lib/db/client";
import {
  hasAllRequiredDocumentsApproved,
  isFinalStatus,
  updateApplicationStatus,
  logEvent,
} from "@/lib/applications";
import {
  sendDocumentRejectedEmail,
  sendDocumentsApprovedEmail,
} from "@/lib/email";
import { DOCUMENT_LABELS } from "@/lib/constants";
import { publishToAdmins, publishToUser } from "@/lib/sse-broker";

const reviewSchema = z.object({
  documentId: z.string(),
  action: z.enum(["approve", "reject"]),
  rejectionReason: z.string().trim().max(500, "Motif trop long").optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { documentId, action, rejectionReason } = reviewSchema.parse(body);

    const doc = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        application: {
          include: {
            candidate: true,
            documents: true,
          },
        },
      },
    });

    if (
      !doc ||
      doc.application.organizationId !== session.user.organizationId ||
      doc.application.archivedAt
    ) {
      return NextResponse.json({ error: "Document introuvable" }, { status: 404 });
    }

    if (isFinalStatus(doc.application.status)) {
      return NextResponse.json(
        { error: "Ce dossier est clôturé, ses documents ne peuvent plus être modifiés" },
        { status: 400 },
      );
    }

    const wasFullyApproved = hasAllRequiredDocumentsApproved(doc.application.documents);

    if (action === "reject" && !rejectionReason) {
      return NextResponse.json(
        { error: "Motif de refus requis" },
        { status: 400 }
      );
    }

    await prisma.document.update({
      where: { id: documentId },
      data: {
        status: action === "approve" ? DocumentStatus.APPROVED : DocumentStatus.REJECTED,
        rejectionReason: action === "reject" ? rejectionReason : null,
        reviewedById: session.user.id,
        reviewedAt: new Date(),
      },
    });

    await logEvent(
      doc.applicationId,
      action === "approve" ? EventType.DOCUMENT_APPROVED : EventType.DOCUMENT_REJECTED,
      session.user.id,
      { documentType: doc.type }
    );

    await updateApplicationStatus(doc.applicationId);

    const updatedApp = await prisma.permitApplication.findUnique({
      where: { id: doc.applicationId },
      include: { documents: true, candidate: true },
    });

    if (action === "reject") {
      await sendDocumentRejectedEmail(
        doc.application.candidate.email,
        DOCUMENT_LABELS[doc.type as DocumentType],
        rejectionReason!
      );
    }

    // L'email « documents validés » ne part qu'au moment où le dossier devient complet.
    if (
      updatedApp &&
      !wasFullyApproved &&
      hasAllRequiredDocumentsApproved(updatedApp.documents)
    ) {
      await sendDocumentsApprovedEmail(updatedApp.candidate.email);
    }

    const documentEvent = {
      type: "document" as const,
      data: {
        documentId,
        action,
        applicationId: doc.applicationId,
        documentType: doc.type,
        documentLabel: DOCUMENT_LABELS[doc.type as DocumentType],
        reason: action === "reject" ? rejectionReason : undefined,
      },
    };
    publishToAdmins(session.user.organizationId, documentEvent);
    publishToUser(doc.application.candidateId, documentEvent);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Données invalides" },
        { status: 400 },
      );
    }
    console.error("Review error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
