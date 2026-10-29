import { Role } from "@/lib/db/client";

import { auth } from "@/lib/auth";
import { resolveFileUrl } from "@/lib/files";
import { prisma } from "@/lib/prisma";
import { resolveDbUser } from "@/lib/session";

export const dynamic = "force-dynamic";

/** Seuls ces types sont affichés dans le navigateur ; le reste est téléchargé. */
const INLINE_TYPES = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);

/**
 * Sert un document après vérification des droits : l'admin de l'organisation
 * ou l'élève propriétaire. L'URL de stockage n'est jamais exposée.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) return new Response("Non connecté", { status: 401 });

  const dbUser = await resolveDbUser(session);
  if (!dbUser) return new Response("Session expirée", { status: 401 });

  const { id } = await params;
  const document = await prisma.document.findFirst({
    where: {
      id,
      application: {
        organizationId: dbUser.organizationId,
        ...(dbUser.role === Role.ADMIN ? {} : { candidateId: dbUser.id }),
      },
    },
  });
  if (!document) return new Response("Document introuvable", { status: 404 });

  const upstream = await fetch(await resolveFileUrl(document), {
    signal: AbortSignal.timeout(20_000),
  }).catch(() => null);
  if (!upstream?.ok || !upstream.body) {
    return new Response("Fichier indisponible", { status: 502 });
  }

  const mimeType = (document.mimeType || "").toLowerCase();
  const safe = INLINE_TYPES.has(mimeType);
  const download = !safe || new URL(req.url).searchParams.get("download") === "1";
  const fileName = document.fileName.replace(/["\\\r\n]/g, "_");

  return new Response(upstream.body, {
    headers: {
      // Un type inconnu (SVG, HTML…) n'est jamais interprété par le navigateur.
      "Content-Type": safe ? mimeType : "application/octet-stream",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${fileName}"; filename*=UTF-8''${encodeURIComponent(document.fileName)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      ...(mimeType.startsWith("image/") ? { "Content-Security-Policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox" } : {}),
    },
  });
}
