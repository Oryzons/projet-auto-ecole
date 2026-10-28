/**
 * Données fictives pour la maquette. Elles seront remplacées par l'API
 * quand le backend sera branché : les types ci-dessous servent de premier contrat.
 */

import type { Tone } from '@/theme';

export const school = { name: 'Virage', city: 'Lyon 7e', phone: '04 78 00 00 00' };

/* ---------- Élève connecté ---------- */

export const student = {
  id: 's1',
  firstName: 'Lucas',
  lastName: 'Martin',
  email: 'lucas.martin@email.fr',
  phone: '06 12 34 56 78',
  birthDate: '14/03/2007',
  address: '12 rue Garibaldi, 69007 Lyon',
  licence: 'Permis B',
  formula: 'Forfait 20 h',
  fileNumber: 'VRG-2026-0148',
  goalDate: 'Objectif : mars 2027',
  availability: 'Soirs en semaine et samedi matin',
  status: 'Dossier en cours de validation',
  code: { score: 32, max: 40, series: 18, seriesTotal: 25, ratio: 0.82 },
  driving: { done: 12, total: 20, skills: 9, skillsTotal: 22 },
  balance: { remainingHours: 7, due: 450, paid: 900, total: 1350 },
};

export type DocStatus = 'accepted' | 'pending' | 'refused' | 'missing';

export const docStatus: Record<DocStatus, { label: string; tone: Tone }> = {
  accepted: { label: 'Accepté', tone: 'success' },
  pending: { label: 'En vérification', tone: 'warning' },
  refused: { label: 'Refusé', tone: 'danger' },
  missing: { label: 'À déposer', tone: 'neutral' },
};

export const documents: { id: string; name: string; status: DocStatus; note?: string }[] = [
  { id: 'd1', name: "Pièce d'identité", status: 'accepted' },
  { id: 'd2', name: 'Photo e-photo (ANTS)', status: 'accepted' },
  { id: 'd3', name: 'Justificatif de domicile', status: 'refused', note: 'Document de plus de 6 mois, merci d’en déposer un récent.' },
  { id: 'd4', name: 'ASSR 2 ou ASR', status: 'pending' },
  { id: 'd5', name: 'Attestation JDC', status: 'missing' },
];

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
};

export const upcomingLessons: Lesson[] = [
  { id: 'l1', day: 'Jeu.', date: '29 oct.', start: '17:30', end: '18:30', type: 'Conduite', instructor: 'Julie Bernard', vehicle: 'Clio V · GH-412-KL', place: 'Agence Jean Macé' },
  { id: 'l2', day: 'Sam.', date: '31 oct.', start: '09:00', end: '11:00', type: 'Conduite', instructor: 'Julie Bernard', vehicle: 'Clio V · GH-412-KL', place: 'Lycée Récamier' },
  { id: 'l3', day: 'Mar.', date: '3 nov.', start: '18:00', end: '19:00', type: 'Code', instructor: 'Salle de code', place: 'Agence Jean Macé' },
];

export const pastLessons: Lesson[] = [
  { id: 'p1', day: 'Lun.', date: '26 oct.', start: '18:00', end: '19:00', type: 'Conduite', instructor: 'Julie Bernard', place: 'Agence Jean Macé' },
  { id: 'p2', day: 'Sam.', date: '24 oct.', start: '10:00', end: '12:00', type: 'Conduite', instructor: 'Karim Haddad', place: 'Lycée Récamier' },
];

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

export const instructor = { name: 'Julie Bernard', licence: 'Permis B · BEPECASER', vehicle: 'Clio V · GH-412-KL' };

export const instructorDays = [
  { key: 'mon', day: 'Lun', date: '26' },
  { key: 'tue', day: 'Mar', date: '27' },
  { key: 'wed', day: 'Mer', date: '28' },
  { key: 'thu', day: 'Jeu', date: '29' },
  { key: 'fri', day: 'Ven', date: '30' },
  { key: 'sat', day: 'Sam', date: '31' },
];

export const instructorLessons: (Lesson & { hoursDone: number; reportDone?: boolean })[] = [
  { id: 'i1', day: 'Mar.', date: '27 oct.', start: '08:00', end: '09:00', type: 'Conduite', instructor: 'Julie Bernard', student: 'Emma Petit', vehicle: 'Clio V', place: 'Agence Jean Macé', status: 'done', hoursDone: 18, reportDone: true },
  { id: 'i2', day: 'Mar.', date: '27 oct.', start: '09:00', end: '11:00', type: 'Conduite', instructor: 'Julie Bernard', student: 'Lucas Martin', vehicle: 'Clio V', place: 'Lycée Récamier', status: 'done', hoursDone: 12 },
  { id: 'i3', day: 'Mar.', date: '27 oct.', start: '14:00', end: '15:00', type: 'Conduite', instructor: 'Julie Bernard', student: 'Inès Moreau', vehicle: 'Clio V', place: 'Agence Jean Macé', status: 'todo', hoursDone: 4 },
  { id: 'i4', day: 'Mar.', date: '27 oct.', start: '15:00', end: '16:00', type: 'Examen blanc', instructor: 'Julie Bernard', student: 'Nathan Roux', vehicle: 'Clio V', place: 'Centre d’examen Bron', status: 'todo', hoursDone: 27 },
  { id: 'i5', day: 'Mar.', date: '27 oct.', start: '17:30', end: '18:30', type: 'Conduite', instructor: 'Julie Bernard', student: 'Chloé Garnier', vehicle: 'Clio V', place: 'Agence Jean Macé', status: 'confirmed', hoursDone: 9 },
];

export const plannedStudents = [
  { id: 'lucas', name: 'Lucas Martin', licence: 'Permis B · 20 h', hours: '12/20 h', progress: 0.42, next: 'Sam. 31 oct. · 09:00' },
  { id: 'emma', name: 'Emma Petit', licence: 'Permis B · AAC', hours: '18/20 h', progress: 0.78, next: 'Jeu. 29 oct. · 08:00' },
  { id: 'ines', name: 'Inès Moreau', licence: 'Permis B · 20 h', hours: '4/20 h', progress: 0.12, next: 'Aujourd’hui · 14:00' },
  { id: 'nathan', name: 'Nathan Roux', licence: 'Permis B · 30 h', hours: '27/30 h', progress: 0.91, next: 'Aujourd’hui · 15:00' },
  { id: 'chloe', name: 'Chloé Garnier', licence: 'Permis B · Boîte auto', hours: '9/13 h', progress: 0.55, next: 'Aujourd’hui · 17:30' },
];

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
  activeStudents: 186,
  docsToReview: 9,
  lessonsToday: 42,
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
};

export const adminStudents: AdminStudent[] = [
  { id: 'lucas', name: 'Lucas Martin', licence: 'Permis B · Forfait 20 h', step: 'Pièces à vérifier', tone: 'warning', balance: 450, docs: '3/5' },
  { id: 'emma', name: 'Emma Petit', licence: 'Permis B · AAC', step: 'Prête pour l’examen', tone: 'success', balance: 0, docs: '5/5' },
  { id: 'ines', name: 'Inès Moreau', licence: 'Permis B · Forfait 20 h', step: 'En formation', tone: 'primary', balance: 900, docs: '5/5' },
  { id: 'nathan', name: 'Nathan Roux', licence: 'Permis B · Forfait 30 h', step: 'Examen le 12 nov.', tone: 'violet', balance: 0, docs: '5/5' },
  { id: 'chloe', name: 'Chloé Garnier', licence: 'Permis B · Boîte auto', step: 'Impayé', tone: 'danger', balance: 620, docs: '5/5' },
  { id: 'hugo', name: 'Hugo Lefebvre', licence: 'Code seul', step: 'Dossier incomplet', tone: 'neutral', balance: 0, docs: '1/5' },
];

export const docsToReview = [
  { id: 'r1', student: 'Lucas Martin', doc: 'ASSR 2', sent: 'il y a 2 h' },
  { id: 'r2', student: 'Hugo Lefebvre', doc: "Pièce d'identité", sent: 'il y a 5 h' },
  { id: 'r3', student: 'Sarah Benali', doc: 'Justificatif de domicile', sent: 'hier' },
];

export const recentActivity = [
  { id: 'e1', text: 'Emma Petit a réglé 450 € (CB)', time: '10:42', tone: 'success' as Tone },
  { id: 'e2', text: 'Nouvelle inscription : Sarah Benali · Permis B', time: '09:15', tone: 'primary' as Tone },
  { id: 'e3', text: 'Karim Haddad a déclaré une absence le 13 nov.', time: '08:30', tone: 'warning' as Tone },
  { id: 'e4', text: 'Échéance impayée : Chloé Garnier · 620 €', time: 'Hier', tone: 'danger' as Tone },
];

export const instructors = [
  { id: 'julie', name: 'Julie Bernard', role: 'Monitrice · B', load: 0.86, today: '5 leçons', vehicle: 'Clio V · GH-412-KL' },
  { id: 'karim', name: 'Karim Haddad', role: 'Moniteur · B / BE', load: 0.72, today: '4 leçons', vehicle: 'Peugeot 208 · FT-908-AB' },
  { id: 'sophie', name: 'Sophie Laurent', role: 'Monitrice · B auto', load: 0.64, today: '3 leçons', vehicle: 'Zoé · GA-221-ZE' },
  { id: 'marc', name: 'Marc Dubois', role: 'Moniteur · A2', load: 0.4, today: 'Absent', vehicle: 'MT-07 · EZ-778-RT' },
];

export const vehicles = [
  { id: 'v1', name: 'Renault Clio V', plate: 'GH-412-KL', type: 'Manuelle', status: 'Disponible', tone: 'success' as Tone, km: '48 210 km' },
  { id: 'v2', name: 'Peugeot 208', plate: 'FT-908-AB', type: 'Manuelle', status: 'En leçon', tone: 'primary' as Tone, km: '62 870 km' },
  { id: 'v3', name: 'Renault Zoé', plate: 'GA-221-ZE', type: 'Automatique', status: 'Disponible', tone: 'success' as Tone, km: '31 450 km' },
  { id: 'v4', name: 'Yamaha MT-07', plate: 'EZ-778-RT', type: 'Moto A2', status: 'Révision', tone: 'warning' as Tone, km: '12 300 km' },
];

/** Planning multi-moniteurs : une colonne par moniteur, créneaux de 1 h */
export const planningHours = ['08', '09', '10', '11', '14', '15', '16', '17', '18'];
export const planningGrid: Record<string, Record<string, { student: string; type?: string } | 'off'>> = {
  julie: {
    '08': { student: 'E. Petit' },
    '09': { student: 'L. Martin' },
    '10': { student: 'L. Martin' },
    '14': { student: 'I. Moreau' },
    '15': { student: 'N. Roux', type: 'Examen blanc' },
    '17': { student: 'C. Garnier' },
  },
  karim: {
    '08': { student: 'T. Faure' },
    '10': { student: 'S. Benali' },
    '11': { student: 'A. Girard' },
    '15': { student: 'M. Blanc' },
    '16': { student: 'M. Blanc' },
    '18': { student: 'J. Morel' },
  },
  sophie: {
    '09': { student: 'L. Perrin' },
    '14': { student: 'P. Henry' },
    '16': { student: 'C. Royer' },
    '17': { student: 'C. Royer' },
  },
  marc: Object.fromEntries(['08', '09', '10', '11', '14', '15', '16', '17', '18'].map((h) => [h, 'off' as const])),
};

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
