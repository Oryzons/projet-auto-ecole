"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, Move, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

import { EASE_OUT } from "@/components/motion/tokens";
import { useDraggable } from "@/hooks/use-draggable";
import { adminNav, findNavItem } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export const PLAN_PATH = "/admin/dashboard";

/** Largeur réservée à droite quand une page ouvre un panneau latéral (fiche véhicule…). */
const SplitContext = createContext<(open: boolean) => void>(() => {});

/**
 * Une page qui ouvre un panneau à droite appelle ce hook : la fenêtre glisse vers la gauche
 * pour laisser la place au panneau, et reste visible et cliquable à côté de lui.
 */
export function usePageSplit(open: boolean) {
  const setSplit = useContext(SplitContext);
  useEffect(() => {
    setSplit(open);
    return () => setSplit(false);
  }, [open, setSplit]);
}

/**
 * Toutes les pages de l'administration s'ouvrent dans cette fenêtre, au-dessus du plan.
 * L'adresse change comme avant : un lien partagé ou un rechargement rouvre la même fenêtre.
 */
export function PagePopup({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const reduce = useReducedMotion();
  const scrollRef = useRef<HTMLDivElement>(null);
  const open = pathname !== PLAN_PATH && pathname !== "/admin";
  const item = findNavItem(adminNav, pathname);
  // fiche d'un élève, d'une séance… : un cran sous la page de la rubrique
  const nested = Boolean(item && pathname !== item.href);
  const drag = useDraggable<HTMLDivElement>(open);
  const [split, setSplit] = useState(false);

  const close = () => router.push(PLAN_PATH, { scroll: false });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      // une boîte de dialogue ouverte dans la page se ferme d'abord
      if (
        event.key === "Escape" &&
        document.querySelectorAll("[role=dialog]").length <= 1
      )
        close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <SplitContext.Provider value={setSplit}>
    <AnimatePresence>
      {open && (
        <div data-page-popup className="fixed inset-0 z-40 flex items-stretch justify-center md:p-[3vh]">
          <motion.div
            key="backdrop"
            aria-hidden
            className="absolute inset-0 bg-ink/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={close}
          />
          <div
            ref={drag.ref}
            style={drag.style}
            data-split={split || undefined}
            className={cn(
              "relative flex w-full max-w-[1240px] transition-[margin] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
              // place laissée au panneau latéral (540 px + marges), sur grand écran seulement
              split && "md:mr-[calc(min(540px,45vw)+24px-3vh)]",
            )}
          >
            <motion.section
              key="popup"
              role="dialog"
              aria-modal="true"
              aria-label={item?.label ?? "Fenêtre"}
              initial={{
                opacity: 0,
                y: reduce ? 0 : 18,
                scale: reduce ? 1 : 0.985,
              }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{
                opacity: 0,
                y: reduce ? 0 : 12,
                scale: reduce ? 1 : 0.985,
              }}
              transition={{ duration: 0.24, ease: EASE_OUT }}
              className="relative flex w-full flex-col overflow-hidden bg-background shadow-[0_30px_80px_-30px_rgb(20_32_60/0.55)] md:rounded-3xl md:border md:border-white/70"
            >
              <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border/70 bg-card px-3 sm:px-4">
                {nested && (
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl px-2.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    <ArrowLeft className="size-4" /> Retour
                  </button>
                )}
                {item && (
                  <span className="flex min-w-0 items-center gap-2 px-1 text-sm font-semibold text-foreground">
                    <item.icon className="size-4 shrink-0 text-primary" />
                    <span className="truncate">{item.label}</span>
                  </span>
                )}
                <button
                  type="button"
                  {...drag.handleProps}
                  className="ml-auto grid size-9 cursor-grab touch-none place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground active:cursor-grabbing max-md:hidden"
                >
                  <Move className="size-[18px]" />
                </button>
                <button
                  type="button"
                  onClick={close}
                  aria-label="Fermer et revenir au plan"
                  className="inline-flex max-md:ml-auto h-9 items-center gap-1.5 rounded-xl px-2.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none"
                >
                  <span className="max-sm:hidden">Revenir au plan</span>
                  <X className="size-[18px]" />
                </button>
              </header>
              <div
                ref={scrollRef}
                className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
              >
                <motion.div
                  key={pathname}
                  initial={{ opacity: 0, y: reduce ? 0 : 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, ease: EASE_OUT }}
                  className="px-4 pt-5 pb-10 sm:px-6 lg:px-8 lg:pt-7"
                >
                  {children}
                </motion.div>
              </div>
            </motion.section>
          </div>
        </div>
      )}
    </AnimatePresence>
    </SplitContext.Provider>
  );
}
