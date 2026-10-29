import type { Prisma } from "@/lib/db/client";

import { prisma } from "@/lib/prisma";

type Db = Prisma.TransactionClient;

export function formatInvoiceNumber(year: number, value: number) {
  return `NF-${year}-${String(value).padStart(6, "0")}`;
}

/**
 * Attribue au paiement le prochain numéro de facture de l'année
 * (numérotation chronologique et continue, sans trou).
 * Ne fait rien si le paiement a déjà un numéro.
 */
export async function assignInvoiceNumber(
  paymentId: string,
  organizationId: string,
  paidAt: Date,
  db: Db = prisma,
): Promise<string> {
  const run = async (tx: Prisma.TransactionClient) => {
    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
      select: { invoiceNumber: true },
    });
    if (payment?.invoiceNumber) return payment.invoiceNumber;

    const year = paidAt.getFullYear();
    // L'upsert verrouille la ligne du compteur : deux paiements simultanés
    // obtiennent forcément deux numéros différents.
    const counter = await tx.invoiceCounter.upsert({
      where: { organizationId_year: { organizationId, year } },
      create: { organizationId, year, value: 1 },
      update: { value: { increment: 1 } },
    });

    const invoiceNumber = formatInvoiceNumber(year, counter.value);
    await tx.payment.update({ where: { id: paymentId }, data: { invoiceNumber } });
    return invoiceNumber;
  };

  if ("$transaction" in db) {
    return db.$transaction(run);
  }
  return run(db);
}
