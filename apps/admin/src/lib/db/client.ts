/**
 * Types et énumérations de la base, identiques à ceux que génère Prisma
 * depuis le schéma (voir supabase/README.md pour la migration vers Postgres).
 */
import { KnownRequestError } from "./engine";

export const Role = { ADMIN: "ADMIN", CANDIDATE: "CANDIDATE", SKIPPER: "SKIPPER" } as const;
export type Role = (typeof Role)[keyof typeof Role];

export const ApplicationStatus = {
  DRAFT: "DRAFT",
  DOCUMENTS_PENDING: "DOCUMENTS_PENDING",
  DOCUMENTS_REVIEW: "DOCUMENTS_REVIEW",
  PAYMENT_PENDING: "PAYMENT_PENDING",
  PAID: "PAID",
  COMPLETED: "COMPLETED",
  REJECTED: "REJECTED",
} as const;
export type ApplicationStatus = (typeof ApplicationStatus)[keyof typeof ApplicationStatus];

/** Pièces du dossier ANTS d'un élève */
export const DocumentType = {
  TRAINING_CONTRACT: "TRAINING_CONTRACT",
  ID_CARD: "ID_CARD",
  ID_PHOTO: "ID_PHOTO",
  PROOF_OF_ADDRESS: "PROOF_OF_ADDRESS",
  ASSR: "ASSR",
  JDC: "JDC",
  PARTNER_BADGE: "PARTNER_BADGE",
} as const;
export type DocumentType = (typeof DocumentType)[keyof typeof DocumentType];

export const DocumentStatus = { PENDING: "PENDING", APPROVED: "APPROVED", REJECTED: "REJECTED" } as const;
export type DocumentStatus = (typeof DocumentStatus)[keyof typeof DocumentStatus];

export const PaymentStatus = { PENDING: "PENDING", COMPLETED: "COMPLETED", FAILED: "FAILED", REFUNDED: "REFUNDED" } as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const PaymentMethod = { STRIPE: "STRIPE", CARD: "CARD", CASH: "CASH", CHECK: "CHECK", TRANSFER: "TRANSFER" } as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const EventType = {
  CREATED: "CREATED",
  DOCUMENT_UPLOADED: "DOCUMENT_UPLOADED",
  DOCUMENT_APPROVED: "DOCUMENT_APPROVED",
  DOCUMENT_REJECTED: "DOCUMENT_REJECTED",
  PAYMENT_INITIATED: "PAYMENT_INITIATED",
  PAYMENT_COMPLETED: "PAYMENT_COMPLETED",
  MESSAGE_SENT: "MESSAGE_SENT",
  STATUS_CHANGED: "STATUS_CHANGED",
  COMPLETED: "COMPLETED",
} as const;
export type EventType = (typeof EventType)[keyof typeof EventType];

export const PasswordTokenPurpose = { ACTIVATION: "ACTIVATION", RESET: "RESET" } as const;
export type PasswordTokenPurpose = (typeof PasswordTokenPurpose)[keyof typeof PasswordTokenPurpose];

export type Organization = {
  id: string;
  slug: string;
  name: string;
  settings: unknown;
  stripeAccountId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type User = {
  id: string;
  email: string;
  passwordHash: string;
  role: Role;
  firstName: string;
  lastName: string;
  phone: string | null;
  profilePhotoUrl: string | null;
  street: string | null;
  postalCode: string | null;
  city: string | null;
  dateOfBirth: Date | null;
  /** Numéro NEPH (dossier ANTS) — colonne héritée du schéma Nautiflow */
  oedippNumber: string | null;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type PermitApplication = {
  id: string;
  organizationId: string;
  candidateId: string;
  permitType: string;
  status: ApplicationStatus;
  partnerRate: boolean;
  partnerCompany: string | null;
  discountCode: string | null;
  discountKind: string | null;
  discountValue: number | null;
  briefingSeenAt: Date | null;
  totalAmount: number | null;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Document = {
  id: string;
  applicationId: string;
  type: DocumentType;
  status: DocumentStatus;
  fileUrl: string;
  fileKey: string | null;
  fileName: string;
  fileSize: number;
  mimeType: string;
  rejectionReason: string | null;
  reviewedById: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Payment = {
  id: string;
  applicationId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: PaymentMethod;
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
  installmentCount: number | null;
  installmentIndex: number | null;
  paidAt: Date | null;
  invoiceNumber: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Message = {
  id: string;
  applicationId: string;
  senderId: string;
  content: string;
  readAt: Date | null;
  createdAt: Date;
};

export type TheorySession = {
  id: string;
  organizationId: string;
  title: string;
  location: string;
  startsAt: Date;
  durationMinutes: number;
  capacity: number;
  notes: string | null;
  createdById: string | null;
  createdAt: Date;
  updatedAt: Date;
  attendanceSecret: string | null;
  attendanceOpenedAt: Date | null;
  attendanceClosedAt: Date | null;
};

export type SessionRegistration = {
  id: string;
  sessionId: string;
  candidateId: string;
  reminder: boolean;
  reminderSentAt: Date | null;
  attendedAt: Date | null;
  attendanceMethod: string | null;
  codeEmailSentAt: Date | null;
  createdAt: Date;
};

export type ApplicationEvent = {
  id: string;
  applicationId: string;
  userId: string | null;
  type: EventType;
  metadata: unknown;
  createdAt: Date;
};

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Prisma {
  export type InputJsonValue = string | number | boolean | { [key: string]: unknown } | unknown[];
  export type JsonValue = InputJsonValue | null;
  export const PrismaClientKnownRequestError = KnownRequestError;
  export type PrismaClientKnownRequestError = KnownRequestError;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type TransactionClient = any;
}
