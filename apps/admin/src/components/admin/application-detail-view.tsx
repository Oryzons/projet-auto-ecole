"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DocumentStatus, type DocumentType } from "@/lib/db/client";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  BadgeCheck,
  Cake,
  Camera,
  Check,
  CheckCircle2,
  Clock3,
  Download,
  Eye,
  FileText,
  Hash,
  Loader2,
  Mail,
  MapPin,
  MessagesSquare,
  MoreHorizontal,
  Pencil,
  Phone,
  ReceiptText,
  RotateCcw,
  Send,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { InviteLinkDialog, type InviteResult } from "@/components/admin/invite-link-dialog";
import { TheoryCourseBadge } from "@/components/ui/theory-course-badge";
import { CandidateFormDialog } from "@/components/admin/candidate-form-dialog";
import { DocumentPreviewDialog } from "@/components/admin/document-preview-dialog";
import { ACCEPTED_FILES } from "@/components/documents/file-drop";
import { FadeIn, ProgressRing, Stagger, StaggerItem } from "@/components/motion";
import { EASE_OUT } from "@/components/motion/tokens";
import { Avatar } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge, Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { ApplicationStatusBadge, DocumentStatusBadge } from "@/components/ui/status-badge";
import { useAppDialog } from "@/hooks/use-app-dialog";
import type { ApplicationDetail } from "@/lib/application-types";
import { formatCandidateAddress } from "@/lib/candidate-schema";
import {
  ALL_DOCUMENT_TYPES,
  DOCUMENT_LABELS,
  MANUAL_PAYMENT_METHODS,
  OPTIONAL_DOCUMENTS,
  PAYMENT_METHOD_LABELS,
  PERMIT_TYPES,
} from "@/lib/constants";
import { computeDossierProgress, countDocumentsByStatus, getDocumentEntry } from "@/lib/dossier-progress";
import {
  INSTALLMENT_COUNTS,
  centsToEurosInput,
  eurosToCents,
  paymentCoverage,
  suggestedInstallmentCents,
} from "@/lib/payment";
import { useUploadThing } from "@/lib/uploadthing-client";
import { cn, formatCurrency, formatDate, formatDay } from "@/lib/utils";

type Doc = ApplicationDetail["documents"][number];

async function postJson(url: string, body?: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? "L'action n'a pas pu aboutir.");
  return json;
}

export function ApplicationDetailView({ id }: { id: string }) {
  const queryClient = useQueryClient();
  const queryKey = ["application", id];

  const { data, isLoading, isError } = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await fetch(`/api/applications/${id}`);
      if (!res.ok) throw new Error("Dossier introuvable");
      return (await res.json()) as { application: ApplicationDetail };
    },
  });

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey });
    void queryClient.invalidateQueries({ queryKey: ["applications"] });
    void queryClient.invalidateQueries({ queryKey: ["finances"] });
  };

  if (isLoading) return <DetailSkeleton />;
  if (isError || !data?.application) {
    return (
      <Card className="py-6">
        <EmptyState
          icon={FileText}
          title="Dossier introuvable"
          description="Ce dossier a peut-être été supprimé ou n'appartient pas à votre auto-école."
          action={
            <Link href="/admin/applications" className={buttonVariants({ variant: "outline" })}>
              <ArrowLeft /> Retour aux dossiers
            </Link>
          }
        />
      </Card>
    );
  }

  return <DetailContent application={data.application} onChanged={refresh} />;
}

function DetailContent({ application, onChanged }: { application: ApplicationDetail; onChanged: () => void }) {
  const [editing, setEditing] = useState(false);
  const coverage = paymentCoverage(application.payments, application.totalAmount);
  const paymentState = coverage.fullyPaid ? "paid" : coverage.partial ? "partial" : "unpaid";
  const priceLocked = coverage.paidAmount > 0;

  return (
    <div className="space-y-6">
      <FadeIn>
        <Link
          href="/admin/applications"
          className="inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Dossiers
        </Link>
      </FadeIn>

      <HeaderCard application={application} paymentState={paymentState} onEdit={() => setEditing(true)} onChanged={onChanged} />

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <DocumentsCard application={application} onChanged={onChanged} />
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-1">
          <ProgressCard application={application} />
          <PaymentCard application={application} onChanged={onChanged} />
        </div>
      </div>

      <CandidateFormDialog
        open={editing}
        onOpenChange={setEditing}
        target={{ id: application.id, permitType: application.permitType, partnerRate: application.partnerRate, paid: priceLocked, candidate: application.candidate }}
        onSaved={onChanged}
      />
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * En-tête : identité, coordonnées, actions
 * ------------------------------------------------------------------------- */

function HeaderCard({
  application,
  paymentState,
  onEdit,
  onChanged,
}: {
  application: ApplicationDetail;
  paymentState: "paid" | "partial" | "unpaid";
  onEdit: () => void;
  onChanged: () => void;
}) {
  const router = useRouter();
  const { showConfirm } = useAppDialog();
  const candidate = application.candidate;
  const fullName = `${candidate.firstName} ${candidate.lastName}`;
  const address = formatCandidateAddress(candidate);
  const permit = PERMIT_TYPES.find((p) => p.value === application.permitType)?.label ?? application.permitType;

  const [inviteResult, setInviteResult] = useState<InviteResult | null>(null);
  const invite = useMutation({
    mutationFn: () => postJson(`/api/applications/${application.id}/invite`),
    onSuccess: (json) =>
      setInviteResult({ name: candidate.firstName, email: candidate.email, inviteLink: json.inviteLink, emailSent: json.emailSent }),
    onError: (error) => toast.error("Envoi impossible", { description: error.message }),
  });

  const complete = useMutation({
    mutationFn: () => postJson(`/api/applications/${application.id}/complete`),
    onSuccess: () => {
      toast.success("Dossier finalisé", { description: `${fullName} a été prévenu(e).` });
      onChanged();
    },
    onError: (error) => toast.error("Action impossible", { description: error.message }),
  });

  async function remove() {
    const ok = await showConfirm({
      title: `Supprimer le dossier de ${fullName} ?`,
      description: "Le dossier, ses documents et ses messages seront définitivement supprimés.",
      variant: "destructive",
      confirmLabel: "Supprimer",
    });
    if (!ok) return;
    const res = await fetch(`/api/applications/${application.id}`, { method: "DELETE" });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      toast.error("Suppression impossible", { description: json.error ?? "Réessayez dans un instant." });
      return;
    }
    toast.success("Dossier supprimé");
    router.replace("/admin/applications");
    onChanged();
  }

  const details: { icon: ReactNode; label: string; value: ReactNode }[] = [
    { icon: <Mail />, label: "Email", value: <a href={`mailto:${candidate.email}`} className="hover:text-primary">{candidate.email}</a> },
    ...(candidate.phone
      ? [{ icon: <Phone />, label: "Téléphone", value: <a href={`tel:${candidate.phone}`} className="hover:text-primary">{candidate.phone}</a> }]
      : []),
    ...(candidate.dateOfBirth ? [{ icon: <Cake />, label: "Naissance", value: formatDay(candidate.dateOfBirth, true) }] : []),
    ...(candidate.oedippNumber ? [{ icon: <Hash />, label: "NEPH", value: candidate.oedippNumber }] : []),
    ...(address ? [{ icon: <MapPin />, label: "Adresse", value: address }] : []),
    ...(application.partnerCompany ? [{ icon: <BadgeCheck />, label: "Entreprise", value: application.partnerCompany }] : []),
  ];

  return (
    <FadeIn delay={0.04}>
      <Card className="gap-0 overflow-hidden p-0">
        <div className="relative h-20 overflow-hidden bg-gradient-to-r from-primary to-primary-strong sm:h-24">
          <svg className="absolute inset-x-0 bottom-0 h-10 w-[200%] animate-wave-slow text-white/10" viewBox="0 0 1200 40" preserveAspectRatio="none" aria-hidden>
            <path d="M0 20 C 150 0 300 40 450 20 C 600 0 750 40 900 20 C 1050 0 1200 40 1350 20 L 1350 40 L 0 40 Z" fill="currentColor" />
          </svg>
        </div>
        <div className="px-5 pb-6 sm:px-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="-mt-10 sm:-mt-12">
              <PhotoUpload candidateId={candidate.id} firstName={candidate.firstName} lastName={candidate.lastName} src={candidate.profilePhotoUrl} onUploaded={onChanged} />
              </div>
              <div className="min-w-0 pt-3">
                <h1 className="truncate text-[22px] leading-tight font-semibold tracking-[-0.02em] text-foreground sm:text-2xl">{fullName}</h1>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {permit} · créé le {formatDay(application.createdAt)}
                </p>
                <TheoryCourseBadge course={application.theoryCourse} className="mt-2" />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:pt-3">
              <Link href={`/admin/messages?application=${application.id}`} className={buttonVariants({ variant: "outline" })}>
                <MessagesSquare /> Message
              </Link>
              <Button variant="outline" onClick={onEdit}>
                <Pencil /> Modifier
              </Button>
              {application.status === "PAID" && (
                <Button onClick={() => complete.mutate()} loading={complete.isPending}>
                  {!complete.isPending && <BadgeCheck />} Finaliser le dossier
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="outline" size="icon" aria-label="Plus d'actions" />}>
                  <MoreHorizontal />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <DropdownMenuItem onClick={() => invite.mutate()} disabled={invite.isPending}>
                    <Send /> Lien d&apos;invitation
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onClick={() => void remove()}>
                    <Trash2 /> Supprimer le dossier
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <ApplicationStatusBadge status={application.status} />
            <Badge
              variant={paymentState === "paid" ? "success" : paymentState === "partial" ? "warning" : "neutral"}
              dot
            >
              {paymentState === "paid" ? "Payé" : paymentState === "partial" ? "Partiel" : "Non payé"}
            </Badge>
            {application.partnerRate && <Badge variant="info">Tarif partenaire</Badge>}
            {application.discountCode && !application.partnerRate && (
              <Badge variant="info">
                Code {application.discountCode}
                {application.discountKind === "percent" && application.discountValue
                  ? ` · -${application.discountValue} %`
                  : application.discountKind === "amount" && application.discountValue
                    ? ` · -${formatCurrency(application.discountValue)}`
                    : ""}
              </Badge>
            )}
            <Badge variant="neutral" className="font-mono text-[11px]">
              N° {application.id.slice(-8).toUpperCase()}
            </Badge>
          </div>

          <dl className="mt-5 grid gap-x-6 gap-y-3 border-t border-border pt-5 sm:grid-cols-2 lg:grid-cols-3">
            {details.map((item) => (
              <div key={item.label} className="flex min-w-0 items-start gap-3">
                <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary [&_svg]:size-4">
                  {item.icon}
                </span>
                <div className="min-w-0">
                  <dt className="text-xs text-muted-foreground">{item.label}</dt>
                  <dd className="truncate text-sm font-medium text-foreground">{item.value}</dd>
                </div>
              </div>
            ))}
          </dl>
        </div>
      </Card>
      <InviteLinkDialog result={inviteResult} onClose={() => setInviteResult(null)} />
    </FadeIn>
  );
}

function PhotoUpload({
  candidateId,
  firstName,
  lastName,
  src,
  onUploaded,
}: {
  candidateId: string;
  firstName: string;
  lastName: string;
  src?: string | null;
  onUploaded: () => void;
}) {
  const { startUpload, isUploading } = useUploadThing("profilePhotoUploader", {
    onClientUploadComplete: () => {
      toast.success("Photo mise à jour");
      onUploaded();
    },
    onUploadError: (error) => {
      toast.error("Échec de l'envoi", { description: error.message });
    },
  });

  return (
    <label className="group relative shrink-0 cursor-pointer rounded-full" title="Changer la photo">
      <input
        type="file"
        accept="image/*"
        className="sr-only"
        disabled={isUploading}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void startUpload([file], { candidateId });
          event.target.value = "";
        }}
      />
      <Avatar size="xl" firstName={firstName} lastName={lastName} src={src} className="size-20 ring-4 ring-card sm:size-24 sm:text-3xl" />
      <span
        className={cn(
          "absolute inset-0 grid place-items-center rounded-full bg-ink/45 text-white transition-opacity duration-200",
          isUploading ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100",
        )}
      >
        {isUploading ? <Loader2 className="size-6 animate-spin" /> : <Camera className="size-6" />}
      </span>
    </label>
  );
}

/* ----------------------------------------------------------------------------
 * Documents
 * ------------------------------------------------------------------------- */

function DocumentsCard({ application, onChanged }: { application: ApplicationDetail; onChanged: () => void }) {
  const pending = application.documents.filter((d) => d.status === DocumentStatus.PENDING).length;

  return (
    <FadeIn delay={0.08}>
      <Card className="gap-0 p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-[15px] font-semibold text-foreground">Pièces du dossier</h2>
            <p className="text-[13px] text-muted-foreground">Vérifiez les pièces ou déposez-les pour l'élève.</p>
          </div>
          {pending > 0 && (
            <Badge variant="warning" dot>
              {pending} à vérifier
            </Badge>
          )}
        </div>
        <Stagger className="divide-y divide-border">
          {ALL_DOCUMENT_TYPES.map((type) => (
            <StaggerItem key={type}>
              <DocumentRow
                applicationId={application.id}
                type={type}
                doc={getDocumentEntry(application.documents, type)}
                onChanged={onChanged}
              />
            </StaggerItem>
          ))}
        </Stagger>
      </Card>
    </FadeIn>
  );
}

function DocumentRow({
  applicationId,
  type,
  doc,
  onChanged,
}: {
  applicationId: string;
  type: DocumentType;
  doc: Doc | null;
  onChanged: () => void;
}) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [previewing, setPreviewing] = useState(false);
  const optional = OPTIONAL_DOCUMENTS.includes(type);
  const label = DOCUMENT_LABELS[type];

  const review = useMutation({
    mutationFn: (input: { action: "approve" | "reject"; rejectionReason?: string }) =>
      postJson("/api/documents/review", { documentId: doc!.id, ...input }),
    onSuccess: (_data, input) => {
      setPreviewing(false);
      if (input.action === "approve") toast.success("Document validé", { description: label });
      else toast("Document refusé", { description: "L'élève est invité à le renvoyer." });
      setRejecting(false);
      setReason("");
      onChanged();
    },
    onError: (error) => toast.error("Action impossible", { description: error.message }),
  });

  const status = doc?.status ?? "MISSING";
  const iconTone =
    status === "APPROVED"
      ? "bg-success-soft text-success"
      : status === "REJECTED"
        ? "bg-danger-soft text-danger"
        : status === "PENDING"
          ? "bg-warning-soft text-warning"
          : "bg-subtle text-muted-foreground";

  return (
    <div className={cn("px-5 py-4 transition-colors sm:px-6", status === "PENDING" && "bg-warning-soft/30")}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", iconTone)}>
          {status === "APPROVED" ? <CheckCircle2 className="size-5" /> : status === "PENDING" ? <Clock3 className="size-5" /> : <FileText className="size-5" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-foreground">
            {label}
            {optional && <span className="rounded-md bg-subtle px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">Optionnel</span>}
          </p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {doc ? `${doc.fileName} · déposé le ${formatDay(doc.createdAt)}` : "Pas encore déposé"}
          </p>
          <DocumentStatusBadge status={status} className="mt-2 sm:hidden" />
        </div>
        <DocumentStatusBadge status={status} className="max-sm:hidden" />
        <div className="flex items-center gap-1.5 max-sm:basis-full max-sm:pl-14">
          {doc && (
            <Button size="sm" variant="ghost" onClick={() => setPreviewing(true)}>
              <Eye /> Voir
            </Button>
          )}
          {doc?.status === DocumentStatus.PENDING && !rejecting && (
            <>
              <Button size="sm" variant="outline" onClick={() => setRejecting(true)} disabled={review.isPending}>
                <X /> Refuser
              </Button>
              <Button size="sm" onClick={() => review.mutate({ action: "approve" })} loading={review.isPending}>
                {!review.isPending && <Check />} Valider
              </Button>
            </>
          )}
          {(!doc || doc.status !== DocumentStatus.PENDING) && (
            <AdminUploadButton applicationId={applicationId} documentType={type} hasFile={Boolean(doc)} onUploaded={onChanged} />
          )}
        </div>
      </div>

      {doc && (
        <DocumentPreviewDialog
          label={label}
          doc={doc}
          open={previewing}
          onOpenChange={setPreviewing}
          approving={review.isPending}
          onApprove={() => review.mutate({ action: "approve" })}
          onReject={() => {
            setPreviewing(false);
            setRejecting(true);
          }}
        />
      )}

      {doc?.status === DocumentStatus.REJECTED && doc.rejectionReason && (
        <p className="mt-3 rounded-lg border border-danger/15 bg-danger-soft px-3 py-2 text-[13px] text-danger sm:ml-14">
          Motif : {doc.rejectionReason}
        </p>
      )}

      <AnimatePresence initial={false}>
        {rejecting && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: EASE_OUT }}
            className="overflow-hidden"
          >
            <form
              className="mt-3 space-y-2.5 sm:ml-14"
              onSubmit={(event) => {
                event.preventDefault();
                if (reason.trim()) review.mutate({ action: "reject", rejectionReason: reason.trim() });
              }}
            >
              <Textarea
                autoFocus
                rows={2}
                maxLength={500}
                placeholder="Expliquez à l'élève ce qui ne va pas (ex. : photo floue, document expiré)…"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              />
              <div className="flex justify-end gap-2">
                <Button type="button" size="sm" variant="ghost" onClick={() => { setRejecting(false); setReason(""); }}>
                  Annuler
                </Button>
                <Button type="submit" size="sm" variant="destructive" disabled={!reason.trim()} loading={review.isPending}>
                  Refuser le document
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AdminUploadButton({
  applicationId,
  documentType,
  hasFile,
  onUploaded,
}: {
  applicationId: string;
  documentType: DocumentType;
  hasFile: boolean;
  onUploaded: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState(0);
  const { startUpload, isUploading } = useUploadThing("documentUploader", {
    onUploadProgress: setProgress,
    onClientUploadComplete: () => {
      setProgress(0);
      toast.success("Document déposé", { description: DOCUMENT_LABELS[documentType] });
      onUploaded();
    },
    onUploadError: (error) => {
      setProgress(0);
      toast.error("Échec de l'envoi", { description: error.message });
    },
  });

  return (
    <>
      <input
        ref={input}
        type="file"
        accept={ACCEPTED_FILES}
        className="sr-only"
        tabIndex={-1}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          if (file.size > 8 * 1024 * 1024) {
            toast.error("Fichier trop lourd", { description: "8 Mo maximum." });
            return;
          }
          void startUpload([file], { applicationId, documentType });
        }}
      />
      <Button
        size="sm"
        variant={hasFile ? "ghost" : "outline"}
        onClick={() => input.current?.click()}
        disabled={isUploading}
        className="relative overflow-hidden"
      >
        {isUploading ? (
          <>
            <Loader2 className="animate-spin" /> {Math.round(progress)} %
            <span className="absolute inset-x-0 bottom-0 h-0.5 bg-primary transition-[width]" style={{ width: `${progress}%` }} />
          </>
        ) : hasFile ? (
          <>
            <RotateCcw /> Remplacer
          </>
        ) : (
          <>
            <Upload /> Déposer
          </>
        )}
      </Button>
    </>
  );
}

/* ----------------------------------------------------------------------------
 * Colonne latérale : avancement et paiement
 * ------------------------------------------------------------------------- */

function ProgressCard({ application }: { application: ApplicationDetail }) {
  const progress = computeDossierProgress(application.documents);
  const counts = countDocumentsByStatus(application.documents);
  const pending = application.documents.filter((d) => d.status === "PENDING").length;
  const rejected = application.documents.filter((d) => d.status === "REJECTED").length;

  const rows = [
    { label: "Validées", value: counts.approved, tone: "bg-success" },
    { label: "À vérifier", value: pending, tone: "bg-warning" },
    { label: "À renvoyer", value: rejected, tone: "bg-danger" },
    { label: "Manquantes", value: counts.missing, tone: "bg-border" },
  ];

  return (
    <FadeIn delay={0.12}>
      <Card className="gap-0 p-5">
        <p className="text-[15px] font-semibold text-foreground">Avancement</p>
        <div className="mt-4 flex items-center gap-5">
          <ProgressRing value={progress} size={104} stroke={9}>
            <span className="text-xl font-semibold tracking-[-0.02em] text-foreground tabular">{progress}%</span>
          </ProgressRing>
          <ul className="flex-1 space-y-2">
            {rows.map((row) => (
              <li key={row.label} className="flex items-center gap-2 text-[13px]">
                <span className={cn("size-2 rounded-full", row.tone)} />
                <span className="flex-1 text-muted-foreground">{row.label}</span>
                <span className="font-semibold text-foreground tabular">{row.value}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">Calculé sur les {counts.required} pièces obligatoires validées.</p>
      </Card>
    </FadeIn>
  );
}

function PaymentCard({
  application,
  onChanged,
}: {
  application: ApplicationDetail;
  onChanged: () => void;
}) {
  const coverage = paymentCoverage(application.payments, application.totalAmount);
  const completed = application.payments
    .filter((payment) => payment.status === "COMPLETED")
    .sort(
      (a, b) =>
        new Date(a.paidAt ?? a.createdAt).getTime() - new Date(b.paidAt ?? b.createdAt).getTime(),
    );
  const existingPlan = completed.find((payment) => payment.installmentCount)?.installmentCount ?? null;
  const recorded = existingPlan
    ? completed.filter((payment) => payment.installmentCount === existingPlan).length
    : 0;
  const knownTotal = (application.totalAmount ?? 0) > 0;
  const total = knownTotal ? application.totalAmount! : 0;
  const [method, setMethod] = useState("");
  const [installmentsOn, setInstallmentsOn] = useState(Boolean(existingPlan));
  const [count, setCount] = useState(existingPlan ?? 3);
  const [amountEuros, setAmountEuros] = useState("");
  const [amountTouched, setAmountTouched] = useState(false);
  const useInstallments = Boolean(existingPlan) || installmentsOn;
  const activeCount = existingPlan ?? count;
  const suggested = knownTotal
    ? suggestedInstallmentCents(total, activeCount, coverage.paidAmount, recorded)
    : 0;
  const suggestedLabel = knownTotal ? centsToEurosInput(suggested) : "";

  // Tant que l'admin n'a rien saisi, le montant suit la suggestion.
  const amountValue = amountTouched ? amountEuros : suggestedLabel;

  const markPaid = useMutation({
    mutationFn: (installments?: { count: number; amount: number }) =>
      postJson(`/api/applications/${application.id}/mark-paid`, {
        method,
        ...(installments ? { installments } : {}),
      }),
    onSuccess: (_data, installments) => {
      const settles =
        !installments || (knownTotal && installments.amount >= coverage.remaining);
      toast.success(settles ? "Paiement enregistré" : "Versement enregistré", {
        description: settles
          ? "La facture est disponible."
          : knownTotal
            ? `Il reste ${formatCurrency(coverage.remaining - (installments?.amount ?? 0))} à encaisser.`
            : "La facture de ce versement est disponible.",
      });
      setMethod("");
      setAmountTouched(false);
      onChanged();
    },
    onError: (error) => toast.error("Enregistrement impossible", { description: error.message }),
  });

  const canMarkPaid = !coverage.fullyPaid && application.status !== "REJECTED";
  const enteredCents = eurosToCents(amountValue);
  const amountTooHigh = useInstallments && knownTotal && enteredCents != null && enteredCents > coverage.remaining;
  const pendingTransfer = coverage.fullyPaid
    ? null
    : (application.payments.find((p) => p.status === "PENDING" && p.method === "TRANSFER") ?? null);
  const badge = coverage.fullyPaid ? "Payé" : pendingTransfer ? "Virement annoncé" : coverage.partial ? "Partiel" : "Non payé";
  const confirmTransfer = useMutation({
    mutationFn: () => postJson(`/api/payments/${pendingTransfer!.id}/confirm-transfer`, {}),
    onSuccess: () => {
      toast.success("Virement confirmé", { description: "La facture a été envoyée à l'élève." });
      onChanged();
    },
    onError: (error) => toast.error("Confirmation impossible", { description: error.message }),
  });


  return (
    <FadeIn delay={0.16}>
      <Card className="gap-0 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[15px] font-semibold text-foreground">Paiement</p>
            <p className="text-xs text-muted-foreground">{application.partnerRate ? "Tarif partenaire" : "Tarif standard"}</p>
          </div>
          <Badge variant={coverage.fullyPaid ? "success" : pendingTransfer || coverage.partial ? "warning" : "neutral"} dot>
            {badge}
          </Badge>
        </div>
        <p className="mt-4 text-[32px] leading-none font-semibold tracking-[-0.03em] text-foreground tabular">
          {application.totalAmount ? formatCurrency(application.totalAmount) : "—"}
        </p>

        {coverage.partial && (
          <dl className="mt-4 space-y-1.5 text-[13px]">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Déjà reçu</dt>
              <dd className="font-medium text-foreground">{formatCurrency(coverage.paidAmount)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Reste à payer</dt>
              <dd className="font-medium text-foreground">{formatCurrency(coverage.remaining)}</dd>
            </div>
          </dl>
        )}

        {completed.length > 0 && (
          <ul className="mt-4 space-y-2">
            {completed.map((payment) => (
              <li key={payment.id}>
                <a
                  href={`/api/invoices/${payment.id}`}
                  className="flex items-center gap-3 rounded-xl border border-border px-3.5 py-3 transition-colors hover:border-primary/30 hover:bg-primary-soft/40"
                >
                  <span className="grid size-8 place-items-center rounded-lg bg-primary-soft text-primary">
                    <ReceiptText className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-foreground">
                      {formatCurrency(payment.amount)}
                      {payment.installmentIndex && payment.installmentCount
                        ? ` · Versement ${payment.installmentIndex}/${payment.installmentCount}`
                        : ""}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {payment.method ? (PAYMENT_METHOD_LABELS[payment.method] ?? payment.method) : "Paiement"}
                      {payment.paidAt ? ` · ${formatDate(payment.paidAt)}` : ""}
                    </span>
                  </span>
                  <Download className="size-4 text-primary" />
                </a>
              </li>
            ))}
          </ul>
        )}

        {canMarkPaid && (
          <div className="mt-5 space-y-3 border-t border-border pt-4">
            {pendingTransfer && (
              <div className="space-y-3 rounded-xl border border-warning/25 bg-warning-soft px-4 py-3.5">
                <p className="text-[13px] leading-relaxed text-foreground">
                  L'élève a signalé un virement de {formatCurrency(pendingTransfer.amount)} le {formatDate(pendingTransfer.createdAt)}. Vérifiez qu&apos;il est bien arrivé sur votre compte avant de confirmer.
                </p>
                <Button className="w-full" loading={confirmTransfer.isPending} onClick={() => confirmTransfer.mutate()}>
                  Confirmer la réception du virement
                </Button>
              </div>
            )}
            <p className="text-[13px] font-medium text-foreground">Enregistrer un paiement reçu</p>
            <div role="radiogroup" aria-label="Mode de paiement" className="grid grid-cols-2 gap-2">
              {MANUAL_PAYMENT_METHODS.filter((m) => m !== "STRIPE").map((m) => (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={method === m}
                  onClick={() => setMethod(m)}
                  className={cn(
                    "h-9 rounded-lg border text-[13px] font-medium transition-all duration-200",
                    method === m
                      ? "border-primary bg-primary-soft text-primary-strong shadow-[0_0_0_3px_var(--color-primary-soft)]"
                      : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground",
                  )}
                >
                  {PAYMENT_METHOD_LABELS[m]}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5">
              <span className="min-w-0">
                <span className="block text-[13px] font-medium text-foreground">Paiement en plusieurs fois</span>
                <span className="block text-xs text-muted-foreground">
                  {existingPlan
                    ? `Échéancier en ${existingPlan} fois · ${recorded}/${existingPlan} reçu${recorded > 1 ? "s" : ""}`
                    : useInstallments
                      ? "Le dossier est réglé en plusieurs versements"
                      : "Le dossier est réglé en une fois"}
                </span>
              </span>
              <Switch
                size="sm"
                checked={useInstallments}
                disabled={Boolean(existingPlan)}
                onCheckedChange={(value) => {
                  setInstallmentsOn(value);
                  setAmountTouched(false);
                }}
                aria-label="Paiement en plusieurs fois"
              />
            </div>

            {useInstallments && (
              <div className="space-y-3">
                <div role="radiogroup" aria-label="Nombre de versements" className="grid grid-cols-3 gap-2">
                  {INSTALLMENT_COUNTS.map((value) => (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={activeCount === value}
                      disabled={Boolean(existingPlan) && existingPlan !== value}
                      onClick={() => {
                        setCount(value);
                        setAmountTouched(false);
                      }}
                      className={cn(
                        "h-9 rounded-lg border text-[13px] font-medium transition-all duration-200",
                        activeCount === value
                          ? "border-primary bg-primary-soft text-primary-strong"
                          : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground",
                        existingPlan && existingPlan !== value && "opacity-40",
                      )}
                    >
                      {value} fois
                    </button>
                  ))}
                </div>
                <Field
                  label="Montant reçu aujourd'hui"
                  htmlFor="installment-amount"
                  error={amountTooHigh ? `Le reste à payer est de ${formatCurrency(coverage.remaining)}.` : undefined}
                  hint={knownTotal ? `Suggestion : ${formatCurrency(suggested)}` : undefined}
                >
                  <div className="relative">
                    <Input
                      id="installment-amount"
                      inputMode="decimal"
                      value={amountValue}
                      onChange={(event) => {
                        setAmountTouched(true);
                        setAmountEuros(event.target.value);
                      }}
                      aria-invalid={amountTooHigh}
                      className="h-9 pr-8 text-right font-medium tabular"
                    />
                    <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">€</span>
                  </div>
                </Field>
              </div>
            )}

            <Button
              className="w-full"
              disabled={
                !method ||
                (useInstallments &&
                  (enteredCents == null || (knownTotal && enteredCents > coverage.remaining)))
              }
              loading={markPaid.isPending}
              onClick={() => {
                if (useInstallments && enteredCents != null) {
                  markPaid.mutate({ count: activeCount, amount: enteredCents });
                  return;
                }
                markPaid.mutate(undefined);
              }}
            >
              {useInstallments ? "Enregistrer le versement" : "Marquer comme payé"}
            </Button>
            {existingPlan && knownTotal && coverage.remaining > 0 && (
              <Button
                variant="outline"
                className="w-full"
                disabled={!method}
                loading={markPaid.isPending}
                onClick={() => markPaid.mutate(undefined)}
              >
                Encaisser le solde ({formatCurrency(coverage.remaining)})
              </Button>
            )}
            <p className="text-xs text-muted-foreground">
              L'élève peut aussi régler le solde en ligne, en une fois, depuis son espace.
            </p>
          </div>
        )}
      </Card>
    </FadeIn>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-5 w-24" />
      <Skeleton className="h-64 rounded-2xl" />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Skeleton className="h-96 rounded-2xl" />
        <div className="space-y-5">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-56 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
