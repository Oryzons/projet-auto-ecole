import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { DOCUMENT_LABELS } from "@/lib/constants";
import { prisma, type DbRow } from "@/lib/prisma";
import { taskAssigneeIds } from "@/lib/tasks";

export const dynamic = "force-dynamic";

const DAY = 86_400_000;
const name = (u: DbRow | null | undefined) => (u ? `${u.firstName} ${u.lastName}`.trim() : "Un élève");
const time = (d: unknown) => new Date(d as string).getTime();

export type RecapItem = { id: string; title: string; detail?: string | null; at: string; href?: string | null };
export type RecapGroup = { key: string; label: string; count: number; tone: "active" | "success" | "warning" | "danger" | "neutral"; href: string; items: RecapItem[] };

/**
 * Récap affiché après la connexion : tout ce qui s'est passé depuis la visite précédente
 * (messages non lus, inscriptions, pièces, paiements, leçons, véhicules, tâches) et le programme du jour.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id: userId, organizationId } = session.user;
  const me = await prisma.user.findFirst({ where: { id: userId } });
  const now = Date.now();
  // sans visite connue, on remonte à la veille
  const since = me?.previousSeenAt ? time(me.previousSeenAt) : now - DAY;
  const after = (d: unknown) => d && time(d) > since && time(d) <= now;

  const [messages, events, lessons, tasks, sessions, exams] = await Promise.all([
    prisma.message.findMany({
      where: { readAt: null, sender: { role: "CANDIDATE" }, application: { organizationId, archivedAt: null } },
      include: { sender: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.applicationEvent.findMany({ where: { application: { organizationId } }, include: { application: { include: { candidate: true } } } }),
    prisma.drivingLesson.findMany({ where: { organizationId }, include: { application: { include: { candidate: true } }, instructor: true, vehicle: true } }),
    prisma.task.findMany({ where: { organizationId } }),
    prisma.theorySession.findMany({ where: { organizationId } }),
    prisma.exam.findMany({ where: { organizationId }, include: { application: { include: { candidate: true } } } }),
  ]);

  /* messages non lus : un fil par élève */
  const threads = new Map<string, { app: string; sender: DbRow; count: number; last: DbRow }>();
  for (const message of messages as DbRow[]) {
    const entry = threads.get(message.applicationId) ?? { app: message.applicationId, sender: message.sender, count: 0, last: message };
    entry.count += 1;
    threads.set(message.applicationId, entry);
  }
  const unread = [...threads.values()].map((t) => ({
    id: t.app,
    title: name(t.sender),
    detail: String(t.last.content ?? "").slice(0, 120),
    at: new Date(t.last.createdAt).toISOString(),
    count: t.count,
    href: `/admin/messages?application=${t.app}`,
  }));

  /* nouveautés depuis la dernière visite */
  const recent = (events as DbRow[]).filter((e) => after(e.createdAt) && e.userId !== userId).sort((a, b) => time(b.createdAt) - time(a.createdAt));
  const ofType = (type: string) => recent.filter((e) => e.type === type);
  const appHref = (e: DbRow) => `/admin/applications/${e.applicationId}`;
  const groups: RecapGroup[] = [];
  const push = (group: Omit<RecapGroup, "count"> & { count?: number }) => {
    if (group.items.length) groups.push({ ...group, count: group.count ?? group.items.length });
  };

  push({
    key: "signups",
    label: "Nouvelles inscriptions",
    tone: "active",
    href: "/admin/applications",
    items: ofType("CREATED").map((e) => ({ id: e.id, title: name(e.application?.candidate), detail: "Dossier créé", at: new Date(e.createdAt).toISOString(), href: appHref(e) })),
  });
  push({
    key: "documents",
    label: "Pièces déposées à vérifier",
    tone: "warning",
    href: "/admin/applications",
    items: ofType("DOCUMENT_UPLOADED").map((e) => ({
      id: e.id,
      title: name(e.application?.candidate),
      detail: DOCUMENT_LABELS[e.metadata?.documentType as keyof typeof DOCUMENT_LABELS] ?? "Pièce justificative",
      at: new Date(e.createdAt).toISOString(),
      href: appHref(e),
    })),
  });
  const payments = ofType("PAYMENT_COMPLETED");
  const total = payments.reduce((sum, e) => sum + Number(e.metadata?.amount ?? 0), 0);
  push({
    key: "payments",
    label: `Paiements reçus${total ? ` · ${(total / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })}` : ""}`,
    tone: "success",
    href: "/admin/finances",
    items: payments.map((e) => ({
      id: e.id,
      title: name(e.application?.candidate),
      detail: e.metadata?.amount ? (Number(e.metadata.amount) / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" }) : null,
      at: new Date(e.createdAt).toISOString(),
      href: appHref(e),
    })),
  });

  const pastLessons = (lessons as DbRow[]).filter((l) => after(time(l.startsAt) + Number(l.durationMinutes ?? 60) * 60_000));
  const done = pastLessons.filter((l) => l.status !== "CANCELLED");
  push({
    key: "lessons",
    label: "Leçons de conduite réalisées",
    tone: "neutral",
    href: "/admin/calendar",
    items: done
      .sort((a, b) => time(b.startsAt) - time(a.startsAt))
      .map((l) => ({
        id: l.id,
        title: name(l.application?.candidate),
        detail: [l.instructor?.firstName && `avec ${l.instructor.firstName}`, l.vehicle?.name].filter(Boolean).join(" · "),
        at: new Date(l.startsAt).toISOString(),
      })),
  });
  push({
    key: "cancelled",
    label: "Leçons annulées",
    tone: "danger",
    href: "/admin/calendar",
    items: (lessons as DbRow[])
      .filter((l) => l.status === "CANCELLED" && after(l.updatedAt))
      .map((l) => ({ id: l.id, title: name(l.application?.candidate), detail: l.notes ?? null, at: new Date(l.startsAt).toISOString() })),
  });
  push({
    key: "vehicles",
    label: "Problèmes signalés sur les véhicules",
    tone: "warning",
    href: "/admin/vehicles",
    items: (lessons as DbRow[]).flatMap((l) =>
      l.report && after(l.report.submittedAt)
        ? (l.report.issues as { label: string }[]).map((issue, i) => ({
            id: `${l.id}-${i}`,
            title: issue.label,
            detail: [l.vehicle?.name, l.instructor?.firstName && `signalé par ${l.instructor.firstName}`].filter(Boolean).join(" · "),
            at: l.report.submittedAt as string,
            href: l.vehicleId ? `/admin/vehicles?id=${l.vehicleId}` : null,
          }))
        : [],
    ),
  });

  /* tâches : celles qui me sont confiées depuis, et celles en retard */
  const mine = (tasks as DbRow[]).filter((t) => t.status !== "DONE" && taskAssigneeIds(t).includes(userId));
  push({
    key: "assigned",
    label: "Tâches qui vous sont confiées",
    tone: "active",
    href: "/admin/tasks",
    items: mine.filter((t) => after(t.createdAt)).map((t) => ({ id: t.id, title: t.title, detail: t.entityLabel ?? null, at: new Date(t.createdAt).toISOString(), href: "/admin/tasks" })),
  });
  push({
    key: "overdue",
    label: "Vos tâches en retard",
    tone: "danger",
    href: "/admin/tasks",
    items: mine
      .filter((t) => t.dueAt && time(t.dueAt) < now)
      .sort((a, b) => time(a.dueAt) - time(b.dueAt))
      .map((t) => ({ id: t.id, title: t.title, detail: t.entityLabel ?? null, at: new Date(t.dueAt).toISOString(), href: "/admin/tasks" })),
  });

  /* programme du jour */
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = start.getTime() + DAY;
  const today = (d: unknown) => time(d) >= start.getTime() && time(d) < end;
  const todayLessons = (lessons as DbRow[]).filter((l) => l.status !== "CANCELLED" && today(l.startsAt));
  const agenda = {
    lessons: todayLessons.length,
    nextLesson: todayLessons
      .filter((l) => time(l.startsAt) > now)
      .sort((a, b) => time(a.startsAt) - time(b.startsAt))
      .map((l) => ({ at: new Date(l.startsAt).toISOString(), title: name(l.application?.candidate) }))[0] ?? null,
    sessions: (sessions as DbRow[]).filter((s) => today(s.startsAt)).length,
    exams: (exams as DbRow[]).filter((e) => today(e.date)).length,
  };

  return NextResponse.json({
    firstName: session.user.firstName,
    since: new Date(since).toISOString(),
    firstVisit: !me?.previousSeenAt,
    unread,
    unreadCount: messages.length,
    groups,
    agenda,
  });
}
