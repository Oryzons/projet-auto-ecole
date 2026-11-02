"use client";

import { AnimatePresence, motion } from "motion/react";
import { ChevronRight, FileClock, FolderOpen } from "lucide-react";

import { EASE_OUT } from "@/components/motion/tokens";
import { Avatar } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { TheoryCourseBadge } from "@/components/ui/theory-course-badge";
import { ApplicationStatusBadge } from "@/components/ui/status-badge";
import type { TheoryCourseInfo } from "@/lib/application-types";
import { PERMIT_TYPES, REQUIRED_DOCUMENTS } from "@/lib/constants";
import { RelativeTime } from "@/components/ui/relative-time";
import { paymentCoverage } from "@/lib/payment";
import { cn, formatCurrency } from "@/lib/utils";

export type ApplicationRow = {
  id: string;
  status: string;
  permitType: string;
  partnerRate: boolean;
  discountCode?: string | null;
  totalAmount: number | null;
  updatedAt: string;
  candidate: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    profilePhotoUrl?: string | null;
    street?: string | null;
    postalCode?: string | null;
    city?: string | null;
    dateOfBirth?: string | null;
    oedippNumber?: string | null;
  };
  payments: { status: string; amount: number }[];
  documents: { id: string; type: string; status: string }[];
  theoryCourse?: TheoryCourseInfo;
};

function permitLabel(value: string) {
  return PERMIT_TYPES.find((item) => item.value === value)?.label ?? value;
}

function DocsProgress({ documents }: { documents: ApplicationRow["documents"] }) {
  const required = REQUIRED_DOCUMENTS.length;
  const approved = REQUIRED_DOCUMENTS.filter((t) => documents.some((d) => d.type === t && d.status === "APPROVED")).length;
  const uploaded = REQUIRED_DOCUMENTS.filter((t) => documents.some((d) => d.type === t)).length;
  return (
    <div className="w-28">
      <div className="flex justify-between text-[11px] text-muted-foreground tabular-nums">
        <span>{approved}/{required} validés</span>
      </div>
      <div className="relative mt-1 h-1.5 overflow-hidden rounded-full bg-secondary">
        <span className="absolute inset-y-0 left-0 rounded-full bg-primary/25" style={{ width: `${(uploaded / required) * 100}%` }} />
        <motion.span
          className="absolute inset-y-0 left-0 rounded-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${(approved / required) * 100}%` }}
          transition={{ duration: 0.7, ease: EASE_OUT }}
        />
      </div>
    </div>
  );
}

export function ApplicationsTable({
  rows,
  loading,
  selected,
  onToggle,
  onToggleAll,
  onOpen,
  emptyAction,
  filtered,
}: {
  rows: ApplicationRow[];
  loading: boolean;
  selected: Set<string>;
  onToggle: (id: string, checked: boolean) => void;
  onToggleAll: (checked: boolean) => void;
  onOpen: (id: string) => void;
  emptyAction?: React.ReactNode;
  filtered: boolean;
}) {
  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const someSelected = !allSelected && rows.some((r) => selected.has(r.id));

  if (loading) {
    return (
      <div className="divide-y divide-border/70">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4">
            <Skeleton className="size-4 rounded" />
            <Skeleton className="size-10 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-40" />
              <Skeleton className="h-3 w-56" />
            </div>
            <Skeleton className="hidden h-6 w-28 rounded-full md:block" />
          </div>
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={FolderOpen}
        title={filtered ? "Aucun dossier ne correspond" : "Aucun dossier pour l'instant"}
        description={filtered ? "Modifiez la recherche ou les filtres." : "Créez un premier élève pour ouvrir son dossier."}
        action={!filtered ? emptyAction : undefined}
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[880px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
            <th className="w-12 py-3 pl-5">
              <Checkbox checked={allSelected} indeterminate={someSelected} onCheckedChange={onToggleAll} aria-label="Tout sélectionner" />
            </th>
            <th className="py-3 pr-4">Élève</th>
            <th className="py-3 pr-4">Statut</th>
            <th className="py-3 pr-4">Documents</th>
            <th className="py-3 pr-4">Séance de code</th>
            <th className="py-3 pr-4">Paiement</th>
            <th className="py-3 pr-4 text-right">Mis à jour</th>
            <th className="w-10" />
          </tr>
        </thead>
        <tbody>
          <AnimatePresence initial={false}>
            {rows.map((row, index) => {
              const coverage = paymentCoverage(row.payments, row.totalAmount);
              const paymentLabel = coverage.fullyPaid ? "Payé" : coverage.partial ? "Partiel" : "Non payé";
              const pending = row.documents.filter((d) => d.status === "PENDING").length;
              const isSelected = selected.has(row.id);
              return (
                <motion.tr
                  key={row.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.3, ease: EASE_OUT, delay: Math.min(index, 12) * 0.025 }}
                  onClick={() => onOpen(row.id)}
                  className={cn(
                    "group cursor-pointer border-b border-border/70 transition-colors duration-150 last:border-0",
                    isSelected ? "bg-primary-soft/60" : "hover:bg-subtle",
                  )}
                >
                  <td className="py-3 pl-5" onClick={(event) => event.stopPropagation()}>
                    <Checkbox checked={isSelected} onCheckedChange={(checked) => onToggle(row.id, checked)} aria-label={`Sélectionner ${row.candidate.firstName} ${row.candidate.lastName}`} />
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-3">
                      <Avatar firstName={row.candidate.firstName} lastName={row.candidate.lastName} src={row.candidate.profilePhotoUrl} />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">
                          {row.candidate.firstName} {row.candidate.lastName}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {row.candidate.email} · {permitLabel(row.permitType)}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex flex-col items-start gap-1">
                      <ApplicationStatusBadge status={row.status} />
                      {pending > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-warning">
                          <FileClock className="size-3" />
                          {pending} à vérifier
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <DocsProgress documents={row.documents} />
                  </td>
                  <td className="py-3 pr-4">
                    {row.theoryCourse && row.theoryCourse.status !== "none" ? (
                      <TheoryCourseBadge course={row.theoryCourse} compact />
                    ) : (
                      <span className="text-xs text-muted-foreground/70">Pas inscrit</span>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    <p className={cn("font-medium tabular-nums", coverage.fullyPaid ? "text-success" : coverage.partial ? "text-warning" : "text-foreground")}>
                      {row.totalAmount ? formatCurrency(row.totalAmount) : "—"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {paymentLabel}
                      {coverage.partial ? ` · ${formatCurrency(coverage.paidAmount)} reçus` : ""}
                      {row.partnerRate ? " · partenaire" : row.discountCode ? ` · code ${row.discountCode}` : ""}
                    </p>
                  </td>
                  <td className="py-3 pr-4 text-right text-xs text-muted-foreground">
                    <RelativeTime date={row.updatedAt} />
                  </td>
                  <td className="pr-4">
                    <ChevronRight className="size-4 text-muted-foreground/60 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-primary" />
                  </td>
                </motion.tr>
              );
            })}
          </AnimatePresence>
        </tbody>
      </table>
    </div>
  );
}
