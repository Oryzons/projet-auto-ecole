import { ApplicationStatus, DocumentStatus, PaymentStatus } from "@/lib/db/client";

import { prisma } from "@/lib/prisma";

const OPEN_STATUSES: ApplicationStatus[] = [
  ApplicationStatus.DRAFT,
  ApplicationStatus.DOCUMENTS_PENDING,
  ApplicationStatus.DOCUMENTS_REVIEW,
  ApplicationStatus.PAYMENT_PENDING,
  ApplicationStatus.PAID,
];

function monthStart(offset = 0) {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + offset, 1);
}

/** Chiffres du tableau de bord admin, calculés sur les vraies données de l'organisation. */
export async function getAdminOverview(organizationId: string) {
  const active = { organizationId, archivedAt: null };
  const thisMonth = monthStart();
  const lastMonth = monthStart(-1);
  const sixMonthsAgo = monthStart(-5);

  const [
    openCount,
    statusGroups,
    pendingDocs,
    paidThisMonth,
    paidLastMonth,
    completedThisMonth,
    newThisMonth,
    unreadMessages,
    recentPayments,
    reviewQueue,
    events,
  ] = await Promise.all([
    prisma.permitApplication.count({ where: { ...active, status: { in: OPEN_STATUSES } } }),
    prisma.permitApplication.groupBy({ by: ["status"], where: active, _count: true }),
    prisma.document.count({ where: { status: DocumentStatus.PENDING, application: active } }),
    prisma.payment.aggregate({
      where: { status: PaymentStatus.COMPLETED, paidAt: { gte: thisMonth }, application: { organizationId } },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.payment.aggregate({
      where: { status: PaymentStatus.COMPLETED, paidAt: { gte: lastMonth, lt: thisMonth }, application: { organizationId } },
      _sum: { amount: true },
    }),
    prisma.permitApplication.count({
      where: { ...active, status: ApplicationStatus.COMPLETED, updatedAt: { gte: thisMonth } },
    }),
    prisma.permitApplication.count({ where: { ...active, createdAt: { gte: thisMonth } } }),
    prisma.message.count({
      where: { readAt: null, sender: { role: "CANDIDATE" }, application: active },
    }),
    prisma.payment.findMany({
      where: { status: PaymentStatus.COMPLETED, paidAt: { gte: sixMonthsAgo }, application: { organizationId } },
      select: { amount: true, paidAt: true },
    }),
    prisma.permitApplication.findMany({
      where: { ...active, documents: { some: { status: DocumentStatus.PENDING } } },
      select: {
        id: true,
        status: true,
        candidate: { select: { firstName: true, lastName: true, profilePhotoUrl: true } },
        documents: {
          where: { status: DocumentStatus.PENDING },
          select: { createdAt: true, updatedAt: true },
          orderBy: { updatedAt: "asc" },
        },
      },
      take: 50,
    }),
    prisma.applicationEvent.findMany({
      where: { application: active, type: { notIn: ["MESSAGE_SENT", "PAYMENT_INITIATED"] } },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        type: true,
        metadata: true,
        createdAt: true,
        applicationId: true,
        application: { select: { candidate: { select: { firstName: true, lastName: true } } } },
        user: { select: { role: true, firstName: true } },
      },
    }),
  ]);

  const revenue = Array.from({ length: 6 }, (_, index) => {
    const start = monthStart(index - 5);
    const end = monthStart(index - 4);
    const inMonth = recentPayments.filter((p) => p.paidAt && p.paidAt >= start && p.paidAt < end);
    return {
      label: start.toLocaleDateString("fr-FR", { month: "short" }).replace(".", ""),
      total: inMonth.reduce((sum, p) => sum + p.amount, 0),
      count: inMonth.length,
    };
  });

  const queue = reviewQueue
    .map((app) => ({
      id: app.id,
      status: app.status,
      candidate: app.candidate,
      pending: app.documents.length,
      since: app.documents[0]?.updatedAt ?? new Date(),
    }))
    .sort((a, b) => a.since.getTime() - b.since.getTime())
    .slice(0, 6);

  return {
    openCount,
    pendingDocs,
    newThisMonth,
    unreadMessages,
    completedThisMonth,
    revenueThisMonth: paidThisMonth._sum.amount ?? 0,
    paymentsThisMonth: paidThisMonth._count,
    revenueLastMonth: paidLastMonth._sum.amount ?? 0,
    statuses: Object.fromEntries(statusGroups.map((g) => [g.status, g._count])) as Partial<Record<ApplicationStatus, number>>,
    revenue,
    queue,
    events: events.map((event) => ({
      id: event.id,
      type: event.type,
      metadata: event.metadata as Record<string, unknown>,
      createdAt: event.createdAt.toISOString(),
      applicationId: event.applicationId,
      candidate: event.application.candidate,
      byAdmin: event.user?.role === "ADMIN",
    })),
  };
}

export type AdminOverview = Awaited<ReturnType<typeof getAdminOverview>>;
