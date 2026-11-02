import { PaymentStatus, Role } from "@/lib/db/client";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { buildInvoicePdf } from "@/lib/invoice";
import { assignInvoiceNumber } from "@/lib/invoice-number";
import { getOrgSettings } from "@/lib/org";
import { prisma } from "@/lib/prisma";
import { resolveDbUser } from "@/lib/session";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ paymentId: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await resolveDbUser(session);
  if (!dbUser) {
    return NextResponse.json({ error: "Session expirée" }, { status: 401 });
  }

  const { paymentId } = await params;
  const payment = await prisma.payment.findFirst({
    where: {
      id: paymentId,
      status: PaymentStatus.COMPLETED,
      application: { organizationId: dbUser.organizationId },
    },
    include: {
      application: {
        include: {
          candidate: true,
          organization: true,
        },
      },
    },
  });

  if (!payment) {
    return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });
  }

  // Seuls l'admin et l'élève concerné voient une facture (pas le moniteur).
  if (
    dbUser.role !== Role.ADMIN &&
    !(dbUser.role === Role.CANDIDATE && payment.application.candidateId === dbUser.id)
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const company = getOrgSettings(payment.application.organization.settings).company!;
  const paidAt = payment.paidAt ?? payment.updatedAt;
  const candidate = payment.application.candidate;
  // Les paiements antérieurs à la numérotation séquentielle reçoivent leur numéro ici.
  const number =
    payment.invoiceNumber ??
    (await assignInvoiceNumber(payment.id, payment.application.organizationId, paidAt));
  const address = [candidate.street, candidate.postalCode, candidate.city]
    .filter(Boolean)
    .join(" ");

  const pdf = await buildInvoicePdf({
    number,
    paidAt,
    amountCents: payment.amount,
    permitType: payment.application.permitType,
    company,
    paymentMethod: PAYMENT_METHOD_LABELS[payment.method] ?? payment.method,
    organizationName: payment.application.organization.name,
    customer: {
      name: `${candidate.firstName} ${candidate.lastName}`,
      // Élève supprimé : l'adresse anonymisée ne figure pas sur la facture.
      email: payment.application.archivedAt ? "" : candidate.email,
      phone: candidate.phone,
      address,
    },
  });

  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${number}.pdf"`,
    },
  });
}
