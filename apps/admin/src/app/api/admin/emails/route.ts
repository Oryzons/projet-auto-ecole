import { NextResponse } from "next/server";

import { emailStatus } from "@/lib/email";
import { EMAIL_PREVIEWS } from "@/lib/email-templates";
import { getAdminUser } from "@/lib/members";

/** Liste des emails envoyés par Virage, pour l'aperçu dans Paramètres. */
export async function GET() {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  return NextResponse.json({
    status: { ...emailStatus(), testRecipient: admin.email },
    templates: EMAIL_PREVIEWS.map(({ id, label, audience, build }) => ({
      id,
      label,
      audience,
      subject: build().subject,
    })),
  });
}
