import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { MANUAL_PAYMENT_METHODS } from "@/lib/constants";
import { isManualPaymentMethod, markApplicationPaidManually } from "@/lib/manual-payment";
import { isInstallmentCount } from "@/lib/payment";
import { resolveDbUser } from "@/lib/session";

const bodySchema = z.object({
  method: z.enum(MANUAL_PAYMENT_METHODS),
  installments: z
    .object({
      count: z.number().int(),
      amount: z.number().int().positive(),
    })
    .optional(),
});

export async function POST(
  req: Request,
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
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);

  if (!parsed.success || !isManualPaymentMethod(parsed.data.method)) {
    return NextResponse.json(
      { error: "Choisis un mode de paiement" },
      { status: 400 },
    );
  }

  if (
    parsed.data.installments &&
    !isInstallmentCount(parsed.data.installments.count)
  ) {
    return NextResponse.json(
      { error: "Choisis 2, 3 ou 4 versements" },
      { status: 400 },
    );
  }

  const result = await markApplicationPaidManually({
    applicationId: id,
    organizationId: dbUser.organizationId,
    adminUserId: dbUser.id,
    method: parsed.data.method,
    installments: parsed.data.installments,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ payment: result.payment });
}
