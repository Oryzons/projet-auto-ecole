import { DEMO_VEHICLES, demoLessons } from "@virage/shared/demo";

import type { Store } from "./engine";

/**
 * Données de démonstration du CRM : véhicules, leçons de conduite, examens et tâches.
 * Elles s'appuient sur les élèves créés par seed() et restent cohérentes avec eux
 * (heures effectuées, moniteur référent, dossiers incomplets…).
 */

const ORG = "org-virage";
const DAY = 86_400_000;

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
  // même parc que l'app mobile
  const vehicles = DEMO_VEHICLES;
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
      fuel: v.fuel,
      permitCategory: v.permitCategory,
      dualControls: v.transmission !== "MOTO",
      color: v.color,
      vin: null,
      firstRegistrationAt: new Date(`${v.year}-03-15T09:00:00`),
      nextServiceMileage: Math.ceil((v.mileage + 1) / 10_000) * 10_000,
      insurer: v.insurer,
      insurancePolicy: v.policy,
      createdAt: ago(500),
      updatedAt: ago(3),
    }),
  );
  /* ---------- leçons de conduite ---------- */
  // calculées dans @virage/shared/demo : l'élève et le moniteur voient les mêmes dans l'app
  demoLessons(now).forEach((l) => {
    t.drivingLesson.push({
      id: l.id,
      organizationId: ORG,
      applicationId: `app-${l.studentId.slice(2)}`,
      instructorId: l.instructorId,
      vehicleId: l.vehicleId,
      startsAt: l.startsAt,
      durationMinutes: l.durationMinutes,
      status: l.status,
      notes: l.notes,
      meetingPoint: l.place,
      createdAt: ago(Math.max(1, Math.round((now - l.startsAt.getTime()) / DAY) + 7)),
      updatedAt: ago(Math.max(0, Math.round((now - l.startsAt.getTime()) / DAY))),
    });
  });

  /* ---------- comptes rendus des leçons, documents et journal des véhicules ---------- */
  const CAR_ISSUES = [
    { label: "Bruit au freinage", severity: "WARNING", detail: "Grincement à l'avant gauche en fin de freinage." },
    { label: "Voyant pression des pneus", severity: "INFO", detail: "Allumé au démarrage, pression à vérifier." },
    { label: "Rétroviseur droit desserré", severity: "INFO", detail: null },
    { label: "Embrayage qui patine", severity: "URGENT", detail: "Patine en côte en 2e, à faire contrôler rapidement." },
    { label: "Rayure pare-chocs arrière", severity: "INFO", detail: "Manœuvre de créneau, rayure légère." },
    { label: "Essuie-glace avant usé", severity: "INFO", detail: "Traces sur le pare-brise." },
  ];
  const MOTO_ISSUES = [
    { label: "Chaîne détendue", severity: "WARNING", detail: "À retendre et graisser." },
    { label: "Levier d'embrayage tordu", severity: "INFO", detail: "Chute à l'arrêt sur le plateau." },
  ];
  const CAR_SKILLS = ["Démarrage en côte", "Insertion sur voie rapide", "Créneau", "Ronds-points", "Conduite en ville", "Freinage d'urgence", "Rangement en bataille"];
  const MOTO_SKILLS = ["Slalom", "Freinage d'urgence", "Évitement", "Circulation en ville", "Plateau lent"];
  const COMMENTS = [
    "Bonne leçon, l'élève gagne en assurance.",
    "Regards encore trop courts, à retravailler.",
    "Très bonne gestion des intersections.",
    "Stress sur voie rapide, à reprendre la prochaine fois.",
    null,
  ];
  const FUELS = ["FULL", "THREE_QUARTERS", "HALF", "QUARTER"];
  const staffName = (id: string) => {
    const u = users.get(id);
    return u ? `${u.firstName} ${u.lastName}` : null;
  };
  for (const v of vehicles) {
    const moto = v.transmission === "MOTO";
    const done = (t.drivingLesson as Row[])
      .filter((l) => l.vehicleId === v.id && l.status === "DONE")
      .sort((a, b) => (b.startsAt as Date).getTime() - (a.startsAt as Date).getTime());
    let km = v.mileage - 30;
    done.forEach((l, i) => {
      const driven = 14 + Math.round(rand() * 28);
      const issues = rand() < 0.12 ? [(moto ? MOTO_ISSUES : CAR_ISSUES)[Math.floor(rand() * (moto ? MOTO_ISSUES : CAR_ISSUES).length)]!] : [];
      const skills = moto ? MOTO_SKILLS : CAR_SKILLS;
      const end = new Date((l.startsAt as Date).getTime() + Number(l.durationMinutes ?? 60) * 60_000 + 5 * 60_000);
      l.report = {
        kmStart: km - driven,
        kmEnd: km,
        fuelLevel: FUELS[(i + driven) % FUELS.length],
        issues,
        skills: [skills[i % skills.length]!, skills[(i + 3) % skills.length]!],
        comment: COMMENTS[(i + driven) % COMMENTS.length] ?? null,
        submittedAt: end.toISOString(),
      };
      km -= driven + Math.round(rand() * 12);
    });

    const year = new Date(`${v.year}-03-15T09:00:00`);
    const iso = (d: Date) => d.toISOString().slice(0, 10);
    const insuranceEnd = dayAt(v.insurance, 9);
    const inspectionEnd = dayAt(v.inspection, 9);
    const doc = (id: string, type: string, issued: Date, expires: Date | null, comment: string | null, addedDaysAgo: number) => ({
      id: `${v.id}-${id}`,
      type,
      title: null,
      issuedAt: iso(issued),
      expiresAt: expires ? iso(expires) : null,
      comment,
      file: null,
      addedAt: ago(addedDaysAgo).toISOString(),
      addedBy: "Sophie Laurent",
    });
    const vehicle = (t.vehicle as Row[]).find((row) => row.id === v.id)!;
    vehicle.documents = [
      doc("cg", "REGISTRATION", year, null, `Certificat d'immatriculation ${v.plate}, original rangé dans le coffre de l'accueil.`, 480),
      doc("ins", "INSURANCE", new Date(insuranceEnd.getTime() - 365 * DAY), insuranceEnd, `Contrat ${v.policy} chez ${v.insurer}, flotte auto-école.`, 200),
      doc("ct", "INSPECTION", new Date(inspectionEnd.getTime() - 730 * DAY), inspectionEnd, moto ? "Favorable, aucune défaillance." : "Favorable, défaillance mineure : usure des balais d'essuie-glace.", 300),
      ...(v.id === "veh-208a" ? [doc("rep", "REPAIR", ago(2), null, "Devis plaquettes et disques avant : 286 € TTC, garage Martin.", 2)] : []),
    ];
    const entry = (id: string, kind: string, daysAgo: number, text: string, author = "Sophie Laurent") => ({ id: `${v.id}-j${id}`, at: ago(daysAgo).toISOString(), kind, text, author });
    vehicle.journal = [
      entry("1", "UPDATE", 500, "Véhicule ajouté au parc"),
      entry("2", "REPAIR", 140, moto ? "Pneu arrière remplacé (Michelin Road 6)." : "Pneus avant remplacés, parallélisme refait.", "Thomas Girard"),
      ...(v.id === "veh-clio" ? [entry("3", "ISSUE", 4, "Révision des 70 000 km dépassée, rendez-vous à prendre au garage.", "Thomas Girard")] : []),
      ...(v.id === "veh-208a" ? [entry("3", "ISSUE", 3, "Plaquettes de frein avant usées, véhicule immobilisé.", staffName("u-marc") ?? "Marc Dubois")] : []),
      ...(v.id === "veh-yaris" ? [entry("3", "NOTE", 6, "Contrôle technique à programmer avant la fin du mois.")] : []),
    ];
  }

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
    /** autres responsables et élèves, pour montrer les tâches partagées */
    also?: string[];
    more?: string[];
  }[] = [
    { title: "Relancer pour l'attestation JDC", description: "Pièce manquante depuis plus de 10 jours.", category: "ADMIN", assignee: "u-sophie", due: -2, priority: "HIGH", status: "TODO", student: "Hugo" },
    { title: "Vérifier le justificatif de domicile", category: "ADMIN", assignee: "u-thomas", due: 0, priority: "NORMAL", status: "IN_PROGRESS", student: "Sarah" },
    { title: "Contrôler les pièces du dossier", description: "4 pièces déposées, à vérifier une par une.", category: "ADMIN", assignee: "u-sophie", due: 1, priority: "NORMAL", status: "TODO", student: "Lucas" },
    { title: "Demander le numéro NEPH à l'ANTS", category: "ADMIN", assignee: "u-thomas", due: -1, priority: "URGENT", status: "TODO", student: "Adam" },
    { title: "Confirmer l'inscription", description: "Rappeler pour choisir la formule et le moniteur.", category: "INSCRIPTION", assignee: "u-sophie", due: 0, priority: "HIGH", status: "TODO", student: "Lina" },
    { title: "Envoyer le contrat de formation", category: "INSCRIPTION", assignee: "u-thomas", due: 2, priority: "NORMAL", status: "TODO", student: "Camille" },
    { title: "Relancer le 2e versement", description: "Échéance du paiement en 3 fois dépassée.", category: "PAYMENT", assignee: "u-sophie", due: -3, priority: "HIGH", status: "TODO", student: "Chloé" },
    { title: "Confirmer la réception du virement", category: "PAYMENT", assignee: "u-thomas", due: 0, priority: "NORMAL", status: "IN_PROGRESS", student: "Louis" },
    { title: "Préparer l'examen pratique", description: "Faire un examen blanc sur le parcours de Vénissieux.", category: "EXAM", assignee: "u-karim", due: 4, priority: "NORMAL", status: "TODO", student: "Léo", also: ["u-julie"], more: ["Zoé"] },
    { title: "Inscrire à l'examen du code", category: "EXAM", assignee: "u-sophie", due: -1, priority: "HIGH", status: "TODO", student: "Zoé" },
    { title: "Programmer la révision des 70 000 km", category: "VEHICLE", assignee: "u-thomas", due: -4, priority: "URGENT", status: "TODO", vehicle: "veh-clio", also: ["u-marc"] },
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
      assigneeIds: task.assignee ? [task.assignee, ...(task.also ?? [])] : [],
      links: [
        ...(app ? [{ type: "APPLICATION", id: app.id, label: nameOf(app) }] : []),
        ...(task.more ?? []).map((first) => ({ type: "APPLICATION", id: byName(first).id, label: nameOf(byName(first)) })),
        ...(vehicle ? [{ type: "VEHICLE", id: vehicle.id, label: `${vehicle.name} · ${vehicle.plate}` }] : []),
      ],
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
