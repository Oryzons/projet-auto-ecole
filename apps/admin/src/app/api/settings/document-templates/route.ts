import { DocumentType } from "@/lib/db/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { TEMPLATE_DOWNLOAD_TYPES } from "@/lib/constants";
import { getOrgSettings } from "@/lib/org";
import { prisma } from "@/lib/prisma";

const deleteSchema = z.object({
  documentType: z.nativeEnum(DocumentType),
});

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { documentType } = deleteSchema.parse(body);

    if (
      !TEMPLATE_DOWNLOAD_TYPES.includes(documentType)
    ) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    const org = await prisma.organization.findUnique({
      where: { id: session.user.organizationId },
    });

    if (!org) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const settings = getOrgSettings(org.settings);
    const documentTemplates = { ...settings.documentTemplates };
    delete documentTemplates[documentType];

    const updated = await prisma.organization.update({
      where: { id: session.user.organizationId },
      data: {
        settings: {
          ...settings,
          documentTemplates,
        } as unknown as import("@/lib/db/client").Prisma.InputJsonValue,
      },
    });

    return NextResponse.json({
      documentTemplates: getOrgSettings(updated.settings).documentTemplates,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
