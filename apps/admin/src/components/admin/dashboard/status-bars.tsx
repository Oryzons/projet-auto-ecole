"use client";

import Link from "next/link";
import { motion } from "motion/react";

import { EASE_OUT } from "@/components/motion/tokens";
import { APPLICATION_STATUS_LABELS } from "@/lib/constants";

const ORDER = ["DOCUMENTS_PENDING", "DOCUMENTS_REVIEW", "PAYMENT_PENDING", "PAID", "COMPLETED"] as const;
const SHADES: Record<string, string> = {
  DOCUMENTS_PENDING: "bg-[#b9d4f7]",
  DOCUMENTS_REVIEW: "bg-[#7fb2f0]",
  PAYMENT_PENDING: "bg-[#3b8cf0]",
  PAID: "bg-primary",
  COMPLETED: "bg-[#0b3d91]",
};

export function StatusBars({ statuses }: { statuses: Partial<Record<string, number>> }) {
  const rows = ORDER.map((status) => ({
    status,
    count: (statuses[status] ?? 0) + (status === "DOCUMENTS_PENDING" ? statuses.DRAFT ?? 0 : 0),
  }));
  const max = Math.max(1, ...rows.map((r) => r.count));
  const total = rows.reduce((sum, r) => sum + r.count, 0);

  return (
    <div className="space-y-4">
      <div className="flex h-2.5 overflow-hidden rounded-full bg-secondary">
        {rows.map((row, index) =>
          row.count > 0 ? (
            <motion.span
              key={row.status}
              className={`${SHADES[row.status]} h-full first:rounded-l-full last:rounded-r-full`}
              initial={{ width: 0 }}
              animate={{ width: `${(row.count / Math.max(total, 1)) * 100}%` }}
              transition={{ duration: 0.9, ease: EASE_OUT, delay: 0.1 + index * 0.05 }}
            />
          ) : null,
        )}
      </div>
      <ul className="space-y-1">
        {rows.map((row, index) => (
          <li key={row.status}>
            <Link
              href={`/admin/applications?status=${row.status}`}
              className="group flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-subtle"
            >
              <span className={`size-2.5 shrink-0 rounded-full ${SHADES[row.status]}`} />
              <span className="flex-1 text-[13px] text-foreground">{APPLICATION_STATUS_LABELS[row.status]}</span>
              <span className="hidden h-1.5 w-20 overflow-hidden rounded-full bg-secondary sm:block">
                <motion.span
                  className="block h-full rounded-full bg-primary/70"
                  initial={{ width: 0 }}
                  animate={{ width: `${(row.count / max) * 100}%` }}
                  transition={{ duration: 0.8, ease: EASE_OUT, delay: 0.2 + index * 0.05 }}
                />
              </span>
              <span className="w-6 text-right text-[13px] font-semibold text-foreground tabular-nums">{row.count}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
