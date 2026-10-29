"use client";

import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { useState, type ReactNode } from "react";

import { EASE_OUT } from "@/components/motion/tokens";
import { TooltipProvider } from "@/components/ui/tooltip";
import { findNavItem, navForRole, type NavConfig } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { MobileNav } from "./mobile-nav";
import { NavigationProgress } from "./navigation-progress";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

/**
 * Sens de la transition : vers la droite quand on avance (onglet suivant ou
 * page de détail), vers la gauche quand on revient, fondu sinon.
 */
function directionBetween(config: NavConfig, from: string, to: string) {
  const items = [...config.primary, ...config.secondary, ...config.extra];
  const a = items.indexOf(findNavItem(config, from)!);
  const b = items.indexOf(findNavItem(config, to)!);
  if (a !== -1 && b !== -1 && a !== b) return Math.sign(b - a);
  const depth = (path: string) => path.split("/").filter(Boolean).length;
  return Math.sign(depth(to) - depth(from));
}

/** Transition entre deux pages. */
function PageTransition({
  config,
  children,
}: {
  config: NavConfig;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const [nav, setNav] = useState({ path: pathname, direction: 0 });
  if (nav.path !== pathname) {
    setNav({
      path: pathname,
      direction: directionBetween(config, nav.path, pathname),
    });
  }
  const offset = reduce ? 0 : nav.direction * 22;

  return (
    <motion.div
      key={pathname}
      className="flex min-h-0 w-full flex-1 flex-col"
      style={{
        display: "flex",
        flexDirection: "column",
        flex: "1 1 auto",
        minHeight: 0,
        width: "100%",
      }}
      initial={{
        opacity: 0,
        x: offset,
        y: reduce || offset ? 0 : 10,
        filter: reduce ? "none" : "blur(2px)",
      }}
      animate={{ opacity: 1, x: 0, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.42, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  );
}

export function AppShell({
  role,
  children,
}: {
  role: "ADMIN" | "CANDIDATE" | "SKIPPER";
  children: ReactNode;
}) {
  const config = navForRole(role);
  const reduce = useReducedMotion();
  const pathname = usePathname();
  const candidate = role === "CANDIDATE";
  const chat = candidate && pathname.startsWith("/messages");
  const profile = candidate && pathname.startsWith("/profile");

  return (
    <TooltipProvider delay={300}>
      <NavigationProgress>
        <div
          className={cn(
            "min-h-svh bg-background",
            chat && "max-lg:h-dvh max-lg:overflow-hidden",
          )}
        >
          <motion.div
            initial={{ opacity: 0, x: reduce ? 0 : -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: EASE_OUT }}
          >
            <Sidebar config={config} />
          </motion.div>
          <div
            className={cn(
              "flex min-h-svh flex-col lg:pl-[264px]",
              chat && "max-lg:h-dvh max-lg:min-h-0",
            )}
          >
            <div className={cn(candidate && "max-lg:hidden")}>
              <Topbar config={config} />
            </div>
            <main
              className={cn(
                "mx-auto w-full max-w-[1400px] flex-1",
                candidate
                  ? chat
                    ? "flex min-h-0 flex-col px-0 pb-[calc(5.35rem+env(safe-area-inset-bottom))] lg:block lg:px-8 lg:pt-8 lg:pb-12"
                    : cn(
                        "px-4 pt-2 pb-[calc(6.25rem+env(safe-area-inset-bottom))] sm:px-6 lg:overflow-visible lg:px-8 lg:pt-8 lg:pb-12 max-lg:overflow-x-clip",
                        profile &&
                          "pb-[max(1.25rem,env(safe-area-inset-bottom))] lg:pb-12",
                      )
                  : "px-4 pt-6 pb-28 sm:px-6 lg:px-8 lg:pt-8 lg:pb-12",
              )}
            >
              <PageTransition config={config}>{children}</PageTransition>
            </main>
          </div>
          {!(candidate && profile) && (
            <MobileNav
              config={config}
              appearance={candidate ? "app" : "default"}
            />
          )}
        </div>
      </NavigationProgress>
    </TooltipProvider>
  );
}
