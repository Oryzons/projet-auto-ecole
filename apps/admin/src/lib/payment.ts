import { ApplicationStatus } from "@/lib/db/client";

const PAYMENT_BLOCKED_STATUSES: ApplicationStatus[] = [
  ApplicationStatus.PAID,
  ApplicationStatus.COMPLETED,
  ApplicationStatus.REJECTED,
];

export const INSTALLMENT_COUNTS = [2, 3, 4] as const;

export type InstallmentCount = (typeof INSTALLMENT_COUNTS)[number];

export function isInstallmentCount(value: number): value is InstallmentCount {
  return INSTALLMENT_COUNTS.some((count) => count === value);
}

export function canInitiatePayment(
  status: ApplicationStatus,
  fullyPaid: boolean,
): boolean {
  if (fullyPaid) return false;
  return !PAYMENT_BLOCKED_STATUSES.includes(status);
}

export function sumCompletedPayments(
  payments: { status: string; amount: number }[],
) {
  return payments
    .filter((payment) => payment.status === "COMPLETED")
    .reduce((sum, payment) => sum + payment.amount, 0);
}

export function paymentCoverage(
  payments: { status: string; amount: number }[],
  totalAmount: number | null | undefined,
) {
  const paidAmount = sumCompletedPayments(payments);
  const total = totalAmount && totalAmount > 0 ? totalAmount : 0;
  const remaining = Math.max(0, total - paidAmount);
  const fullyPaid = total > 0 && remaining === 0;
  return {
    paidAmount,
    total,
    remaining,
    fullyPaid,
    partial: paidAmount > 0 && !fullyPaid,
  };
}

export function suggestedInstallmentCents(
  total: number,
  count: number,
  paidAmount: number,
  recordedInstallments: number,
) {
  const remaining = Math.max(0, total - paidAmount);
  const slots = Math.max(1, count - recordedInstallments);
  if (slots <= 1) return remaining;
  return Math.floor(remaining / slots);
}

export function eurosToCents(value: string): number | null {
  const normalized = value.trim().replace(/\s/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const cents = Math.round(Number(normalized) * 100);
  return Number.isFinite(cents) && cents > 0 ? cents : null;
}

export function centsToEurosInput(cents: number) {
  return (cents / 100).toFixed(2).replace(".", ",");
}
