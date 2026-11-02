/** Historique de formation et débriefs des moniteurs (données fictives) */

export type LessonReport = {
  id: string;
  date: string;
  weekday: string;
  start: string;
  end: string;
  hours: number;
  type: 'conduite' | 'code' | 'evaluation';
  title: string;
  instructor: string;
  place: string;
  mood: 'top' | 'bien' | 'progres';
  debrief: string;
  strengths: string[];
  toWork: string[];
  validated?: string[];
};

export const lessonHistory: LessonReport[] = [
  {
    id: 'h1',
    date: '26 oct.',
    weekday: 'Lun.',
    start: '18:00',
    end: '19:00',
    hours: 1,
    type: 'conduite',
    title: 'Créneau et démarrage en côte',
    instructor: 'Julie Bernard',
    place: 'Agence Lyon République',
    mood: 'top',
    debrief: 'Très bonne séance, Lucas. Le démarrage en côte est maintenant fluide et sans calage. Le créneau est réussi 3 fois sur 4 : on va consolider avant de passer au rangement en bataille.',
    strengths: ['Démarrage en côte', 'Contrôles rétroviseurs'],
    toWork: ['Créneau à gauche', 'Vitesse en manœuvre'],
    validated: ['Démarrer et s’arrêter', 'Utiliser la boîte de vitesses'],
  },
  {
    id: 'h2',
    date: '24 oct.',
    weekday: 'Sam.',
    start: '10:00',
    end: '12:00',
    hours: 2,
    type: 'conduite',
    title: 'Circulation en ville et ronds-points',
    instructor: 'Karim Haddad',
    place: 'Lycée Récamier',
    mood: 'bien',
    debrief: 'Bonne lecture de la signalisation. Attention au placement dans les ronds-points à plusieurs voies : choisis ta voie plus tôt et clignote avant de sortir.',
    strengths: ['Respect des priorités', 'Anticipation des feux'],
    toWork: ['Ronds-points à 2 voies', 'Clignotant en sortie'],
    validated: ['Rechercher la signalisation'],
  },
  {
    id: 'h3',
    date: '21 oct.',
    weekday: 'Mer.',
    start: '17:00',
    end: '18:00',
    hours: 1,
    type: 'code',
    title: 'Cours de code : priorités',
    instructor: 'Salle de code',
    place: 'Agence Lyon République',
    mood: 'bien',
    debrief: 'Cours collectif sur les intersections et les priorités. Série d’entraînement : 36/40.',
    strengths: ['Priorité à droite', 'Panneaux de danger'],
    toWork: ['Intersections avec stop'],
  },
  {
    id: 'h4',
    date: '17 oct.',
    weekday: 'Sam.',
    start: '09:00',
    end: '11:00',
    hours: 2,
    type: 'conduite',
    title: 'Premières sorties en agglomération',
    instructor: 'Julie Bernard',
    place: 'Agence Lyon République',
    mood: 'progres',
    debrief: 'Première vraie sortie en ville : un peu de stress au début, c’est normal. Le regard porte encore trop près du capot, pense à regarder loin devant pour anticiper.',
    strengths: ['Maintien de la trajectoire'],
    toWork: ['Regard lointain', 'Distances de sécurité', 'Gestion du stress'],
    validated: ['Tenir et tourner le volant'],
  },
  {
    id: 'h5',
    date: '10 oct.',
    weekday: 'Sam.',
    start: '09:00',
    end: '11:00',
    hours: 2,
    type: 'conduite',
    title: 'Maniement du véhicule sur plateau',
    instructor: 'Julie Bernard',
    place: 'Plateau Gerland',
    mood: 'top',
    debrief: 'Très à l’aise avec les commandes. Les passages de vitesses sont propres, l’embrayage est bien dosé.',
    strengths: ['Passage des vitesses', 'Position de conduite'],
    toWork: ['Marche arrière en ligne droite'],
    validated: ['Connaître les commandes', 'S’installer au poste de conduite'],
  },
  {
    id: 'h6',
    date: '3 oct.',
    weekday: 'Sam.',
    start: '10:00',
    end: '12:00',
    hours: 2,
    type: 'evaluation',
    title: 'Évaluation de départ',
    instructor: 'Julie Bernard',
    place: 'Agence Lyon République',
    mood: 'bien',
    debrief: 'Évaluation réalisée : 20 h de conduite recommandées. Bonne coordination, quelques automatismes à créer.',
    strengths: ['Coordination', 'Écoute des consignes'],
    toWork: ['Automatismes au volant'],
  },
];

/** Étapes du parcours, de l'inscription au permis */
export const journey = [
  { key: 'inscription', label: 'Inscription', state: 'done' as const },
  { key: 'code', label: 'Code', state: 'current' as const },
  { key: 'conduite', label: 'Conduite', state: 'current' as const },
  { key: 'examen', label: 'Examen', state: 'todo' as const },
];
