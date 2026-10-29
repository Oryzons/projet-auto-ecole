import { PlanView } from "@/components/plan/plan-view";
import { auth } from "@/lib/auth";
import { getPlanData } from "@/lib/plan";

export const metadata = { title: "Vue d'ensemble" };
export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const session = await auth();
  if (!session) return null;
  // les données arrivent avec la page : le plan s'affiche complet dès l'ouverture
  const initial = await getPlanData(session.user.organizationId);
  return <PlanView initial={initial} />;
}
