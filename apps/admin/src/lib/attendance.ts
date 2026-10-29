import { createHmac, randomBytes, timingSafeEqual } from "crypto";

/**
 * Appel par QR code.
 *
 * Le QR code contient un code qui change toutes les 15 secondes (HMAC de
 * l'identifiant de séance et du créneau, avec une clé propre à la séance).
 * Une photo du QR code envoyée à un absent ne sert donc qu'une minute et
 * demie, le temps de se connecter s'il le faut.
 */
export const CODE_PERIOD_MS = 15_000;
/** Créneaux précédents encore acceptés (90 s). */
const GRACE_PERIODS = 6;
/** L'appel peut s'ouvrir 2 h avant le début et jusqu'à 12 h après la fin. */
const OPEN_BEFORE_MS = 2 * 60 * 60_000;
const OPEN_AFTER_END_MS = 12 * 60 * 60_000;

export function newAttendanceSecret() {
  return randomBytes(32).toString("base64url");
}

function codeFor(secret: string, sessionId: string, period: number) {
  return createHmac("sha256", secret).update(`${sessionId}:${period}`).digest("base64url").slice(0, 12);
}

export function currentAttendanceCode(secret: string, sessionId: string, now = Date.now()) {
  const period = Math.floor(now / CODE_PERIOD_MS);
  return { code: codeFor(secret, sessionId, period), expiresAt: (period + 1) * CODE_PERIOD_MS };
}

export function verifyAttendanceCode(secret: string, sessionId: string, code: string, now = Date.now()) {
  if (!/^[A-Za-z0-9_-]{12}$/.test(code)) return false;
  const period = Math.floor(now / CODE_PERIOD_MS);
  const given = Buffer.from(code);
  for (let offset = 0; offset <= GRACE_PERIODS; offset++) {
    const expected = Buffer.from(codeFor(secret, sessionId, period - offset));
    if (expected.length === given.length && timingSafeEqual(expected, given)) return true;
  }
  return false;
}

/** Vrai si l'appel peut être ouvert maintenant pour cette séance. */
export function canOpenAttendance(session: { startsAt: Date; durationMinutes: number }, now = Date.now()) {
  const start = session.startsAt.getTime();
  const end = start + session.durationMinutes * 60_000;
  return now >= start - OPEN_BEFORE_MS && now <= end + OPEN_AFTER_END_MS;
}

export type AttendanceState = "not-started" | "open" | "closed";

export function attendanceState(session: { attendanceOpenedAt: Date | null; attendanceClosedAt: Date | null }): AttendanceState {
  if (!session.attendanceOpenedAt) return "not-started";
  return session.attendanceClosedAt ? "closed" : "open";
}
