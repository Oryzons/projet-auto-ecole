import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PaymentMethod, PaymentStatus } from "@/lib/db/client";
import { transferReference } from "@/lib/bank-transfer";
import { getOrgSettings } from "@/lib/org";
import { calcGrowth } from "@/lib/finances";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const orgId = session.user.organizationId;
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
  const start12m = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  const prices = getOrgSettings(org?.settings);

  const [completedPayments, totalApplications, paidApplications, pendingApplications, pendingTransfers] =
    await Promise.all([
      prisma.payment.findMany({
        where: {
          status: PaymentStatus.COMPLETED,
          application: { organizationId: orgId },
        },
        include: {
          application: {
            include: {
              candidate: {
                select: { firstName: true, lastName: true, email: true },
              },
            },
          },
        },
        orderBy: { paidAt: "asc" },
      }),
      prisma.permitApplication.count({ where: { organizationId: orgId, archivedAt: null } }),
      prisma.permitApplication.count({
        where: {
          organizationId: orgId,
          archivedAt: null,
          status: { in: ["PAID", "COMPLETED"] },
        },
      }),
      prisma.permitApplication.count({
        where: {
          organizationId: orgId,
          archivedAt: null,
          status: { in: ["DOCUMENTS_PENDING", "DOCUMENTS_REVIEW", "PAYMENT_PENDING"] },
        },
      }),
      prisma.payment.findMany({
        where: {
          status: PaymentStatus.PENDING,
          method: PaymentMethod.TRANSFER,
          application: { organizationId: orgId, archivedAt: null },
        },
        include: {
          application: {
            select: {
              id: true,
              candidate: { select: { firstName: true, lastName: true } },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      }),
    ]);

  const payments = completedPayments;
  const settledTotals = new Map<string, number>();
  for (const payment of completedPayments) {
    if (payment.application.status === "PAID" || payment.application.status === "COMPLETED") {
      settledTotals.set(
        payment.applicationId,
        (settledTotals.get(payment.applicationId) ?? 0) + payment.amount,
      );
    }
  }
  const settledCount = settledTotals.size;
  const settledRevenue = [...settledTotals.values()].reduce((sum, amount) => sum + amount, 0);

  const start90d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 89);
  const dayMap = new Map<string, { total: number; count: number }>();
  const monthMap = new Map<string, { total: number; count: number }>();
  let standardRevenue = 0;
  let partnerRevenue = 0;
  let standardCount = 0;
  let partnerCount = 0;
  let todayRevenue = 0;
  let todayCount = 0;
  let monthRevenue = 0;
  let monthCount = 0;
  let prevMonthRevenue = 0;
  const permitTypeMap = new Map<string, { count: number; revenue: number }>();

  for (const payment of payments) {
    const paidAt = payment.paidAt ?? payment.updatedAt;
    if (payment.application.partnerRate) {
      partnerRevenue += payment.amount;
      partnerCount++;
    } else {
      standardRevenue += payment.amount;
      standardCount++;
    }

    const permitType = payment.application.permitType;
    const currentPermit = permitTypeMap.get(permitType) ?? { count: 0, revenue: 0 };
    permitTypeMap.set(permitType, {
      count: currentPermit.count + 1,
      revenue: currentPermit.revenue + payment.amount,
    });

    if (paidAt >= startOfDay) {
      todayRevenue += payment.amount;
      todayCount++;
    }
    if (paidAt >= startOfMonth) {
      monthRevenue += payment.amount;
      monthCount++;
    } else if (paidAt >= startOfPrevMonth && paidAt <= endOfPrevMonth) {
      prevMonthRevenue += payment.amount;
    }

    if (paidAt >= start90d) {
      const dayKey = paidAt.toISOString().slice(0, 10);
      const day = dayMap.get(dayKey) ?? { total: 0, count: 0 };
      dayMap.set(dayKey, {
        total: day.total + payment.amount,
        count: day.count + 1,
      });
    }

    if (paidAt >= start12m) {
      const monthKey = `${paidAt.getFullYear()}-${String(paidAt.getMonth() + 1).padStart(2, "0")}`;
      const month = monthMap.get(monthKey) ?? { total: 0, count: 0 };
      monthMap.set(monthKey, {
        total: month.total + payment.amount,
        count: month.count + 1,
      });
    }
  }

  const totalRev = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const totalCount = payments.length;
  const recentPayments = [...payments]
    .sort(
      (a, b) =>
        (b.paidAt ?? b.updatedAt).getTime() - (a.paidAt ?? a.updatedAt).getTime(),
    )
    .slice(0, 50);

  return NextResponse.json({
    kpis: {
      todayRevenue,
      todayCount,
      monthRevenue,
      monthCount,
      monthGrowth: calcGrowth(monthRevenue, prevMonthRevenue),
      totalRevenue: totalRev,
      totalPaid: totalCount,
      averageTicket: settledCount > 0 ? Math.round(settledRevenue / settledCount) : 0,
      totalApplications,
      paidApplications,
      pendingApplications,
      conversionRate:
        totalApplications > 0
          ? Math.round((paidApplications / totalApplications) * 100)
          : 0,
    },
    prices,
    priceBreakdown: {
      standard: { count: standardCount, revenue: standardRevenue },
      partner: { count: partnerCount, revenue: partnerRevenue },
    },
    revenueByPermitType: Array.from(permitTypeMap.entries()).map(([type, data]) => ({
      type,
      ...data,
    })),
    recentPayments,
    pendingTransfers: pendingTransfers.map((payment) => ({
      id: payment.id,
      amount: payment.amount,
      announcedAt: payment.createdAt,
      reference: transferReference(payment.application.id),
      applicationId: payment.application.id,
      firstName: payment.application.candidate.firstName,
      lastName: payment.application.candidate.lastName,
    })),
    revenueByDay: [...dayMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, value]) => ({ date, ...value })),
    revenueByMonth: [...monthMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, value]) => ({ month, ...value })),
  });
}
