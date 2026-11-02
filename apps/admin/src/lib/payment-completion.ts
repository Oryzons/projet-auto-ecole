import { ApplicationStatus, EventType, PaymentMethod, PaymentStatus } from "@/lib/db/client";

import {
  broadcastApplicationUpdate,
  getAdminUsers,
  logEvent,
} from "@/lib/applications";
import {
  sendAdminDuplicatePaymentAlert,
  sendAdminPaymentNotification,
  sendPaymentReceivedEmail,
  sendToMany,
} from "@/lib/email";
import { assignInvoiceNumber } from "@/lib/invoice-number";
import { prisma } from "@/lib/prisma";
import { publishToAdmins } from "@/lib/sse-broker";
import { formatCurrency } from "@/lib/utils";

export type PaymentCompletionResult = "completed" | "duplicate" | "already-done";

/**
 * Passe un paiement en attente à « payé », de façon atomique.
 * Appelé par le webhook Stripe et par la synchronisation manuelle :
 * si les deux arrivent en même temps, un seul des deux fait le travail.
 */
export async function completePendingPayment(input: {
  paymentId: string;
  paymentIntentId?: string | null;
  source: "stripe-webhook" | "stripe-sync" | "stripe-return" | "transfer-confirmed";
  /** Administrateur à l'origine de la confirmation (virement). */
  userId?: string;
}): Promise<PaymentCompletionResult> {
  const paidAt = new Date();

  const outcome = await prisma.$transaction(async (tx) => {
    const { count } = await tx.payment.updateMany({
      where: { id: input.paymentId, status: PaymentStatus.PENDING },
      data: {
        status: PaymentStatus.COMPLETED,
        paidAt,
        stripePaymentIntentId: input.paymentIntentId ?? undefined,
      },
    });
    if (count === 0) return null;

    const payment = await tx.payment.findUniqueOrThrow({
      where: { id: input.paymentId },
      include: { application: { include: { candidate: true } } },
    });

    // Un virement annoncé mais pas encore reçu n'a plus lieu d'être.
    await tx.payment.updateMany({
      where: {
        applicationId: payment.applicationId,
        status: PaymentStatus.PENDING,
        method: PaymentMethod.TRANSFER,
        NOT: { id: payment.id },
      },
      data: { status: PaymentStatus.FAILED },
    });

    const completed = await tx.payment.findMany({
      where: {
        applicationId: payment.applicationId,
        status: PaymentStatus.COMPLETED,
      },
      select: { amount: true },
    });
    const paidSum = completed.reduce((sum, item) => sum + item.amount, 0);
    const alreadyPaid = paidSum - payment.amount;
    const total =
      payment.application.totalAmount && payment.application.totalAmount > 0
        ? payment.application.totalAmount
        : paidSum;
    const fullyPaid = paidSum >= total;
    const duplicate = alreadyPaid >= total || paidSum > total;

    await assignInvoiceNumber(
      payment.id,
      payment.application.organizationId,
      paidAt,
      tx,
    );

    const status = payment.application.status;
    const canMarkPaid =
      fullyPaid &&
      status !== ApplicationStatus.COMPLETED &&
      status !== ApplicationStatus.REJECTED &&
      status !== ApplicationStatus.PAID;

    const applicationUpdate = {
      ...(!payment.application.totalAmount ? { totalAmount: total } : {}),
      ...(canMarkPaid ? { status: ApplicationStatus.PAID } : {}),
    };
    if (Object.keys(applicationUpdate).length > 0) {
      await tx.permitApplication.update({
        where: { id: payment.applicationId },
        data: applicationUpdate,
      });
    }

    return { payment, duplicate, fullyPaid, remaining: Math.max(0, total - paidSum), markedPaid: canMarkPaid };
  });

  if (!outcome) return "already-done";

  const { payment, duplicate, fullyPaid, remaining, markedPaid } = outcome;
  const app = payment.application;
  const candidateName = `${app.candidate.firstName} ${app.candidate.lastName}`;
  const amountStr = formatCurrency(payment.amount);
  const admins = await getAdminUsers(app.organizationId);

  await logEvent(app.id, EventType.PAYMENT_COMPLETED, input.userId, {
    amount: payment.amount,
    sessionId: payment.stripeCheckoutSessionId,
    source: input.source,
    duplicate,
  });

  if (duplicate) {
    await sendToMany(
      admins.map((admin) => admin.email),
      (to) => sendAdminDuplicatePaymentAlert(to, candidateName, amountStr),
    );
  } else {
    await Promise.allSettled([
      sendPaymentReceivedEmail(
        app.candidate.email,
        candidateName,
        amountStr,
        fullyPaid
          ? undefined
          : `Il reste ${formatCurrency(remaining)} à régler.`,
      ),
      sendToMany(
        admins.map((admin) => admin.email),
        (to) => sendAdminPaymentNotification(to, candidateName, amountStr),
      ),
    ]);
  }

  publishToAdmins(app.organizationId, {
    type: "payment",
    data: {
      applicationId: app.id,
      amount: payment.amount,
      candidateName,
      duplicate,
    },
  });
  if (markedPaid) {
    broadcastApplicationUpdate(app, { status: ApplicationStatus.PAID });
  }

  return duplicate ? "duplicate" : "completed";
}

/** Marque un paiement Stripe abandonné (session expirée). */
export async function failPendingPayment(paymentId: string) {
  await prisma.payment.updateMany({
    where: { id: paymentId, status: PaymentStatus.PENDING },
    data: { status: PaymentStatus.FAILED },
  });
}
