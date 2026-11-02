import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { markStripeSynced } from '@/lib/stripe-integration';
import { syncStripePaymentsForOrganization } from '@/lib/stripe-sync';

export async function POST() {
  const session = await auth();

  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: 'Stripe non configuré' },
      { status: 503 },
    );
  }

  try {
    const result = await syncStripePaymentsForOrganization(
      session.user.organizationId,
    );

    await markStripeSynced(session.user.organizationId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Stripe sync error:', error);
    return NextResponse.json(
      { error: 'Échec de la synchronisation Stripe' },
      { status: 500 },
    );
  }
}
