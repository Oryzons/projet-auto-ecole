export type SSEEvent = {
  type: "payment" | "document" | "message" | "application" | "session";
  data: Record<string, unknown>;
};

type Listener = (event: SSEEvent) => void;

class SSEBroker {
  private listeners = new Map<string, Set<Listener>>();

  subscribe(channel: string, listener: Listener): () => void {
    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, new Set());
    }
    this.listeners.get(channel)!.add(listener);
    return () => {
      const set = this.listeners.get(channel);
      set?.delete(listener);
      if (set && set.size === 0) this.listeners.delete(channel);
    };
  }

  publish(channel: string, event: SSEEvent): void {
    this.listeners.get(channel)?.forEach((listener) => listener(event));
  }
}

// Survit au rechargement à chaud en dev (sinon les abonnés et les éditeurs
// se retrouvent sur deux instances différentes).
const globalForBroker = globalThis as unknown as { sseBroker?: SSEBroker };
export const sseBroker = globalForBroker.sseBroker ?? new SSEBroker();
if (process.env.NODE_ENV !== "production") globalForBroker.sseBroker = sseBroker;

/** Canal réservé aux administrateurs d'une organisation. */
export function adminChannel(organizationId: string) {
  return `org:${organizationId}:admins`;
}

/** Canal personnel d'un utilisateur (élève ou admin). */
export function userChannel(userId: string) {
  return `user:${userId}`;
}

export function publishToAdmins(organizationId: string, event: SSEEvent) {
  sseBroker.publish(adminChannel(organizationId), event);
}

export function publishToUser(userId: string, event: SSEEvent) {
  sseBroker.publish(userChannel(userId), event);
}

/** Flux ouverts par utilisateur : borne le nombre d'onglets/connexions simultanées. */
const MAX_STREAMS_PER_USER = 6;
/** Durée maximale d'un flux : le navigateur se reconnecte tout seul ensuite. */
const MAX_STREAM_MS = 60 * 60_000;
const globalForStreams = globalThis as unknown as { sseOpenStreams?: Map<string, number> };
const openStreams = globalForStreams.sseOpenStreams ?? new Map<string, number>();
globalForStreams.sseOpenStreams = openStreams;

/**
 * Flux Server-Sent Events abonné aux canaux donnés, avec heartbeat.
 * `stillAllowed` est réévalué à chaque heartbeat : un compte supprimé ou
 * rétrogradé perd le flux au plus tard 30 secondes après.
 */
export function createSSEResponse(
  req: Request,
  channels: string[],
  { userId, stillAllowed }: { userId: string; stillAllowed: () => Promise<boolean> },
) {
  const current = openStreams.get(userId) ?? 0;
  if (current >= MAX_STREAMS_PER_USER) {
    return new Response("Trop de connexions ouvertes", { status: 429, headers: { "Retry-After": "30" } });
  }
  openStreams.set(userId, current + 1);

  let cleanup: (() => void) | undefined;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      let closed = false;
      const unsubscribers: (() => void)[] = [];
      const timers: { heartbeat?: ReturnType<typeof setInterval>; lifetime?: ReturnType<typeof setTimeout> } = {};

      function teardown() {
        if (closed) return;
        closed = true;
        const remaining = (openStreams.get(userId) ?? 1) - 1;
        if (remaining > 0) openStreams.set(userId, remaining);
        else openStreams.delete(userId);
        if (timers.heartbeat) clearInterval(timers.heartbeat);
        if (timers.lifetime) clearTimeout(timers.lifetime);
        unsubscribers.forEach((unsubscribe) => unsubscribe());
        try {
          controller.close();
        } catch {
          // déjà fermé par le client
        }
      }

      function send(data: object) {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          teardown();
        }
      }

      cleanup = teardown;
      send({ type: "connected" });

      for (const channel of channels) {
        unsubscribers.push(sseBroker.subscribe(channel, send));
      }

      timers.heartbeat = setInterval(() => {
        void stillAllowed()
          .then((allowed) => (allowed ? send({ type: "heartbeat" }) : teardown()))
          .catch(() => send({ type: "heartbeat" }));
      }, 30_000);
      timers.lifetime = setTimeout(teardown, MAX_STREAM_MS);
      req.signal.addEventListener("abort", teardown, { once: true });
    },
    cancel() {
      cleanup?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
