import { NextResponse } from "next/server";

import { lessonInputSchema } from "@/lib/lessons";
import { checkSlot, LESSON_INCLUDE, lessonStaff, planningPayload, serializeLesson } from "@/lib/lessons-server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const WEEK = 7 * 86_400_000;

/** Planning de conduite entre `from` et `to` (par défaut la semaine en cours), avec moniteurs, véhicules et élèves. */
export async function GET(req: Request) {
  const staff = await lessonStaff();
  if (!staff) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const params = new URL(req.url).searchParams;
  const from = new Date(params.get("from") ?? Date.now() - WEEK);
  const to = new Date(params.get("to") ?? from.getTime() + WEEK);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return NextResponse.json({ error: "Période invalide" }, { status: 400 });
  return NextResponse.json(await planningPayload(staff.user, staff.canEdit, from, to));
}

export async function POST(req: Request) {
  const staff = await lessonStaff();
  if (!staff?.canEdit) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const parsed = lessonInputSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Données invalides" }, { status: 400 });
  const organizationId = staff.user.organizationId;
  const app = await prisma.permitApplication.findFirst({ where: { id: parsed.data.applicationId, organizationId } });
  if (!app) return NextResponse.json({ error: "Élève introuvable" }, { status: 404 });

  const conflicts = await checkSlot(organizationId, parsed.data);
  if (conflicts.length) return NextResponse.json({ error: conflicts[0]!.message, conflicts }, { status: 409 });

  const created = await prisma.drivingLesson.create({
    data: { ...parsed.data, organizationId, status: "PLANNED", report: null },
  });
  const lesson = await prisma.drivingLesson.findFirst({ where: { id: created.id }, include: LESSON_INCLUDE });
  return NextResponse.json({ lesson: serializeLesson(lesson) }, { status: 201 });
}
