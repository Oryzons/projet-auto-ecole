import { NextResponse } from "next/server";

import { sendEmail } from "@/lib/email";
import { EMAIL_PREVIEWS, LOGO_CID } from "@/lib/email-templates";
import { getAdminUser } from "@/lib/members";

function findPreview(id: string) {
  return EMAIL_PREVIEWS.find((preview) => preview.id === id) ?? null;
}

/** Aperçu HTML d'un email avec des données d'exemple. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const preview = findPreview((await params).id);
  if (!preview) return NextResponse.json({ error: "Email introuvable" }, { status: 404 });

  // Dans le navigateur, le logo joint (cid:) est servi depuis le site.
  const html = preview.build().html.replaceAll(`cid:${LOGO_CID}`, "/email/logo-white.png");
  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "Content-Security-Policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'",
    },
  });
}

/** Envoie l'email d'exemple à l'administrateur connecté. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const preview = findPreview((await params).id);
  if (!preview) return NextResponse.json({ error: "Email introuvable" }, { status: 404 });

  const message = preview.build();
  const result = await sendEmail({ to: admin.email, ...message, subject: `[Test] ${message.subject}` });
  if (!result) {
    return NextResponse.json(
      { error: "Resend a refusé l'envoi. Vérifiez la clé et le domaine de l'expéditeur." },
      { status: 502 },
    );
  }
  return NextResponse.json({ sent: result.id !== "mock", to: admin.email });
}
