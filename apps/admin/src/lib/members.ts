import { Role } from "@/lib/db/client";

import { auth } from "@/lib/auth";
import { resolveDbUser } from "@/lib/session";

export const MEMBER_ROLE_LABELS: Record<"ADMIN" | "SKIPPER", string> = {
  ADMIN: "administrateur",
  SKIPPER: "moniteur",
};

/** Administrateur connecté, relu en base. */
export async function getAdminUser() {
  const session = await auth();
  if (!session?.user) return null;
  const user = await resolveDbUser(session);
  return user?.role === Role.ADMIN ? user : null;
}

