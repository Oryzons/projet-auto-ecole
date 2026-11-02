"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

import { DOCUMENT_LABELS } from "@/lib/constants";
import {
  applyIncomingMessageToConversations,
  getActiveMessagingThread,
  refetchMessagingQueries,
} from "@/lib/messaging-sync";
import { formatCurrency } from "@/lib/utils";

export type LiveNotificationTone = "info" | "success" | "warning" | "danger";

export type LiveNotification = {
  id: string;
  tone: LiveNotificationTone;
  kind: "message" | "document" | "payment" | "application" | "session";
  title: string;
  description?: string;
  href?: string;
  createdAt: number;
  read: boolean;
};

type LiveEvent = {
  type: string;
  data?: Record<string, unknown>;
};

type LiveContextValue = {
  notifications: LiveNotification[];
  unreadCount: number;
  markRead: (id: string) => void;
  dismiss: (id: string) => void;
  markAllRead: () => void;
  clear: () => void;
  /** Remet des notifications supprimées (bouton « Annuler »). */
  restore: (items: LiveNotification[]) => void;
};

const LiveContext = createContext<LiveContextValue>({
  notifications: [],
  unreadCount: 0,
  markRead: () => {},
  dismiss: () => {},
  markAllRead: () => {},
  clear: () => {},
  restore: () => {},
});

const MAX_NOTIFICATIONS = 30;

function storageKey(userId: string) {
  return `virage:notifications:${userId}`;
}

function readStored(userId: string): LiveNotification[] {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, MAX_NOTIFICATIONS) : [];
  } catch {
    return [];
  }
}

function writeStored(userId: string, notifications: LiveNotification[]) {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(notifications));
  } catch {
    // Stockage indisponible (navigation privée) : les notifications restent en mémoire.
  }
}

function str(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

/** Traduit un évènement temps réel en notification lisible, selon le rôle. */
function describe(
  event: LiveEvent,
  role: "ADMIN" | "CANDIDATE" | "SKIPPER",
  userId: string,
): Omit<LiveNotification, "id" | "createdAt" | "read"> | null {
  const data = event.data ?? {};
  const applicationId = str(data.applicationId);

  switch (event.type) {
    case "message": {
      if (data.senderId === userId) return null;
      const sender = str(data.senderName);
      return {
        kind: "message",
        tone: "info",
        title: sender ? `Message de ${sender}` : "Nouveau message",
        description: str(data.preview),
        href:
          role === "ADMIN" && applicationId
            ? `/admin/messages?application=${applicationId}`
            : "/messages",
      };
    }
    case "document": {
      const label =
        str(data.documentLabel) ??
        (str(data.documentType)
          ? DOCUMENT_LABELS[data.documentType as keyof typeof DOCUMENT_LABELS]
          : undefined) ??
        "Document";
      if (role === "ADMIN") {
        if (data.action !== "uploaded" || data.source !== "candidate") return null;
        return {
          kind: "document",
          tone: "info",
          title: "Nouveau document à vérifier",
          description: `${label}${str(data.candidateName) ? ` · ${data.candidateName}` : ""}`,
          href: applicationId ? `/admin/applications/${applicationId}` : undefined,
        };
      }
      if (data.action === "approve") {
        return { kind: "document", tone: "success", title: "Document validé", description: label, href: "/documents" };
      }
      if (data.action === "reject") {
        return {
          kind: "document",
          tone: "danger",
          title: "Document à renvoyer",
          description: str(data.reason) ? `${label} : ${data.reason}` : label,
          href: "/documents",
        };
      }
      return null;
    }
    case "payment": {
      if (role !== "ADMIN") return null;
      const amount = typeof data.amount === "number" ? formatCurrency(data.amount) : "";
      const name = str(data.candidateName) ?? "Un élève";
      if (data.pending) {
        return {
          kind: "payment",
          tone: "info",
          title: "Virement annoncé",
          description: `${name} · ${amount}, à confirmer à réception`,
          href: "/admin/finances",
        };
      }
      if (data.duplicate) {
        return {
          kind: "payment",
          tone: "danger",
          title: "Paiement en double",
          description: `${name} · ${amount} à rembourser`,
          href: "/admin/finances",
        };
      }
      return {
        kind: "payment",
        tone: "success",
        title: "Paiement reçu",
        description: `${name} · ${amount}`,
        href: applicationId ? `/admin/applications/${applicationId}` : "/admin/finances",
      };
    }
    case "session": {
      const when = str(data.when) ?? "";
      if (role === "CANDIDATE") {
        if (data.kind === "created") {
          return { kind: "session", tone: "info", title: "Nouveà la séance de code", description: `${when} · inscriptions ouvertes`, href: "/calendar" };
        }
        if (data.kind === "cancelled") {
          return { kind: "session", tone: "danger", title: "Séance de code annulé", description: when, href: "/calendar" };
        }
        if (data.kind === "updated") {
          return { kind: "session", tone: "info", title: "Séance de code modifié", description: when, href: "/calendar" };
        }
        return null;
      }
      if (data.kind === "registered") {
        return { kind: "session", tone: "info", title: "Nouvelle inscription", description: `${str(data.candidateName) ?? "Un élève"} s'est inscrit à un cours`, href: "/admin/calendar" };
      }
      return null;
    }
    case "application": {
      if (role === "CANDIDATE" && data.status === "COMPLETED") {
        return { kind: "application", tone: "success", title: "Dossier finalisé", description: "Votre dossier a été traité.", href: "/dashboard" };
      }
      if (role === "CANDIDATE" && data.status === "PAID") {
        return { kind: "application", tone: "success", title: "Paiement confirmé", description: "Votre facture est disponible.", href: "/payment" };
      }
      return null;
    }
    default:
      return null;
  }
}

function showToast(notification: Omit<LiveNotification, "id" | "createdAt" | "read">, onOpen?: () => void) {
  const options = {
    description: notification.description,
    action: onOpen ? { label: "Ouvrir", onClick: onOpen } : undefined,
  };
  switch (notification.tone) {
    case "success":
      toast.success(notification.title, options);
      break;
    case "danger":
      toast.error(notification.title, options);
      break;
    case "warning":
      toast.warning(notification.title, options);
      break;
    default:
      toast.info(notification.title, options);
  }
}

/**
 * Un seul flux SSE par onglet : met à jour les données affichées
 * et alimente le centre de notifications.
 */
export function LiveEventsProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const user = session?.user;
  const userId = user?.id;
  const role = user?.role;

  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [notifications, setNotifications] = useState<LiveNotification[]>([]);
  const pathnameRef = useRef(pathname);
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!userId) return;
    // Lecture différée : localStorage n'existe pas au rendu serveur.
    const stored = readStored(userId);
    const frame = requestAnimationFrame(() => setNotifications(stored));
    return () => cancelAnimationFrame(frame);
  }, [userId]);

  const update = useCallback(
    (updater: (current: LiveNotification[]) => LiveNotification[]) => {
      setNotifications((current) => {
        const next = updater(current).slice(0, MAX_NOTIFICATIONS);
        if (userId) writeStored(userId, next);
        return next;
      });
    },
    [userId],
  );

  useEffect(() => {
    if (!userId || !role) return;
    let cancelled = false;
    let source: EventSource | null = null;
    let retry: ReturnType<typeof setTimeout> | null = null;
    let attempts = 0;

    const scheduleRefresh = () => {
      // Les pages élève sont rendues côté serveur : on les rafraîchit.
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      refreshTimer.current = setTimeout(() => router.refresh(), 250);
    };

    const handle = (event: LiveEvent) => {
      const data = event.data ?? {};
      const applicationId = str(data.applicationId);

      if (event.type === "message") {
        const onMessages = pathnameRef.current.includes("/messages");
        const viewingThread = onMessages && applicationId === getActiveMessagingThread();
        if (applicationId && str(data.preview) && data.senderId !== userId) {
          applyIncomingMessageToConversations(
            queryClient,
            { applicationId, preview: str(data.preview)!, senderName: str(data.senderName) },
            { incrementUnread: !viewingThread },
          );
        }
        void refetchMessagingQueries(queryClient, applicationId);
        if (pathnameRef.current.startsWith("/admin/dashboard")) scheduleRefresh();
        if (onMessages) return;
      } else if (event.type === "session") {
        void queryClient.invalidateQueries({ queryKey: ["sessions"] });
      } else {
        void queryClient.invalidateQueries({ queryKey: ["applications"] });
        void queryClient.invalidateQueries({ queryKey: ["application"] });
        void queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
        void queryClient.invalidateQueries({ queryKey: ["finances"] });
        void queryClient.invalidateQueries({ queryKey: ["conversations"] });
        if (role === "CANDIDATE" || pathnameRef.current.startsWith("/admin/dashboard")) scheduleRefresh();
      }

      const notification = describe(event, role, userId);
      if (!notification) return;

      update((current) => [
        {
          ...notification,
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          createdAt: Date.now(),
          read: false,
        },
        ...current,
      ]);
      showToast(
        notification,
        notification.href ? () => router.push(notification.href!) : undefined,
      );
    };

    const connect = () => {
      if (cancelled) return;
      source = new EventSource("/api/sse/inbox");
      source.onopen = () => {
        attempts = 0;
      };
      source.onmessage = (message) => {
        try {
          const event = JSON.parse(message.data) as LiveEvent;
          if (event.type === "heartbeat" || event.type === "connected") return;
          handle(event);
        } catch {
          // message illisible : ignoré
        }
      };
      source.onerror = () => {
        source?.close();
        source = null;
        if (cancelled) return;
        attempts += 1;
        retry = setTimeout(connect, Math.min(30_000, 2_000 * 2 ** Math.min(attempts, 4)));
      };
    };

    connect();

    return () => {
      cancelled = true;
      if (retry) clearTimeout(retry);
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      source?.close();
    };
  }, [userId, role, queryClient, router, update]);

  const markRead = useCallback(
    (id: string) => update((current) => current.map((n) => (n.id === id ? { ...n, read: true } : n))),
    [update],
  );
  const dismiss = useCallback(
    (id: string) => update((current) => current.filter((n) => n.id !== id)),
    [update],
  );
  const markAllRead = useCallback(
    () => update((current) => current.map((n) => (n.read ? n : { ...n, read: true }))),
    [update],
  );
  const clear = useCallback(() => update(() => []), [update]);
  const restore = useCallback(
    (items: LiveNotification[]) =>
      update((current) => {
        const ids = new Set(current.map((n) => n.id));
        return [...current, ...items.filter((n) => !ids.has(n.id))]
          .sort((a, b) => b.createdAt - a.createdAt)
          .slice(0, MAX_NOTIFICATIONS);
      }),
    [update],
  );

  const value = useMemo(
    () => ({
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
      markRead,
      dismiss,
      markAllRead,
      clear,
      restore,
    }),
    [notifications, markRead, dismiss, markAllRead, clear, restore],
  );

  return <LiveContext.Provider value={value}>{children}</LiveContext.Provider>;
}

export function useLiveNotifications() {
  return useContext(LiveContext);
}
