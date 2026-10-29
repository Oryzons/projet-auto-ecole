import { redirect } from "next/navigation";

import { Logo } from "@/components/brand/logo";
import { OceanPanel } from "@/components/auth/ocean-panel";
import { auth } from "@/lib/auth";
import { homeForRole } from "@/lib/navigation";

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
    <div className="grid min-h-svh bg-card lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <div className="hidden p-3 lg:block">
        <div className="sticky top-3 h-[calc(100svh-1.5rem)] overflow-hidden rounded-[24px]">
          <OceanPanel />
        </div>
      </div>
      <div className="flex min-h-svh flex-col px-5 py-6 sm:px-10">
        <div className="lg:hidden">
          <Logo />
        </div>
        <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center py-10">
          {children}
        </div>
        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Virage · Gestion des dossiers de permis de conduire
        </p>
      </div>
    </div>
  );
}
