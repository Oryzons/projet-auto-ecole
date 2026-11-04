import { PERMIT_TYPES } from "@/lib/constants";
import { ApplicationStatus } from "@/lib/db/client";
import type { DbRow } from "@/lib/prisma";

/** Couleurs fonctionnelles : bleu actif, vert validé, orange en attente, rouge alerte. */
export type Tone = "neutral" | "active" | "success" | "warning" | "danger";

const DAY = 86_400_000;

export function permitLabel(value: string) {
  return PERMIT_TYPES.find((item) => item.value === value)?.label ?? value;
}

/** Étape du parcours d'un élève, déduite de son dossier, de ses leçons et de ses examens. */
export type StudentStage = "NEW" | "ENROLLING" | "INCOMPLETE" | "VALIDATED" | "TRAINING" | "READY" | "DONE" | "ARCHIVED";

export const STUDENT_STAGE_LABELS: Record<StudentStage, string> = {
  NEW: "Nouveau contact",
  ENROLLING: "Inscription en cours",
  INCOMPLETE: "Dossier incomplet",
  VALIDATED: "Dossier validé",
  TRAINING: "Formation en cours",
  READY: "Prêt pour l'examen",
  DONE: "Formation terminée",
  ARCHIVED: "Archivé",
};

export function studentStage(app: DbRow, now = new Date()): StudentStage {
  if (app.archivedAt) return "ARCHIVED";
  if (app.status === ApplicationStatus.COMPLETED) return "DONE";
  if (app.status === ApplicationStatus.DRAFT) return "NEW";
  if (app.status === ApplicationStatus.DOCUMENTS_PENDING) return "INCOMPLETE";
  if (app.status === ApplicationStatus.DOCUMENTS_REVIEW || app.status === ApplicationStatus.PAYMENT_PENDING) return "ENROLLING";
  const lessons: DbRow[] = app.lessons ?? [];
  const done = lessons.filter((l) => l.status === "DONE").length;
  if (done === 0) return "VALIDATED";
  const exams: DbRow[] = app.exams ?? [];
  const drivingBooked = exams.some((e) => e.kind === "DRIVING" && e.result === "PENDING" && new Date(e.date) >= now);
  const codePassed = exams.some((e) => e.kind === "CODE" && e.result === "PASSED");
  if (codePassed && done >= (app.hoursPlanned ?? 20) - 4 && !drivingBooked) return "READY";
  return "TRAINING";
}

export function taskTone(task: DbRow, now = new Date()): Tone {
  if (task.status === "DONE") return "success";
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (task.dueAt && new Date(task.dueAt) < today) return "danger";
  if (task.priority === "URGENT") return "danger";
  if (task.priority === "HIGH" || (task.dueAt && new Date(task.dueAt).getTime() - today.getTime() < DAY)) return "warning";
  return task.status === "IN_PROGRESS" ? "active" : "neutral";
}

/** Échéances d'un véhicule : dépassée en rouge, sous 30 jours en orange. */
export function vehicleAlerts(vehicle: DbRow, now = new Date()) {
  const checks: [string, Date][] = [
    ["Révision", new Date(vehicle.nextServiceAt ?? NaN)],
    ["Contrôle technique", new Date(vehicle.inspectionExpiresAt ?? NaN)],
    ["Assurance", new Date(vehicle.insuranceExpiresAt ?? NaN)],
  ];
  const alerts: { label: string; tone: Tone }[] = [];
  for (const [label, date] of checks) {
    if (Number.isNaN(date.getTime()) || date.getTime() === 0) continue;
    const days = Math.ceil((date.getTime() - now.getTime()) / DAY);
    if (days < 0) alerts.push({ label: `${label} dépassée de ${-days} j`, tone: "danger" });
    else if (days <= 30) alerts.push({ label: `${label} dans ${days} j`, tone: "warning" });
  }
  if (vehicle.status === "MAINTENANCE") alerts.push({ label: "Au garage", tone: "warning" });
  if (vehicle.status === "OUT_OF_SERVICE") alerts.push({ label: "Hors service", tone: "danger" });
  return alerts.sort((a, b) => (a.tone === "danger" ? -1 : 0) - (b.tone === "danger" ? -1 : 0));
}

export const TASK_STATUS_LABELS: Record<string, string> = { TODO: "À faire", IN_PROGRESS: "En cours", DONE: "Terminée" };
export const TASK_PRIORITY_LABELS: Record<string, string> = { LOW: "Basse", NORMAL: "Normale", HIGH: "Haute", URGENT: "Urgente" };
export const TASK_CATEGORY_LABELS: Record<string, string> = {
  INSCRIPTION: "Inscriptions",
  ADMIN: "Administratif",
  CODE: "Salle de code",
  PLANNING: "Planning",
  VEHICLE: "Parc automobile",
  EXAM: "Examens",
  PAYMENT: "Comptabilité",
  COMMUNICATION: "Communication",
};
