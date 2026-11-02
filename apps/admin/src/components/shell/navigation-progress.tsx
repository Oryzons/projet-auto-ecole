"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { EASE_OUT } from "@/components/motion/tokens";

/** Chemin vers lequel l'utilisateur navigue, avant que la page ne soit prête. */
const PendingPathContext = createContext<string | null>(null);

/**
 * Chemin à considérer comme actif dans la navigation : la page demandée dès le
 * clic, pour que l'onglet se déplace immédiatement sans attendre le serveur.
 */
export function useNavPath() {
  const pathname = usePathname();
  return useContext(PendingPathContext) ?? pathname;
}

const START_EVENT = "virage:navigation-start";

/** À appeler juste avant un router.push pour afficher la barre de chargement. */
export function signalNavigation(path: string) {
  window.dispatchEvent(new CustomEvent(START_EVENT, { detail: path }));
}

function internalTarget(event: MouseEvent, currentPath: string) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return null;
  const anchor = (event.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
  if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return null;
  const url = new URL(anchor.href, window.location.href);
  if (url.origin !== window.location.origin || url.pathname.startsWith("/api/")) return null;
  if (url.pathname === currentPath) return null;
  return url.pathname;
}

/**
 * Barre de chargement en haut de l'écran pendant les changements de page et
 * déplacement immédiat de l'onglet actif.
 */
export function NavigationProgress({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const [pending, setPending] = useState<{ path: string; from: string } | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = internalTarget(event, window.location.pathname);
      if (target) setPending({ path: target, from: window.location.pathname });
    }
    function onSignal(event: Event) {
      const path = (event as CustomEvent<string>).detail;
      if (path && path !== window.location.pathname) setPending({ path, from: window.location.pathname });
    }
    // Phase de capture : next/link annule l'événement avant qu'il ne remonte au document.
    document.addEventListener("click", onClick, true);
    window.addEventListener(START_EVENT, onSignal);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener(START_EVENT, onSignal);
    };
  }, []);

  // La barre n'apparaît que si la page tarde un peu, pour éviter un flash.
  useEffect(() => {
    if (!pending) return;
    const show = window.setTimeout(() => setVisible(true), 120);
    const giveUp = window.setTimeout(() => setPending(null), 12_000);
    return () => {
      window.clearTimeout(show);
      window.clearTimeout(giveUp);
    };
  }, [pending]);

  // Page affichée (ou navigation annulée) : on termine.
  const done = pending !== null && pathname !== pending.from;
  useEffect(() => {
    if (!done) return;
    const t = window.setTimeout(() => setPending(null), 0);
    return () => window.clearTimeout(t);
  }, [done]);
  useEffect(() => {
    if (pending) return;
    const t = window.setTimeout(() => setVisible(false), 220);
    return () => window.clearTimeout(t);
  }, [pending]);

  return (
    <PendingPathContext.Provider value={pending && !done ? pending.path : null}>
      <AnimatePresence>
        {visible && (
          <motion.div
            key="route-progress"
            aria-hidden
            className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px]"
            exit={{ opacity: 0, transition: { duration: 0.35, delay: 0.15 } }}
          >
            <motion.div
              className="h-full origin-left rounded-r-full bg-gradient-to-r from-primary/70 via-primary to-sky-400 shadow-[0_0_10px_var(--color-primary)]"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: pending ? 0.85 : 1 }}
              transition={pending ? { duration: reduce ? 0 : 6, ease: [0.1, 0.7, 0.2, 1] } : { duration: 0.2, ease: EASE_OUT }}
            />
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </PendingPathContext.Provider>
  );
}
