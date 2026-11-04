import { redirect } from "next/navigation";

import { AppShell } from "@/components/shell/app-shell";
import { ImmersiveShell } from "@/components/shell/immersive-shell";
import { auth } from "@/lib/auth";
import { getPlanData } from "@/lib/plan";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN" && session.user.role !== "SKIPPER") redirect("/dashboard");

  // le moniteur garde la navigation classique ; l'administration travaille depuis le plan
  if (session.user.role === "SKIPPER") return <AppShell role={session.user.role}>{children}</AppShell>;
  const initialPlan = await getPlanData(session.user.organizationId);
  return <ImmersiveShell initialPlan={initialPlan}>{children}</ImmersiveShell>;
}
