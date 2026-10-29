import { ApplicationStatus, Role, type TheorySession } from "@/lib/db/client";
import { z } from "zod";

import { auth } from "@/lib/auth";
import {
  sendNewSessionEmail,
  sendSessionChangedEmail,
  sendSessionReminderEmail,
  type SessionEmailInfo,
} from "@/lib/email";
import { paymentCoverage } from "@/lib/payment";
import { prisma } from "@/lib/prisma";
import { resolveDbUser } from "@/lib/session";
import { publishToUser } from "@/lib/sse-broker";

/** Fuseau de l'auto-école : les dates sont saisies et affichées à l'heure de Paris. */
export const SCHOOL_TIME_ZONE = "Europe/Paris";

/** Délai avant la session pour l'email de rappel. */
export const REMINDER_DELAY_MS = 2 * 24 * 60 * 60 * 1000;

export const sessionInputSchema = z.object({
  title: z.string().trim().min(1, "Indiquez un intitulé").max(120).default("Séance de code"),
  location: z.string().trim().min(1, "Indiquez le lieu").max(200),
  startsAt: z.coerce.date({ message: "Date invalide" }),
  durationMinutes: z.coerce.number().int().min(15, "Durée trop courte").max(12 * 60, "Durée trop longue"),
  capacity: z.coerce.number().int().min(1, "Au moins 1 place").max(500, "500 places au maximum"),
  notes: z.string().trim().max(1000).optional().nullable(),
});

export function formatSessionWhen(startsAt: Date, durationMinutes: number) {
  const end = new Date(startsAt.getTime() + durationMinutes * 60_000);
  const day = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: SCHOOL_TIME_ZONE,
  }).format(startsAt);
  const time = new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: SCHOOL_TIME_ZONE,
  });
  return `${day}, ${time.format(startsAt)} – ${time.format(end)}`;
}

export function sessionEmailInfo(
  session: Pick<TheorySession, "id" | "title" | "location" | "startsAt" | "durationMinutes" | "notes">,
): SessionEmailInfo {
  const endsAt = new Date(session.startsAt.getTime() + session.durationMinutes * 60_000);
  const format = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("fr-FR", { ...options, timeZone: SCHOOL_TIME_ZONE }).format(session.startsAt);
  const clock = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: SCHOOL_TIME_ZONE });
  return {
    id: session.id,
    title: session.title,
    location: session.location,
    when: formatSessionWhen(session.startsAt, session.durationMinutes),
    day: format({ day: "numeric" }),
    month: format({ month: "short" }).replace(".", ""),
    weekday: format({ weekday: "long", day: "numeric", month: "long" }),
    time: `${clock.format(session.startsAt)} – ${clock.format(endsAt)}`,
    startsAt: session.startsAt,
    endsAt,
    notes: session.notes,
  };
}

/** Admin ou moniteur connecté, relu en base. */
export async function getStaffUser() {
  const session = await auth();
  if (!session?.user) return null;
  const user = await resolveDbUser(session);
  if (!user || (user.role !== Role.ADMIN && user.role !== Role.SKIPPER)) return null;
  return user;
}

/** Élève connecté, relu en base. */
export async function getCandidateUser() {
  const session = await auth();
  if (!session?.user) return null;
  const user = await resolveDbUser(session);
  if (!user || user.role !== Role.CANDIDATE) return null;
  return user;
}

/**
 * Règle de l'auto-école : on ne s'inscrit à la séance de code qu'une fois la
 * formation réglée en totalité. Renvoie le reste à payer (0 si c'est réglé).
 */
export async function candidatePaymentState(candidateId: string, organizationId: string) {
  const application = await prisma.permitApplication.findFirst({
    where: { candidateId, organizationId, archivedAt: null },
    select: { status: true, totalAmount: true, payments: { select: { status: true, amount: true } } },
    orderBy: { createdAt: "desc" },
  });
  if (!application) return { fullyPaid: false, remaining: null as number | null };
  const coverage = paymentCoverage(application.payments, application.totalAmount);
  const fullyPaid =
    coverage.fullyPaid ||
    application.status === ApplicationStatus.PAID ||
    application.status === ApplicationStatus.COMPLETED;
  return { fullyPaid, remaining: fullyPaid ? 0 : coverage.total > 0 ? coverage.remaining : null };
}

/** Élèves actifs de l'auto-école (dossier non archivé), avec l'état de leur paiement. */
async function activeCandidates(organizationId: string) {
  const users = await prisma.user.findMany({
    where: {
      organizationId,
      role: Role.CANDIDATE,
      applications: { some: { archivedAt: null } },
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      applications: {
        where: { archivedAt: null },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { status: true, totalAmount: true, payments: { select: { status: true, amount: true } } },
      },
    },
  });
  return users.map(({ applications, ...user }) => {
    const application = applications[0];
    const paid = application
      ? paymentCoverage(application.payments, application.totalAmount).fullyPaid ||
        application.status === ApplicationStatus.PAID ||
        application.status === ApplicationStatus.COMPLETED
      : false;
    return { ...user, paid };
  });
}

/** Prévient tous les élèves qu'une nouvelle date est ouverte (alerte + email). */
export async function announceSession(session: TheorySession) {
  const candidates = await activeCandidates(session.organizationId);
  const info = sessionEmailInfo(session);
  for (const candidate of candidates) {
    publishToUser(candidate.id, {
      type: "session",
      data: { sessionId: session.id, kind: "created", when: info.when, location: info.location },
    });
  }
  await Promise.allSettled(
    candidates.map((candidate) => sendNewSessionEmail(candidate.email, candidate.firstName, info, candidate.paid)),
  );
}

/** Prévient les inscrits d'une modification ou d'une annulation. */
export async function notifyRegistrants(
  session: TheorySession,
  registrants: { id: string; email: string; firstName: string }[],
  cancelled: boolean,
) {
  const info = sessionEmailInfo(session);
  for (const registrant of registrants) {
    publishToUser(registrant.id, {
      type: "session",
      data: { sessionId: session.id, kind: cancelled ? "cancelled" : "updated", when: info.when, location: info.location },
    });
  }
  await Promise.allSettled(
    registrants.map((r) => sendSessionChangedEmail(r.email, r.firstName, info, cancelled)),
  );
}

/**
 * Envoie les rappels dus : sessions qui commencent dans moins de 2 jours,
 * inscrits ayant demandé un rappel et inscrits avant cette échéance
 * (une inscription de dernière minute a déjà reçu sa confirmation).
 */
export async function sendDueReminders(now = new Date()) {
  const due = await prisma.sessionRegistration.findMany({
    where: {
      reminder: true,
      reminderSentAt: null,
      session: { startsAt: { gt: now, lte: new Date(now.getTime() + REMINDER_DELAY_MS) } },
    },
    include: {
      session: true,
      candidate: { select: { email: true, firstName: true } },
    },
  });

  let sent = 0;
  for (const registration of due) {
    const threshold = registration.session.startsAt.getTime() - REMINDER_DELAY_MS;
    // Marque d'abord : deux instances simultanées n'envoient pas deux fois.
    const { count } = await prisma.sessionRegistration.updateMany({
      where: { id: registration.id, reminderSentAt: null },
      data: { reminderSentAt: now },
    });
    if (count === 0 || registration.createdAt.getTime() > threshold) continue;
    await sendSessionReminderEmail(
      registration.candidate.email,
      registration.candidate.firstName,
      sessionEmailInfo(registration.session),
    );
    sent++;
  }
  return { checked: due.length, sent };
}

/** Délai avant le début du cours à partir duquel on ne peut plus se désinscrire. */
export const UNREGISTER_CUTOFF_MS = 10 * 60_000;

export type TheoryCourseStatus = {
  /** attended : présent à l'appel · absent : appel fait sans lui · registered : inscrit à venir · none */
  status: "attended" | "absent" | "registered" | "none";
  title: string | null;
  startsAt: Date | null;
  attendedAt: Date | null;
};

/** Où en est l'élève pour son séance de code (présence relevée à l'appel). */
type CourseRegistration = {
  candidateId: string;
  attendedAt: Date | null;
  session: { title: string; startsAt: Date; attendanceClosedAt: Date | null };
};

function courseStatusFrom(registrations: CourseRegistration[], now: number): TheoryCourseStatus {
  const attended = registrations.find((r) => r.attendedAt);
  if (attended) {
    return { status: "attended", title: attended.session.title, startsAt: attended.session.startsAt, attendedAt: attended.attendedAt };
  }
  const upcoming = registrations.filter((r) => r.session.startsAt.getTime() > now).at(-1);
  if (upcoming) {
    return { status: "registered", title: upcoming.session.title, startsAt: upcoming.session.startsAt, attendedAt: null };
  }
  const missed = registrations.find((r) => r.session.attendanceClosedAt);
  if (missed) {
    return { status: "absent", title: missed.session.title, startsAt: missed.session.startsAt, attendedAt: null };
  }
  return { status: "none", title: null, startsAt: null, attendedAt: null };
}

/** État du séance de code de plusieurs élèves en une seule requête. */
export async function theoryCourseStatuses(candidateIds: string[]) {
  const registrations = await prisma.sessionRegistration.findMany({
    where: { candidateId: { in: candidateIds } },
    select: {
      candidateId: true,
      attendedAt: true,
      session: { select: { title: true, startsAt: true, attendanceClosedAt: true } },
    },
    orderBy: { session: { startsAt: "desc" } },
  });
  const now = Date.now();
  return new Map(candidateIds.map((id) => [id, courseStatusFrom(registrations.filter((r) => r.candidateId === id), now)]));
}

export async function theoryCourseStatus(candidateId: string): Promise<TheoryCourseStatus> {
  return (await theoryCourseStatuses([candidateId])).get(candidateId)!;
}
