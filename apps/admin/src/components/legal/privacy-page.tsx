import { redirect } from "next/navigation";

import { LegalCenter } from "@/components/legal/legal-center";
import { auth } from "@/lib/auth";
import { DEFAULT_COMPANY_PROFILE } from "@/lib/constants";
import { getOrgSettings } from "@/lib/org";
import { prisma } from "@/lib/prisma";
import { resolveDbUser } from "@/lib/session";

/** Page « Données et mentions légales », commune aux élèves, admins et moniteurs. */
export async function PrivacyPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const user = await resolveDbUser(session);
  if (!user) redirect("/login");

  const [organization, application] = await Promise.all([
    prisma.organization.findUnique({ where: { id: user.organizationId }, select: { name: true, settings: true } }),
    user.role === "CANDIDATE"
      ? prisma.permitApplication.findFirst({
          where: { candidateId: user.id, organizationId: user.organizationId, archivedAt: null },
          orderBy: { createdAt: "desc" },
          select: { id: true },
        })
      : null,
  ]);

  return (
    <LegalCenter
      role={user.role}
      orgName={organization?.name ?? ""}
      company={getOrgSettings(organization?.settings).company ?? DEFAULT_COMPANY_PROFILE}
      applicationId={application?.id ?? null}
    />
  );
}
