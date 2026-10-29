import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  CreditCard,
  FileCheck2,
  FilePlus2,
  FileText,
  FolderOpen,
  MessagesSquare,
  PartyPopper,
  Sparkles,
  UserPlus,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { RevenueChart } from "@/components/admin/dashboard/revenue-chart";
import { StatusBars } from "@/components/admin/dashboard/status-bars";
import { Stagger, StaggerItem } from "@/components/motion";
import { Avatar } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { RelativeTime } from "@/components/ui/relative-time";
import { StatCard } from "@/components/ui/stat-card";
import { getAdminOverview, type AdminOverview } from "@/lib/admin-overview";
import { auth } from "@/lib/auth";
import { DOCUMENT_LABELS } from "@/lib/constants";
import { calcGrowth } from "@/lib/finances";
import { formatCurrency } from "@/lib/utils";

export const metadata = { title: "Rapports" };
export const dynamic = "force-dynamic";

const EVENT_META: Record<string, { icon: LucideIcon; tone: string; text: (e: AdminOverview["events"][number]) => string }> = {
  CREATED: { icon: UserPlus, tone: "bg-primary-soft text-primary", text: () => "a ouvert son dossier" },
  DOCUMENT_UPLOADED: {
    icon: FilePlus2,
    tone: "bg-primary-soft text-primary",
    text: (e) => `${e.metadata.source === "admin" ? "· document ajouté par l'auto-école :" : "a déposé"} ${DOCUMENT_LABELS[e.metadata.documentType as keyof typeof DOCUMENT_LABELS] ?? "un document"}`,
  },
  DOCUMENT_APPROVED: {
    icon: FileCheck2,
    tone: "bg-success-soft text-success",
    text: (e) => `· ${DOCUMENT_LABELS[e.metadata.documentType as keyof typeof DOCUMENT_LABELS] ?? "document"} validé`,
  },
  DOCUMENT_REJECTED: {
    icon: CircleAlert,
    tone: "bg-danger-soft text-danger",
    text: (e) => `· ${DOCUMENT_LABELS[e.metadata.documentType as keyof typeof DOCUMENT_LABELS] ?? "document"} refusé`,
  },
  PAYMENT_COMPLETED: {
    icon: CreditCard,
    tone: "bg-success-soft text-success",
    text: (e) => `a réglé ${typeof e.metadata.amount === "number" ? formatCurrency(e.metadata.amount) : "son dossier"}`,
  },
  COMPLETED: { icon: PartyPopper, tone: "bg-primary-soft text-primary", text: () => "· dossier finalisé" },
};

export default async function AdminReportsPage() {
  const session = await auth();
  if (!session) return null;
  const data = await getAdminOverview(session.user.organizationId);
  const growth = calcGrowth(data.revenueThisMonth, data.revenueLastMonth);
  const today = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={today}
        title="Rapports"
        description="Encaissements, avancement des dossiers et activité récente de l'auto-école."
        actions={
          <>
            <Link href="/admin/applications" className={buttonVariants({ variant: "outline" })}>
              <FolderOpen /> Dossiers
            </Link>
            <Link href="/admin/applications?create=1" className={buttonVariants()}>
              <UserPlus /> Nouvel élève
            </Link>
          </>
        }
      />

      <Stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" stagger={0.06}>
        <StaggerItem>
          <StatCard tone="primary" label="Dossiers en cours" value={data.openCount} icon={<FolderOpen />} hint={`${data.newThisMonth} nouveau${data.newThisMonth > 1 ? "x" : ""} ce mois-ci`} />
        </StaggerItem>
        <StaggerItem>
          <StatCard label="Documents à vérifier" value={data.pendingDocs} icon={<FileText />} hint={data.queue.length ? `Sur ${data.queue.length} dossier${data.queue.length > 1 ? "s" : ""}` : "Rien en attente"} />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Encaissé ce mois"
            value={data.revenueThisMonth}
            format="currency"
            icon={<Wallet />}
            hint={
              <span>
                <span className={growth >= 0 ? "font-medium text-success" : "font-medium text-danger"}>{growth >= 0 ? "+" : ""}{growth} %</span>{" "}
                vs mois dernier
              </span>
            }
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard label="Messages non lus" value={data.unreadMessages} icon={<MessagesSquare />} hint={`${data.completedThisMonth} dossier${data.completedThisMonth > 1 ? "s" : ""} finalisé${data.completedThisMonth > 1 ? "s" : ""} ce mois`} />
        </StaggerItem>
      </Stagger>

      <Stagger className="grid gap-5 xl:grid-cols-[1.6fr_1fr]" delay={0.15} stagger={0.08}>
        <StaggerItem>
          <Card className="h-full gap-0 p-5 sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-[15px] font-semibold text-foreground">Encaissements</p>
                <p className="text-[13px] text-muted-foreground">6 derniers mois · {data.paymentsThisMonth} paiement{data.paymentsThisMonth > 1 ? "s" : ""} ce mois</p>
              </div>
              <Link href="/admin/finances" className={buttonVariants({ variant: "ghost", size: "sm", className: "text-primary" })}>
                Finances <ArrowRight />
              </Link>
            </div>
            <RevenueChart data={data.revenue} />
          </Card>
        </StaggerItem>
        <StaggerItem>
          <Card className="h-full gap-0 p-5 sm:p-6">
            <p className="text-[15px] font-semibold text-foreground">Répartition des dossiers</p>
            <p className="mb-5 text-[13px] text-muted-foreground">Par étape d&apos;avancement</p>
            <StatusBars statuses={data.statuses} />
          </Card>
        </StaggerItem>
      </Stagger>

      <Stagger className="grid gap-5 xl:grid-cols-2" delay={0.25} stagger={0.08}>
        <StaggerItem>
          <Card className="h-full gap-0 p-0">
            <div className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-6">
              <div>
                <p className="text-[15px] font-semibold text-foreground">À vérifier</p>
                <p className="text-[13px] text-muted-foreground">Les plus anciens en premier</p>
              </div>
              {data.pendingDocs > 0 && (
                <span className="rounded-full bg-warning-soft px-2.5 py-0.5 text-xs font-semibold text-warning">{data.pendingDocs}</span>
              )}
            </div>
            {data.queue.length === 0 ? (
              <EmptyState compact icon={CheckCircle2} title="Aucun document en attente" description="Les nouveaux dépôts apparaîtront ici." />
            ) : (
              <ul className="divide-y divide-border/70">
                {data.queue.map((item) => (
                  <li key={item.id}>
                    <Link href={`/admin/applications/${item.id}`} className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-subtle sm:px-6">
                      <Avatar size="sm" firstName={item.candidate.firstName} lastName={item.candidate.lastName} src={item.candidate.profilePhotoUrl} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-foreground">
                          {item.candidate.firstName} {item.candidate.lastName}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {item.pending} document{item.pending > 1 ? "s" : ""} · déposé <RelativeTime date={item.since.toISOString()} className="lowercase" />
                        </span>
                      </span>
                      <span className="text-xs font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">Vérifier</span>
                      <ArrowRight className="size-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-primary" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </StaggerItem>
        <StaggerItem>
          <Card className="h-full gap-0 p-0">
            <div className="border-b border-border px-5 py-4 sm:px-6">
              <p className="text-[15px] font-semibold text-foreground">Activité récente</p>
              <p className="text-[13px] text-muted-foreground">Dépôts, validations et paiements</p>
            </div>
            {data.events.length === 0 ? (
              <EmptyState compact icon={Sparkles} title="Pas encore d'activité" />
            ) : (
              <ol className="relative px-5 py-4 sm:px-6">
                <span className="absolute top-6 bottom-6 left-[35px] w-px bg-border sm:left-[39px]" aria-hidden />
                {data.events.map((event) => {
                  const meta = EVENT_META[event.type] ?? EVENT_META.CREATED;
                  const Icon = meta.icon;
                  return (
                    <li key={event.id} className="relative flex items-start gap-3 py-2">
                      <span className={`relative grid size-8 shrink-0 place-items-center rounded-full ring-4 ring-card ${meta.tone}`}>
                        <Icon className="size-3.5" />
                      </span>
                      <span className="min-w-0 flex-1 pt-1 text-[13px] leading-snug">
                        <Link href={`/admin/applications/${event.applicationId}`} className="font-semibold text-foreground hover:text-primary">
                          {event.candidate.firstName} {event.candidate.lastName}
                        </Link>{" "}
                        <span className="text-muted-foreground">{meta.text(event)}</span>
                      </span>
                      <RelativeTime date={event.createdAt} className="shrink-0 pt-1 text-xs text-muted-foreground" />
                    </li>
                  );
                })}
              </ol>
            )}
          </Card>
        </StaggerItem>
      </Stagger>
    </div>
  );
}
