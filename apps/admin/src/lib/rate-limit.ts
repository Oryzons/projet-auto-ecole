/**
 * Limiteur de débit en mémoire (fenêtre glissante simple).
 * Suffisant pour une seule instance Node ; à remplacer par Redis si
 * l'application tourne un jour sur plusieurs instances.
 */
type Bucket = { count: number; resetAt: number };

const globalForLimiter = globalThis as unknown as {
  rateLimitBuckets?: Map<string, Bucket>;
};
const buckets = globalForLimiter.rateLimitBuckets ?? new Map<string, Bucket>();
globalForLimiter.rateLimitBuckets = buckets;

let lastSweep = Date.now();

function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export type RateLimitResult = { ok: boolean; retryAfterSeconds: number };

export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSeconds: 0 };
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    return {
      ok: false,
      retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }
  return { ok: true, retryAfterSeconds: 0 };
}

export function resetRateLimit(key: string) {
  buckets.delete(key);
}

/**
 * Adresse IP du client, telle que vue par notre reverse proxy.
 * nginx écrase `X-Real-IP` avec l'adresse réelle : on la lit en premier.
 * Dans `X-Forwarded-For`, seule la dernière entrée vient du proxy ; les
 * premières sont fournies par le client et peuvent être inventées.
 */
export function clientIp(headers: Headers): string {
  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",").at(-1)!.trim() || "unknown";
  return "unknown";
}

export function tooManyRequests(retryAfterSeconds: number) {
  return Response.json(
    { error: "Trop de tentatives. Réessaie dans quelques minutes." },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
  );
}
