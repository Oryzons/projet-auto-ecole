/**
 * Adresse du site telle que le navigateur l'a utilisée (ex. http://192.168.1.21:3000).
 * Sert aux liens de retour (Stripe) : on revient sur l'appareil et l'adresse d'où
 * le paiement est parti, même si NEXTAUTH_URL vaut localhost.
 */
export function requestOrigin(req: Request): string {
  const fallback = (process.env.APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/$/, "");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!host || !/^[a-z0-9.\-:[\]]+$/i.test(host)) return fallback;
  const forwardedProto = req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const proto = forwardedProto === "https" || forwardedProto === "http" ? forwardedProto : new URL(req.url).protocol.replace(":", "");
  return `${proto}://${host}`;
}
