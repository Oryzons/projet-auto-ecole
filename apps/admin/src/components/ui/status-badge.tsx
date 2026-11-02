import { Badge, type BadgeVariant } from "@/components/ui/card";
import { APPLICATION_STATUS_LABELS } from "@/lib/constants";

const APPLICATION_TONES: Record<string, BadgeVariant> = {
  DRAFT: "neutral",
  DOCUMENTS_PENDING: "warning",
  DOCUMENTS_REVIEW: "info",
  PAYMENT_PENDING: "warning",
  PAID: "success",
  COMPLETED: "success",
  REJECTED: "danger",
};

export function applicationTone(status: string): BadgeVariant {
  return APPLICATION_TONES[status] ?? "neutral";
}

export function ApplicationStatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <Badge variant={applicationTone(status)} dot className={className}>
      {APPLICATION_STATUS_LABELS[status] ?? status}
    </Badge>
  );
}

const DOCUMENT_STATUS: Record<string, { label: string; tone: BadgeVariant }> = {
  MISSING: { label: "À déposer", tone: "neutral" },
  PENDING: { label: "En vérification", tone: "warning" },
  APPROVED: { label: "Validé", tone: "success" },
  REJECTED: { label: "À renvoyer", tone: "danger" },
};

export function documentStatusMeta(status: string | null | undefined) {
  return DOCUMENT_STATUS[status ?? "MISSING"] ?? DOCUMENT_STATUS.MISSING;
}

export function DocumentStatusBadge({ status, className }: { status?: string | null; className?: string }) {
  const meta = documentStatusMeta(status);
  return (
    <Badge variant={meta.tone} dot className={className}>
      {meta.label}
    </Badge>
  );
}

const PAYMENT_STATUS: Record<string, { label: string; tone: BadgeVariant }> = {
  PENDING: { label: "En attente", tone: "warning" },
  COMPLETED: { label: "Payé", tone: "success" },
  FAILED: { label: "Échoué", tone: "danger" },
  REFUNDED: { label: "Remboursé", tone: "neutral" },
};

export function PaymentStatusBadge({ status, className }: { status: string; className?: string }) {
  const meta = PAYMENT_STATUS[status] ?? { label: status, tone: "neutral" as const };
  return (
    <Badge variant={meta.tone} dot className={className}>
      {meta.label}
    </Badge>
  );
}
