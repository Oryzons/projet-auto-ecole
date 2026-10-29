"use client";

import { motion, useAnimationControls, useReducedMotion } from "motion/react";
import { createContext, useCallback, useContext, useRef, type ReactNode } from "react";

import { Logo } from "@/components/brand/logo";
import { EASE_OUT } from "@/components/motion/tokens";
import { sceneBounds } from "@/components/plan/scene";
import { INTRO_FLAG } from "@/lib/intro";

import { AuthWindow } from "./auth-window";
import { PlanBackdrop } from "./plan-backdrop";


const AuthExit = createContext<(options?: { zoom?: boolean }) => Promise<void>>(async () => {});
/** Lance la sortie de l'écran de connexion : la fenêtre s'efface et la caméra plonge sur le plan. */
export const useAuthExit = () => useContext(AuthExit);

const B = sceneBounds();
const ROOMS = ["Garage", "Accueil", "Salle de code", "Salle d'examen", "Planning", "Comptabilité"];

export function AuthScene({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  const planRef = useRef<HTMLDivElement>(null);
  const plan = useAnimationControls();
  const chrome = useAnimationControls();

  const leave = useCallback(async ({ zoom = true }: { zoom?: boolean } = {}) => {
    const el = planRef.current;
    if (!el || reduce || !zoom) {
      await chrome.start({ opacity: 0, transition: { duration: 0.2 } });
      return;
    }
    // le plan prend exactement la place qu'il aura sur la vue d'ensemble (mêmes marges que PlanView)
    try {
      sessionStorage.setItem(INTRO_FLAG, "1");
    } catch {}
    const box = el.getBoundingClientRect();
    const w = window.innerWidth;
    const h = window.innerHeight;
    const desktop = w >= 768;
    const top = desktop ? 112 : 96;
    const bottom = desktop ? 64 : 60;
    const from = Math.min(box.width / B.w, box.height / B.h);
    const to = Math.min(w / B.w, Math.max(h - top - bottom, 120) / B.h) * (desktop ? 1 : 1.45);
    const dx = w / 2 - (box.left + box.width / 2);
    const dy = top + (h - top - bottom) / 2 - (box.top + box.height / 2);
    await Promise.all([
      chrome.start({ opacity: 0, y: -8, transition: { duration: 0.3, ease: EASE_OUT } }),
      plan.start({ x: dx, y: dy, scale: to / from, opacity: 1, transition: { duration: 1.5, ease: [0.65, 0, 0.35, 1] } }),
    ]);
  }, [chrome, plan, reduce]);

  return (
    <AuthExit.Provider value={leave}>
      <div className="relative isolate min-h-svh overflow-hidden bg-[radial-gradient(120%_90%_at_50%_35%,#ffffff_0%,#eceff5_75%)]">
        {/* le plan de l'auto-école, vu de loin : on plonge dessus à la connexion */}
        <motion.div
          ref={planRef}
          animate={plan}
          className="absolute inset-x-[6%] bottom-[7%] -z-10 h-[24%] opacity-70 lg:inset-y-[24%] lg:right-[9%] lg:left-[50%] lg:h-auto lg:opacity-100"
        >
          <PlanBackdrop className="size-full" />
        </motion.div>
        <motion.div
          aria-hidden
          animate={chrome}
          className="absolute inset-0 -z-10 bg-gradient-to-b from-[#f6f7fb]/50 to-transparent lg:bg-gradient-to-r lg:from-[#f6f7fb] lg:from-25% lg:via-[#f6f7fb]/40 lg:via-45% lg:to-transparent"
        />

        <motion.div animate={chrome} className="flex min-h-svh flex-col p-3 sm:p-4">
          <header className="flex items-center gap-3">
            <Logo animated />
            <span className="rounded-full border border-border bg-white/95 px-2.5 py-1 text-[12px] font-medium text-muted-foreground shadow-xs max-sm:hidden">
              Gestion de l&apos;auto-école
            </span>
          </header>

          <main className="flex flex-1 items-center justify-center py-8 lg:justify-start lg:pl-[7vw]">
            <div className="w-full max-w-[420px]">
              <AuthWindow>{children}</AuthWindow>
            </div>
          </main>

          <footer className="flex flex-wrap items-end justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Virage · Gestion des dossiers de permis de conduire
            </p>
            <ul className="flex flex-wrap gap-1.5 max-lg:hidden">
              {ROOMS.map((room) => (
                <li
                  key={room}
                  className="rounded-full border border-border bg-white/95 px-2.5 py-1 text-[11.5px] font-medium text-foreground shadow-xs"
                >
                  {room}
                </li>
              ))}
            </ul>
          </footer>
        </motion.div>
      </div>
    </AuthExit.Provider>
  );
}
