import { NextResponse } from "next/server";

import { lessonPatchSchema } from "@/lib/lessons";
import { checkSlot, LESSON_INCLUDE, lessonStaff, serializeLesson } from "@/lib/lessons-server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** Déplace, réattribue, annule ou valide une leçon. Un créneau déjà pris est refusé (409). */
export async function PATCH(req: Request, { params }: Params) {
  const staff = await lessonStaff();
  if (!staff?.canEdit) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const { id } = await params;
  const organizationId = staff.user.organizationId;
  const lesson = await prisma.drivingLesson.findFirst({ where: { id, organizationId } });
  if (!lesson) return NextResponse.json({ error: "Leçon introuvable" }, { status: 404 });
  const parsed = lessonPatchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Données invalides" }, { status: 400 });
  const data = parsed.data;

  const next = {
    id,
    applicationId: lesson.applicationId as string,
    startsAt: data.startsAt ?? new Date(lesson.startsAt),
    durationMinutes: data.durationMinutes ?? Number(lesson.durationMinutes ?? 60),
    instructorId: data.instructorId ?? lesson.instructorId,
    vehicleId: data.vehicleId === undefined ? lesson.vehicleId : data.vehicleId,
  };
  const moved = ["startsAt", "durationMinutes", "instructorId", "vehicleId"].some((key) => key in data);
  const status = data.status ?? lesson.status;
  if (moved && status !== "CANCELLED") {
    const conflicts = await checkSlot(organizationId, next);
    if (conflicts.length) return NextResponse.json({ error: conflicts[0]!.message, conflicts }, { status: 409 });
  }
  // une leçon réactivée doit retrouver un créneau libre
  if (data.status === "PLANNED" && lesson.status === "CANCELLED") {
    const conflicts = await checkSlot(organizationId, next);
    if (conflicts.length) return NextResponse.json({ error: conflicts[0]!.message, conflicts }, { status: 409 });
  }

  await prisma.drivingLesson.update({ where: { id }, data: { ...data, updatedAt: new Date() } });
  const fresh = await prisma.drivingLesson.findFirst({ where: { id }, include: LESSON_INCLUDE });
  return NextResponse.json({ lesson: serializeLesson(fresh) });
}

export async function DELETE(_req: Request, { params }: Params) {
  const staff = await lessonStaff();
  if (!staff?.canEdit) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const { id } = await params;
  const lesson = await prisma.drivingLesson.findFirst({ where: { id, organizationId: staff.user.organizationId } });
  if (!lesson) return NextResponse.json({ error: "Leçon introuvable" }, { status: 404 });
  await prisma.drivingLesson.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
