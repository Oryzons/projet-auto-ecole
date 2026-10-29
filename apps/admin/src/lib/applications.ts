import {
  ApplicationStatus,
  DocumentStatus,
  DocumentType,
  EventType,
  PaymentStatus,
  Role,
  Prisma,
} from "@/lib/db/client";
import { prisma, type DbRow } from "./prisma";
import { DEFAULT_ORG_SETTINGS, priceForChoice, REQUIRED_DOCUMENTS } from "./constants";
import { getOrgSettings } from "./org";
import { sumCompletedPayments } from "./payment";
import { publishToAdmins, publishToUser } from "./sse-broker";

export async function resolveApplicationPrice(
  organizationId: string,
  partnerRate: boolean,
  permitType = "permis-b",
  discount?: { kind?: string | null; value?: number | null } | null,
): Promise<number> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
  });
  return priceForChoice(getOrgSettings(org?.settings), permitType, partnerRate, discount);
}

/** Recalcule le montant des dossiers ouverts qui n'ont encore reçu aucun paiement. */
export async function syncOpenApplicationPrices(organizationId: string) {
  const org = await prisma.organization.findUnique({ where: { id: organizationId } });
  const settings = getOrgSettings(org?.settings);
  const apps = await prisma.permitApplication.findMany({
    where: {
      organizationId,
      archivedAt: null,
      status: {
        notIn: [ApplicationStatus.PAID, ApplicationStatus.COMPLETED, ApplicationStatus.REJECTED],
      },
    },
    select: {
      id: true,
      permitType: true,
      partnerRate: true,
      discountKind: true,
      discountValue: true,
      totalAmount: true,
      payments: { where: { status: PaymentStatus.COMPLETED }, select: { amount: true } },
    },
  });

  for (const app of apps) {
    if (app.payments.reduce((sum: number, payment: DbRow) => sum + payment.amount, 0) > 0) continue;
    const totalAmount = priceForChoice(
      settings,
      app.permitType,
      app.partnerRate,
      app.partnerRate ? null : { kind: app.discountKind, value: app.discountValue },
    );
    if (app.totalAmount === totalAmount) continue;
    await prisma.permitApplication.update({
      where: { id: app.id },
      data: { totalAmount },
    });
  }
}

export async function getOrCreateApplication(
  candidateId: string,
  organizationId: string,
  options?: {
    partnerRate?: boolean;
    permitType?: string;
    partnerCompany?: string | null;
    discountCode?: string | null;
    discountKind?: string | null;
    discountValue?: number | null;
  },
) {
  const existing = await prisma.permitApplication.findUnique({
    where: { candidateId_organizationId: { candidateId, organizationId } },
    include: { documents: true, payments: true },
  });
  if (existing) return existing;

  const partnerRate = options?.partnerRate ?? false;
  const permitType = options?.permitType ?? "permis-b";
  const discount = partnerRate
    ? null
    : { kind: options?.discountKind, value: options?.discountValue };
  const totalAmount = await resolveApplicationPrice(organizationId, partnerRate, permitType, discount);

  try {
    return await prisma.permitApplication.create({
      data: {
        candidateId,
        organizationId,
        status: ApplicationStatus.DOCUMENTS_PENDING,
        permitType,
        partnerRate,
        partnerCompany: partnerRate ? options?.partnerCompany ?? null : null,
        discountCode: discount ? options?.discountCode ?? null : null,
        discountKind: discount?.kind ?? null,
        discountValue: discount?.value ?? null,
        totalAmount,
        events: {
          create: { type: EventType.CREATED, userId: candidateId },
        },
      },
      include: { documents: true, payments: true },
    });
  } catch (error) {
    // Deux requêtes simultanées : l'autre a créé le dossier entre-temps.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return prisma.permitApplication.findUniqueOrThrow({
        where: { candidateId_organizationId: { candidateId, organizationId } },
        include: { documents: true, payments: true },
      });
    }
    throw error;
  }
}

/** Statuts finaux : aucun recalcul automatique ne doit les modifier. */
const FINAL_STATUSES: ApplicationStatus[] = [
  ApplicationStatus.COMPLETED,
  ApplicationStatus.REJECTED,
];

export function isFinalStatus(status: ApplicationStatus) {
  return FINAL_STATUSES.includes(status);
}

/** Tous les documents obligatoires sont-ils validés ? */
export function hasAllRequiredDocumentsApproved(
  documents: { type: DocumentType; status: DocumentStatus }[],
) {
  return REQUIRED_DOCUMENTS.every((type) =>
    documents.some((d) => d.type === type && d.status === DocumentStatus.APPROVED),
  );
}

/** Prévient les admins et l'élève concerné qu'un dossier a changé. */
export function broadcastApplicationUpdate(
  application: { id: string; organizationId: string; candidateId: string },
  data: Record<string, unknown> = {},
) {
  const event = {
    type: "application" as const,
    data: { applicationId: application.id, ...data },
  };
  publishToAdmins(application.organizationId, event);
  publishToUser(application.candidateId, event);
}

export async function updateApplicationStatus(applicationId: string) {
  const app = await prisma.permitApplication.findUnique({
    where: { id: applicationId },
    include: { documents: true, payments: true },
  });
  if (!app) return;

  const allRequiredUploaded = REQUIRED_DOCUMENTS.every((type) =>
    app.documents.some((d: DbRow) => d.type === type)
  );
  const allRequiredApproved = hasAllRequiredDocumentsApproved(app.documents);
  const partnerBadge = app.documents.find(
    (d: DbRow) => d.type === DocumentType.PARTNER_BADGE
  );
  const partnerRate =
    app.partnerRate || partnerBadge?.status === DocumentStatus.APPROVED;

  const paidAmount = sumCompletedPayments(app.payments);
  const catalogPrice = await resolveApplicationPrice(
    app.organizationId,
    partnerRate,
    app.permitType,
    partnerRate ? null : { kind: app.discountKind, value: app.discountValue },
  );
  const currentTotal = app.totalAmount && app.totalAmount > 0 ? app.totalAmount : catalogPrice;
  const fullyPaid = paidAmount > 0 && paidAmount >= currentTotal;

  let newStatus: ApplicationStatus;

  if (isFinalStatus(app.status)) {
    // Un dossier finalisé ou refusé ne revient jamais en arrière.
    newStatus = app.status;
  } else if (fullyPaid) {
    newStatus = ApplicationStatus.PAID;
  } else if (allRequiredApproved) {
    newStatus = ApplicationStatus.PAYMENT_PENDING;
  } else if (allRequiredUploaded) {
    newStatus = ApplicationStatus.DOCUMENTS_REVIEW;
  } else {
    newStatus = ApplicationStatus.DOCUMENTS_PENDING;
  }

  // Dès le premier versement, le montant du dossier ne change plus.
  const priceCanChange = paidAmount === 0 && !isFinalStatus(app.status);

  const nextTotal = priceCanChange ? catalogPrice : currentTotal;
  const priceChanged = priceCanChange && (app.partnerRate !== partnerRate || app.totalAmount !== nextTotal);

  if (app.status !== newStatus || priceChanged) {
    await prisma.permitApplication.update({
      where: { id: applicationId },
      data: {
        status: newStatus,
        ...(priceCanChange ? { partnerRate, totalAmount: nextTotal } : {}),
      },
    });

    broadcastApplicationUpdate(app, { status: newStatus });
  }
}

export async function logEvent(
  applicationId: string,
  type: EventType,
  userId?: string,
  metadata?: Record<string, unknown>
) {
  await prisma.applicationEvent.create({
    data: {
      applicationId,
      type,
      userId,
      metadata: (metadata ?? {}) as Prisma.InputJsonValue,
    },
  });
}

export async function calculateApplicationAmount(
  applicationId: string
): Promise<number> {
  const app = await prisma.permitApplication.findUnique({
    where: { id: applicationId },
    include: { organization: true },
  });
  if (!app) return DEFAULT_ORG_SETTINGS.standardPrice;

  return priceForChoice(
    getOrgSettings(app.organization.settings),
    app.permitType,
    app.partnerRate,
    app.partnerRate ? null : { kind: app.discountKind, value: app.discountValue },
  );
}

export async function getAdminUsers(organizationId: string) {
  return prisma.user.findMany({
    where: { organizationId, role: Role.ADMIN },
  });
}
