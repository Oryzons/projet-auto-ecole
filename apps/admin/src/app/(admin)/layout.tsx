import { redirect } from "next/navigation";

import { AppShell } from "@/components/shell/app-shell";
import { auth } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN" && session.user.role !== "SKIPPER") redirect("/dashboard");

  return <AppShell role={session.user.role}>{children}</AppShell>;
}
