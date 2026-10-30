import { REQUIRED_DOCUMENTS, DOCUMENT_LABELS } from "@/lib/constants";
import { ApplicationStatus, DocumentStatus, PaymentMethod, PaymentStatus, type DocumentType } from "@/lib/db/client";
import { prisma, type DbRow } from "@/lib/prisma";
import { permitLabel, studentStage, taskTone, vehicleAlerts, type Tone } from "@/lib/crm";
import { formatCurrency } from "@/lib/utils";

import type { PlanData, PlanItem, PlanMetric, PlanTask, PlanZone, ZoneId } from "@/lib/plan-types";
import { ZONE_TASK_CATEGORY } from "@/lib/plan-types";
import { linkHref, staffNames, taskAssigneeIds, taskLinks } from "@/lib/tasks";
import { VEHICLE_STATUS_LABELS } from "@/lib/vehicles";

export * from "@/lib/plan-types";

const DAY = 86_400_000;
const HOUR_FMT = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });
const DATE_FMT = new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "short", timeZone: "Europe/Paris" });

const fullName = (u: DbRow | null | undefined) => (u ? `${u.firstName} ${u.lastName}` : "—");
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n > 1 ? many : one}`;

/** Données du plan : chaque zone résume sa partie de l'activité, à partir de la base. */
export async function getPlanData(organizationId: string): Promise<PlanData> {
  const now = new Date();
  const today = startOfDay(now);
  const tomorrow = new Date(today.getTime() + DAY);
  const inWeek = new Date(today.getTime() + 7 * DAY);
  const in14 = new Date(today.getTime() + 14 * DAY);
  const monthAgo = new Date(now.getTime() - 30 * DAY);

  const [apps, sessions, lessons, exams, vehicles, tasks, unread, staff] = await Promise.all([
    prisma.permitApplication.findMany({
      where: { organizationId, archivedAt: null },
      include: { candidate: true, documents: true, payments: true, instructor: true, lessons: true, exams: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.theorySession.findMany({
      where: { organizationId, startsAt: { gte: now } },
      include: { registrations: true },
      orderBy: { startsAt: "asc" },
    }),
    prisma.drivingLesson.findMany({
      where: { organizationId },
      include: { application: { include: { candidate: true } }, instructor: true, vehicle: true },
      orderBy: { startsAt: "asc" },
    }),
    prisma.exam.findMany({
      where: { organizationId },
      include: { application: { include: { candidate: true } } },
      orderBy: { date: "asc" },
    }),
    prisma.vehicle.findMany({ where: { organizationId }, orderBy: { name: "asc" } }),
    prisma.task.findMany({ where: { organizationId }, include: { assignee: true }, orderBy: { dueAt: "asc" } }),
    prisma.message.findMany({
      where: { readAt: null, sender: { role: "CANDIDATE" }, application: { organizationId, archivedAt: null } },
      include: { application: { include: { candidate: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({ where: { organizationId, role: "SKIPPER" } }),
  ]);

  const staffById = await staffNames(organizationId);
  const openTasks = tasks.filter((task: DbRow) => task.status !== "DONE");
  const overdueTasks = openTasks.filter((task: DbRow) => task.dueAt && new Date(task.dueAt) < today);
  const toPlanTask = (task: DbRow): PlanTask => ({
    id: task.id,
    title: task.title,
    status: task.status,
    priority: task.priority,
    dueAt: task.dueAt ? new Date(task.dueAt).toISOString() : null,
    tone: taskTone(task, now),
    assignee: taskAssigneeIds(task).map((id) => staffById.get(id)?.firstName).filter(Boolean).join(", ") || null,
    entityLabel: task.entityLabel,
    href: task.entityType === "APPLICATION" && task.entityId ? `/admin/applications/${task.entityId}` : null,
    links: taskLinks(task).map((link) => ({ label: link.label, href: linkHref(link) })),
  });
  const tasksFor = (zone: ZoneId) => {
    const category = ZONE_TASK_CATEGORY[zone];
    const list = category ? openTasks.filter((task: DbRow) => task.category === category) : overdueTasks;
    // en retard d'abord, puis par échéance
    return list.map(toPlanTask).sort((a: PlanTask, b: PlanTask) => rank(a) - rank(b) || (a.dueAt ?? "9").localeCompare(b.dueAt ?? "9"));
  };

  /* ---------- dossiers ---------- */
  const inProgress = apps.filter((app: DbRow) => app.status !== ApplicationStatus.COMPLETED);
  const dossierState = (app: DbRow) => {
    const byType = new Map<DocumentType, DbRow>(app.documents.map((doc: DbRow) => [doc.type, doc]));
    const missing = REQUIRED_DOCUMENTS.filter((type) => !byType.get(type) || byType.get(type).status === DocumentStatus.REJECTED);
    const pending = app.documents.filter((doc: DbRow) => doc.status === DocumentStatus.PENDING);
    const rejected = app.documents.filter((doc: DbRow) => doc.status === DocumentStatus.REJECTED);
    const ageDays = (now.getTime() - new Date(app.createdAt).getTime()) / DAY;
    const urgent = rejected.length > 0 || (missing.length > 0 && ageDays > 14 && app.status !== ApplicationStatus.DRAFT);
    return { missing, pending, rejected, urgent };
  };
  const dossiers = inProgress.map((app: DbRow) => ({ app, ...dossierState(app) }));
  const incomplete = dossiers.filter((d: DbRow) => d.missing.length > 0);
  const toVerify = dossiers.flatMap((d: DbRow) => d.pending);
  const urgent = dossiers.filter((d: DbRow) => d.urgent);

  /* ---------- formation ---------- */
  const lessonsToday = lessons.filter((l: DbRow) => l.status !== "CANCELLED" && new Date(l.startsAt) >= today && new Date(l.startsAt) < tomorrow);
  const lessonsWeek = lessons.filter((l: DbRow) => l.status !== "CANCELLED" && new Date(l.startsAt) >= today && new Date(l.startsAt) < inWeek);
  const cancelledRecent = lessons.filter((l: DbRow) => l.status === "CANCELLED" && new Date(l.startsAt) >= new Date(today.getTime() - 7 * DAY));
  const upcomingExams = exams.filter((e: DbRow) => e.result === "PENDING" && new Date(e.date) >= today);
  const recentResults = exams.filter((e: DbRow) => e.result !== "PENDING" && new Date(e.date) >= new Date(now.getTime() - 60 * DAY));
  const passRate = recentResults.length ? Math.round((recentResults.filter((e: DbRow) => e.result === "PASSED").length / recentResults.length) * 100) : null;
  const readyForExam = apps.filter((app: DbRow) => studentStage(app, now) === "READY");
  const activeStudents = apps.filter((app: DbRow) => ["TRAINING", "READY", "VALIDATED"].includes(studentStage(app, now)));

  /* ---------- argent ---------- */
  const paidAmount = (app: DbRow) =>
    app.payments.filter((p: DbRow) => p.status === PaymentStatus.COMPLETED).reduce((sum: number, p: DbRow) => sum + p.amount, 0);
  const awaitingPayment = apps.filter((app: DbRow) => app.status === ApplicationStatus.PAYMENT_PENDING);
  const transfers = apps.flatMap((app: DbRow) =>
    app.payments.filter((p: DbRow) => p.status === PaymentStatus.PENDING && p.method === PaymentMethod.TRANSFER).map((p: DbRow) => ({ app, payment: p })),
  );
  const cashedMonth = apps
    .flatMap((app: DbRow) => app.payments)
    .filter((p: DbRow) => p.status === PaymentStatus.COMPLETED && p.paidAt && new Date(p.paidAt) >= new Date(now.getFullYear(), now.getMonth(), 1))
    .reduce((sum: number, p: DbRow) => sum + p.amount, 0);

  /* ---------- parc ---------- */
  const fleet = vehicles.map((v: DbRow) => ({ vehicle: v, alerts: vehicleAlerts(v, now) }));
  const fleetAlerts = fleet.filter((f: DbRow) => f.alerts.length > 0);
  const fleetOverdue = fleet.filter((f: DbRow) => f.alerts.some((a: DbRow) => a.tone === "danger"));

  /* ---------- messages ---------- */
  const unreadByApp = new Map<string, DbRow[]>();
  for (const message of unread) unreadByApp.set(message.applicationId, [...(unreadByApp.get(message.applicationId) ?? []), message]);

  const studentHref = (app: DbRow) => `/admin/applications/${app.id}`;
  const lessonItem = (l: DbRow): PlanItem => ({
    id: l.id,
    title: `${HOUR_FMT.format(new Date(l.startsAt))} · ${fullName(l.application?.candidate)}`,
    subtitle: `${l.instructor?.firstName ?? "—"} · ${l.vehicle ? l.vehicle.name : "sans véhicule"}`,
    tone: l.status === "DONE" ? "success" : new Date(l.startsAt) < now ? "neutral" : "active",
    badge: l.status === "DONE" ? "Faite" : `${l.durationMinutes} min`,
    href: studentHref(l.application),
  });

  const zones: PlanZone[] = [
    {
      id: "accueil",
      title: "Accueil",
      subtitle: "Vue générale de l'activité et alertes",
      count: overdueTasks.length + urgent.length + fleetOverdue.length,
      countLabel: "alertes",
      tone: overdueTasks.length + fleetOverdue.length > 0 ? "danger" : urgent.length ? "warning" : "success",
      metrics: [
        { label: "Élèves actifs", value: activeStudents.length, tone: "active", href: "/admin/applications" },
        { label: "Leçons aujourd'hui", value: lessonsToday.length, tone: "neutral" },
        { label: "Examens sous 14 j", value: upcomingExams.filter((e: DbRow) => new Date(e.date) < in14).length, tone: "neutral" },
        { label: "Tâches en retard", value: overdueTasks.length, tone: overdueTasks.length ? "danger" : "success", href: "/admin/tasks?view=late" },
      ],
      itemsTitle: "À traiter en priorité",
      items: [
        ...fleetOverdue.map(({ vehicle, alerts }: DbRow) => ({
          id: `veh-${vehicle.id}`,
          title: `${vehicle.name} · ${vehicle.plate}`,
          subtitle: alerts[0].label,
          tone: "danger" as Tone,
          badge: "Véhicule",
          detail: vehicleDetail(vehicle, alerts),
        })),
        ...urgent.slice(0, 5).map(({ app, missing, rejected }: DbRow) => ({
          id: `urg-${app.id}`,
          title: fullName(app.candidate),
          subtitle: rejected.length ? plural(rejected.length, "pièce refusée", "pièces refusées") : `${plural(missing.length, "pièce manquante", "pièces manquantes")} depuis plus de 14 jours`,
          tone: "warning" as Tone,
          badge: "Dossier",
          href: studentHref(app),
        })),
      ],
      tasks: tasksFor("accueil"),
      page: { label: "Toutes les tâches", href: "/admin/tasks" },
    },
    {
      id: "inscriptions",
      title: "Inscriptions",
      subtitle: "Nouveaux élèves et demandes entrantes",
      count: apps.filter((app: DbRow) => app.status === ApplicationStatus.DRAFT).length + apps.filter((app: DbRow) => new Date(app.createdAt) >= monthAgo && app.status === ApplicationStatus.DOCUMENTS_PENDING).length,
      countLabel: "à traiter",
      tone: apps.some((app: DbRow) => app.status === ApplicationStatus.DRAFT) ? "warning" : "active",
      metrics: [
        { label: "Nouveaux sur 30 j", value: apps.filter((app: DbRow) => new Date(app.createdAt) >= monthAgo).length, tone: "active" },
        { label: "À confirmer", value: apps.filter((app: DbRow) => app.status === ApplicationStatus.DRAFT).length, tone: "warning" },
        { label: "Pièces en attente", value: apps.filter((app: DbRow) => app.status === ApplicationStatus.DOCUMENTS_PENDING).length, tone: "neutral" },
      ],
      itemsTitle: "Dernières inscriptions",
      items: apps.slice(0, 6).map((app: DbRow) => ({
        id: app.id,
        title: fullName(app.candidate),
        subtitle: `${permitLabel(app.permitType)} · inscrit le ${DATE_FMT.format(new Date(app.createdAt))}`,
        tone: app.status === ApplicationStatus.DRAFT ? "warning" : "neutral",
        badge: app.status === ApplicationStatus.DRAFT ? "À confirmer" : undefined,
        href: studentHref(app),
      })),
      tasks: tasksFor("inscriptions"),
      page: { label: "Voir les dossiers", href: "/admin/applications" },
    },
    {
      id: "administratif",
      title: "Bureau administratif",
      subtitle: "Dossiers, pièces justificatives et formalités",
      count: incomplete.length,
      countLabel: "incomplets",
      tone: urgent.length ? "danger" : incomplete.length || toVerify.length ? "warning" : "success",
      metrics: [
        { label: "Dossiers en cours", value: inProgress.length, tone: "active", href: "/admin/applications" },
        { label: "Dossiers incomplets", value: incomplete.length, tone: incomplete.length ? "warning" : "success" },
        { label: "Pièces à vérifier", value: toVerify.length, tone: toVerify.length ? "warning" : "success", href: "/admin/applications?status=todo" },
        { label: "Dossiers urgents", value: urgent.length, tone: urgent.length ? "danger" : "success" },
      ],
      itemsTitle: "Dossiers qui demandent une action",
      items: dossiers
        .filter((d: DbRow) => d.missing.length || d.pending.length)
        .sort((a: DbRow, b: DbRow) => Number(b.urgent) - Number(a.urgent) || b.pending.length - a.pending.length)
        .map(({ app, missing, pending, urgent: isUrgent }: DbRow) => ({
          id: app.id,
          title: fullName(app.candidate),
          subtitle: [
            pending.length ? plural(pending.length, "pièce à vérifier", "pièces à vérifier") : null,
            missing.length ? `manque ${missing.slice(0, 2).map((t: DocumentType) => DOCUMENT_LABELS[t].toLowerCase()).join(", ")}${missing.length > 2 ? "…" : ""}` : null,
          ]
            .filter(Boolean)
            .join(" · "),
          tone: isUrgent ? "danger" : pending.length ? "warning" : "neutral",
          badge: isUrgent ? "Urgent" : pending.length ? "À vérifier" : "Incomplet",
          href: studentHref(app),
        })),
      tasks: tasksFor("administratif"),
      page: { label: "Voir les dossiers", href: "/admin/applications" },
    },
    {
      id: "code",
      title: "Salle de code",
      subtitle: "Séances de code et examens blancs",
      count: sessions.length,
      countLabel: "séances à venir",
      tone: "active",
      metrics: [
        { label: "Séances à venir", value: sessions.length, tone: "active", href: "/admin/calendar" },
        { label: "Élèves inscrits", value: sessions.reduce((sum: number, s: DbRow) => sum + s.registrations.length, 0), tone: "neutral" },
        { label: "Places libres", value: sessions.reduce((sum: number, s: DbRow) => sum + Math.max(0, s.capacity - s.registrations.length), 0), tone: "neutral" },
      ],
      itemsTitle: "Prochaines séances",
      items: sessions.slice(0, 6).map((s: DbRow) => ({
        id: s.id,
        title: `${s.title} · ${DATE_FMT.format(new Date(s.startsAt))} ${HOUR_FMT.format(new Date(s.startsAt))}`,
        subtitle: `${s.registrations.length} / ${s.capacity} inscrits · ${s.location}`,
        tone: s.registrations.length >= s.capacity ? "success" : "active",
        badge: s.registrations.length >= s.capacity ? "Complet" : `${s.capacity - s.registrations.length} places`,
        href: `/admin/calendar?session=${s.id}`,
      })),
      tasks: tasksFor("code"),
      page: { label: "Ouvrir le calendrier", href: "/admin/calendar" },
    },
    {
      id: "planning",
      title: "Planning",
      subtitle: "Leçons de conduite, moniteurs et véhicules",
      count: lessonsToday.length,
      countLabel: "leçons aujourd'hui",
      tone: cancelledRecent.length ? "warning" : "active",
      metrics: [
        { label: "Leçons aujourd'hui", value: lessonsToday.length, tone: "active" },
        { label: "Sur 7 jours", value: lessonsWeek.length, tone: "neutral" },
        { label: "À reprogrammer", value: cancelledRecent.length, tone: cancelledRecent.length ? "warning" : "success" },
        { label: "Moniteurs", value: staff.length, tone: "neutral" },
      ],
      itemsTitle: "Leçons du jour",
      items: lessonsToday.map(lessonItem),
      tasks: tasksFor("planning"),
      page: { label: "Ouvrir le planning", href: "/admin/calendar" },
      schedule: {
        instructors: [...staff]
          .sort((a: DbRow, b: DbRow) => a.firstName.localeCompare(b.firstName, "fr"))
          .map((u: DbRow) => ({ id: u.id, firstName: u.firstName, lastName: u.lastName })),
        lessons: lessonsToday
          .sort((a: DbRow, b: DbRow) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
          .map((l: DbRow) => ({
            id: l.id,
            startsAt: new Date(l.startsAt).toISOString(),
            endsAt: new Date(new Date(l.startsAt).getTime() + Number(l.durationMinutes ?? 60) * 60_000).toISOString(),
            status: l.status,
            student: fullName(l.application?.candidate),
            instructorId: l.instructorId ?? null,
            vehicle: l.vehicle?.name ?? null,
          })),
        cancelled: cancelledRecent.length,
        week: lessonsWeek.length,
      },
    },
    {
      id: "parc",
      title: "Parc automobile",
      subtitle: "Véhicules, entretien et échéances",
      count: fleetAlerts.length,
      countLabel: "échéances",
      tone: fleetOverdue.length ? "danger" : fleetAlerts.length ? "warning" : "success",
      metrics: [
        { label: "Véhicules", value: vehicles.length, tone: "neutral" },
        { label: "Disponibles", value: vehicles.filter((v: DbRow) => v.status === "AVAILABLE").length, tone: "success" },
        { label: "Au garage", value: vehicles.filter((v: DbRow) => v.status === "MAINTENANCE").length, tone: "warning" },
        { label: "Échéances proches", value: fleetAlerts.length, tone: fleetOverdue.length ? "danger" : fleetAlerts.length ? "warning" : "success" },
      ],
      itemsTitle: "Véhicules",
      items: fleet.map(({ vehicle, alerts }: DbRow) => ({
        id: vehicle.id,
        title: `${vehicle.name} · ${vehicle.plate}`,
        subtitle: alerts[0]?.label ?? `${vehicle.mileage.toLocaleString("fr-FR")} km · à jour`,
        tone: alerts[0]?.tone ?? (vehicle.status === "AVAILABLE" ? "success" : "neutral"),
        badge: VEHICLE_STATUS_LABELS[vehicle.status] ?? "Au garage",
        detail: vehicleDetail(vehicle, alerts),
      })),
      tasks: tasksFor("parc"),
      page: { label: "Gérer les véhicules", href: "/admin/vehicles" },
    },
    {
      id: "examens",
      title: "Espace examens",
      subtitle: "Dates d'examen, candidats et résultats",
      count: upcomingExams.length,
      countLabel: "examens à venir",
      tone: readyForExam.length ? "warning" : "active",
      metrics: [
        { label: "Examens à venir", value: upcomingExams.length, tone: "active" },
        { label: "Prêts sans date", value: readyForExam.length, tone: readyForExam.length ? "warning" : "success" },
        { label: "Réussite sur 60 j", value: passRate === null ? "—" : `${passRate} %`, tone: "success" },
      ],
      itemsTitle: "Prochains examens",
      items: [
        ...upcomingExams.map((e: DbRow) => ({
          id: e.id,
          title: `${fullName(e.application?.candidate)} · ${e.kind === "CODE" ? "Code" : "Conduite"}`,
          subtitle: `${DATE_FMT.format(new Date(e.date))} ${HOUR_FMT.format(new Date(e.date))} · ${e.location ?? "lieu à confirmer"}`,
          tone: "active" as Tone,
          badge: e.kind === "CODE" ? "Code" : "Conduite",
          href: studentHref(e.application),
        })),
        ...readyForExam.map((app: DbRow) => ({
          id: `ready-${app.id}`,
          title: fullName(app.candidate),
          subtitle: `Prêt pour l'examen pratique · ${app.lessons.filter((l: DbRow) => l.status === "DONE").length} h faites`,
          tone: "warning" as Tone,
          badge: "Sans date",
          href: studentHref(app),
        })),
      ],
      tasks: tasksFor("examens"),
      page: { label: "Tâches examens", href: "/admin/tasks?category=EXAM" },
    },
    {
      id: "comptabilite",
      title: "Comptabilité",
      subtitle: "Paiements, soldes et factures",
      count: awaitingPayment.length + transfers.length,
      countLabel: "en attente",
      tone: transfers.length ? "warning" : awaitingPayment.length ? "warning" : "success",
      metrics: [
        { label: "Encaissé ce mois", value: formatCurrency(cashedMonth), tone: "success", href: "/admin/finances" },
        { label: "Paiements en attente", value: awaitingPayment.length, tone: awaitingPayment.length ? "warning" : "success" },
        { label: "Virements à confirmer", value: transfers.length, tone: transfers.length ? "warning" : "success", href: "/admin/finances" },
      ],
      itemsTitle: "Soldes à encaisser",
      items: awaitingPayment.map((app: DbRow) => {
        const paid = paidAmount(app);
        const total = app.totalAmount ?? 0;
        const transfer = transfers.find((t: DbRow) => t.app.id === app.id);
        return {
          id: app.id,
          title: fullName(app.candidate),
          subtitle: transfer
            ? `Virement de ${formatCurrency(transfer.payment.amount)} annoncé, à confirmer`
            : `Reste ${formatCurrency(Math.max(0, total - paid))} sur ${formatCurrency(total)}`,
          tone: "warning" as Tone,
          badge: transfer ? "Virement" : paid > 0 ? "Échéancier" : "Non payé",
          href: studentHref(app),
        };
      }),
      tasks: tasksFor("comptabilite"),
      page: { label: "Ouvrir les finances", href: "/admin/finances" },
    },
    {
      id: "communication",
      title: "Communication",
      subtitle: "Messages, rappels et notifications",
      count: unreadByApp.size,
      countLabel: "conversations non lues",
      tone: unreadByApp.size ? "active" : "success",
      metrics: [
        { label: "Messages non lus", value: unread.length, tone: unread.length ? "active" : "success", href: "/admin/messages" },
        { label: "Conversations à répondre", value: unreadByApp.size, tone: "neutral" },
      ],
      itemsTitle: "Messages non lus",
      items: [...unreadByApp.entries()].map(([applicationId, messages]) => ({
        id: applicationId,
        title: fullName(messages[0].application?.candidate),
        subtitle: messages[0].content.length > 80 ? `${messages[0].content.slice(0, 80)}…` : messages[0].content,
        tone: "active" as Tone,
        badge: messages.length > 1 ? `${messages.length} messages` : "1 message",
        href: `/admin/messages?application=${applicationId}`,
      })),
      tasks: tasksFor("communication"),
      page: { label: "Ouvrir la messagerie", href: "/admin/messages" },
    },
  ];

  return {
    generatedAt: now.toISOString(),
    kpis: [
      { label: "Élèves actifs", value: activeStudents.length, tone: "active", href: "/admin/applications" },
      { label: "Nouveaux sur 30 j", value: apps.filter((app: DbRow) => new Date(app.createdAt) >= monthAgo).length, tone: "neutral" },
      { label: "Dossiers incomplets", value: incomplete.length, tone: incomplete.length ? "warning" : "success" },
      { label: "Leçons aujourd'hui", value: lessonsToday.length, tone: "neutral" },
      { label: "Examens à venir", value: upcomingExams.length, tone: "neutral" },
      { label: "Tâches en retard", value: overdueTasks.length, tone: overdueTasks.length ? "danger" : "success", href: "/admin/tasks?view=late" },
      { label: "Paiements en attente", value: awaitingPayment.length, tone: awaitingPayment.length ? "warning" : "success", href: "/admin/finances" },
    ],
    zones,
  };
}

function rank(task: PlanTask) {
  return task.tone === "danger" ? 0 : task.tone === "warning" ? 1 : 2;
}

function vehicleDetail(vehicle: DbRow, alerts: { label: string; tone: Tone }[]): PlanItem["detail"] {
  const date = (d: Date) => DATE_FMT.format(new Date(d));
  return {
    title: `${vehicle.name} · ${vehicle.plate}`,
    rows: [
      { label: "Boîte", value: vehicle.transmission === "AUTO" ? "Automatique" : vehicle.transmission === "MOTO" ? "Moto" : "Manuelle" },
      { label: "Kilométrage", value: `${vehicle.mileage.toLocaleString("fr-FR")} km` },
      { label: "Prochaine révision", value: date(vehicle.nextServiceAt), tone: alerts.find((a) => a.label.includes("évision"))?.tone },
      { label: "Contrôle technique", value: date(vehicle.inspectionExpiresAt), tone: alerts.find((a) => a.label.includes("ontrôle"))?.tone },
      { label: "Assurance", value: date(vehicle.insuranceExpiresAt), tone: alerts.find((a) => a.label.includes("ssurance"))?.tone },
    ],
    note: vehicle.notes ?? undefined,
  };
}
