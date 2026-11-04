/**
 * Source unique des données de démonstration de Virage.
 *
 * Le site admin (seed de la base en mémoire) et l'app mobile (espaces élève,
 * moniteur et administration) lisent tous les deux ce fichier : mêmes élèves,
 * mêmes moniteurs, mêmes véhicules et mêmes leçons, calculées à partir de la
 * date du jour. Une leçon visible dans le planning du site est donc aussi celle
 * que l'élève et le moniteur voient dans l'app.
 */

export type DemoStage = 'DRAFT' | 'DOCUMENTS_PENDING' | 'DOCUMENTS_REVIEW' | 'PAYMENT_PENDING' | 'PAID' | 'COMPLETED';
export type DemoDocType = 'TRAINING_CONTRACT' | 'ID_CARD' | 'ID_PHOTO' | 'PROOF_OF_ADDRESS' | 'ASSR' | 'JDC';
export type DemoDocStatus = 'APPROVED' | 'PENDING' | 'REJECTED';

export const DEMO_ORG = 'org-virage';
const DAY = 86_400_000;

/* ---------- Équipe ---------- */

export type DemoStaff = {
  id: string;
  key: string;
  role: 'ADMIN' | 'SKIPPER';
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  /** libellé affiché dans l'app (Monitrice · B…) */
  title: string;
  vehicleId?: string;
};

export const DEMO_STAFF: DemoStaff[] = [
  { id: 'u-sophie', key: 'sophie', role: 'ADMIN', firstName: 'Sophie', lastName: 'Laurent', email: 'sophie@virage.fr', phone: '06 11 22 33 44', title: 'Gérante' },
  { id: 'u-thomas', key: 'thomas', role: 'ADMIN', firstName: 'Thomas', lastName: 'Girard', email: 'thomas@virage.fr', phone: '06 22 33 44 55', title: 'Secrétariat' },
  { id: 'u-julie', key: 'julie', role: 'SKIPPER', firstName: 'Julie', lastName: 'Bernard', email: 'julie@virage.fr', phone: '06 33 44 55 66', title: 'Monitrice · B', vehicleId: 'veh-clio' },
  { id: 'u-karim', key: 'karim', role: 'SKIPPER', firstName: 'Karim', lastName: 'Haddad', email: 'karim@virage.fr', phone: '06 44 55 66 77', title: 'Moniteur · B / BE', vehicleId: 'veh-208' },
  { id: 'u-marc', key: 'marc', role: 'SKIPPER', firstName: 'Marc', lastName: 'Dubois', email: 'marc@virage.fr', phone: '06 55 66 77 88', title: 'Moniteur · B / A2', vehicleId: 'veh-208a' },
];

export const DEMO_INSTRUCTORS = DEMO_STAFF.filter((s) => s.role === 'SKIPPER');
export const staffName = (id: string | null | undefined) => {
  const s = DEMO_STAFF.find((x) => x.id === id);
  return s ? `${s.firstName} ${s.lastName}` : '—';
};

/* ---------- Véhicules ---------- */

export type DemoVehicle = {
  id: string;
  name: string;
  /** nom court affiché dans l'app (Clio V) */
  short: string;
  plate: string;
  transmission: 'MANUAL' | 'AUTO' | 'MOTO';
  status: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE';
  fuel: string;
  permitCategory: string;
  color: string;
  year: number;
  insurer: string;
  policy: string;
  mileage: number;
  /** échéances, en jours à partir d'aujourd'hui */
  service: number;
  inspection: number;
  insurance: number;
  notes: string | null;
};

export const DEMO_VEHICLES: DemoVehicle[] = [
  { id: 'veh-208', short: '208', fuel: 'PETROL', permitCategory: 'B', color: 'Blanc nacré', year: 2022, insurer: 'MMA Pro', policy: 'AE-208-4471', name: 'Peugeot 208', plate: 'GH-208-VR', transmission: 'MANUAL', status: 'AVAILABLE', mileage: 41250, service: 38, inspection: 210, insurance: 160, notes: null },
  { id: 'veh-clio', short: 'Clio V', fuel: 'DIESEL', permitCategory: 'B', color: 'Gris titanium', year: 2020, insurer: 'MMA Pro', policy: 'AE-512-4472', name: 'Renault Clio V', plate: 'FT-512-VR', transmission: 'MANUAL', status: 'IN_USE', mileage: 68900, service: -4, inspection: 95, insurance: 160, notes: 'Révision des 70 000 km dépassée.' },
  { id: 'veh-yaris', short: 'Yaris', fuel: 'HYBRID', permitCategory: 'B_AUTO', color: 'Rouge', year: 2023, insurer: 'MMA Pro', policy: 'AE-731-4473', name: 'Toyota Yaris Hybride', plate: 'GK-731-VR', transmission: 'AUTO', status: 'AVAILABLE', mileage: 22400, service: 120, inspection: 18, insurance: 160, notes: 'Contrôle technique à programmer.' },
  { id: 'veh-208a', short: '208 EAT8', fuel: 'PETROL', permitCategory: 'B_AUTO', color: 'Bleu vertigo', year: 2022, insurer: 'MMA Pro', policy: 'AE-044-4474', name: 'Peugeot 208 EAT8', plate: 'GL-044-VR', transmission: 'AUTO', status: 'MAINTENANCE', mileage: 35120, service: 2, inspection: 300, insurance: 160, notes: 'Plaquettes de frein en cours de remplacement au garage.' },
  { id: 'veh-mt07', short: 'MT-07', fuel: 'PETROL', permitCategory: 'A2', color: 'Noir', year: 2021, insurer: 'AXA Moto', policy: 'MO-907-1180', name: 'Yamaha MT-07 A2', plate: 'FZ-907-VR', transmission: 'MOTO', status: 'AVAILABLE', mileage: 15800, service: 64, inspection: 400, insurance: 25, notes: null },
];

export const vehicleLabel = (id: string | null | undefined) => {
  const v = DEMO_VEHICLES.find((x) => x.id === id);
  return v ? `${v.short} · ${v.plate}` : '—';
};

/* ---------- Élèves ---------- */

export const PERMIT_LABELS: Record<string, string> = {
  'permis-b': 'Permis B',
  'permis-b-auto': 'Permis B · Boîte auto',
  aac: 'Permis B · AAC',
  a2: 'Permis A2',
};

/** Prix des formules, en centimes */
export const PERMIT_PRICES: Record<string, number> = { 'permis-b': 135000, 'permis-b-auto': 99000, aac: 149000, a2: 129000 };

export type DemoStudent = {
  id: string;
  key: string;
  firstName: string;
  lastName: string;
  phone: string;
  permitType: string;
  stage: DemoStage;
  /** ancienneté du dossier, en jours */
  days: number;
  /** paiement en plusieurs fois */
  installments?: number;
  /** échéances déjà réglées, quand le dossier n'est pas encore soldé */
  paidInstallments?: number;
  instructorId: string | null;
  hoursPlanned: number;
  hoursDone: number;
  /** état des pièces quand il diffère du cas général de l'étape */
  docs?: Partial<Record<DemoDocType, DemoDocStatus>>;
  /** leçons à venir imposées : [jours à partir d'aujourd'hui, heure] */
  next?: [number, number][];
};

/** prénom, nom, permis, étape, ancienneté (jours), paiement en plusieurs fois, téléphone */
const RAW: [string, string, string, DemoStage, number, number | undefined, string][] = [
  ['Lucas', 'Martin', 'permis-b', 'DOCUMENTS_REVIEW', 12, 3, '06 12 34 56 78'],
  ['Emma', 'Petit', 'aac', 'PAID', 150, 3, '06 45 12 78 90'],
  ['Inès', 'Moreau', 'permis-b', 'PAYMENT_PENDING', 40, undefined, '07 81 22 43 10'],
  ['Nathan', 'Roux', 'permis-b', 'PAID', 120, undefined, '06 98 55 21 04'],
  ['Chloé', 'Garnier', 'permis-b-auto', 'PAYMENT_PENDING', 75, 3, '07 66 31 09 87'],
  ['Hugo', 'Lefebvre', 'permis-b', 'DOCUMENTS_PENDING', 6, undefined, '06 02 47 85 33'],
  ['Sarah', 'Benali', 'permis-b', 'DOCUMENTS_REVIEW', 3, undefined, '06 71 90 12 44'],
  ['Léo', 'Perrin', 'a2', 'PAID', 95, undefined, '07 12 45 78 23'],
  ['Manon', 'Faure', 'permis-b', 'COMPLETED', 175, undefined, '06 84 21 36 57'],
  ['Théo', 'Blanc', 'permis-b-auto', 'PAID', 60, 3, '06 37 58 14 92'],
  ['Camille', 'Royer', 'aac', 'DOCUMENTS_PENDING', 18, undefined, '07 55 18 62 30'],
  ['Jade', 'Morel', 'permis-b', 'COMPLETED', 168, undefined, '06 26 73 41 08'],
  ['Louis', 'Henry', 'permis-b', 'PAYMENT_PENDING', 30, undefined, '06 93 04 27 61'],
  ['Zoé', 'Lambert', 'permis-b', 'PAID', 45, undefined, '07 48 36 95 12'],
  ['Adam', 'Mercier', 'a2', 'DOCUMENTS_REVIEW', 9, undefined, '06 19 82 54 70'],
  ['Lina', 'Fontaine', 'permis-b', 'DRAFT', 1, undefined, '07 30 67 81 45'],
  ['Yanis', 'Chevalier', 'permis-b-auto', 'COMPLETED', 140, undefined, '06 61 09 33 28'],
  ['Clara', 'Dupuis', 'permis-b', 'PAID', 25, 3, '06 05 74 19 86'],
];

const slug = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Élève connecté dans l'app de démonstration */
export const DEMO_STUDENT_ID = 'u-lucas';
/** Moniteur connecté dans l'app de démonstration */
export const DEMO_INSTRUCTOR_ID = 'u-julie';

export const DEMO_STUDENTS: DemoStudent[] = RAW.map(([firstName, lastName, permitType, stage, days, installments, phone], index) => {
  const key = slug(firstName);
  const hoursPlanned = permitType === 'permis-b-auto' ? 13 : 20;
  const hoursDone =
    stage === 'COMPLETED' ? hoursPlanned : stage === 'PAID' ? Math.min(hoursPlanned - 1, 4 + ((index * 5) % 14)) : stage === 'PAYMENT_PENDING' ? index % 3 : 0;
  const student: DemoStudent = {
    id: `u-${key}`,
    key,
    firstName,
    lastName,
    phone,
    permitType,
    stage,
    days,
    installments,
    instructorId: stage === 'DRAFT' ? null : ['u-julie', 'u-karim', 'u-marc'][index % 3]!,
    hoursPlanned,
    hoursDone,
  };
  // Lucas est l'élève de l'app : dossier en vérification mais déjà en formation
  if (key === 'lucas') {
    Object.assign(student, {
      hoursDone: 12,
      paidInstallments: 2,
      docs: { TRAINING_CONTRACT: 'APPROVED', ID_CARD: 'APPROVED', ID_PHOTO: 'APPROVED', PROOF_OF_ADDRESS: 'REJECTED', ASSR: 'PENDING' },
      next: [
        [1, 17],
        [3, 9],
        [6, 17],
      ],
    });
  }
  return student;
});

export const studentById = (id: string | null | undefined) => DEMO_STUDENTS.find((s) => s.id === id || s.key === id);
export const studentName = (s: Pick<DemoStudent, 'firstName' | 'lastName'>) => `${s.firstName} ${s.lastName}`;

/** Véhicule utilisé pour les leçons d'un élève */
export const vehicleForStudent = (s: DemoStudent) => {
  if (s.permitType === 'a2') return 'veh-mt07';
  if (s.permitType === 'permis-b-auto') return 'veh-yaris';
  return DEMO_STAFF.find((x) => x.id === s.instructorId)?.vehicleId === 'veh-208' ? 'veh-208' : 'veh-clio';
};

/* ---------- Leçons de conduite ---------- */

export type DemoLesson = {
  id: string;
  studentId: string;
  instructorId: string;
  vehicleId: string;
  startsAt: Date;
  durationMinutes: number;
  status: 'PLANNED' | 'DONE' | 'CANCELLED';
  notes: string | null;
  place: string;
};

export const MEETING_POINTS = ['Agence Jean Macé', 'Lycée Récamier', 'Place Bellecour', 'Gare Part-Dieu'];
const SLOTS = [8, 9, 10, 11, 14, 15, 16, 17, 18];

const cache = new Map<string, DemoLesson[]>();

/**
 * Toutes les leçons de conduite, calculées à partir du jour donné.
 * Le résultat ne dépend que du jour, sauf la leçon en cours (commencée il y a
 * 20 minutes) : le site et l'app tombent sur les mêmes leçons le même jour.
 */
export function demoLessons(now: number = Date.now()): DemoLesson[] {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const cacheKey = `${Math.floor(now / 60_000)}`;
  const hit = cache.get(cacheKey);
  if (hit) return hit;

  const lessons: DemoLesson[] = [];
  const busy = new Set<string>();
  const dayAt = (offset: number, hour: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offset);
    d.setHours(hour, 0, 0, 0);
    return d;
  };
  // pas de leçon le dimanche : on décale d'un jour, vers le passé ou le futur
  const workday = (offset: number) => (dayAt(offset, 9).getDay() === 0 ? offset + (offset < 0 ? -1 : 1) : offset);

  const place = (s: DemoStudent, rawOffset: number, hour: number, status: DemoLesson['status'], index: number) => {
    const offset = workday(rawOffset);
    const vehicleId = vehicleForStudent(s);
    const start = Math.max(0, SLOTS.indexOf(hour));
    for (let k = 0; k < SLOTS.length; k++) {
      const h = SLOTS[(start + k) % SLOTS.length]!;
      const keys = [`i:${s.instructorId}:${offset}:${h}`, `s:${s.id}:${offset}:${h}`, `v:${vehicleId}:${offset}:${h}`];
      if (keys.some((x) => busy.has(x))) continue;
      keys.forEach((x) => busy.add(x));
      lessons.push({
        id: `les-${lessons.length + 1}`,
        studentId: s.id,
        instructorId: s.instructorId!,
        vehicleId,
        startsAt: dayAt(offset, h),
        durationMinutes: 60,
        status,
        notes: status === 'CANCELLED' ? "Annulée par l'élève (malade)." : null,
        place: MEETING_POINTS[(index + k + offset) % 2 === 0 ? 0 : 1]!,
      });
      return;
    }
  };

  const live = new Date(now - 20 * 60_000);

  DEMO_STUDENTS.forEach((s, index) => {
    if (!s.instructorId) return;
    for (let k = 0; k < s.hoursDone; k++) place(s, -1 - k * 3 - (index % 3), SLOTS[(index + k) % SLOTS.length]!, 'DONE', index);
    if (s.next) s.next.forEach(([offset, hour]) => place(s, offset, hour, 'PLANNED', index));
    else if (s.stage === 'PAID') {
      place(s, 0, SLOTS[index % SLOTS.length]!, 'PLANNED', index);
      place(s, 2 + (index % 3), SLOTS[(index + 3) % SLOTS.length]!, 'PLANNED', index);
      place(s, 6 + (index % 4), SLOTS[(index + 5) % SLOTS.length]!, 'PLANNED', index);
      if (index % 4 === 1) place(s, -1, SLOTS[(index + 6) % SLOTS.length]!, 'CANCELLED', index);
    } else if (s.stage === 'PAYMENT_PENDING' && s.hoursDone > 0) place(s, 1 + (index % 4), SLOTS[(index + 2) % SLOTS.length]!, 'PLANNED', index);
  });

  // leçon en cours chez Julie, avec un de ses élèves en formation qui n'a pas déjà leçon aujourd'hui
  const todayHas = (id: string) => lessons.some((l) => l.studentId === id && l.startsAt.toDateString() === live.toDateString());
  const liveStudent =
    DEMO_STUDENTS.find((s) => s.instructorId === 'u-julie' && s.stage === 'PAID' && s.permitType === 'permis-b' && !todayHas(s.id)) ??
    DEMO_STUDENTS.find((s) => s.key === 'nathan')!;
  // elle remplace ce qui chevauche son créneau chez Julie, l'élève ou la Clio
  if (live.getDay() !== 0 && live.getHours() >= 7 && live.getHours() < 20) {
    const liveStart = live.getTime();
    const liveEnd = liveStart + 90 * 60_000;
    const overlaps = (l: DemoLesson) => {
      const s = l.startsAt.getTime();
      const sameSlot = s < liveEnd && s + l.durationMinutes * 60_000 > liveStart && (l.instructorId === 'u-julie' || l.vehicleId === 'veh-clio');
      // une seule leçon dans la journée pour l'élève de la leçon en cours
      const sameStudentToday = l.studentId === liveStudent.id && l.status !== 'DONE' && l.startsAt.toDateString() === live.toDateString();
      return sameSlot || sameStudentToday;
    };
    for (let i = lessons.length - 1; i >= 0; i--) if (overlaps(lessons[i]!)) lessons.splice(i, 1);
    lessons.push({
      id: 'les-live',
      studentId: liveStudent.id,
      instructorId: 'u-julie',
      vehicleId: 'veh-clio',
      startsAt: new Date(liveStart),
      durationMinutes: 90,
      status: 'PLANNED',
      notes: 'Leçon de conduite en ville.',
      place: MEETING_POINTS[0]!,
    });
  }

  lessons.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  cache.clear();
  cache.set(cacheKey, lessons);
  return lessons;
}

/** Heures de conduite réellement faites (leçons terminées) */
export const doneHours = (studentId: string, now = Date.now()) =>
  demoLessons(now)
    .filter((l) => l.studentId === studentId && l.status === 'DONE')
    .reduce((n, l) => n + l.durationMinutes / 60, 0);

export const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/* ---------- Pièces du dossier ---------- */

export const REQUIRED_DOCS: DemoDocType[] = ['TRAINING_CONTRACT', 'ID_CARD', 'ID_PHOTO', 'PROOF_OF_ADDRESS', 'ASSR', 'JDC'];

/** État de chaque pièce d'un élève, null si elle n'est pas encore déposée */
export function studentDocs(s: DemoStudent, index = DEMO_STUDENTS.indexOf(s)): Record<DemoDocType, DemoDocStatus | null> {
  const out = {} as Record<DemoDocType, DemoDocStatus | null>;
  if (s.docs) {
    REQUIRED_DOCS.forEach((t) => (out[t] = s.docs![t] ?? null));
    return out;
  }
  const count = s.stage === 'DRAFT' ? 0 : s.stage === 'DOCUMENTS_PENDING' ? 2 + (index % 3) : REQUIRED_DOCS.length;
  REQUIRED_DOCS.forEach((t, i) => {
    if (i >= count) return (out[t] = null);
    let status: DemoDocStatus = 'APPROVED';
    if (s.stage === 'DOCUMENTS_PENDING') status = i === 0 ? 'APPROVED' : i === count - 1 && index % 2 ? 'REJECTED' : 'PENDING';
    if (s.stage === 'DOCUMENTS_REVIEW') status = i < 2 ? 'APPROVED' : 'PENDING';
    out[t] = status;
  });
  return out;
}

/* ---------- Formats ---------- */

const DAYS_SHORT = ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'];
const MONTHS_SHORT = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
export const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
export const dayShort = (d: Date) => DAYS_SHORT[d.getDay()]!;
export const dateShort = (d: Date) => `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
export const endOf = (l: Pick<DemoLesson, 'startsAt' | 'durationMinutes'>) => new Date(l.startsAt.getTime() + l.durationMinutes * 60_000);
export const DEMO_DAY = DAY;
