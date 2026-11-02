import { DocumentType } from "@/lib/db/client";

export const DOCUMENT_LABELS: Record<DocumentType, string> = {
  TRAINING_CONTRACT: "Contrat de formation",
  ID_CARD: "Pièce d'identité",
  ID_PHOTO: "E-photo (code ANTS)",
  PROOF_OF_ADDRESS: "Justificatif de domicile",
  ASSR: "ASSR 2 ou ASR",
  JDC: "Attestation JDC ou recensement",
  PARTNER_BADGE: "Justificatif de tarif réduit",
};

export const REQUIRED_DOCUMENTS: DocumentType[] = [
  DocumentType.TRAINING_CONTRACT,
  DocumentType.ID_CARD,
  DocumentType.ID_PHOTO,
  DocumentType.PROOF_OF_ADDRESS,
  DocumentType.ASSR,
  DocumentType.JDC,
];

export const OPTIONAL_DOCUMENTS: DocumentType[] = [DocumentType.PARTNER_BADGE];

export const ALL_DOCUMENT_TYPES: DocumentType[] = [
  ...REQUIRED_DOCUMENTS,
  ...OPTIONAL_DOCUMENTS,
];

/** Pièces pour lesquelles l'auto-école peut fournir un modèle et une consigne : toutes. */
export const TEMPLATE_DOWNLOAD_TYPES: DocumentType[] = ALL_DOCUMENT_TYPES;

export type TemplateDocumentType = DocumentType;

/** Consigne affichée à l'élève à côté d'une pièce (texte et/ou lien). */
export interface DocumentGuidance {
  instructions?: string;
  linkUrl?: string;
  linkLabel?: string;
}

export type DocumentGuidanceMap = Partial<Record<DocumentType, DocumentGuidance>>;

export interface DocumentTemplateFile {
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  updatedAt: string;
}

export type DocumentTemplates = Partial<
  Record<TemplateDocumentType, DocumentTemplateFile>
>;

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  STRIPE: "Stripe",
  CARD: "Carte bancaire",
  CASH: "Espèces",
  CHECK: "Chèque",
  TRANSFER: "Virement",
};

export const MANUAL_PAYMENT_METHODS = [
  "CARD",
  "CASH",
  "CHECK",
  "TRANSFER",
  "STRIPE",
] as const;

export const APPLICATION_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Brouillon",
  DOCUMENTS_PENDING: "Documents en attente",
  DOCUMENTS_REVIEW: "En cours de vérification",
  PAYMENT_PENDING: "Paiement en attente",
  PAID: "Payé",
  COMPLETED: "Terminé",
  REJECTED: "Refusé",
};

export const PERMIT_TYPES = [
  { value: "permis-b", label: "Permis B · boîte manuelle" },
  { value: "permis-b-auto", label: "Permis B · boîte auto" },
  { value: "aac", label: "Conduite accompagnée (AAC)" },
  { value: "a2", label: "Permis moto A2" },
] as const;

export type PermitTypeValue = (typeof PERMIT_TYPES)[number]["value"];

export type PermitPrice = { standard: number; partner: number };

export type PermitPrices = Partial<Record<PermitTypeValue, PermitPrice>>;

export type PermitBriefings = Partial<Record<PermitTypeValue, string>>;

export type DiscountKind = "amount" | "percent";

export interface DiscountCode {
  code: string;
  label: string;
  kind: DiscountKind;
  /** Centimes si `amount`, pourcentage entier si `percent`. */
  value: number;
}

function briefing(name: string, scope: string) {
  return `Vous êtes inscrit au ${name}, ${scope}

Voici le déroulement de votre formation :

1. Déposez vos pièces : contrat de formation, pièce d'identité, e-photo, justificatif de domicile, ASSR et attestation JDC.
2. L'auto-école vérifie chaque document puis dépose votre demande de numéro NEPH auprès de l'ANTS.
3. Réglez votre formation en ligne, en plusieurs fois si vous le souhaitez, ou directement à l'agence.
4. Révisez le code, réservez vos séances en salle et vos leçons de conduite depuis l'application.

Vous suivez chaque étape ici, et vous pouvez écrire à l'auto-école à tout moment.`;
}

const PERMIS_B_BRIEFING = `Votre formation au permis B se déroule en deux temps : le dossier ANTS et le code, puis la conduite et l'examen pratique.

# 1. Votre dossier ANTS

Pour demander votre numéro NEPH auprès de l'ANTS, nous avons besoin des documents suivants :

- Contrat de formation signé
- Pièce d'identité recto verso en cours de validité
- E-photo avec son code (cabine agréée ou photographe)
- Justificatif de domicile de moins de 6 mois
- ASSR 2 ou ASR (si vous êtes né après 1988)
- Attestation de participation à la JDC ou de recensement (moins de 25 ans)

Dès réception de ces pièces, nous déposons votre demande. Le numéro NEPH arrive en général sous 1 à 3 semaines. Il vous permet de vous inscrire à l'examen du code.

# 2. Le code de la route

Vos accès à la plateforme de révision en ligne sont ouverts dès le règlement de la formation. Vous y trouverez des cours, des séries thématiques et des examens blancs.

Des séances de code en salle sont organisées chaque semaine à l'agence. Réservez votre place depuis le calendrier.

# 3. La conduite

Vos leçons sont planifiées avec votre moniteur référent, à l'agence ou depuis l'application. Le livret d'apprentissage suit vos progrès compétence par compétence.

Quand votre moniteur vous juge prêt, nous vous proposons une date d'examen pratique.

Une question sur les démarches ou les documents ? Écrivez-nous depuis la messagerie, nous vous répondons rapidement.`;

export const DEFAULT_PERMIT_BRIEFINGS: Record<PermitTypeValue, string> = {
  "permis-b": PERMIS_B_BRIEFING,
  "permis-b-auto": briefing("permis B en boîte automatique", "une formation courte de 13 heures minimum."),
  aac: briefing("permis B en conduite accompagnée", "dès 15 ans, avec 3 000 km à parcourir avec votre accompagnateur."),
  a2: briefing("permis moto A2", "pour les motos jusqu'à 35 kW."),
};

export interface CompanyProfile {
  legalName: string;
  address: string;
  postalCode: string;
  city: string;
  siret: string;
  vatNumber: string;
  email: string;
  phone: string;
}

export const DEFAULT_COMPANY_PROFILE: CompanyProfile = {
  legalName: "",
  address: "",
  postalCode: "",
  city: "",
  siret: "",
  vatNumber: "",
  email: "",
  phone: "",
};

/** Coordonnées bancaires affichées à l'élève pour un virement (sans frais). */
export interface BankTransferSettings {
  enabled: boolean;
  holder: string;
  iban: string;
  bic: string;
}

export const DEFAULT_BANK_TRANSFER: BankTransferSettings = {
  enabled: false,
  holder: "",
  iban: "",
  bic: "",
};

export interface OrgSettings {
  standardPrice: number;
  partnerPrice: number;
  /** Tarif standard et partenaire de chaque permis, en centimes. */
  permitPrices: PermitPrices;
  fiscalStampPrice: number;
  permitTypes: string[];
  /** Texte de la fenêtre d'accueil, propre à chaque permis. Vide = texte par défaut. */
  permitBriefings: PermitBriefings;
  /** Codes proposés à l'inscription, en alternative au tarif partenaire. */
  discountCodes: DiscountCode[];
  lastStripeSyncAt?: string | null;
  /** Ancien réglage Klarna, conservé pour ne pas casser les paramètres déjà enregistrés. */
  installmentsEnabled?: boolean;
  bankTransfer?: BankTransferSettings;
  documentTemplates?: DocumentTemplates;
  documentGuidance?: DocumentGuidanceMap;
  company?: CompanyProfile;
}

export const DEFAULT_ORG_SETTINGS: OrgSettings = {
  standardPrice: 135000,
  partnerPrice: 115000,
  permitPrices: {
    "permis-b": { standard: 135000, partner: 115000 },
    "permis-b-auto": { standard: 99000, partner: 89000 },
    aac: { standard: 149000, partner: 129000 },
    a2: { standard: 129000, partner: 109000 },
  },
  fiscalStampPrice: 8000,
  permitTypes: ["permis-b", "permis-b-auto", "aac", "a2"],
  permitBriefings: {},
  discountCodes: [],
  installmentsEnabled: false,
  bankTransfer: DEFAULT_BANK_TRANSFER,
  company: DEFAULT_COMPANY_PROFILE,
};

/** Montant TTC d'un dossier, selon le permis et le tarif partenaire. */
export function quotePermitPrice(
  settings: Pick<OrgSettings, "permitPrices" | "standardPrice" | "partnerPrice">,
  permitType: string,
  partnerRate: boolean,
): number {
  const row = PERMIT_TYPES.some((permit) => permit.value === permitType)
    ? settings.permitPrices[permitType as PermitTypeValue]
    : undefined;
  if (partnerRate) return row?.partner ?? settings.partnerPrice;
  return row?.standard ?? settings.standardPrice;
}

export function normalizeDiscountCode(code: string) {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

/** Réduction sur le tarif standard. Le tarif partenaire ne se cumule pas avec un code. */
export function applyDiscount(amount: number, kind?: string | null, value?: number | null) {
  if (!kind || value == null || value <= 0) return amount;
  if (kind === "percent") {
    const percent = Math.min(100, value);
    return Math.max(0, Math.round((amount * (100 - percent)) / 100));
  }
  if (kind === "amount") return Math.max(0, amount - value);
  return amount;
}

export function priceForChoice(
  settings: Pick<OrgSettings, "permitPrices" | "standardPrice" | "partnerPrice">,
  permitType: string,
  partnerRate: boolean,
  discount?: { kind?: string | null; value?: number | null } | null,
) {
  const base = quotePermitPrice(settings, permitType, partnerRate);
  if (partnerRate) return base;
  return applyDiscount(base, discount?.kind, discount?.value);
}

export function permitBriefingText(settings: Pick<OrgSettings, "permitBriefings">, permitType: string) {
  const known = PERMIT_TYPES.find((permit) => permit.value === permitType);
  const custom = known ? settings.permitBriefings[known.value]?.trim() : "";
  if (custom) return custom;
  return DEFAULT_PERMIT_BRIEFINGS[known?.value ?? "permis-b"];
}

export function prepareDiscountCodes(codes: DiscountCode[]): { codes: DiscountCode[] } | { error: string } {
  const seen = new Set<string>();
  const prepared: DiscountCode[] = [];
  for (const code of codes) {
    const normalized = normalizeDiscountCode(code.code);
    if (normalized.length < 2 || normalized.length > 40 || !/^[A-Z0-9_-]+$/.test(normalized)) {
      return { error: "Un code de réduction ne peut contenir que des lettres, des chiffres et des tirets." };
    }
    if (seen.has(normalized)) return { error: `Le code ${normalized} est en double.` };
    seen.add(normalized);
    if (code.kind === "percent" && (code.value < 1 || code.value > 100)) {
      return { error: "Un pourcentage doit être compris entre 1 et 100." };
    }
    if (code.kind === "amount" && code.value < 1) {
      return { error: "Le montant d'une réduction est invalide." };
    }
    prepared.push({
      code: normalized,
      label: code.label.trim().slice(0, 80),
      kind: code.kind,
      value: code.value,
    });
  }
  return { codes: prepared };
}
