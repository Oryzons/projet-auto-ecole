import { redirect } from "next/navigation";

import { AuthWindow } from "@/components/auth/auth-window";
import { PlanBackdrop } from "@/components/auth/plan-backdrop";
import { Logo } from "@/components/brand/logo";
import { auth } from "@/lib/auth";
import { homeForRole } from "@/lib/navigation";

const ROOMS = ["Garage", "Accueil", "Salle de code", "Salle d'examen", "Planning", "Comptabilité"];

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (session?.user) {
    redirect(homeForRole(session.user.role));
  }

  return (
    <div className="relative isolate min-h-svh overflow-hidden bg-[radial-gradient(120%_90%_at_60%_40%,#ffffff_0%,#eceff5_75%)]">
      {/* le plan de l'auto-école, tel qu'on le retrouve une fois connecté */}
      <PlanBackdrop className="absolute inset-x-[-30%] top-[10%] -z-10 h-[62%] opacity-40 sm:inset-x-[-10%] lg:inset-y-[6%] lg:right-[1%] lg:left-[36%] lg:h-auto lg:opacity-100" />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-b from-[#f6f7fb]/70 via-[#f6f7fb]/30 to-[#f6f7fb]/80 lg:bg-gradient-to-r lg:from-[#f6f7fb] lg:from-25% lg:via-[#f6f7fb]/40 lg:via-45% lg:to-transparent"
      />

      <div className="flex min-h-svh flex-col p-3 sm:p-4">
        <header className="flex items-center gap-3">
          <Logo />
          <span className="rounded-full border border-border bg-white/95 px-2.5 py-1 text-[12px] font-medium text-muted-foreground shadow-xs max-sm:hidden">
            Gestion de l&apos;auto-école
          </span>
        </header>

        <main className="flex flex-1 items-center justify-center py-8 lg:justify-start lg:pl-[6vw]">
          <div className="w-full max-w-[440px]">
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
      </div>
    </div>
  );
}
