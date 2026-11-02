import { PaymentStatus } from "@/lib/db/client";

import { getOrgSettings } from "@/lib/org";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export interface StripeAccountStatus {
  id: string;
  valid: boolean;
  businessName: string | null;
  email: string | null;
  chargesEnabled: boolean;
  detailsSubmitted: boolean;
}

export interface StripeIntegrationStatus {
  platformConfigured: boolean;
  stripeAccountId: string | null;
  account: StripeAccountStatus | null;
  sync: {
    lastSyncedAt: string | null;
    pendingPayments: number;
    isSynchronized: boolean;
  };
}

export async function getStripeIntegrationStatus(
  organizationId: string,
): Promise<StripeIntegrationStatus> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
  });

  if (!org) {
    throw new Error("Organization not found");
  }

  const platformConfigured = Boolean(process.env.STRIPE_SECRET_KEY?.trim());
  const orgSettings = getOrgSettings(org.settings);

  const pendingPayments = await prisma.payment.count({
    where: {
      status: PaymentStatus.PENDING,
      stripeCheckoutSessionId: { not: null },
      application: { organizationId },
    },
  });

  let account: StripeAccountStatus | null = null;

  if (org.stripeAccountId && platformConfigured) {
    try {
      const stripeAccount = await getStripe().accounts.retrieve(org.stripeAccountId);
      account = {
        id: stripeAccount.id,
        valid: true,
        businessName:
          stripeAccount.business_profile?.name ??
          stripeAccount.settings?.dashboard?.display_name ??
          null,
        email: stripeAccount.email ?? null,
        chargesEnabled: stripeAccount.charges_enabled ?? false,
        detailsSubmitted: stripeAccount.details_submitted ?? false,
      };
    } catch {
      account = {
        id: org.stripeAccountId,
        valid: false,
        businessName: null,
        email: null,
        chargesEnabled: false,
        detailsSubmitted: false,
      };
    }
  }

  return {
    platformConfigured,
    stripeAccountId: org.stripeAccountId,
    account,
    sync: {
      lastSyncedAt: orgSettings.lastStripeSyncAt ?? null,
      pendingPayments,
      isSynchronized: pendingPayments === 0,
    },
  };
}

export async function validateStripeAccountId(stripeAccountId: string) {
  if (!process.env.STRIPE_SECRET_KEY?.trim()) {
    throw new Error("Stripe non configuré sur le serveur");
  }

  const account = await getStripe().accounts.retrieve(stripeAccountId);

  return {
    id: account.id,
    businessName:
      account.business_profile?.name ??
      account.settings?.dashboard?.display_name ??
      null,
    email: account.email ?? null,
    chargesEnabled: account.charges_enabled ?? false,
    detailsSubmitted: account.details_submitted ?? false,
  };
}

export async function markStripeSynced(organizationId: string) {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
  });

  if (!org) return;

  const settings = {
    ...getOrgSettings(org.settings),
    lastStripeSyncAt: new Date().toISOString(),
  };

  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      settings: settings as unknown as import("@/lib/db/client").Prisma.InputJsonValue,
    },
  });
}
