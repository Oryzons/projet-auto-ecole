export type HelpTopic = "dossiers" | "documents" | "paiements" | "compte";

export type FaqItem = {
  id: string;
  topic: HelpTopic;
  question: string;
  answer: string;
};

export const HELP_TOPICS: { value: HelpTopic | "all"; label: string }[] = [
  { value: "all", label: "Tout" },
  { value: "dossiers", label: "Dossiers" },
  { value: "documents", label: "Documents" },
  { value: "paiements", label: "Paiements" },
  { value: "compte", label: "Compte" },
];

export const ADMIN_HELP_FAQS: FaqItem[] = [
  {
    id: "create-candidate",
    topic: "dossiers",
    question: "Comment créer un dossier élève ?",
    answer:
      "Sur la page Dossiers, cliquez sur « Nouvel élève ». Renseignez son identité, ses coordonnées et son tarif, puis validez. L'élève reçoit aussitôt un email pour choisir son mot de passe et accéder à son espace.",
  },
  {
    id: "invite-again",
    topic: "dossiers",
    question: "L'élève n'a pas reçu son invitation, que faire ?",
    answer:
      "Ouvrez sa fiche, cliquez sur le bouton « … » puis « Renvoyer l'invitation ». Un nouveau lien, valable 7 jours, lui est envoyé. Pensez à lui demander de vérifier ses courriers indésirables.",
  },
  {
    id: "documents-review",
    topic: "documents",
    question: "Comment valider ou refuser un document ?",
    answer:
      "Les pièces à vérifier apparaissent sur le tableau de bord et dans chaque fiche élève. Cliquez sur « Voir » pour ouvrir le fichier, puis sur « Valider » ou « Refuser ». En cas de refus, indiquez le motif : l'élève est prévenu et peut renvoyer la pièce.",
  },
  {
    id: "documents-on-behalf",
    topic: "documents",
    question: "Puis-je déposer un document à la place de l'élève ?",
    answer:
      "Oui. Dans la fiche élève, cliquez sur « Déposer » en face de la pièce concernée. Le document est enregistré dans son dossier comme s'il l'avait envoyé lui-même.",
  },
  {
    id: "templates",
    topic: "documents",
    question: "Comment fournir le certificat médical et le contrat à remplir ?",
    answer:
      "Dans Paramètres, section « Modèles », importez vos fichiers PDF. Les élèves peuvent ensuite les télécharger depuis leur page Documents avant de les déposer complétés.",
  },
  {
    id: "manual-payment",
    topic: "paiements",
    question: "Un élève a payé sur place, comment l'enregistrer ?",
    answer:
      "Ouvrez sa fiche, choisissez le mode de paiement (carte, espèces, chèque ou virement) dans la carte Paiement. « Marquer comme payé » encaisse le solde. « Paiement en plusieurs fois » enregistre chaque versement : le dossier passe à Payé seulement quand le total est couvert. Une facture est générée à chaque versement.",
  },
  {
    id: "stripe",
    topic: "paiements",
    question: "Comment activer le paiement en ligne ?",
    answer:
      "Dans Paramètres, section « Paiement », collez l'identifiant de votre compte Stripe Connect (il commence par acct_). Si un paiement en ligne n'apparaît pas, utilisez « Synchroniser » sur la page Finances.",
  },
  {
    id: "installments",
    topic: "paiements",
    question: "Un élève peut-il payer en plusieurs fois ?",
    answer:
      "En ligne, le paiement Stripe se fait en une fois. Si l'élève vous règle en plusieurs fois (espèces, chèque, virement ou carte sur place), enregistrez chaque versement depuis sa fiche, dans la carte Paiement.",
  },
  {
    id: "calendar",
    topic: "dossiers",
    question: "Comment organiser les séances de code ?",
    answer:
      "Dans Calendrier, cliquez sur « Nouvelle session » : lieu, date, heure, durée et nombre de places. Les élèves reçoivent une alerte et un email, puis s'inscrivent depuis leur espace une fois leur formation réglée en totalité et peuvent demander un rappel par email 2 jours avant. Cliquez sur une session pour voir les inscrits, en ajouter ou en retirer, la modifier ou la supprimer : les inscrits sont prévenus.",
  },
  {
    id: "moniteur",
    topic: "dossiers",
    question: "Qu'est-ce qu'un moniteur ?",
    answer:
      "Un formateur qui a accès uniquement au calendrier des séances de code : il crée et modifie les sessions, y inscrit des élèves et consulte l'historique des séances passées. Il ne peut ni supprimer une session ni retirer un élève, et ne voit ni les dossiers ni les finances. Invitez-le dans Membres, onglet « Équipe ». Il reçoit un email pour choisir son mot de passe.",
  },
  {
    id: "attendance",
    topic: "dossiers",
    question: "Comment faire l'appel à la séance de code ?",
    answer:
      "Le jour de la séance, ouvrez-la dans le Calendrier puis « Faire l'appel par QR code ». Un QR code s'affiche (il change toutes les 15 secondes) : chaque élève le scanne avec l'appareil photo de son téléphone et il est noté présent. Pointez à la main un élève sans téléphone. « Terminer l'appel » envoie le relevé des présents et absents aux administrateurs ; il reste consultable dans la fiche de la séance.",
  },
  {
    id: "emails",
    topic: "dossiers",
    question: "Quels emails reçoivent les élèves ?",
    answer:
      "Un email aux couleurs de Virage part à chaque étape : bienvenue, document à renvoyer, dossier validé, paiement, nouveau message, séance de code (nouvelle date, inscription, rappel 2 jours avant, modification ou annulation). Dans Paramètres, section « Emails », vous pouvez tous les prévisualiser et vous en envoyer un exemplaire de test.",
  },
  {
    id: "bank-transfer",
    topic: "paiements",
    question: "Comment recevoir les paiements par virement, sans frais ?",
    answer:
      "Dans Paramètres, section « Paiement », renseignez le titulaire et l'IBAN puis activez « Proposer le paiement par virement ». L'élève voit vos coordonnées et une référence propre à son dossier, puis signale son virement. Il apparaît dans Finances, « Virements à confirmer » : confirmez la réception quand l'argent est sur votre compte, la facture est alors émise et le paiement compte dans les statistiques.",
  },
  {
    id: "pricing",
    topic: "paiements",
    question: "Où modifier les tarifs ?",
    answer:
      "Dans Paramètres, section « Tarifs et permis ». Chaque permis a son tarif standard, son tarif partenaire, et le texte d'instructions affiché à l'élève après son inscription. Vous pouvez aussi y créer des codes de réduction. Les nouveaux montants s'appliquent aux dossiers qui ne sont pas encore payés.",
  },
  {
    id: "export-data",
    topic: "dossiers",
    question: "Comment exporter la liste des dossiers ?",
    answer:
      "Sur la page Dossiers, cliquez sur « Exporter » et choisissez Excel, CSV ou ZIP. Le ZIP contient un dossier par élève avec ses informations et ses documents. Si des dossiers sont sélectionnés, seuls ceux-ci sont exportés.",
  },
  {
    id: "password",
    topic: "compte",
    question: "Comment changer mon mot de passe ?",
    answer:
      "Ouvrez le menu en haut à droite, puis « Mon profil ». Vous pouvez y changer votre photo, vos informations et votre mot de passe. En cas d'oubli, utilisez « Mot de passe oublié » sur la page de connexion.",
  },
  {
    id: "notifications",
    topic: "compte",
    question: "Comment fonctionnent les notifications ?",
    answer:
      "Les nouveaux documents, messages et paiements s'affichent en temps réel dans la cloche en haut de l'écran. Ouvrez-la pour les consulter : elles sont alors marquées comme lues.",
  },
];
