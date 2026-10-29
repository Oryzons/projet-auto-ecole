import { NextResponse } from "next/server";
import { z } from "zod";

import { sendPasswordResetEmail } from "@/lib/email";
import { getCurrentOrganization } from "@/lib/org";
import { createPasswordToken, passwordLink } from "@/lib/password-tokens";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { requestOrigin } from "@/lib/request-origin";
import { findUserByEmail } from "@/lib/users";

const schema = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
});

export async function POST(req: Request) {
  const limit = rateLimit(`forgot:${clientIp(req.headers)}`, {
    limit: 5,
    windowMs: 15 * 60_000,
  });
  if (!limit.ok) return tooManyRequests(limit.retryAfterSeconds);

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Email invalide" }, { status: 400 });
  }

  const org = await getCurrentOrganization();
  const user = await findUserByEmail(org.id, parsed.data.email);

  // Même réponse que le compte existe ou non : on ne révèle pas les emails inscrits.
  if (user && rateLimit(`forgot:account:${user.id}`, { limit: 3, windowMs: 60 * 60_000 }).ok) {
    const token = await createPasswordToken(user.id, "RESET");
    // Envoi non attendu : le temps de réponse ne révèle pas si le compte existe.
    void sendPasswordResetEmail(
      user.email,
      `${user.firstName} ${user.lastName}`,
      // En production, jamais l'en-tête Host (falsifiable) : APP_URL ou NEXTAUTH_URL.
      passwordLink(token, "RESET", process.env.NODE_ENV === "production" ? undefined : requestOrigin(req)),
    ).catch((error) => console.error("Reset email failed:", error));
  }

  return NextResponse.json({ success: true });
}
