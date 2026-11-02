/** Textes légaux fictifs : à remplacer par les documents validés de l'auto-école */

export type LegalDoc = 'cgv' | 'cgu' | 'confidentialite' | 'mentions';

type Doc = { title: string; short: string; updated: string; sections: { heading: string; body: string }[] };

export const legalDocs: Record<LegalDoc, Doc> = {
  cgv: {
    title: 'Conditions générales de vente',
    short: 'CGV',
    updated: '1er septembre 2026',
    sections: [
      { heading: 'Objet', body: 'Les présentes conditions encadrent la vente des formations au permis de conduire proposées par Virage, auto-école agréée.' },
      { heading: 'Tarifs et formules', body: 'Les prix sont indiqués TTC. Le détail de chaque formule (heures de conduite, accès au code, frais de présentation) figure dans le contrat de formation.' },
      { heading: 'Paiement', body: 'Le règlement peut être effectué comptant ou en 3 ou 4 fois sans frais. Le financement par le permis à 1 € par jour et le CPF est accepté.' },
      { heading: 'Rétractation', body: 'Vous disposez de 14 jours après la signature du contrat pour vous rétracter, sans justification ni frais.' },
      { heading: 'Annulation des leçons', body: 'Toute leçon annulée moins de 48 h à l’avance est due, sauf motif légitime justifié (maladie, convocation…).' },
    ],
  },
  cgu: {
    title: 'Conditions générales d’utilisation',
    short: 'CGU',
    updated: '1er septembre 2026',
    sections: [
      { heading: 'Accès au service', body: 'L’application Virage est réservée aux élèves, moniteurs et personnels de l’auto-école disposant d’un compte.' },
      { heading: 'Compte et identifiants', body: 'Vous êtes responsable de la confidentialité de votre mot de passe. Signalez-nous toute utilisation non autorisée.' },
      { heading: 'Bon usage', body: 'Les messages échangés doivent rester courtois. Tout contenu abusif peut entraîner la suspension du compte.' },
      { heading: 'Disponibilité', body: 'Nous faisons notre possible pour que l’application soit accessible en continu, hors opérations de maintenance.' },
    ],
  },
  confidentialite: {
    title: 'Politique de confidentialité',
    short: 'Confidentialité',
    updated: '1er septembre 2026',
    sections: [
      { heading: 'Données collectées', body: 'Identité, coordonnées, pièces justificatives, progression de formation et historique des leçons.' },
      { heading: 'Finalités', body: 'Gestion de votre formation, inscription aux examens via l’ANTS, facturation et communication avec l’équipe.' },
      { heading: 'Durée de conservation', body: 'Vos données sont conservées pendant la durée de la formation, puis archivées pendant la durée légale.' },
      { heading: 'Vos droits', body: 'Vous pouvez accéder à vos données, les rectifier, les exporter ou demander leur suppression depuis Paramètres ou en nous écrivant.' },
    ],
  },
  mentions: {
    title: 'Mentions légales',
    short: 'Mentions légales',
    updated: '1er septembre 2026',
    sections: [
      { heading: 'Éditeur', body: 'Virage SAS, auto-école agréée, 12 rue Garibaldi, 69007 Lyon. Agrément préfectoral n° E 26 069 0000 0.' },
      { heading: 'Contact', body: 'contact@virage-auto.fr · 04 78 00 00 00' },
      { heading: 'Hébergement', body: 'Les données sont hébergées en France, chez un prestataire certifié HDS.' },
    ],
  },
};
