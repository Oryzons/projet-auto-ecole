import { PaymentMethod, PaymentStatus } from "@/lib/db/client";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { expireOpenCheckoutSessions } from "@/lib/manual-payment";
import { completePendingPayment } from "@/lib/payment-completion";
import { prisma, type DbRow } from "@/lib/prisma";
import { resolveDbUser } from "@/lib/session";

/** L'auto-école a reçu le virement : le paiement passe à « payé » et la facture est émise. */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const dbUser = await resolveDbUser(session);
  if (!dbUser || dbUser.role !== "ADMIN") {
    return NextResponse.json({ error: "Session expirée" }, { status: 401 });
  }

  const { id } = await params;
  const payment = await prisma.payment.findFirst({
    where: {
      id,
      method: PaymentMethod.TRANSFER,
      application: { organizationId: dbUser.organizationId },
    },
    include: { application: { include: { payments: true } } },
  });

  if (!payment) {
    return NextResponse.json({ error: "Virement introuvable" }, { status: 404 });
  }
  if (payment.status !== PaymentStatus.PENDING) {
    return NextResponse.json({ error: "Ce virement n'est plus en attente" }, { status: 400 });
  }
  if (payment.application.payments.some((p: DbRow) => p.status === PaymentStatus.COMPLETED)) {
    return NextResponse.json({ error: "Ce dossier est déjà payé" }, { status: 400 });
  }

  await expireOpenCheckoutSessions(payment.applicationId);
  const result = await completePendingPayment({
    paymentId: payment.id,
    source: "transfer-confirmed",
    userId: dbUser.id,
  });

  if (result === "already-done") {
    return NextResponse.json({ error: "Ce virement n'est plus en attente" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
