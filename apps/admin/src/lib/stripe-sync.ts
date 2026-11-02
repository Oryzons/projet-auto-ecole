import { PaymentStatus } from '@/lib/db/client';

import { completePendingPayment, failPendingPayment } from '@/lib/payment-completion';
import { prisma } from '@/lib/prisma';
import { getStripe } from '@/lib/stripe';

/** Rattrape les paiements Stripe dont le webhook n'est pas arrivé. */
export async function syncStripePaymentsForOrganization(organizationId: string) {
  const pendingPayments = await prisma.payment.findMany({
    where: {
      status: PaymentStatus.PENDING,
      stripeCheckoutSessionId: { not: null },
      application: { organizationId },
    },
  });

  let synced = 0;

  for (const payment of pendingPayments) {
    const session = await getStripe().checkout.sessions.retrieve(
      payment.stripeCheckoutSessionId!,
    );

    if (session.status === 'expired') {
      await failPendingPayment(payment.id);
      continue;
    }

    if (session.payment_status !== 'paid') continue;

    const result = await completePendingPayment({
      paymentId: payment.id,
      paymentIntentId:
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id,
      source: 'stripe-sync',
    });
    if (result !== 'already-done') synced += 1;
  }

  return {
    checked: pendingPayments.length,
    synced,
  };
}
