"use client";

import { KeyRound, LogIn, type LucideIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const TITLES: Record<string, { label: string; icon: LucideIcon }> = {
  "/login": { label: "Connexion", icon: LogIn },
  "/forgot-password": { label: "Mot de passe oublié", icon: KeyRound },
  "/reset-password": { label: "Nouveau mot de passe", icon: KeyRound },
};

/** Fenêtre des écrans de connexion, dessinée comme les fenêtres ouvertes au-dessus du plan. */
export function AuthWindow({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const title = TITLES[pathname] ?? TITLES["/login"];
  return (
    <section className="w-full overflow-hidden rounded-3xl border border-white/70 bg-background shadow-[0_30px_80px_-30px_rgb(20_32_60/0.55)]">
      <header className="flex h-14 items-center gap-2 border-b border-border/70 bg-card px-4 sm:px-5">
        <title.icon className="size-4 shrink-0 text-primary" />
        <span className="text-sm font-semibold text-foreground">{title.label}</span>
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-2.5 py-1 text-[11px] font-semibold text-primary-strong">
          <span className="size-1.5 rounded-full bg-primary" />
          Espace équipe
        </span>
      </header>
      <div className="bg-card px-5 pt-6 pb-7 sm:px-8 sm:pt-8 sm:pb-9">{children}</div>
    </section>
  );
}
