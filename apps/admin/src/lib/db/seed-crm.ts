import type { Store } from "./engine";

/**
 * Données de démonstration du CRM : véhicules, leçons de conduite, examens et tâches.
 * Elles s'appuient sur les élèves créés par seed() et restent cohérentes avec eux
 * (heures effectuées, moniteur référent, dossiers incomplets…).
 */

const ORG = "org-virage";
const DAY = 86_400_000;
const INSTRUCTORS = ["u-julie", "u-karim", "u-marc"];
const SLOTS = [8, 9, 10, 11, 14, 15, 16, 17];

let state = 7;
const rand = () => {
  state = (state * 1664525 + 1013904223) % 4294967296;
  return state / 4294967296;
};

type Row = Record<string, unknown> & { id: string };

export function seedCrm(store: Store, now: number) {
  state = 7;
  const t = store.tables;
  const ago = (days: number) => new Date(now - days * DAY);
  const dayAt = (offset: number, hour: number) => {
    const d = new Date(now + offset * DAY);
    d.setHours(hour, 0, 0, 0);
    return d;
  };

  const apps = t.permitApplication as Row[];
  const users = new Map((t.user as Row[]).map((u) => [u.id, u]));
  const nameOf = (app: Row) => {
    const u = users.get(app.candidateId as string)!;
    return `${u.firstName} ${u.lastName}`;
  };

  /* ---------- parc automobile ---------- */
  const vehicles = [
    { id: "veh-208", name: "Peugeot 208", plate: "GH-208-VR", transmission: "MANUAL", status: "AVAILABLE", mileage: 41250, service: 38, inspection: 210, insurance: 160, notes: null },
    { id: "veh-clio", name: "Renault Clio V", plate: "FT-512-VR", transmission: "MANUAL", status: "IN_USE", mileage: 68900, service: -4, inspection: 95, insurance: 160, notes: "Révision des 70 000 km dépassée." },
    { id: "veh-yaris", name: "Toyota Yaris Hybride", plate: "GK-731-VR", transmission: "AUTO", status: "AVAILABLE", mileage: 22400, service: 120, inspection: 18, insurance: 160, notes: "Contrôle technique à programmer." },
    { id: "veh-208a", name: "Peugeot 208 EAT8", plate: "GL-044-VR", transmission: "AUTO", status: "MAINTENANCE", mileage: 35120, service: 2, inspection: 300, insurance: 160, notes: "Plaquettes de frein en cours de remplacement au garage." },
    { id: "veh-mt07", name: "Yamaha MT-07 A2", plate: "FZ-907-VR", transmission: "MOTO", status: "AVAILABLE", mileage: 15800, service: 64, inspection: 400, insurance: 25, notes: null },
  ];
  vehicles.forEach((v) =>
    t.vehicle.push({
      id: v.id,
      organizationId: ORG,
      name: v.name,
      plate: v.plate,
      transmission: v.transmission,
      status: v.status,
      mileage: v.mileage,
      nextServiceAt: dayAt(v.service, 9),
      inspectionExpiresAt: dayAt(v.inspection, 9),
      insuranceExpiresAt: dayAt(v.insurance, 9),
      notes: v.notes,
      createdAt: ago(500),
      updatedAt: ago(3),
    }),
  );
  const vehicleFor = (permitType: string) =>
    permitType === "a2" ? "veh-mt07" : permitType === "permis-b-auto" ? "veh-yaris" : rand() > 0.5 ? "veh-208" : "veh-clio";

  /* ---------- leçons de conduite ---------- */
  // créneaux occupés par moniteur, pour ne jamais créer de conflit
  const busy = new Set<string>();
  const book = (instructorId: string, offset: number, hour: number) => {
    const key = `${instructorId}:${offset}:${hour}`;
    if (busy.has(key)) return false;
    busy.add(key);
    return true;
  };
  let lessonCount = 0;
  const lesson = (app: Row, offset: number, hour: number, status: string) => {
    const instructorId = app.instructorId as string;
    if (!book(instructorId, offset, hour)) return;
    const startsAt = dayAt(offset, hour);
    if (startsAt.getDay() === 0) return;
    lessonCount += 1;
    t.drivingLesson.push({
      id: `les-${lessonCount}`,
      organizationId: ORG,
      applicationId: app.id,
      instructorId,
      vehicleId: vehicleFor(app.permitType as string),
      startsAt,
      durationMinutes: 60,
      status,
      notes: status === "CANCELLED" ? "Annulée par l'élève (malade)." : null,
      createdAt: ago(Math.max(1, -offset + 7)),
      updatedAt: ago(Math.max(0, -offset)),
    });
  };

  apps.forEach((app, index) => {
    if (!app.instructorId) return;
    const planned = app.hoursPlanned as number;
    const done =
      app.status === "COMPLETED" ? planned : app.status === "PAID" ? 4 + ((index * 5) % 14) : app.status === "PAYMENT_PENDING" ? index % 3 : 0;
    for (let k = 0; k < done; k++) lesson(app, -2 - k * 3 - (index % 3), SLOTS[(index + k) % SLOTS.length]!, "DONE");
    if (app.status === "PAID") {
      lesson(app, 0, SLOTS[index % SLOTS.length]!, "PLANNED");
      lesson(app, 2 + (index % 3), SLOTS[(index + 3) % SLOTS.length]!, "PLANNED");
      lesson(app, 6 + (index % 4), SLOTS[(index + 5) % SLOTS.length]!, "PLANNED");
      if (index % 4 === 1) lesson(app, -1, SLOTS[(index + 6) % SLOTS.length]!, "CANCELLED");
    }
    if (app.status === "PAYMENT_PENDING" && index % 2 === 0) lesson(app, 1 + (index % 4), SLOTS[(index + 2) % SLOTS.length]!, "PLANNED");
  });

  /* ---------- examens ---------- */
  let examCount = 0;
  const exam = (app: Row, kind: string, offset: number, result: string) => {
    examCount += 1;
    t.exam.push({
      id: `exa-${examCount}`,
      organizationId: ORG,
      applicationId: app.id,
      kind,
      date: dayAt(offset, kind === "CODE" ? 9 : 8 + (examCount % 4)),
      location: kind === "CODE" ? "La Poste · Lyon Jean Macé" : "Centre d'examen de Vénissieux",
      result,
      createdAt: ago(Math.max(5, -offset + 20)),
      updatedAt: ago(Math.max(0, -offset)),
    });
  };
  apps.forEach((app, index) => {
    if (app.status === "COMPLETED") {
      exam(app, "CODE", -90 - index, "PASSED");
      exam(app, "DRIVING", -8 - (index % 5), "PASSED");
    }
    if (app.status === "PAID") {
      if (index % 3 === 0) exam(app, "CODE", -40 - index, "PASSED");
      if (index % 3 === 1) exam(app, "CODE", 3 + (index % 6), "PENDING");
      if (index % 3 === 0 && index % 2 === 1) exam(app, "DRIVING", 9 + (index % 7), "PENDING");
      if (index === 7) exam(app, "DRIVING", -12, "FAILED");
    }
  });

  /* ---------- tâches ---------- */
  const byName = (first: string) => apps.find((a) => users.get(a.candidateId as string)?.firstName === first)!;
  const tasks: {
    title: string;
    description?: string;
    category: string;
    assignee: string | null;
    due: number | null;
    priority: string;
    status: string;
    student?: string;
    vehicle?: string;
  }[] = [
    { title: "Relancer pour l'attestation JDC", description: "Pièce manquante depuis plus de 10 jours.", category: "ADMIN", assignee: "u-sophie", due: -2, priority: "HIGH", status: "TODO", student: "Hugo" },
    { title: "Vérifier le justificatif de domicile", category: "ADMIN", assignee: "u-thomas", due: 0, priority: "NORMAL", status: "IN_PROGRESS", student: "Sarah" },
    { title: "Contrôler les pièces du dossier", description: "4 pièces déposées, à vérifier une par une.", category: "ADMIN", assignee: "u-sophie", due: 1, priority: "NORMAL", status: "TODO", student: "Lucas" },
    { title: "Demander le numéro NEPH à l'ANTS", category: "ADMIN", assignee: "u-thomas", due: -1, priority: "URGENT", status: "TODO", student: "Adam" },
    { title: "Confirmer l'inscription", description: "Rappeler pour choisir la formule et le moniteur.", category: "INSCRIPTION", assignee: "u-sophie", due: 0, priority: "HIGH", status: "TODO", student: "Lina" },
    { title: "Envoyer le contrat de formation", category: "INSCRIPTION", assignee: "u-thomas", due: 2, priority: "NORMAL", status: "TODO", student: "Camille" },
    { title: "Relancer le 2e versement", description: "Échéance du paiement en 3 fois dépassée.", category: "PAYMENT", assignee: "u-sophie", due: -3, priority: "HIGH", status: "TODO", student: "Chloé" },
    { title: "Confirmer la réception du virement", category: "PAYMENT", assignee: "u-thomas", due: 0, priority: "NORMAL", status: "IN_PROGRESS", student: "Louis" },
    { title: "Préparer l'examen pratique", description: "Faire un examen blanc sur le parcours de Vénissieux.", category: "EXAM", assignee: "u-karim", due: 4, priority: "NORMAL", status: "TODO", student: "Léo" },
    { title: "Inscrire à l'examen du code", category: "EXAM", assignee: "u-sophie", due: -1, priority: "HIGH", status: "TODO", student: "Zoé" },
    { title: "Programmer la révision des 70 000 km", category: "VEHICLE", assignee: "u-thomas", due: -4, priority: "URGENT", status: "TODO", vehicle: "veh-clio" },
    { title: "Prendre rendez-vous au contrôle technique", category: "VEHICLE", assignee: "u-thomas", due: 7, priority: "NORMAL", status: "TODO", vehicle: "veh-yaris" },
    { title: "Récupérer la 208 EAT8 au garage", category: "VEHICLE", assignee: "u-marc", due: 2, priority: "NORMAL", status: "IN_PROGRESS", vehicle: "veh-208a" },
    { title: "Reprogrammer la leçon annulée", category: "PLANNING", assignee: "u-julie", due: 0, priority: "NORMAL", status: "TODO", student: "Emma" },
    { title: "Planifier les leçons de la semaine prochaine", category: "PLANNING", assignee: "u-sophie", due: 3, priority: "LOW", status: "TODO" },
    { title: "Répondre aux messages non lus", category: "COMMUNICATION", assignee: "u-sophie", due: 0, priority: "NORMAL", status: "TODO" },
    { title: "Envoyer le rappel de la séance de code", category: "CODE", assignee: "u-julie", due: 1, priority: "LOW", status: "TODO" },
    { title: "Corriger l'examen blanc de mardi", category: "CODE", assignee: "u-karim", due: -1, priority: "NORMAL", status: "DONE" },
    { title: "Valider le dossier complet", category: "ADMIN", assignee: "u-sophie", due: -6, priority: "NORMAL", status: "DONE", student: "Nathan" },
  ];
  tasks.forEach((task, i) => {
    const app = task.student ? byName(task.student) : null;
    const vehicle = task.vehicle ? vehicles.find((v) => v.id === task.vehicle)! : null;
    const created = ago(4 + (i % 6));
    const history: { at: string; userId: string | null; action: string }[] = [{ at: created.toISOString(), userId: "u-sophie", action: "Tâche créée" }];
    if (task.status !== "TODO") history.push({ at: ago(1).toISOString(), userId: task.assignee, action: task.status === "DONE" ? "Marquée terminée" : "Passée en cours" });
    t.task.push({
      id: `tsk-${i + 1}`,
      organizationId: ORG,
      title: task.title,
      description: task.description ?? null,
      category: task.category,
      assigneeId: task.assignee,
      dueAt: task.due === null ? null : dayAt(task.due, 18),
      priority: task.priority,
      status: task.status,
      entityType: app ? "APPLICATION" : vehicle ? "VEHICLE" : null,
      entityId: app?.id ?? vehicle?.id ?? null,
      entityLabel: app ? nameOf(app) : vehicle ? `${vehicle.name} · ${vehicle.plate}` : null,
      history,
      completedAt: task.status === "DONE" ? ago(1) : null,
      createdAt: created,
      updatedAt: ago(task.status === "TODO" ? 4 : 1),
    });
  });
}
