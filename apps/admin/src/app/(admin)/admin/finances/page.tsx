"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarRange, Download, Landmark, Receipt, RefreshCw, TrendingDown, TrendingUp, Wallet, Percent } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { toast } from "sonner";

import { RevenueChart } from "@/components/admin/dashboard/revenue-chart";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge, Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Segmented } from "@/components/ui/segmented";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { useAppDialog } from "@/hooks/use-app-dialog";
import { PAYMENT_METHOD_LABELS, PERMIT_TYPES, type OrgSettings } from "@/lib/constants";
import { fillDailyRevenue, fillMonthlyRevenue, type FinancePeriod } from "@/lib/finances";
import { cn, formatCurrency, formatDay } from "@/lib/utils";

type Kpis = {
  monthRevenue: number;
  monthCount: number;
  monthGrowth: number;
  totalRevenue: number;
  totalPaid: number;
  averageTicket: number;
  totalApplications: number;
  paidApplications: number;
  conversionRate: number;
};

type PaymentRow = {
  id: string;
  amount: number;
  method?: string | null;
  installmentCount?: number | null;
  installmentIndex?: number | null;
  paidAt: string | null;
  applicationId: string;
  application: { id: string; partnerRate?: boolean; archivedAt?: string | null; candidate: { firstName: string; lastName: string; email: string } };
};

type PendingTransfer = {
  id: string;
  amount: number;
  announcedAt: string;
  reference: string;
  applicationId: string;
  firstName: string;
  lastName: string;
};

type FinanceData = {
  kpis: Kpis;
  prices: { standardPrice: number; partnerPrice: number; fiscalStampPrice: number; permitTypes: string[]; permitPrices: OrgSettings["permitPrices"] };
  priceBreakdown: { standard: { count: number; revenue: number }; partner: { count: number; revenue: number } };
  revenueByPermitType: { type: string; count: number; revenue: number }[];
  recentPayments: PaymentRow[];
  pendingTransfers: PendingTransfer[];
  revenueByDay: { date: string; total: number; count: number }[];
  revenueByMonth: { month: string; total: number; count: number }[];
};

const PERIODS: { value: FinancePeriod; label: string }[] = [
  { value: "7d", label: "7 jours" },
  { value: "30d", label: "30 jours" },
  { value: "90d", label: "90 jours" },
  { value: "12m", label: "12 mois" },
];

const PALETTE = ["#1e6fd9", "#5d9cec", "#a9caf5", "#0b3d91"];

function exportCsv(payments: PaymentRow[]) {
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const rows = [
    ["Date", "Élève", "Email", "Mode", "Montant (EUR)", "Remarque"],
    ...payments.map((p) => [
      p.paidAt ? new Date(p.paidAt).toLocaleDateString("fr-FR") : "",
      `${p.application.candidate.firstName} ${p.application.candidate.lastName}`,
      p.application.archivedAt ? "" : p.application.candidate.email,
      [
        p.method ? (PAYMENT_METHOD_LABELS[p.method] ?? p.method) : "",
        p.installmentIndex && p.installmentCount
          ? `versement ${p.installmentIndex}/${p.installmentCount}`
          : "",
      ]
        .filter(Boolean)
        .join(" · "),
      (p.amount / 100).toFixed(2).replace(".", ","),
      p.application.archivedAt ? "Élève supprimé" : "",
    ]),
  ];
  // Séparateur « ; » et BOM : ouverture directe dans Excel en français.
  const csv = "﻿" + rows.map((row) => row.map(escape).join(";")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `virage-paiements-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function AdminFinancesPage() {
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState<FinancePeriod>("30d");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["finances"],
    queryFn: async () => {
      const res = await fetch("/api/finances");
      if (!res.ok) throw new Error("Chargement impossible");
      return (await res.json()) as FinanceData;
    },
  });

  const sync = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/stripe/sync", { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Synchronisation impossible");
      return json as { checked: number; synced: number };
    },
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ["finances"] });
      void queryClient.invalidateQueries({ queryKey: ["applications"] });
      toast.success("Stripe synchronisé", {
        description: result.synced
          ? `${result.synced} paiement${result.synced > 1 ? "s" : ""} mis à jour.`
          : "Tout était déjà à jour.",
      });
    },
    onError: (error) => toast.error("Synchronisation impossible", { description: error.message }),
  });

  const chartData = useMemo(() => {
    if (!data) return [];
    if (period === "12m") return fillMonthlyRevenue(data.revenueByMonth);
    const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
    return fillDailyRevenue(data.revenueByDay, days);
  }, [data, period]);

  const periodTotal = chartData.reduce((sum, point) => sum + point.total, 0);
  const periodCount = chartData.reduce((sum, point) => sum + point.count, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Gestion"
        title="Finances"
        description="Chiffre d'affaires, paiements reçus et tarifs de votre auto-école."
        actions={
          <>
            <Button variant="outline" onClick={() => sync.mutate()} loading={sync.isPending}>
              {!sync.isPending && <RefreshCw />} Synchroniser Stripe
            </Button>
            <Button onClick={() => data && exportCsv(data.recentPayments)} disabled={!data?.recentPayments.length}>
              <Download /> Exporter
            </Button>
          </>
        }
      />

      {isLoading ? (
        <FinancesSkeleton />
      ) : isError || !data ? (
        <Card className="py-6">
          <EmptyState icon={Wallet} title="Données indisponibles" description="Les finances n'ont pas pu être chargées. Réessayez dans un instant." />
        </Card>
      ) : (
        <>
          <Stagger className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            <StaggerItem>
              <StatCard
                tone="primary"
                label="Ce mois-ci"
                value={data.kpis.monthRevenue}
                format="currency"
                icon={<Wallet />}
                hint={<Growth value={data.kpis.monthGrowth} inverse />}
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                label="Chiffre d'affaires total"
                value={data.kpis.totalRevenue}
                format="currency"
                icon={<CalendarRange />}
                hint={`${data.kpis.totalPaid} paiement${data.kpis.totalPaid > 1 ? "s" : ""}`}
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard label="Panier moyen" value={data.kpis.averageTicket} format="currency" icon={<Receipt />} hint="par dossier payé" />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                label="Dossiers payés"
                value={data.kpis.conversionRate}
                format="percent"
                icon={<Percent />}
                hint={`${data.kpis.paidApplications} sur ${data.kpis.totalApplications} dossiers`}
              />
            </StaggerItem>
          </Stagger>

          <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <FadeIn delay={0.1}>
              <Card className="gap-0 p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[13px] font-medium text-muted-foreground">Encaissé sur la période</p>
                    <p className="mt-1 text-[28px] leading-none font-semibold tracking-[-0.03em] text-foreground tabular">
                      {formatCurrency(periodTotal)}
                    </p>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {periodCount} paiement{periodCount > 1 ? "s" : ""}
                    </p>
                  </div>
                  <Segmented size="sm" options={PERIODS} value={period} onChange={setPeriod} />
                </div>
                <div className="mt-5">
                  <RevenueChart key={period} data={chartData} variant={period === "12m" ? "area" : "bar"} />
                </div>
              </Card>
            </FadeIn>

            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5 sm:grid-cols-2 xl:grid-cols-1">
              <FadeIn delay={0.14}>
                <PermitBreakdown data={data.revenueByPermitType} />
              </FadeIn>
              <FadeIn delay={0.18}>
                <PricesCard prices={data.prices} breakdown={data.priceBreakdown} />
              </FadeIn>
            </div>
          </div>

          {data.pendingTransfers.length > 0 && (
            <FadeIn delay={0.06}>
              <PendingTransfersCard transfers={data.pendingTransfers} />
            </FadeIn>
          )}

          <FadeIn delay={0.2}>
            <PaymentsCard payments={data.recentPayments} />
          </FadeIn>
        </>
      )}
    </div>
  );
}

function PendingTransfersCard({ transfers }: { transfers: PendingTransfer[] }) {
  const queryClient = useQueryClient();
  const { showConfirm } = useAppDialog();
  const confirm = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/payments/${id}/confirm-transfer`, { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Confirmation impossible");
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["finances"] });
      void queryClient.invalidateQueries({ queryKey: ["applications"] });
      toast.success("Virement confirmé", { description: "La facture a été envoyée à l'élève." });
    },
    onError: (error) => toast.error("Erreur", { description: error.message }),
  });

  async function handleConfirm(transfer: PendingTransfer) {
    const ok = await showConfirm({
      title: "Confirmer la réception du virement ?",
      description: `Vérifiez sur votre compte bancaire le virement de ${formatCurrency(transfer.amount)} avec la référence ${transfer.reference}. Le dossier de ${transfer.firstName} ${transfer.lastName} passera en « Payé » et sa facture sera émise.`,
      confirmLabel: "Confirmer la réception",
    });
    if (ok) confirm.mutate(transfer.id);
  }

  return (
    <Card className="gap-0 overflow-hidden border-warning/30 p-0">
      <div className="flex items-start gap-3 border-b border-border bg-warning-soft/40 px-5 py-4 sm:px-6">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-warning-soft text-warning">
          <Landmark className="size-[18px]" />
        </span>
        <div className="min-w-0">
          <p className="text-[15px] font-semibold text-foreground">
            Virements à confirmer <span className="text-muted-foreground tabular">· {transfers.length}</span>
          </p>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            Annoncés par les élèves. Confirmez dès que l&apos;argent apparaît sur votre compte.
          </p>
        </div>
      </div>
      <ul className="divide-y divide-border">
        {transfers.map((transfer) => (
          <li key={transfer.id} className="flex flex-col gap-3 px-5 py-3.5 sm:flex-row sm:items-center sm:px-6">
            <Link href={`/admin/applications/${transfer.applicationId}`} className="flex min-w-0 flex-1 items-center gap-3">
              <Avatar size="sm" firstName={transfer.firstName} lastName={transfer.lastName} />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-foreground">{transfer.firstName} {transfer.lastName}</span>
                <span className="block text-xs text-muted-foreground">
                  Réf. <span className="font-mono">{transfer.reference}</span> · annoncé le {formatDay(transfer.announcedAt)}
                </span>
              </span>
            </Link>
            <div className="flex items-center justify-between gap-4 sm:justify-end">
              <span className="text-sm font-semibold text-foreground tabular">{formatCurrency(transfer.amount)}</span>
              <Button
                size="sm"
                onClick={() => void handleConfirm(transfer)}
                loading={confirm.isPending && confirm.variables === transfer.id}
                disabled={confirm.isPending}
              >
                Confirmer la réception
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function Growth({ value, inverse }: { value: number; inverse?: boolean }) {
  const up = value >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span className={cn("inline-flex items-center gap-1 font-medium", inverse ? "text-white/85" : up ? "text-success" : "text-danger")}>
      <Icon className="size-3.5" />
      {up ? "+" : ""}
      {value}% vs mois dernier
    </span>
  );
}

function PermitBreakdown({ data }: { data: FinanceData["revenueByPermitType"] }) {
  const items = data
    .filter((entry) => entry.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue)
    .map((entry, index) => ({
      ...entry,
      label: PERMIT_TYPES.find((p) => p.value === entry.type)?.label ?? entry.type,
      color: PALETTE[index % PALETTE.length],
    }));
  const total = items.reduce((sum, item) => sum + item.revenue, 0);

  return (
    <Card className="gap-0 p-5">
      <p className="text-[15px] font-semibold text-foreground">Par permis</p>
      {items.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Aucun paiement pour l&apos;instant.</p>
      ) : (
        <div className="mt-4 flex items-center gap-5">
          <div className="relative size-28 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={items}
                  dataKey="revenue"
                  nameKey="label"
                  innerRadius="68%"
                  outerRadius="100%"
                  paddingAngle={3}
                  cornerRadius={4}
                  stroke="none"
                  animationDuration={900}
                >
                  {items.map((item) => (
                    <Cell key={item.type} fill={item.color} />
                  ))}
                </Pie>
                <Tooltip
                  cursor={false}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const item = payload[0].payload as (typeof items)[number];
                    return (
                      <div className="rounded-xl border border-border bg-card px-3 py-2 shadow-float">
                        <p className="text-xs text-muted-foreground">{item.label}</p>
                        <p className="text-sm font-semibold text-foreground tabular">{formatCurrency(item.revenue)}</p>
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="min-w-0 flex-1 space-y-2.5">
            {items.map((item) => (
              <li key={item.type} className="text-[13px]">
                <div className="flex items-center gap-2">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ background: item.color }} />
                  <span className="min-w-0 flex-1 truncate text-muted-foreground">{item.label}</span>
                  <span className="font-semibold text-foreground tabular">{Math.round((item.revenue / total) * 100)}%</span>
                </div>
                <p className="pl-[18px] text-xs text-muted-foreground tabular">
                  {formatCurrency(item.revenue)} · {item.count} dossier{item.count > 1 ? "s" : ""}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

function PricesCard({ prices }: { prices: FinanceData["prices"]; breakdown: FinanceData["priceBreakdown"] }) {
  const offered = PERMIT_TYPES.filter((permit) => prices.permitTypes?.includes(permit.value) ?? true);
  const rows = (offered.length > 0 ? offered : PERMIT_TYPES).map((permit) => {
    const row = prices.permitPrices?.[permit.value];
    return {
      label: permit.label,
      standard: row?.standard ?? prices.standardPrice,
      partner: row?.partner ?? prices.partnerPrice,
    };
  });
  return (
    <Card className="gap-0 p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[15px] font-semibold text-foreground">Tarifs</p>
        <Link href="/admin/settings?tab=pricing" className="text-[13px] font-medium text-primary hover:text-primary-strong">
          Modifier
        </Link>
      </div>
      <ul className="mt-3 divide-y divide-border">
        {rows.map((row) => (
          <li key={row.label} className="flex items-center justify-between gap-3 py-2.5">
            <div>
              <p className="text-sm font-medium text-foreground">{row.label}</p>
              <p className="text-xs text-muted-foreground">Partenaire {formatCurrency(row.partner)}</p>
            </div>
            <p className="text-sm font-semibold text-foreground tabular">{formatCurrency(row.standard)}</p>
          </li>
        ))}
        <li className="flex items-center justify-between gap-3 pt-2.5">
          <p className="text-[13px] text-muted-foreground">Dont timbre fiscal</p>
          <p className="text-[13px] font-medium text-muted-foreground tabular">{formatCurrency(prices.fiscalStampPrice)}</p>
        </li>
      </ul>
    </Card>
  );
}

function PaymentsCard({ payments }: { payments: PaymentRow[] }) {
  return (
    <Card className="gap-0 p-0">
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
        <div>
          <h2 className="text-[15px] font-semibold text-foreground">Paiements reçus</h2>
          <p className="text-[13px] text-muted-foreground">Les 50 derniers règlements, en ligne ou sur place.</p>
        </div>
        <Badge variant="neutral">{payments.length}</Badge>
      </div>
      {payments.length === 0 ? (
        <EmptyState icon={Receipt} title="Aucun paiement" description="Les règlements apparaîtront ici dès le premier encaissement." className="py-12" />
      ) : (
        <ul className="divide-y divide-border">
          {payments.map((payment) => {
            const c = payment.application.candidate;
            const deleted = Boolean(payment.application.archivedAt);
            const content = (
              <>
                <Avatar size="sm" firstName={c.firstName} lastName={c.lastName} className={cn(deleted && "opacity-60 grayscale")} />
                <div className="min-w-0 flex-1">
                  <p className="flex min-w-0 items-center gap-2 text-sm font-medium text-foreground">
                    <span className="truncate">
                      {c.firstName} {c.lastName}
                    </span>
                    {deleted && (
                      <Badge variant="neutral" className="shrink-0">
                        Élève supprimé
                      </Badge>
                    )}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{deleted ? "Dossier archivé, conservé pour la comptabilité" : c.email}</p>
                </div>
                  <span className="hidden text-right text-[13px] text-muted-foreground sm:block">
                    <span className="block">
                      {payment.method ? (PAYMENT_METHOD_LABELS[payment.method] ?? payment.method) : "—"}
                    </span>
                    {payment.installmentIndex && payment.installmentCount ? (
                      <span className="block text-[11px]">
                        Versement {payment.installmentIndex}/{payment.installmentCount}
                      </span>
                    ) : null}
                  </span>
                  <span className="hidden w-28 text-right text-[13px] text-muted-foreground tabular md:block">
                    {payment.paidAt ? formatDay(payment.paidAt) : "—"}
                  </span>
                <span className="w-24 text-right">
                  <span className="block text-sm font-semibold text-foreground tabular">{formatCurrency(payment.amount)}</span>
                  {payment.installmentIndex && payment.installmentCount ? (
                    <span className="block text-[11px] text-muted-foreground sm:hidden">
                      Versement {payment.installmentIndex}/{payment.installmentCount}
                    </span>
                  ) : null}
                </span>
              </>
            );
            const rowClass = "flex items-center gap-3.5 px-5 py-3.5 sm:px-6";
            return (
              <li key={payment.id}>
                {deleted ? (
                  // La fiche n'existe plus : on garde la ligne, sans lien.
                  <div className={rowClass}>{content}</div>
                ) : (
                  <Link href={`/admin/applications/${payment.applicationId ?? payment.application.id}`} className={cn(rowClass, "transition-colors hover:bg-primary-soft/40")}>
                    {content}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

function FinancesSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[132px] rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Skeleton className="h-[380px] rounded-2xl" />
        <Skeleton className="h-[380px] rounded-2xl" />
      </div>
    </div>
  );
}
