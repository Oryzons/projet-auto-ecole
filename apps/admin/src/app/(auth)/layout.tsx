import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AuthScene } from "@/components/auth/auth-scene";
import { auth } from "@/lib/auth";
import { OUTRO_COOKIE } from "@/lib/intro";
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

  const outro = (await cookies()).get(OUTRO_COOKIE)?.value === "1";
  return <AuthScene outro={outro}>{children}</AuthScene>;
}
