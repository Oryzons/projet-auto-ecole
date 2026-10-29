import { redirect } from "next/navigation";

import { AuthScene } from "@/components/auth/auth-scene";
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

  return <AuthScene>{children}</AuthScene>;
}
