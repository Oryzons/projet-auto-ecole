import { DocumentType, type Prisma } from "@/lib/db/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { getOrgSettings } from "@/lib/org";
import { prisma } from "@/lib/prisma";

const optionalText = (max: number) => z.string().trim().max(max).optional().default("");

const guidanceSchema = z
  .object({
    documentType: z.nativeEnum(DocumentType),
    instructions: optionalText(1000),
    linkUrl: optionalText(500).refine(
      (value) => value === "" || /^https?:\/\/\S+$/i.test(value),
      "Le lien doit commencer par https://",
    ),
    linkLabel: optionalText(80),
  })
  .refine((data) => !data.linkLabel || data.linkUrl, {
    message: "Ajoutez l'adresse du lien",
    path: ["linkUrl"],
  });

/** Enregistre la consigne (texte et lien) affichée à l'élève pour une pièce. */
export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const parsed = guidanceSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Données invalides" },
      { status: 400 },
    );
  }

  const { documentType, instructions, linkUrl, linkLabel } = parsed.data;
  const org = await prisma.organization.findUnique({
    where: { id: session.user.organizationId },
  });
  if (!org) return NextResponse.json({ error: "Organisation introuvable" }, { status: 404 });

  const settings = getOrgSettings(org.settings);
  const documentGuidance = { ...settings.documentGuidance };
  if (instructions || linkUrl) {
    documentGuidance[documentType] = {
      ...(instructions ? { instructions } : {}),
      ...(linkUrl ? { linkUrl, linkLabel: linkLabel || undefined } : {}),
    };
  } else {
    delete documentGuidance[documentType];
  }

  const updated = await prisma.organization.update({
    where: { id: org.id },
    data: { settings: { ...settings, documentGuidance } as unknown as Prisma.InputJsonValue },
  });

  return NextResponse.json({ documentGuidance: getOrgSettings(updated.settings).documentGuidance });
}
