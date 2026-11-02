"use client";

import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import type { NavConfig } from "@/lib/navigation";

async function getJson(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Chargement impossible");
  return res.json();
}

/**
 * Données des pages principales, avec les mêmes clés et la même forme que
 * les useQuery des pages : ouvrir la page affiche directement le cache.
 */
const PAGE_DATA: Record<string, (client: QueryClient) => Promise<unknown>> = {
  "/admin/applications": (client) => client.prefetchQuery({ queryKey: ["applications", "all"], queryFn: () => getJson("/api/applications") }),
  "/admin/calendar": (client) =>
    client.prefetchQuery({ queryKey: ["sessions", "staff"], queryFn: async () => (await getJson("/api/sessions")).sessions }),
  "/admin/finances": (client) => client.prefetchQuery({ queryKey: ["finances"], queryFn: () => getJson("/api/finances") }),
  "/admin/vehicles": (client) => client.prefetchQuery({ queryKey: ["vehicles"], queryFn: () => getJson("/api/vehicles") }),
  "/admin/messages": (client) => client.prefetchQuery({ queryKey: ["conversations"], queryFn: () => getJson("/api/messages/conversations") }),
};

/** Lance une tâche quand le navigateur est libre, pour ne pas ralentir la page affichée. */
function whenIdle(task: () => void) {
  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(task, { timeout: 1500 });
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(task, 300);
  return () => window.clearTimeout(id);
}

/**
 * Prépare en arrière-plan toutes les pages du menu (code, rendu serveur et
 * données) juste après l'ouverture de l'espace : changer de page devient
 * immédiat, sans squelette de chargement.
 */
export function RouteWarmup({ config }: { config: NavConfig }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    const hrefs = [...config.primary, ...config.secondary, ...config.extra].map((item) => item.href);
    let cancelled = false;

    const cancelIdle = whenIdle(async () => {
      for (const href of hrefs) {
        if (cancelled) return;
        router.prefetch(href);
        // en développement, Next compile chaque page à sa première visite :
        // on la demande une fois ici pour que le clic soit instantané
        if (process.env.NODE_ENV === "development") await fetch(href).catch(() => undefined);
        await PAGE_DATA[href]?.(queryClient).catch(() => undefined);
      }
    });

    return () => {
      cancelled = true;
      cancelIdle();
    };
  }, [config, router, queryClient]);

  return null;
}

/** Précharge les données d'une page au survol de son lien. */
export function prefetchPageData(client: QueryClient, href: string) {
  void PAGE_DATA[href]?.(client).catch(() => undefined);
}
