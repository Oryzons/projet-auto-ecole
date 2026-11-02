import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { z } from "zod";

import { getAdminUsers } from "@/lib/applications";
import {
  attendanceState,
  canOpenAttendance,
  currentAttendanceCode,
  newAttendanceSecret,
} from "@/lib/attendance";
import { sendPendingCodeExamEmails } from "@/lib/code-exam-emails";
import { sendAttendanceReportEmail } from "@/lib/email";
import { prisma, type DbRow } from "@/lib/prisma";
import { requestOrigin } from "@/lib/request-origin";
import { publishToAdmins } from "@/lib/sse-broker";
import { getStaffUser, sessionEmailInfo } from "@/lib/theory-sessions";

type Params = { params: Promise<{ id: string }> };

async function loadSession(id: string, organizationId: string) {
  return prisma.theorySession.findFirst({
    where: { id, organizationId },
    include: {
      registrations: {
        orderBy: { createdAt: "asc" },
        include: { candidate: { select: { id: true, firstName: true, lastName: true, phone: true } } },
      },
    },
  });
}

type LoadedSession = NonNullable<Awaited<ReturnType<typeof loadSession>>>;

async function payload(session: LoadedSession, origin: string) {
  const state = attendanceState(session);
  let qr: { url: string; image: string; expiresAt: number } | null = null;
  if (state === "open" && session.attendanceSecret) {
    const { code, expiresAt } = currentAttendanceCode(session.attendanceSecret, session.id);
    const base = (process.env.APP_URL || origin).replace(/\/$/, "");
    const url = `${base}/presence?s=${encodeURIComponent(session.id)}&c=${code}`;
    const image = await QRCode.toDataURL(url, { margin: 1, width: 640, errorCorrectionLevel: "M", color: { dark: "#0b2545", light: "#ffffff" } });
    qr = { url, image, expiresAt };
  }
  return {
    session: {
      id: session.id,
      title: session.title,
      location: session.location,
      startsAt: session.startsAt,
      durationMinutes: session.durationMinutes,
      capacity: session.capacity,
      attendanceOpenedAt: session.attendanceOpenedAt,
      attendanceClosedAt: session.attendanceClosedAt,
    },
    state,
    canOpen: canOpenAttendance(session),
    qr,
    serverNow: Date.now(),
    registrations: session.registrations.map((r: DbRow) => ({
      id: r.id,
      attendedAt: r.attendedAt,
      attendanceMethod: r.attendanceMethod,
      candidate: r.candidate,
    })),
  };
}

/** État de l'appel, QR code courant et liste des inscrits (admin ou moniteur). */
export async function GET(req: Request, { params }: Params) {
  const staff = await getStaffUser();
  if (!staff) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const { id } = await params;
  const session = await loadSession(id, staff.organizationId);
  if (!session) return NextResponse.json({ error: "Séance introuvable" }, { status: 404 });
  return NextResponse.json(await payload(session, requestOrigin(req)), { headers: { "Cache-Control": "no-store" } });
}

const actionSchema = z.object({ action: z.enum(["open", "close"]) });

/** Ouvre ou clôture l'appel. La clôture envoie le relevé aux administrateurs. */
export async function POST(req: Request, { params }: Params) {
  const staff = await getStaffUser();
  if (!staff) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const parsed = actionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Action invalide" }, { status: 400 });
  const { id } = await params;
  const existing = await loadSession(id, staff.organizationId);
  if (!existing) return NextResponse.json({ error: "Séance introuvable" }, { status: 404 });

  if (parsed.data.action === "open") {
    if (!canOpenAttendance(existing)) {
      return NextResponse.json(
        { error: "L'appel s'ouvre le jour de la séance, à partir de 2 h avant le début." },
        { status: 400 },
      );
    }
    await prisma.theorySession.update({
      where: { id },
      data: {
        attendanceSecret: existing.attendanceSecret ?? newAttendanceSecret(),
        attendanceOpenedAt: existing.attendanceOpenedAt ?? new Date(),
        attendanceClosedAt: null,
      },
    });
  } else {
    if (attendanceState(existing) !== "open") {
      return NextResponse.json({ error: "L'appel n'est pas en cours." }, { status: 400 });
    }
    await prisma.theorySession.update({ where: { id }, data: { attendanceClosedAt: new Date() } });

    // Relevé envoyé aux administrateurs (sans bloquer la réponse en cas d'échec d'envoi).
    const present = existing.registrations.filter((r: DbRow) => r.attendedAt).map((r: DbRow) => `${r.candidate.firstName} ${r.candidate.lastName}`);
    const absent = existing.registrations.filter((r: DbRow) => !r.attendedAt).map((r: DbRow) => `${r.candidate.firstName} ${r.candidate.lastName}`);
    const takenBy = `${staff.firstName} ${staff.lastName}${staff.role === "SKIPPER" ? " (moniteur)" : ""}`;
    const info = sessionEmailInfo(existing);
    // Les présents reçoivent leur numéro NEPH et les instructions pour l'examen du code.
    const { missing } = await sendPendingCodeExamEmails({ sessionId: id });
    const admins = await getAdminUsers(staff.organizationId);
    await Promise.allSettled(admins.map((admin) => sendAttendanceReportEmail(admin.email, info, present, absent, takenBy, missing)));
    publishToAdmins(staff.organizationId, {
      type: "session",
      data: { sessionId: id, attendance: "closed", present: present.length, total: present.length + absent.length, title: existing.title },
    });
  }

  const session = await loadSession(id, staff.organizationId);
  return NextResponse.json(await payload(session!, requestOrigin(req)));
}

const markSchema = z.object({ registrationId: z.string().min(1).max(64), present: z.boolean() });

/** Pointage manuel d'un élève (présent ou absent). */
export async function PATCH(req: Request, { params }: Params) {
  const staff = await getStaffUser();
  if (!staff) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const parsed = markSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  const { id } = await params;
  const { count } = await prisma.sessionRegistration.updateMany({
    where: { id: parsed.data.registrationId, sessionId: id, session: { organizationId: staff.organizationId } },
    data: parsed.data.present
      ? { attendedAt: new Date(), attendanceMethod: "manual" }
      : { attendedAt: null, attendanceMethod: null },
  });
  if (count === 0) return NextResponse.json({ error: "Inscription introuvable" }, { status: 404 });
  // Pointé présent après la fin de l'appel : il reçoit aussi l'email de l'examen du code.
  if (parsed.data.present) await sendPendingCodeExamEmails({ sessionId: id });
  return NextResponse.json({ ok: true });
}
