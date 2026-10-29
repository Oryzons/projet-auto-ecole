import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import {
  DOSSIER_EXPORT_FORMATS,
  exportFileBaseName,
  isDownloadableFileUrl,
  toCsv,
  toXlsx,
  toZip,
  type ExportableApplication,
} from "@/lib/dossier-export";
import { resolveFileUrl } from "@/lib/files";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  format: z.enum(DOSSIER_EXPORT_FORMATS),
  ids: z.array(z.string().min(1)).min(1).max(300),
});

async function downloadFile(url: string) {
  if (!isDownloadableFileUrl(url)) return null;

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(20_000),
      redirect: "error",
    });
    if (!response.ok) return null;
    return new Uint8Array(await response.arrayBuffer());
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Choisis un format et au moins un dossier" },
      { status: 400 },
    );
  }

  const applications = await prisma.permitApplication.findMany({
    where: {
      organizationId: session.user.organizationId,
      archivedAt: null,
      id: { in: parsed.data.ids },
    },
    include: {
      candidate: true,
      documents: { orderBy: { createdAt: "asc" } },
      payments: { orderBy: { paidAt: "asc" } },
    },
  });

  if (applications.length === 0) {
    return NextResponse.json({ error: "Aucun dossier à exporter" }, { status: 404 });
  }

  applications.sort((a, b) =>
    `${a.candidate.lastName} ${a.candidate.firstName}`.localeCompare(
      `${b.candidate.lastName} ${b.candidate.firstName}`,
      "fr",
    ),
  );

  const rows = applications as ExportableApplication[];
  const baseName = exportFileBaseName();

  if (parsed.data.format === "csv") {
    return new NextResponse(toCsv(rows), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${baseName}.csv"`,
      },
    });
  }

  if (parsed.data.format === "xlsx") {
    const buffer = await toXlsx(rows);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${baseName}.xlsx"`,
      },
    });
  }

  // Documents privés : URL signée de courte durée pour chaque fichier.
  for (const application of rows) {
    for (const document of application.documents) {
      document.fileUrl = await resolveFileUrl(document);
    }
  }

  const zip = await toZip(rows, downloadFile);
  return new NextResponse(new Uint8Array(zip), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${baseName}.zip"`,
    },
  });
}
