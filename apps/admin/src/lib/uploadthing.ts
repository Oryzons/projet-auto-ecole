import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DocumentType, EventType, Role } from "@/lib/db/client";
import { updateApplicationStatus, logEvent } from "@/lib/applications";
import { rateLimit } from "@/lib/rate-limit";
import { resolveDbUser } from "@/lib/session";
import { TEMPLATE_DOWNLOAD_TYPES } from "@/lib/constants";
import { getOrgSettings } from "@/lib/org";
import { publishToAdmins, publishToUser } from "@/lib/sse-broker";
import { deleteStoredFiles, PRIVATE_DOCUMENTS } from "@/lib/files";
import { isFinalStatus } from "@/lib/applications";

const f = createUploadthing();

export const ourFileRouter = {
  // Types exacts : pas de SVG ni de HTML, qui pourraient exécuter du script.
  documentUploader: f({
    pdf: {
      maxFileSize: "8MB",
      maxFileCount: 1,
      ...(PRIVATE_DOCUMENTS ? { acl: "private" as const } : {}),
    },
    "image/jpeg": {
      maxFileSize: "8MB",
      maxFileCount: 1,
      ...(PRIVATE_DOCUMENTS ? { acl: "private" as const } : {}),
    },
    "image/png": {
      maxFileSize: "8MB",
      maxFileCount: 1,
      ...(PRIVATE_DOCUMENTS ? { acl: "private" as const } : {}),
    },
    "image/webp": {
      maxFileSize: "8MB",
      maxFileCount: 1,
      ...(PRIVATE_DOCUMENTS ? { acl: "private" as const } : {}),
    },
    "image/heic": {
      maxFileSize: "8MB",
      maxFileCount: 1,
      ...(PRIVATE_DOCUMENTS ? { acl: "private" as const } : {}),
    },
  })
    .input(
      z.object({
        applicationId: z.string(),
        documentType: z.nativeEnum(DocumentType),
      })
    )
    .middleware(async ({ input }) => {
      const session = await auth();
      if (!session?.user) throw new UploadThingError("Non connecté");

      const dbUser = await resolveDbUser(session);
      if (!dbUser) throw new UploadThingError("Session expirée");
      if (!rateLimit(`upload:${dbUser.id}`, { limit: 30, windowMs: 10 * 60_000 }).ok) {
        throw new UploadThingError("Trop d'envois. Réessayez dans quelques minutes.");
      }

      const app = await prisma.permitApplication.findFirst({
        where: {
          id: input.applicationId,
          organizationId: dbUser.organizationId,
          archivedAt: null,
          ...(dbUser.role === Role.ADMIN ? {} : { candidateId: dbUser.id }),
        },
        include: { candidate: { select: { firstName: true, lastName: true } } },
      });
      if (!app) throw new UploadThingError("Dossier introuvable");
      if (isFinalStatus(app.status)) {
        throw new UploadThingError("Ce dossier est clôturé");
      }

      return {
        userId: dbUser.id,
        applicationId: input.applicationId,
        documentType: input.documentType,
        organizationId: dbUser.organizationId,
        uploadedByAdmin: dbUser.role === Role.ADMIN,
        candidateId: app.candidateId,
        candidateName: `${app.candidate.firstName} ${app.candidate.lastName}`,
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const previous = await prisma.document.findUnique({
        where: {
          applicationId_type: {
            applicationId: metadata.applicationId,
            type: metadata.documentType,
          },
        },
      });

      await prisma.document.upsert({
        where: {
          applicationId_type: {
            applicationId: metadata.applicationId,
            type: metadata.documentType,
          },
        },
        create: {
          applicationId: metadata.applicationId,
          type: metadata.documentType,
          fileUrl: file.ufsUrl,
          fileKey: file.key,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
        },
        update: {
          fileUrl: file.ufsUrl,
          fileKey: file.key,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          status: "PENDING",
          rejectionReason: null,
          reviewedById: null,
          reviewedAt: null,
        },
      });

      await logEvent(metadata.applicationId, EventType.DOCUMENT_UPLOADED, metadata.userId, {
        documentType: metadata.documentType,
        source: metadata.uploadedByAdmin ? "admin" : "candidate",
      });

      await updateApplicationStatus(metadata.applicationId);

      // L'ancien fichier remplacé est effacé du stockage.
      if (previous && previous.fileUrl !== file.ufsUrl) {
        await deleteStoredFiles([previous]);
      }

      const documentEvent = {
        type: "document" as const,
        data: {
          applicationId: metadata.applicationId,
          documentType: metadata.documentType,
          action: "uploaded",
          source: metadata.uploadedByAdmin ? "admin" : "candidate",
          candidateName: metadata.candidateName,
        },
      };
      publishToAdmins(metadata.organizationId, documentEvent);
      publishToUser(metadata.candidateId, documentEvent);

      return { uploaded: true };
    }),

  profilePhotoUploader: f({
    "image/jpeg": { maxFileSize: "4MB", maxFileCount: 1 },
    "image/png": { maxFileSize: "4MB", maxFileCount: 1 },
    "image/webp": { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .input(z.object({ candidateId: z.string() }))
    .middleware(async ({ input }) => {
      const session = await auth();
      if (!session?.user || session.user.role !== "ADMIN") {
        throw new UploadThingError("Unauthorized");
      }

      const candidate = await prisma.user.findFirst({
        where: {
          id: input.candidateId,
          organizationId: session.user.organizationId,
          role: "CANDIDATE",
        },
      });

      if (!candidate) throw new UploadThingError("Candidate not found");

      return {
        candidateId: input.candidateId,
        organizationId: session.user.organizationId,
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const previous = await prisma.user.findUnique({
        where: { id: metadata.candidateId },
        select: { profilePhotoUrl: true },
      });
      if (previous?.profilePhotoUrl) {
        await deleteStoredFiles([{ fileUrl: previous.profilePhotoUrl }]);
      }
      await prisma.user.update({
        where: { id: metadata.candidateId },
        data: { profilePhotoUrl: file.ufsUrl },
      });

      publishToAdmins(metadata.organizationId, {
        type: "application",
        data: { candidateId: metadata.candidateId, action: "profile_photo_updated" },
      });

      return { url: file.ufsUrl };
    }),

  orgDocumentTemplateUploader: f({
    pdf: { maxFileSize: "8MB", maxFileCount: 1 },
    "image/jpeg": { maxFileSize: "8MB", maxFileCount: 1 },
    "image/png": { maxFileSize: "8MB", maxFileCount: 1 },
    "image/webp": { maxFileSize: "8MB", maxFileCount: 1 },
  })
    .input(z.object({ documentType: z.nativeEnum(DocumentType) }))
    .middleware(async ({ input }) => {
      const session = await auth();
      if (!session?.user || session.user.role !== "ADMIN") {
        throw new UploadThingError("Unauthorized");
      }

      if (
        !TEMPLATE_DOWNLOAD_TYPES.includes(input.documentType)
      ) {
        throw new UploadThingError("Invalid document type");
      }

      return {
        organizationId: session.user.organizationId,
        documentType: input.documentType,
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const org = await prisma.organization.findUnique({
        where: { id: metadata.organizationId },
      });

      if (!org) throw new UploadThingError("Organization not found");

      const settings = getOrgSettings(org.settings);
      const documentTemplates = {
        ...settings.documentTemplates,
        [metadata.documentType]: {
          fileUrl: file.ufsUrl,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          updatedAt: new Date().toISOString(),
        },
      };

      await prisma.organization.update({
        where: { id: metadata.organizationId },
        data: {
          settings: {
            ...settings,
            documentTemplates,
          } as unknown as import("@/lib/db/client").Prisma.InputJsonValue,
        },
      });

      return { uploaded: true };
    }),

  accountPhotoUploader: f({
    "image/jpeg": { maxFileSize: "4MB", maxFileCount: 1 },
    "image/png": { maxFileSize: "4MB", maxFileCount: 1 },
    "image/webp": { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .middleware(async () => {
      const session = await auth();
      if (!session?.user) throw new UploadThingError("Non connecté");

      const dbUser = await resolveDbUser(session);
      if (!dbUser) throw new UploadThingError("Session expirée");
      if (!rateLimit(`upload:${dbUser.id}`, { limit: 30, windowMs: 10 * 60_000 }).ok) {
        throw new UploadThingError("Trop d'envois. Réessayez dans quelques minutes.");
      }

      return {
        userId: dbUser.id,
        organizationId: dbUser.organizationId,
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const previous = await prisma.user.findUnique({
        where: { id: metadata.userId },
        select: { profilePhotoUrl: true },
      });
      if (previous?.profilePhotoUrl) {
        await deleteStoredFiles([{ fileUrl: previous.profilePhotoUrl }]);
      }
      await prisma.user.update({
        where: { id: metadata.userId },
        data: { profilePhotoUrl: file.ufsUrl },
      });

      return { url: file.ufsUrl };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
