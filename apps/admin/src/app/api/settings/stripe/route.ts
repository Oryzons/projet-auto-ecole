import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateStripeAccountId } from "@/lib/stripe-integration";

const stripeAccountSchema = z.object({
  stripeAccountId: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? null : value),
    z
      .string()
      .regex(/^acct_[A-Za-z0-9]+$/, "Identifiant Stripe invalide (format attendu : acct_…)")
      .nullable(),
  ),
});

export async function PUT(req: Request) {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { stripeAccountId } = stripeAccountSchema.parse(body);
    const normalizedId = stripeAccountId?.trim() || null;

    if (normalizedId) {
      await validateStripeAccountId(normalizedId);
    }

    const org = await prisma.organization.update({
      where: { id: session.user.organizationId },
      data: { stripeAccountId: normalizedId },
      select: { stripeAccountId: true },
    });

    return NextResponse.json({ stripeAccountId: org.stripeAccountId });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Données invalides" },
        { status: 400 },
      );
    }

    console.error("Stripe settings error:", error);
    return NextResponse.json(
      { error: "Compte Stripe introuvable ou inaccessible" },
      { status: 400 },
    );
  }
}
