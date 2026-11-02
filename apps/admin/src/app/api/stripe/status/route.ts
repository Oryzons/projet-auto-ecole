import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getStripeIntegrationStatus } from "@/lib/stripe-integration";

export async function GET() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const status = await getStripeIntegrationStatus(session.user.organizationId);
    return NextResponse.json(status);
  } catch (error) {
    console.error("Stripe status error:", error);
    return NextResponse.json(
      { error: "Impossible de récupérer le statut Stripe" },
      { status: 500 },
    );
  }
}
