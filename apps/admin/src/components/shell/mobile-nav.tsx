"use client";

import Link from "next/link";
import { motion } from "motion/react";

import { SPRING } from "@/components/motion/tokens";
import { useUnreadMessages } from "@/hooks/use-unread-messages";
import { isActivePath, type NavConfig } from "@/lib/navigation";
import { cn } from "@/lib/utils";

import { useNavPath } from "./navigation-progress";

/** Barre d'onglets en bas d'écran (mobile). `app` : barre de l'élève, plus proche d'une application. */
export function MobileNav({
  config,
  appearance = "default",
}: {
  config: NavConfig;
  appearance?: "default" | "app";
}) {
  const pathname = useNavPath();
  const { data: unread = 0 } = useUnreadMessages();

  const app = appearance === "app";

  return (
    <nav
      aria-label="Navigation"
      className={cn(
        "fixed z-40 lg:hidden",
        app
          ? "inset-x-3 bottom-[max(0.7rem,env(safe-area-inset-bottom))]"
          : "inset-x-0 bottom-0 border-t border-border bg-card/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl",
      )}
    >
      <ul
        className={cn(
          "mx-auto grid max-w-lg",
          app &&
            "rounded-[1.7rem] bg-card/95 p-1.5 shadow-[0_16px_40px_-22px_rgba(10,77,104,0.55)] ring-1 ring-black/[0.06] backdrop-blur-xl",
        )}
        style={{ gridTemplateColumns: `repeat(${config.primary.length}, minmax(0, 1fr))` }}
      >
        {config.primary.map((item) => {
          const active = isActivePath(pathname, item.href);
          const Icon = item.icon;
          const count = item.badge === "unread" ? unread : 0;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex flex-col items-center justify-center font-medium transition-colors active:opacity-80",
                  app ? "h-12 gap-0.5 rounded-[1.3rem] text-[10px] tracking-[-0.01em]" : "h-16 gap-1 text-[11px]",
                  active ? (app ? "text-white" : "text-primary") : "text-muted-foreground",
                )}
              >
                {active && app && (
                  <motion.span
                    layoutId="candidate-tab-bubble"
                    className="absolute inset-0 rounded-[1.3rem] bg-primary"
                    transition={SPRING}
                  />
                )}
                {active && !app && (
                  <motion.span
                    layoutId="mobile-nav-active"
                    className="absolute top-0 h-[3px] w-10 rounded-b-full bg-primary"
                    transition={SPRING}
                  />
                )}
                <span className="relative z-10">
                  <motion.span
                    className="grid place-items-center"
                    animate={app ? undefined : { y: active ? -1 : 0, scale: active ? 1.08 : 1 }}
                    transition={SPRING}
                  >
                    <Icon className={app ? "size-[18px]" : "size-[22px]"} strokeWidth={active ? 2.25 : 1.8} />
                  </motion.span>
                  {count > 0 && (
                    <span
                      className={cn(
                        "absolute -top-1 -right-2 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px] font-semibold text-white ring-2",
                        active && app ? "bg-white text-primary ring-primary" : "bg-primary ring-card",
                      )}
                    >
                      {count > 9 ? "9+" : count}
                    </span>
                  )}
                </span>
                <span className="relative z-10">{item.shortLabel ?? item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
