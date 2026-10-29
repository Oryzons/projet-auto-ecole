import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getPlanData } from "@/lib/plan";

export const dynamic = "force-dynamic";

/** Données du plan de l'auto-école : une synthèse par zone. */
export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json(await getPlanData(session.user.organizationId));
}
