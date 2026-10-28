/** Contenus d'aide affichés par le bouton « ? » de chaque page (données fictives) */

export type HelpContent = {
  title: string;
  intro: string;
  items: { q: string; a: string }[];
};

type Entry = { match: RegExp } & HelpContent;

const entries: Entry[] = [
  /* ---------- Connexion & inscription ---------- */
  {
    match: /^\/connexion\/verification/,
    title: 'Code de vérification',
    intro: 'Une sécurité pour votre première connexion sur cet appareil.',
    items: [
      { q: 'Je n’ai pas reçu le code', a: 'Vérifiez vos courriers indésirables, puis touchez « Renvoyer le code » après 30 secondes.' },
      { q: 'Pourquoi ce code ?', a: 'Il confirme que c’est bien vous qui vous connectez depuis un nouveau téléphone.' },
    ],
  },
  {
    match: /^\/connexion\/mot-de-passe-oublie/,
    title: 'Mot de passe oublié',
    intro: 'Récupérez l’accès à votre espace en deux minutes.',
    items: [
      { q: 'Je ne reçois pas l’e-mail', a: 'Vérifiez vos courriers indésirables, puis touchez « Renvoyer le lien » après 30 secondes.' },
      { q: 'Le lien ne fonctionne plus', a: 'Il est valable 30 minutes et une seule fois. Demandez-en simplement un nouveau.' },
      { q: 'Je n’ai plus accès à mon adresse e-mail', a: 'Contactez l’agence avec une pièce d’identité : elle mettra votre adresse à jour.' },
    ],
  },
  {
    match: /^\/connexion\/mot-de-passe/,
    title: 'Votre mot de passe',
    intro: 'Dernière étape avant de retrouver votre espace.',
    items: [
      { q: 'J’ai oublié mon mot de passe', a: 'Touchez « Mot de passe oublié ? » : vous recevez un lien par e-mail pour en choisir un nouveau. Il est valable 30 minutes.' },
      { q: 'À quoi sert « Rester connecté » ?', a: 'Vous n’aurez plus à saisir votre mot de passe sur ce téléphone. Décochez-le sur un appareil partagé.' },
      { q: 'Mon compte est bloqué', a: 'Après 5 essais, l’accès est suspendu 15 minutes. Contactez l’auto-école si le problème continue.' },
    ],
  },
  {
    match: /^\/connexion/,
    title: 'Se connecter',
    intro: 'Retrouvez votre parcours là où vous l’avez laissé.',
    items: [
      { q: 'Quelle adresse e-mail utiliser ?', a: 'Celle que vous avez donnée à l’inscription, ou celle communiquée à l’agence si l’auto-école a créé votre compte.' },
      { q: 'Je n’ai pas encore de compte', a: 'Touchez « S’inscrire » en bas de la page : l’inscription se fait en 4 étapes et prend environ 3 minutes.' },
      { q: 'Je suis moniteur ou je travaille à l’agence', a: 'Utilisez votre adresse professionnelle : l’application ouvre automatiquement le bon espace.' },
    ],
  },
  {
    match: /^\/inscription\/identite/,
    title: 'Vos informations',
    intro: 'Elles servent à créer votre dossier ANTS et votre contrat.',
    items: [
      { q: 'Pourquoi ces informations ?', a: 'Votre nom, date de naissance et adresse doivent correspondre exactement à votre pièce d’identité pour l’inscription à l’examen.' },
      { q: 'Je suis mineur', a: 'Vous pouvez commencer dès 15 ans en conduite accompagnée. Un responsable légal signera le contrat avec vous.' },
      { q: 'Qui voit mes données ?', a: 'Uniquement l’équipe de votre auto-école et l’ANTS. Elles ne sont jamais revendues.' },
    ],
  },
  {
    match: /^\/inscription\/vehicule/,
    title: 'Voiture ou moto',
    intro: 'Choisissez le permis que vous souhaitez passer.',
    items: [
      { q: 'Je peux changer plus tard ?', a: 'Oui, tant que votre formation n’a pas commencé. Ensuite, parlez-en à l’agence.' },
      { q: 'Je veux passer les deux', a: 'Commencez par l’un : vous pourrez ajouter le second permis depuis votre espace. Le code reste valable pour les deux pendant 5 ans.' },
    ],
  },
  {
    match: /^\/inscription\/permis/,
    title: 'Formule et boîte',
    intro: 'Choisissez le permis et le nombre d’heures qui vous conviennent.',
    items: [
      { q: 'Manuelle ou automatique ?', a: 'La boîte automatique demande moins d’heures (13 h minimum contre 20 h). Vous pourrez conduire une manuelle après 7 h de formation complémentaire.' },
      { q: 'Combien d’heures prévoir ?', a: 'En moyenne 30 h en France. Vous pouvez ajouter des heures à tout moment depuis votre espace.' },
      { q: 'Paiement en plusieurs fois', a: 'Toutes les formules peuvent être payées en 3 ou 4 fois sans frais, et le permis à 1 € par jour est accepté.' },
    ],
  },
  {
    match: /^\/inscription\/objectif/,
    title: 'Votre objectif',
    intro: 'On adapte le rythme des leçons à votre date cible.',
    items: [
      { q: 'La date est-elle garantie ?', a: 'C’est un objectif : la date d’examen dépend des places attribuées par la préfecture et de votre progression.' },
      { q: 'Mes disponibilités changent', a: 'Vous pourrez les modifier à tout moment dans Paramètres. Les propositions de créneaux s’adapteront.' },
    ],
  },
  {
    match: /^\/inscription/,
    title: 'Inscription',
    intro: 'Créez votre espace en quelques étapes.',
    items: [{ q: 'Je peux m’arrêter en cours de route ?', a: 'Oui, vos réponses sont gardées : reprenez quand vous voulez avec la même adresse e-mail.' }],
  },

  /* ---------- Espace élève ---------- */
  {
    match: /^\/eleve\/lecons/,
    title: 'Réserver une leçon',
    intro: 'Choisissez un jour, un créneau, puis confirmez.',
    items: [
      { q: 'Comment annuler une leçon ?', a: 'Depuis l’accueil, touchez votre prochain rendez-vous puis « Gérer ». L’annulation est gratuite jusqu’à 48 h avant.' },
      { q: 'Et si j’annule moins de 48 h avant ?', a: 'La leçon est décomptée de votre forfait, sauf justificatif (maladie, examen…). Contactez l’agence.' },
      { q: 'Un créneau est « Complet »', a: 'Essayez un autre jour ou l’autre moitié de journée en touchant « Après-midi » / « Matin ».' },
      { q: 'Je n’ai plus d’heures', a: 'Ajoutez des heures depuis Paramètres › Paiements : elles sont disponibles immédiatement.' },
    ],
  },
  {
    match: /^\/eleve\/formation/,
    title: 'Ma formation',
    intro: 'Suivez votre progression au code et en conduite.',
    items: [
      { q: 'Quand suis-je prêt pour le code ?', a: 'Visez au moins 35/40 sur vos 5 dernières séries. L’indicateur « Prêt à » vous l’indique.' },
      { q: 'Comment sont validées mes compétences ?', a: 'Votre moniteur les coche après chaque leçon dans votre livret d’apprentissage numérique.' },
    ],
  },
  {
    match: /^\/eleve\/messages|^\/eleve\/conversation/,
    title: 'Messages',
    intro: 'Échangez avec votre moniteur et l’agence.',
    items: [
      { q: 'Quand vais-je avoir une réponse ?', a: 'L’agence répond en général dans la journée, du lundi au samedi.' },
      { q: 'Je peux envoyer un document ?', a: 'Pour vos pièces de dossier, passez plutôt par Documents : elles seront vérifiées plus vite.' },
    ],
  },
  {
    match: /^\/eleve\/parametres\/securite/,
    title: 'Sécurité du compte',
    intro: 'Protégez l’accès à votre espace.',
    items: [
      { q: 'Face ID ou empreinte, c’est sûr ?', a: 'Oui : votre visage ou votre empreinte restent sur votre téléphone, Virage ne les reçoit jamais.' },
      { q: 'J’ai oublié mon code à 4 chiffres', a: 'Connectez-vous avec votre mot de passe puis choisissez un nouveau code ici.' },
      { q: 'Un appareil inconnu est connecté', a: 'Touchez « Retirer » puis changez votre mot de passe.' },
    ],
  },
  {
    match: /^\/eleve\/parametres\/notifications/,
    title: 'Notifications',
    intro: 'Choisissez ce que vous recevez et comment.',
    items: [{ q: 'Je ne reçois rien sur mon téléphone', a: 'Vérifiez que les notifications de Virage sont autorisées dans les réglages de votre téléphone.' }],
  },
  {
    match: /^\/eleve\/parametres\/accessibilite/,
    title: 'Accessibilité',
    intro: 'Adaptez l’affichage à vos besoins.',
    items: [{ q: 'Les réglages de mon téléphone sont-ils pris en compte ?', a: 'Oui, la taille du texte et la réduction des animations du téléphone s’appliquent aussi à Virage.' }],
  },
  {
    match: /^\/eleve\/parametres\/suppression/,
    title: 'Supprimer mon compte',
    intro: 'Ce qu’il faut savoir avant de partir.',
    items: [{ q: 'Puis-je récupérer mon compte ensuite ?', a: 'Non, la suppression est définitive. Téléchargez vos données avant si vous en avez besoin.' }],
  },
  {
    match: /^\/eleve\/profil/,
    title: 'Mon profil',
    intro: 'Vos informations et votre dossier.',
    items: [
      { q: 'Modifier mes informations', a: 'Touchez le crayon en haut à droite, modifiez puis validez avec la coche.' },
      { q: 'Mon nom est mal orthographié', a: 'Il doit correspondre à votre pièce d’identité : corrigez-le ou prévenez l’agence.' },
    ],
  },
  {
    match: /^\/eleve\/reglages/,
    title: 'Mon compte',
    intro: 'Gérez vos informations, notifications et préférences.',
    items: [
      { q: 'Changer mon adresse e-mail', a: 'Touchez vos informations personnelles : un code de vérification vous est envoyé sur la nouvelle adresse.' },
      { q: 'Supprimer mon compte', a: 'Écrivez à l’agence : votre dossier est conservé le temps légal puis supprimé.' },
    ],
  },
  {
    match: /^\/eleve\/documents/,
    title: 'Mes documents',
    intro: 'Les pièces nécessaires à votre dossier ANTS.',
    items: [
      { q: 'Comment déposer un document ?', a: 'Touchez le document puis « Prendre une photo », « Choisir une image » ou « Importer un PDF ». Il passe ensuite en vérification.' },
      { q: 'Quels formats sont acceptés ?', a: 'Photo ou PDF, lisible, en couleur, sans reflet. 10 Mo maximum par fichier.' },
      { q: 'Mon document est refusé', a: 'Le motif est indiqué sous le document. Déposez une nouvelle version : elle est revérifiée sous 48 h.' },
      { q: 'Justificatif de domicile', a: 'Il doit dater de moins de 6 mois : facture d’énergie, d’internet, avis d’imposition ou quittance de loyer.' },
    ],
  },
  {
    match: /^\/eleve\/examen/,
    title: 'Mon examen',
    intro: 'Date, lieu, convocation et préparation.',
    items: [
      { q: 'Où est ma convocation ?', a: 'Touchez « Voir ma convocation » : présentez le QR code et une pièce d’identité le jour J.' },
      { q: 'Le rappel 2 jours avant', a: 'Activez-le en haut de la page : une notification vous rappelle l’heure, le lieu et ce qu’il faut apporter.' },
      { q: 'Quand aurai-je mon résultat ?', a: 'Sous 48 h en général, directement dans l’application et sur le site de l’ANTS.' },
      { q: 'Je ne peux plus venir', a: 'Prévenez l’agence au plus vite par message : un report est possible jusqu’à 7 jours avant.' },
    ],
  },
  {
    match: /^\/eleve\/paiements/,
    title: 'Mes paiements',
    intro: 'Échéances, factures et moyens de paiement.',
    items: [
      { q: 'Payer en une fois ou par échéances ?', a: 'Choisissez « Régler la prochaine échéance » ou « Tout régler maintenant ». Vous pouvez aussi répartir le reste en 2, 3 ou 4 fois sans frais via « Modifier ».' },
      { q: 'Racheter des heures', a: 'Dès la moitié de votre forfait, des packs de 2, 5 ou 10 h sont proposés à prix réduit. Elles s’ajoutent tout de suite à votre solde.' },
      { q: 'Changer ma carte bancaire', a: 'Au moment de payer, choisissez « Nouvelle carte ». Elle sera utilisée pour les prochaines échéances.' },
      { q: 'Où trouver mes factures ?', a: 'Elles sont listées en bas de la page et téléchargeables en PDF.' },
      { q: 'Un prélèvement a échoué', a: 'Une nouvelle tentative a lieu 3 jours plus tard. Vous pouvez aussi régler tout de suite depuis cette page.' },
    ],
  },
  {
    match: /^\/eleve\/contrat/,
    title: 'Mon contrat',
    intro: 'Votre contrat de formation et ses conditions.',
    items: [
      { q: 'Comment signer ?', a: 'Lisez le contrat, signez au doigt dans le cadre puis cochez la case d’acceptation : le bouton « Signer le contrat » devient alors disponible.' },
      { q: 'Ma signature est ratée', a: 'Touchez « Effacer » et recommencez autant de fois que nécessaire.' },
      { q: 'Délai de rétractation', a: 'Vous disposez de 14 jours après la signature pour changer d’avis, sans frais.' },
    ],
  },
  {
    match: /^\/eleve\/progression/,
    title: 'Mes acquis',
    intro: 'Les compétences de votre livret d’apprentissage.',
    items: [
      { q: 'Que signifient les niveaux ?', a: 'Abordé, en cours, puis acquis : il faut que toutes les compétences soient acquises pour passer l’examen.' },
      { q: 'Je ne suis pas d’accord', a: 'Parlez-en à votre moniteur à la prochaine leçon ou par message.' },
    ],
  },
  {
    match: /^\/eleve/,
    title: 'Votre espace',
    intro: 'Tout votre parcours au même endroit.',
    items: [
      { q: 'Passer d’un onglet à l’autre', a: 'Touchez la barre en bas, ou glissez simplement vers la gauche ou la droite.' },
      { q: 'Revenir en arrière', a: 'Glissez vers la droite sur la page, ou touchez la flèche en haut à gauche.' },
    ],
  },

  /* ---------- Espace moniteur ---------- */
  {
    match: /^\/moniteur\/disponibilites/,
    title: 'Disponibilités',
    intro: 'Les créneaux ouverts à la réservation par vos élèves.',
    items: [
      { q: 'Bloquer une demi-journée', a: 'Touchez le créneau puis « Indisponible ». Les élèves déjà inscrits sont prévenus automatiquement.' },
      { q: 'Délai de réservation', a: 'Les élèves peuvent réserver jusqu’à 24 h avant, selon le réglage de l’agence.' },
    ],
  },
  {
    match: /^\/moniteur\/lecon/,
    title: 'Fiche de leçon',
    intro: 'Le déroulé et le compte rendu de la leçon.',
    items: [
      { q: 'Remplir le compte rendu', a: 'Cochez les compétences travaillées et ajoutez un commentaire : l’élève le reçoit immédiatement.' },
      { q: 'Élève absent', a: 'Marquez la leçon « Absent » : l’agence décide ensuite si elle est décomptée.' },
    ],
  },
  {
    match: /^\/moniteur/,
    title: 'Espace moniteur',
    intro: 'Votre planning, vos élèves et vos messages.',
    items: [
      { q: 'Voir la progression d’un élève', a: 'Ouvrez sa fiche depuis l’onglet Élèves : livret, heures et prochains rendez-vous.' },
      { q: 'Un problème avec un véhicule ?', a: 'Signalez-le à l’agence depuis Messages, en précisant l’immatriculation.' },
    ],
  },

  /* ---------- Espace administration ---------- */
  {
    match: /^\/admin\/tarifs/,
    title: 'Tarifs et formules',
    intro: 'Les offres proposées aux élèves à l’inscription.',
    items: [{ q: 'Modifier un prix', a: 'Le nouveau tarif s’applique aux nouvelles inscriptions ; les contrats signés ne changent pas.' }],
  },
  {
    match: /^\/admin\/roles|^\/admin\/equipe/,
    title: 'Équipe et rôles',
    intro: 'Qui a accès à quoi dans l’application.',
    items: [
      { q: 'Ajouter un moniteur', a: 'Invitez-le par e-mail : il crée son mot de passe et accède à son espace moniteur.' },
      { q: 'Limiter un accès', a: 'Chaque rôle définit les pages visibles (finances, dossiers, planning…).' },
    ],
  },
  {
    match: /^\/admin\/examens/,
    title: 'Examens',
    intro: 'Places d’examen et candidats présentés.',
    items: [{ q: 'Attribuer une place', a: 'Choisissez la session puis les élèves prêts : ils sont notifiés et la date apparaît dans leur espace.' }],
  },
  {
    match: /^\/admin/,
    title: 'Administration',
    intro: 'Pilotez l’auto-école : élèves, planning, finances.',
    items: [
      { q: 'Valider un dossier', a: 'Ouvrez la fiche de l’élève, vérifiez chaque pièce puis acceptez ou refusez avec un motif.' },
      { q: 'Exporter les données', a: 'Depuis Finances, téléchargez les encaissements au format CSV pour votre comptable.' },
    ],
  },
];

const fallback: HelpContent = {
  title: 'Besoin d’aide ?',
  intro: 'Notre équipe vous répond du lundi au samedi.',
  items: [{ q: 'Contacter l’auto-école', a: 'Par téléphone au 04 78 00 00 00 ou par message depuis votre espace.' }],
};

export function helpFor(pathname: string): HelpContent {
  return entries.find((e) => e.match.test(pathname)) ?? fallback;
}
