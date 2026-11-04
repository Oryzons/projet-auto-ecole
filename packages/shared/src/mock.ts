/**
 * Données fictives pour la maquette. Elles seront remplacées par l'API
 * quand le backend sera branché : les types ci-dessous servent de premier contrat.
 */

import {
  DEMO_INSTRUCTOR_ID,
  DEMO_INSTRUCTORS,
  DEMO_STUDENT_ID,
  DEMO_STUDENTS,
  DEMO_VEHICLES,
  PERMIT_LABELS,
  PERMIT_PRICES,
  dateShort,
  dayShort,
  demoLessons,
  endOf,
  hhmm,
  sameDay,
  staffName,
  studentById,
  studentDocs,
  vehicleLabel,
  type DemoLesson,
  type DemoStudent,
} from './demo';
import type { Tone } from './theme';

/*
 * Les élèves, moniteurs, véhicules et leçons viennent de ./demo, la même source
 * que le site admin : ce que l'élève voit dans l'app correspond au planning du
 * moniteur et à celui de l'administration.
 */
const NOW = Date.now();
const TODAY = new Date(NOW);
const ALL_LESSONS = demoLessons(NOW);
const me = studentById(DEMO_STUDENT_ID)!;
const fullName = (s: DemoStudent) => `${s.firstName} ${s.lastName}`;
const isPast = (l: DemoLesson) => endOf(l).getTime() <= NOW;
const myLessons = ALL_LESSONS.filter((l) => l.studentId === me.id && l.status !== 'CANCELLED');
const myUpcoming = myLessons.filter((l) => !isPast(l) && l.status === 'PLANNED');
const myDone = myLessons.filter((l) => l.status === 'DONE');

export const school = { name: 'Virage', city: 'Lyon 7e', phone: '04 78 00 00 00' };

/* ---------- Élève connecté ---------- */

export const student = {
  id: me.id,
  firstName: me.firstName,
  lastName: me.lastName,
  email: 'lucas.martin@email.fr',
  phone: me.phone,
  birthDate: '14/03/2007',
  address: '12 rue Garibaldi, 69007 Lyon',
  licence: PERMIT_LABELS[me.permitType] ?? 'Permis B',
  formula: `Forfait ${me.hoursPlanned} h`,
  fileNumber: 'VRG-2026-0148',
  goalDate: 'Objectif : mars 2027',
  availability: 'Soirs en semaine et samedi matin',
  status: 'Dossier en cours de validation',
  instructor: staffName(me.instructorId),
  code: { score: 32, max: 40, series: 18, seriesTotal: 25, ratio: 0.82 },
  driving: { done: myDone.length, total: me.hoursPlanned, skills: 9, skillsTotal: 22 },
  balance: {
    // heures du forfait ni faites ni déjà réservées
    remainingHours: Math.max(0, me.hoursPlanned - myDone.length - myUpcoming.length),
    due: PERMIT_PRICES[me.permitType]! / 100 / (me.installments ?? 1),
    paid: ((PERMIT_PRICES[me.permitType]! / 100) * (me.paidInstallments ?? 0)) / (me.installments ?? 1),
    total: PERMIT_PRICES[me.permitType]! / 100,
  },
};

export type DocStatus = 'accepted' | 'pending' | 'refused' | 'missing';

export const docStatus: Record<DocStatus, { label: string; tone: Tone }> = {
  accepted: { label: 'Accepté', tone: 'success' },
  pending: { label: 'En vérification', tone: 'warning' },
  refused: { label: 'Refusé', tone: 'danger' },
  missing: { label: 'À déposer', tone: 'neutral' },
};

const DOC_NAMES = { ID_CARD: "Pièce d'identité", ID_PHOTO: 'Photo e-photo (ANTS)', PROOF_OF_ADDRESS: 'Justificatif de domicile', ASSR: 'ASSR 2 ou ASR', JDC: 'Attestation JDC' } as const;
const DOC_STATUS = { APPROVED: 'accepted', PENDING: 'pending', REJECTED: 'refused' } as const;
const myDocs = studentDocs(me);

/** Mêmes pièces et mêmes états que dans le dossier de l'élève sur le site admin */
export const documents: { id: string; name: string; status: DocStatus; note?: string }[] = (Object.keys(DOC_NAMES) as (keyof typeof DOC_NAMES)[]).map((type, i) => {
  const state = myDocs[type];
  const status: DocStatus = state ? DOC_STATUS[state] : 'missing';
  return {
    id: `d${i + 1}`,
    name: DOC_NAMES[type],
    status,
    ...(status === 'refused' && type === 'PROOF_OF_ADDRESS' ? { note: 'Document de plus de 6 mois, merci d’en déposer un récent.' } : {}),
  };
});

/* ---------- Leçons ---------- */

export type Lesson = {
  id: string;
  day: string;
  date: string;
  start: string;
  end: string;
  type: 'Conduite' | 'Code' | 'Examen blanc' | 'Examen';
  instructor: string;
  vehicle?: string;
  place: string;
  student?: string;
  status?: 'confirmed' | 'todo' | 'done';
  /** début de la leçon (horodatage), pour les « demain », « dans 2 h »… */
  at?: number;
};

const toLesson = (l: DemoLesson): Lesson => ({
  id: l.id,
  day: dayShort(l.startsAt),
  date: dateShort(l.startsAt),
  start: hhmm(l.startsAt),
  end: hhmm(endOf(l)),
  type: 'Conduite',
  instructor: staffName(l.instructorId),
  vehicle: vehicleLabel(l.vehicleId),
  place: l.place,
  student: fullName(studentById(l.studentId)!),
  status: l.status === 'DONE' ? 'done' : 'confirmed',
  at: l.startsAt.getTime(),
});

/** Prochaines leçons de l'élève connecté : celles du planning admin */
export const upcomingLessons: Lesson[] = myUpcoming.map(toLesson);

export const pastLessons: Lesson[] = myDone.slice(-5).reverse().map(toLesson);

/** Créneaux libres proposés à la réservation */
export const bookingDays = [
  { key: '28', day: 'Mer.', date: '28' },
  { key: '29', day: 'Jeu.', date: '29' },
  { key: '30', day: 'Ven.', date: '30' },
  { key: '31', day: 'Sam.', date: '31' },
  { key: '02', day: 'Lun.', date: '2' },
  { key: '03', day: 'Mar.', date: '3' },
  { key: '04', day: 'Mer.', date: '4' },
];

export const bookingSlots = [
  { id: 'b1', start: '08:00', end: '09:00', instructor: 'Julie Bernard', free: true },
  { id: 'b2', start: '10:00', end: '11:00', instructor: 'Karim Haddad', free: true },
  { id: 'b3', start: '11:00', end: '12:00', instructor: 'Julie Bernard', free: false },
  { id: 'b4', start: '14:00', end: '15:00', instructor: 'Sophie Laurent', free: true },
  { id: 'b5', start: '17:30', end: '18:30', instructor: 'Julie Bernard', free: true },
  { id: 'b6', start: '18:30', end: '19:30', instructor: 'Karim Haddad', free: false },
];

/* ---------- Formation ---------- */

export const codeThemes = [
  { id: 't1', title: 'Signalisation', progress: 0.55, icon: 'signpost' as const },
  { id: 't2', title: 'Prise de risques', progress: 0.65, icon: 'alert' as const },
  { id: 't3', title: 'Priorités et intersections', progress: 0.9, icon: 'signpost' as const },
];

/* ---------- Progression REMC ---------- */

export type SkillLevel = 0 | 1 | 2 | 3; // non abordé, abordé, traité, maîtrisé

export const skillLevels: { label: string; tone: Tone }[] = [
  { label: 'Non abordé', tone: 'neutral' },
  { label: 'Abordé', tone: 'warning' },
  { label: 'Traité', tone: 'primary' },
  { label: 'Maîtrisé', tone: 'success' },
];

export const remc: { id: string; code: string; title: string; items: { label: string; level: SkillLevel }[] }[] = [
  {
    id: 'c1',
    code: 'C1',
    title: 'Maîtriser le maniement du véhicule dans un trafic faible ou nul',
    items: [
      { label: 'Connaître les principaux organes et commandes', level: 3 },
      { label: 'Entrer, s’installer au poste de conduite et en sortir', level: 3 },
      { label: 'Tenir, tourner le volant et maintenir la trajectoire', level: 3 },
      { label: 'Démarrer et s’arrêter', level: 3 },
      { label: 'Doser l’accélération et le freinage', level: 2 },
      { label: 'Utiliser la boîte de vitesses', level: 2 },
      { label: 'Diriger la voiture en avant et en arrière', level: 2 },
      { label: 'Regarder autour de soi et avertir', level: 2 },
    ],
  },
  {
    id: 'c2',
    code: 'C2',
    title: 'Appréhender la route et circuler dans des conditions normales',
    items: [
      { label: 'Rechercher la signalisation et les indices utiles', level: 2 },
      { label: 'Positionner le véhicule sur la chaussée', level: 2 },
      { label: 'Adapter l’allure aux situations', level: 1 },
      { label: 'Détecter, identifier et franchir les intersections', level: 1 },
      { label: 'Tourner à droite et à gauche en agglomération', level: 1 },
      { label: 'Franchir les ronds-points et carrefours à sens giratoire', level: 1 },
      { label: 'S’arrêter et stationner', level: 0 },
    ],
  },
  {
    id: 'c3',
    code: 'C3',
    title: 'Circuler dans des conditions difficiles et partager la route',
    items: [
      { label: 'Évaluer et maintenir les distances de sécurité', level: 1 },
      { label: 'Croiser, dépasser, être dépassé', level: 0 },
      { label: 'Passer des virages et conduire en déclivité', level: 0 },
      { label: 'Connaître les caractéristiques des autres usagers', level: 0 },
      { label: 'S’insérer, circuler et sortir d’une voie rapide', level: 0 },
      { label: 'Conduire dans une file de véhicules et dans une circulation dense', level: 0 },
      { label: 'Conduire quand l’adhérence et la visibilité sont réduites', level: 0 },
    ],
  },
  {
    id: 'c4',
    code: 'C4',
    title: 'Pratiquer une conduite autonome, sûre et économique',
    items: [
      { label: 'Suivre un itinéraire de manière autonome', level: 0 },
      { label: 'Préparer et effectuer un voyage longue distance', level: 0 },
      { label: 'Connaître les situations de défaillance du véhicule', level: 0 },
      { label: 'Pratiquer l’écoconduite', level: 0 },
    ],
  },
];

/* ---------- Messagerie ---------- */

export type Conversation = {
  id: string;
  name: string;
  role: string;
  date: string;
  last: string;
  unread?: number;
  read?: boolean;
};

export const conversations: Conversation[] = [
  { id: 'julie', name: 'Julie Bernard', role: 'Monitrice · Permis B', date: '09:12', last: 'Pense à prendre tes lunettes samedi, on part sur le périphérique 🙂', unread: 1 },
  { id: 'accueil', name: 'Accueil Virage', role: 'Secrétariat', date: 'Hier', last: 'Votre justificatif de domicile a été refusé : il date de plus de 6 mois.', unread: 2 },
  { id: 'karim', name: 'Karim Haddad', role: 'Moniteur · Permis B', date: 'Lun.', last: 'Très bonne séance, on travaillera les ronds-points la prochaine fois.' },
  { id: 'compta', name: 'Comptabilité', role: 'Paiements et factures', date: '21 oct.', last: 'Votre facture n°F-2026-0312 est disponible.', read: true },
  { id: 'examens', name: 'Service examens', role: 'Inscriptions et convocations', date: '15 oct.', last: 'Vous êtes inscrit à la session de code du 12 novembre.' },
];

export const messages: { id: string; from: 'me' | 'them'; name: string; time: string; text: string; day?: string }[] = [
  { id: 'm1', day: 'Hier', from: 'them', name: 'Julie Bernard', time: '18:42', text: 'Bonsoir Lucas ! Bravo pour la leçon d’aujourd’hui, ton démarrage en côte est beaucoup plus fluide.' },
  { id: 'm2', from: 'me', name: 'Moi', time: '18:55', text: 'Merci ! On peut travailler le créneau samedi ?' },
  { id: 'm3', from: 'them', name: 'Julie Bernard', time: '19:01', text: 'Oui bien sûr, on commencera par ça avant de partir sur le périph.' },
  { id: 'm4', from: 'me', name: 'Moi', time: '19:03', text: 'Parfait, à samedi 9 h devant le lycée Récamier.' },
  { id: 'm5', from: 'them', name: 'Julie Bernard', time: '19:04', text: 'Ça marche, bonne soirée !' },
  { id: 'm6', day: 'Aujourd’hui · 1 nouveau message', from: 'them', name: 'Julie Bernard', time: '09:12', text: 'Pense à prendre tes lunettes samedi, on part sur le périphérique 🙂' },
];

/* ---------- Paiements ---------- */

export const invoices = [
  { id: 'F-2026-0312', label: 'Forfait 20 h · 2e échéance', date: '21 oct. 2026', amount: 450, status: 'paid' as const },
  { id: 'F-2026-0277', label: 'Forfait 20 h · 1re échéance', date: '21 sept. 2026', amount: 450, status: 'paid' as const },
  { id: 'F-2026-0401', label: 'Forfait 20 h · 3e échéance', date: '21 nov. 2026', amount: 450, status: 'due' as const },
];

/* ---------- Moniteur ---------- */

const meInstructor = DEMO_INSTRUCTORS.find((i) => i.id === DEMO_INSTRUCTOR_ID)!;
export const instructor = {
  id: meInstructor.id,
  firstName: meInstructor.firstName,
  name: staffName(meInstructor.id),
  licence: 'Permis B · BEPECASER',
  vehicle: vehicleLabel(meInstructor.vehicleId),
};

/** Semaine en cours, du lundi au samedi */
const monday = new Date(TODAY);
monday.setHours(0, 0, 0, 0);
monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
export const instructorDays = DAY_KEYS.map((key, i) => {
  const d = new Date(monday);
  d.setDate(d.getDate() + i);
  return { key, day: dayShort(d).replace('.', ''), date: String(d.getDate()), today: sameDay(d, TODAY), at: d };
});
export const todayKey = instructorDays.find((d) => d.today)?.key ?? 'mon';

const hoursDoneBy = (studentId: string, before: number) =>
  ALL_LESSONS.filter((l) => l.studentId === studentId && l.status === 'DONE' && l.startsAt.getTime() < before).length;

const toInstructorLesson = (l: DemoLesson) => ({
  ...toLesson(l),
  vehicle: DEMO_VEHICLES.find((v) => v.id === l.vehicleId)?.short ?? '—',
  status: (l.status === 'DONE' || isPast(l) ? 'done' : 'confirmed') as Lesson['status'],
  hoursDone: hoursDoneBy(l.studentId, l.startsAt.getTime()),
  reportDone: l.status === 'DONE',
  dayKey: DAY_KEYS[(l.startsAt.getDay() + 6) % 7],
});

const julieLessons = ALL_LESSONS.filter((l) => l.instructorId === meInstructor.id && l.status !== 'CANCELLED');

/** Leçons du moniteur connecté pour toute la semaine (le planning du site admin) */
export const instructorWeek = julieLessons
  .filter((l) => l.startsAt >= monday && l.startsAt.getTime() < monday.getTime() + 7 * 86_400_000)
  .map(toInstructorLesson);

/** Leçons du jour du moniteur connecté */
export const instructorLessons = julieLessons.filter((l) => sameDay(l.startsAt, TODAY)).map(toInstructorLesson);

const nextLabel = (studentId: string) => {
  const n = ALL_LESSONS.find((l) => l.studentId === studentId && l.status === 'PLANNED' && !isPast(l));
  if (!n) return 'Aucune leçon prévue';
  return `${sameDay(n.startsAt, TODAY) ? 'Aujourd’hui' : `${dayShort(n.startsAt)} ${dateShort(n.startsAt)}`} · ${hhmm(n.startsAt)}`;
};

/** Élèves suivis par le moniteur connecté : ses élèves référents sur le site */
export const plannedStudents = DEMO_STUDENTS.filter((s) => s.instructorId === meInstructor.id && s.stage !== 'COMPLETED').map((s) => {
  const done = hoursDoneBy(s.id, NOW);
  return {
    id: s.key,
    name: fullName(s),
    licence: `${PERMIT_LABELS[s.permitType]} · ${s.hoursPlanned} h`,
    hours: `${done}/${s.hoursPlanned} h`,
    progress: Math.min(1, done / s.hoursPlanned),
    next: nextLabel(s.id),
  };
});

export const weekAvailability = [
  { day: 'Lundi', slots: '08:00 – 12:00 · 14:00 – 19:00', off: false },
  { day: 'Mardi', slots: '08:00 – 12:00 · 14:00 – 19:00', off: false },
  { day: 'Mercredi', slots: '08:00 – 12:00', off: false },
  { day: 'Jeudi', slots: '14:00 – 20:00', off: false },
  { day: 'Vendredi', slots: '08:00 – 12:00 · 14:00 – 19:00', off: false },
  { day: 'Samedi', slots: '09:00 – 13:00', off: false },
  { day: 'Dimanche', slots: 'Repos', off: true },
];

export const absences = [
  { id: 'a1', label: 'Congés', range: '21 → 28 déc. 2026', status: 'Validé', tone: 'success' as Tone },
  { id: 'a2', label: 'Formation continue', range: '13 nov. 2026', status: 'En attente', tone: 'warning' as Tone },
];

/* ---------- Administration ---------- */

export const adminKpis = {
  revenueMonth: 48250,
  revenueDelta: '+12 % vs sept.',
  unpaid: 6340,
  unpaidCount: 14,
  // mêmes chiffres que le site admin, calculés sur les mêmes élèves et leçons
  activeStudents: DEMO_STUDENTS.filter((st) => st.stage !== 'DRAFT' && st.stage !== 'COMPLETED').length,
  docsToReview: DEMO_STUDENTS.reduce((n, st) => n + Object.values(studentDocs(st)).filter((d) => d === 'PENDING').length, 0),
  lessonsToday: ALL_LESSONS.filter((l) => l.status !== 'CANCELLED' && sameDay(l.startsAt, TODAY)).length,
  successRate: 0.71,
};

export const revenueByMonth = [
  { m: 'Mai', v: 36 },
  { m: 'Juin', v: 41 },
  { m: 'Juil.', v: 52 },
  { m: 'Août', v: 33 },
  { m: 'Sept.', v: 43 },
  { m: 'Oct.', v: 48 },
];

export type AdminStudent = {
  id: string;
  name: string;
  licence: string;
  step: string;
  tone: Tone;
  balance: number;
  docs: string;
  /** heures de conduite faites / prévues au forfait */
  hours: number;
  hoursTotal: number;
  /** moyenne aux séries de code, sur 40 */
  code: number;
  instructor: string;
  phone: string;
};

const STEP: Record<DemoStudent['stage'], { step: string; tone: Tone }> = {
  DRAFT: { step: 'Inscription à finaliser', tone: 'neutral' },
  DOCUMENTS_PENDING: { step: 'Dossier incomplet', tone: 'neutral' },
  DOCUMENTS_REVIEW: { step: 'Pièces à vérifier', tone: 'warning' },
  PAYMENT_PENDING: { step: 'Paiement en attente', tone: 'danger' },
  PAID: { step: 'En formation', tone: 'primary' },
  COMPLETED: { step: 'Permis obtenu', tone: 'success' },
};

/** Élèves de l'auto-école : la même liste que la page Élèves du site */
export const adminStudents: AdminStudent[] = DEMO_STUDENTS.filter((st) => st.stage !== 'DRAFT').map((st, i) => {
  const docs = Object.values(studentDocs(st));
  const price = PERMIT_PRICES[st.permitType]! / 100;
  const paidShare =
    st.stage === 'PAID' || st.stage === 'COMPLETED' ? 1 : st.installments ? (st.paidInstallments ?? (st.stage === 'PAYMENT_PENDING' ? 1 : 0)) / st.installments : 0;
  return {
    id: st.key,
    name: fullName(st),
    licence: `${PERMIT_LABELS[st.permitType]} · Forfait ${st.hoursPlanned} h`,
    ...STEP[st.stage],
    balance: Math.round(price * (1 - paidShare)),
    docs: `${docs.filter((d) => d === 'APPROVED').length}/${docs.length}`,
    hours: hoursDoneBy(st.id, NOW),
    hoursTotal: st.hoursPlanned,
    code: 24 + ((i * 7) % 16),
    instructor: staffName(st.instructorId),
    phone: st.phone,
  };
});

const DOC_LABEL: Record<string, string> = { TRAINING_CONTRACT: 'Contrat de formation', ID_CARD: "Pièce d'identité", ID_PHOTO: 'Photo e-photo', PROOF_OF_ADDRESS: 'Justificatif de domicile', ASSR: 'ASSR 2', JDC: 'Attestation JDC' };
export const docsToReview = DEMO_STUDENTS.flatMap((st) =>
  Object.entries(studentDocs(st))
    .filter(([, state]) => state === 'PENDING')
    .map(([type]) => ({ id: `${st.key}-${type}`, student: fullName(st), doc: DOC_LABEL[type] ?? type, sent: st.days <= 1 ? 'aujourd’hui' : `il y a ${Math.min(st.days, 6)} j` })),
).slice(0, 5);

export const recentActivity = [
  { id: 'e1', text: 'Emma Petit a réglé 450 € (CB)', time: '10:42', tone: 'success' as Tone },
  { id: 'e2', text: 'Nouvelle inscription : Sarah Benali · Permis B', time: '09:15', tone: 'primary' as Tone },
  { id: 'e3', text: 'Karim Haddad a déclaré une absence le 13 nov.', time: '08:30', tone: 'warning' as Tone },
  { id: 'e4', text: 'Échéance impayée : Chloé Garnier · 620 €', time: 'Hier', tone: 'danger' as Tone },
];

const lessonsOn = (instructorId: string) => ALL_LESSONS.filter((l) => l.instructorId === instructorId && l.status !== 'CANCELLED' && sameDay(l.startsAt, TODAY));

/** Moniteurs, avec leur charge du jour tirée du planning partagé */
export const instructors = DEMO_INSTRUCTORS.map((m) => {
  const n = lessonsOn(m.id).length;
  return { id: m.key, name: staffName(m.id), role: m.title, load: Math.min(1, n / 8), today: n ? `${n} leçon${n > 1 ? 's' : ''}` : 'Pas de leçon', vehicle: vehicleLabel(m.vehicleId) };
});

const VEHICLE_STATUS = {
  AVAILABLE: { status: 'Disponible', tone: 'success' as Tone },
  IN_USE: { status: 'En leçon', tone: 'primary' as Tone },
  MAINTENANCE: { status: 'Au garage', tone: 'warning' as Tone },
};
/** Parc automobile : le même que la page Véhicules du site */
export const vehicles = DEMO_VEHICLES.map((v) => {
  const inLesson = ALL_LESSONS.some((l) => l.vehicleId === v.id && l.status === 'PLANNED' && l.startsAt.getTime() <= NOW && endOf(l).getTime() > NOW);
  const st = v.status === 'MAINTENANCE' ? VEHICLE_STATUS.MAINTENANCE : inLesson ? VEHICLE_STATUS.IN_USE : VEHICLE_STATUS.AVAILABLE;
  return { id: v.id, name: v.name, plate: v.plate, type: v.transmission === 'MOTO' ? 'Moto A2' : v.transmission === 'AUTO' ? 'Automatique' : 'Manuelle', ...st, km: `${v.mileage.toLocaleString('fr-FR')} km` };
});

/** Planning du jour : une colonne par moniteur, créneaux de 1 h */
export const planningHours = ['08', '09', '10', '11', '14', '15', '16', '17', '18'];
export const planningGrid: Record<string, Record<string, { student: string; type?: string } | 'off'>> = Object.fromEntries(
  DEMO_INSTRUCTORS.map((m) => {
    const row: Record<string, { student: string; type?: string }> = {};
    lessonsOn(m.id).forEach((l) => {
      const st = studentById(l.studentId)!;
      const label = `${st.firstName[0]}. ${st.lastName}`;
      const startH = l.startsAt.getHours();
      const endH = Math.ceil((endOf(l).getHours() * 60 + endOf(l).getMinutes()) / 60);
      for (let h = startH; h < Math.max(endH, startH + 1); h++) row[String(h).padStart(2, '0')] = { student: label };
    });
    return [m.key, row];
  }),
);

export const financeDocs = {
  factures: [
    { id: 'F-2026-0412', who: 'Emma Petit', amount: 450, date: '27 oct.', status: 'Payée', tone: 'success' as Tone },
    { id: 'F-2026-0411', who: 'Inès Moreau', amount: 1350, date: '26 oct.', status: 'En attente', tone: 'warning' as Tone },
    { id: 'F-2026-0405', who: 'Chloé Garnier', amount: 620, date: '12 oct.', status: 'En retard', tone: 'danger' as Tone },
  ],
  devis: [
    { id: 'D-2026-0088', who: 'Sarah Benali', amount: 1290, date: '27 oct.', status: 'Envoyé', tone: 'primary' as Tone },
    { id: 'D-2026-0087', who: 'Tom Faure', amount: 890, date: '24 oct.', status: 'Accepté', tone: 'success' as Tone },
  ],
  avoirs: [{ id: 'A-2026-0012', who: 'Hugo Lefebvre', amount: 120, date: '18 oct.', status: 'Remboursé', tone: 'neutral' as Tone }],
  echeanciers: [
    { id: 'E-0031', who: 'Lucas Martin', amount: 1350, date: '3 × 450 €', status: '2/3 réglées', tone: 'primary' as Tone },
    { id: 'E-0029', who: 'Chloé Garnier', amount: 1240, date: '4 × 310 €', status: '1 en retard', tone: 'danger' as Tone },
  ],
};

export const payments = [
  { id: 'pm1', who: 'Emma Petit', method: 'Carte bancaire', amount: 450, time: 'Aujourd’hui 10:42' },
  { id: 'pm2', who: 'Tom Faure', method: 'Virement', amount: 890, time: 'Hier' },
  { id: 'pm3', who: 'Nathan Roux', method: 'Paiement 4× sans frais', amount: 312.5, time: '25 oct.' },
  { id: 'pm4', who: 'Hugo Lefebvre', method: 'Remboursement', amount: -120, time: '18 oct.' },
];

export const offers = [
  { id: 'o1', name: 'Forfait Permis B · 20 h', price: 1350, detail: 'Code illimité + 20 h de conduite + accompagnement examen', students: 82 },
  { id: 'o2', name: 'Forfait Permis B · 30 h', price: 1790, detail: 'Pour les élèves qui partent de zéro', students: 31 },
  { id: 'o3', name: 'Conduite accompagnée (AAC)', price: 1490, detail: 'Dès 15 ans, 20 h + rendez-vous pédagogiques', students: 24 },
  { id: 'o4', name: 'Boîte automatique · 13 h', price: 990, detail: 'Permis B78 en formule courte', students: 19 },
  { id: 'o5', name: 'Code de la route seul', price: 290, detail: 'Accès en ligne + salle de code', students: 30 },
];

export const unitPrices = [
  { id: 'u1', name: 'Heure de conduite', price: 58 },
  { id: 'u2', name: 'Présentation à l’examen', price: 95 },
  { id: 'u3', name: 'Frais de dossier', price: 80 },
];

export const promotions = [
  { id: 'pr1', name: 'Rentrée étudiante', value: '-10 %', until: 'Jusqu’au 30 nov.', active: true },
  { id: 'pr2', name: 'Parrainage', value: '-50 €', until: 'Permanente', active: true },
  { id: 'pr3', name: 'Black Friday', value: '-15 %', until: '27 → 30 nov.', active: false },
];

export const exams = [
  { id: 'x1', type: 'Code', date: 'Jeu. 12 nov.', place: 'La Poste · Lyon 7', students: ['Hugo Lefebvre', 'Sarah Benali', 'Lucas Martin'], seats: 3 },
  { id: 'x2', type: 'Conduite', date: 'Ven. 13 nov.', place: 'Centre d’examen Bron', students: ['Nathan Roux', 'Emma Petit'], seats: 4 },
  { id: 'x3', type: 'Conduite', date: 'Mar. 24 nov.', place: 'Centre d’examen Vénissieux', students: [], seats: 2 },
];

export const examResults = [
  { id: 'xr1', student: 'Léa Fontaine', type: 'Conduite', date: '20 oct.', ok: true },
  { id: 'xr2', student: 'Maxime Girard', type: 'Code', date: '19 oct.', ok: true },
  { id: 'xr3', student: 'Yanis Chevalier', type: 'Conduite', date: '16 oct.', ok: false },
  { id: 'xr4', student: 'Camille Robin', type: 'Code', date: '15 oct.', ok: true },
];

export const roles = [
  {
    id: 'admin',
    name: 'Administrateur',
    members: 2,
    perms: { students: true, finances: true, planning: true, exams: true, settings: true },
  },
  {
    id: 'secretariat',
    name: 'Secrétariat',
    members: 3,
    perms: { students: true, finances: true, planning: true, exams: true, settings: false },
  },
  {
    id: 'moniteur',
    name: 'Moniteur',
    members: 4,
    perms: { students: false, finances: false, planning: true, exams: false, settings: false },
  },
];

export const permLabels: Record<string, string> = {
  students: 'Élèves et dossiers',
  finances: 'Finances et factures',
  planning: 'Planning et véhicules',
  exams: 'Examens et résultats',
  settings: 'Tarifs et paramètres',
};
