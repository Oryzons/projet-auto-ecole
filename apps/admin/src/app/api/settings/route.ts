import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgSettings } from "@/lib/org";
import { syncOpenApplicationPrices } from "@/lib/applications";
import { PERMIT_TYPES, prepareDiscountCodes } from "@/lib/constants";
import { z } from "zod";
import { isValidBic, isValidIban, normalizeIban } from "@/lib/bank-transfer";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const org = await prisma.organization.findUnique({
    where: { id: session.user.organizationId },
  });

  if (!org) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    organization: {
      id: org.id,
      name: org.name,
      slug: org.slug,
      stripeAccountId: org.stripeAccountId,
    },
    settings: getOrgSettings(org.settings),
  });
}

const companySchema = z.object({
  legalName: z.string().max(200),
  address: z.string().max(300),
  postalCode: z.string().max(20),
  city: z.string().max(120),
  siret: z.string().max(20),
  vatNumber: z.string().max(30),
  email: z.string().max(200),
  phone: z.string().max(30),
});

const permitPriceSchema = z.object({
  standard: z.number().int().min(0),
  partner: z.number().int().min(0),
});

const settingsSchema = z.object({
  standardPrice: z.number().min(0),
  partnerPrice: z.number().min(0),
  permitPrices: z
    .object({
      "permis-b": permitPriceSchema,
      "permis-b-auto": permitPriceSchema,
      aac: permitPriceSchema,
      a2: permitPriceSchema,
    })
    .partial()
    .optional(),
  fiscalStampPrice: z.number().min(0),
  permitTypes: z.array(z.enum(["permis-b", "permis-b-auto", "aac", "a2"])).min(1),
  permitBriefings: z
    .object({
      "permis-b": z.string().max(4000).optional(),
      "permis-b-auto": z.string().max(4000).optional(),
      aac: z.string().max(4000).optional(),
      a2: z.string().max(4000).optional(),
    })
    .optional(),
  discountCodes: z
    .array(
      z.object({
        code: z.string().trim().min(2).max(40),
        label: z.string().trim().max(80),
        kind: z.enum(["amount", "percent"]),
        value: z.number().int().min(1),
      }),
    )
    .max(30)
    .optional(),
  installmentsEnabled: z.boolean().optional(),
  bankTransfer: z
    .object({
      enabled: z.boolean(),
      holder: z.string().trim().max(120),
      iban: z.string().max(50).transform(normalizeIban),
      bic: z.string().max(20).transform((v) => v.trim().toUpperCase()),
    })
    .refine((v) => !v.iban || isValidIban(v.iban), { message: "IBAN invalide" })
    .refine((v) => !v.bic || isValidBic(v.bic), { message: "BIC invalide" })
    .refine((v) => !v.enabled || (v.holder && v.iban), {
      message: "Titulaire et IBAN requis pour activer le virement",
    })
    .optional(),
  company: companySchema.optional(),
});

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const settings = settingsSchema.parse(body);

    const currentOrg = await prisma.organization.findUnique({
      where: { id: session.user.organizationId },
    });

    if (!currentOrg) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const currentSettings = getOrgSettings(currentOrg.settings);
    let discountCodes = currentSettings.discountCodes;
    if (settings.discountCodes) {
      const prepared = prepareDiscountCodes(settings.discountCodes);
      if ("error" in prepared) {
        return NextResponse.json({ error: prepared.error }, { status: 400 });
      }
      discountCodes = prepared.codes;
    }
    const permitBriefings = settings.permitBriefings
      ? Object.fromEntries(
          PERMIT_TYPES.flatMap((permit) => {
            const text = settings.permitBriefings?.[permit.value]?.trim();
            return text ? [[permit.value, text.slice(0, 4000)]] : [];
          }),
        )
      : currentSettings.permitBriefings;
    const mergedSettings = {
      ...currentSettings,
      ...settings,
      permitBriefings,
      discountCodes,
      documentTemplates: currentSettings.documentTemplates,
      documentGuidance: currentSettings.documentGuidance,
      company: settings.company
        ? { ...currentSettings.company, ...settings.company }
        : currentSettings.company,
    };

    const org = await prisma.organization.update({
      where: { id: session.user.organizationId },
      data: {
        settings: mergedSettings as unknown as import("@/lib/db/client").Prisma.InputJsonValue,
      },
    });

    await syncOpenApplicationPrices(session.user.organizationId);

    return NextResponse.json({ settings: getOrgSettings(org.settings) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid data" },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
