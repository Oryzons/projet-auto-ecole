import {
  ApplicationStatus,
  EventType,
  PaymentMethod,
  PaymentStatus,
} from "@/lib/db/client";

import {
  broadcastApplicationUpdate,
  calculateApplicationAmount,
  getAdminUsers,
  logEvent,
} from "@/lib/applications";
import { MANUAL_PAYMENT_METHODS } from "@/lib/constants";
import {
  sendAdminPaymentNotification,
  sendPaymentReceivedEmail,
  sendToMany,
} from "@/lib/email";
import { assignInvoiceNumber } from "@/lib/invoice-number";
import { isInstallmentCount, sumCompletedPayments } from "@/lib/payment";
import { prisma, type DbRow } from "@/lib/prisma";
import { publishToAdmins } from "@/lib/sse-broker";
import { getStripe, isStripeSecretKeyConfigured } from "@/lib/stripe";
import { formatCurrency } from "@/lib/utils";

const MANUAL_METHODS = new Set<string>(MANUAL_PAYMENT_METHODS);

export function isManualPaymentMethod(value: string): value is PaymentMethod {
  return MANUAL_METHODS.has(value);
}

/** Ferme les sessions Stripe encore ouvertes, pour éviter un second encaissement. */
export async function expireOpenCheckoutSessions(applicationId: string) {
  const pending = await prisma.payment.findMany({
    where: {
      applicationId,
      status: PaymentStatus.PENDING,
      stripeCheckoutSessionId: { not: null },
    },
  });
  if (pending.length === 0 || !isStripeSecretKeyConfigured()) return;

  await Promise.allSettled(
    pending.map(async (payment) => {
      const session = await getStripe().checkout.sessions.retrieve(
        payment.stripeCheckoutSessionId!,
      );
      if (session.status === "open") {
        await getStripe().checkout.sessions.expire(session.id);
      }
      if (session.payment_status !== "paid") {
        await prisma.payment.updateMany({
          where: { id: payment.id, status: PaymentStatus.PENDING },
          data: { status: PaymentStatus.FAILED },
        });
      }
    }),
  );
}

export async function markApplicationPaidManually(input: {
  applicationId: string;
  organizationId: string;
  adminUserId: string;
  method: PaymentMethod;
  installments?: { count: number; amount: number };
}) {
  const app = await prisma.permitApplication.findFirst({
    where: {
      id: input.applicationId,
      organizationId: input.organizationId,
      archivedAt: null,
    },
    include: { candidate: true, payments: true },
  });

  if (!app) {
    return { ok: false as const, status: 404, error: "Dossier introuvable" };
  }

  if (app.status === ApplicationStatus.REJECTED) {
    return {
      ok: false as const,
      status: 400,
      error: "Un dossier refusé ne peut pas être marqué comme payé",
    };
  }

  const total =
    app.totalAmount && app.totalAmount > 0
      ? app.totalAmount
      : await calculateApplicationAmount(app.id);
  const alreadyPaid = sumCompletedPayments(app.payments);
  const remaining = total - alreadyPaid;

  if (remaining <= 0) {
    return { ok: false as const, status: 400, error: "Ce dossier est déjà payé" };
  }

  const existingPlan =
    app.payments.find(
      (payment: DbRow) =>
        payment.status === PaymentStatus.COMPLETED && payment.installmentCount,
    )?.installmentCount ?? null;

  let amount = remaining;
  let installmentCount: number | null = null;
  let installmentIndex: number | null = null;

  if (input.installments) {
    if (!isInstallmentCount(input.installments.count)) {
      return {
        ok: false as const,
        status: 400,
        error: "Choisis 2, 3 ou 4 versements",
      };
    }
    if (existingPlan && existingPlan !== input.installments.count) {
      return {
        ok: false as const,
        status: 400,
        error: `Ce dossier est déjà en paiement en ${existingPlan} fois`,
      };
    }
    if (
      input.installments.amount <= 0 ||
      input.installments.amount > remaining
    ) {
      return {
        ok: false as const,
        status: 400,
        error: "Le montant doit être compris entre 0 € et le reste à payer",
      };
    }
    amount = input.installments.amount;
    installmentCount = input.installments.count;
    installmentIndex =
      app.payments.filter(
        (payment: DbRow) =>
          payment.status === PaymentStatus.COMPLETED &&
          payment.installmentCount === installmentCount,
      ).length + 1;
  }

  const fullyPaid = alreadyPaid + amount >= total;
  const paidAt = new Date();
  const nextStatus = fullyPaid
    ? app.status === ApplicationStatus.COMPLETED
      ? ApplicationStatus.COMPLETED
      : ApplicationStatus.PAID
    : app.status;

  await expireOpenCheckoutSessions(app.id);

  const payment = await prisma.$transaction(async (tx) => {
    const completed = await tx.payment.findMany({
      where: { applicationId: app.id, status: PaymentStatus.COMPLETED },
      select: { amount: true },
    });
    const paidNow = completed.reduce((sum, item) => sum + item.amount, 0);
    if (paidNow >= total || paidNow + amount > total) return null;

    // Un virement annoncé par l'élève est remplacé par ce paiement.
    await tx.payment.updateMany({
      where: {
        applicationId: app.id,
        status: PaymentStatus.PENDING,
        method: PaymentMethod.TRANSFER,
      },
      data: { status: PaymentStatus.FAILED },
    });

    const created = await tx.payment.create({
      data: {
        applicationId: app.id,
        amount,
        status: PaymentStatus.COMPLETED,
        method: input.method,
        paidAt,
        installmentCount,
        installmentIndex,
      },
    });
    const invoiceNumber = await assignInvoiceNumber(
      created.id,
      app.organizationId,
      paidAt,
      tx,
    );
    await tx.permitApplication.update({
      where: { id: app.id },
      data: {
        totalAmount: total,
        ...(fullyPaid ? { status: nextStatus } : {}),
      },
    });
    return { ...created, invoiceNumber };
  });

  if (!payment) {
    return { ok: false as const, status: 400, error: "Ce dossier est déjà payé" };
  }

  await logEvent(app.id, EventType.PAYMENT_COMPLETED, input.adminUserId, {
    amount,
    method: input.method,
    source: "manual",
  });

  const candidateName = `${app.candidate.firstName} ${app.candidate.lastName}`;
  const amountStr = formatCurrency(amount);
  const admins = await getAdminUsers(input.organizationId);

  await Promise.allSettled([
    sendPaymentReceivedEmail(
      app.candidate.email,
      candidateName,
      amountStr,
      fullyPaid
        ? undefined
        : `Il reste ${formatCurrency(total - alreadyPaid - amount)} à régler.`,
    ),
    sendToMany(
      admins.map((admin) => admin.email),
      (to) => sendAdminPaymentNotification(to, candidateName, amountStr),
    ),
  ]);

  publishToAdmins(input.organizationId, {
    type: "payment",
    data: {
      applicationId: app.id,
      amount,
      candidateName,
      method: input.method,
    },
  });
  if (fullyPaid) {
    broadcastApplicationUpdate(app, { status: nextStatus });
  }

  return { ok: true as const, payment };
}
