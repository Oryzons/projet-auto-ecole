"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Anchor, ChevronRight, Link2, MailCheck, Pencil, Search, ShieldCheck, Trash2, UserPlus, UsersRound } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { toast } from "sonner";

import { CandidateFormDialog } from "@/components/admin/candidate-form-dialog";
import { InviteLinkDialog, type InviteResult } from "@/components/admin/invite-link-dialog";
import { FadeIn } from "@/components/motion";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge, Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input, InputWithIcon } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PageHeader } from "@/components/ui/page-header";
import { Segmented } from "@/components/ui/segmented";
import { Skeleton } from "@/components/ui/skeleton";
import { ApplicationStatusBadge } from "@/components/ui/status-badge";
import { useAppDialog } from "@/hooks/use-app-dialog";
import { cn } from "@/lib/utils";
import { signalNavigation } from "@/components/shell/navigation-progress";

type Tab = "team" | "candidates";
type MemberRole = "ADMIN" | "SKIPPER";

type Member = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: MemberRole;
  profilePhotoUrl: string | null;
  sessionsCreated: number;
  pendingActivation: boolean;
};

type CandidateRow = {
  id: string;
  status: string;
  permitType: string;
  partnerRate: boolean;
  payments: { status: string }[];
  candidate: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    profilePhotoUrl: string | null;
    street?: string | null;
    postalCode?: string | null;
    city?: string | null;
    dateOfBirth?: string | null;
    oedippNumber?: string | null;
  };
};

const ROLE_INFO: Record<MemberRole, { label: string; description: string; icon: typeof ShieldCheck }> = {
  ADMIN: { label: "Administrateur", description: "Accès complet : dossiers, finances, paramètres, calendrier.", icon: ShieldCheck },
  SKIPPER: { label: "Moniteur", description: "Calendrier seul : crée et modifie les cours, inscrit des élèves, sans rien supprimer.", icon: Anchor },
};

async function sendJson(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? "Action impossible, réessayez.");
  return json;
}

function MembersContent() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const tab: Tab = params.get("tab") === "candidates" ? "candidates" : "team";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Organisation"
        title="Membres"
        description="Votre équipe (administrateurs et moniteurs) et vos élèves."
        actions={
          <Segmented
            options={[
              { value: "team", label: "Équipe" },
              { value: "candidates", label: "Élèves" },
            ]}
            value={tab}
            onChange={(value) => router.replace(value === "team" ? pathname : `${pathname}?tab=${value}`, { scroll: false })}
          />
        }
      />
      {tab === "team" ? <TeamTab /> : <CandidatesTab />}
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * Équipe
 * ------------------------------------------------------------------------- */

function TeamTab() {
  const queryClient = useQueryClient();
  const { showConfirm } = useAppDialog();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteResult, setInviteResult] = useState<InviteResult | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["members"],
    queryFn: () => sendJson("/api/members", "GET") as Promise<{ currentUserId: string; members: Member[] }>,
  });

  const changeRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: MemberRole }) => sendJson(`/api/members/${id}`, "PATCH", { role }),
    onSuccess: (_d, { role }) => {
      void queryClient.invalidateQueries({ queryKey: ["members"] });
      toast.success("Rôle mis à jour", { description: `Ce membre est maintenant ${ROLE_INFO[role].label.toLowerCase()}.` });
    },
    onError: (error) => toast.error("Modification impossible", { description: error.message }),
  });

  const reinvite = useMutation({
    mutationFn: async (member: Member) => {
      const json = await sendJson(`/api/members/${member.id}/invite`, "POST");
      return { name: member.firstName, email: member.email, inviteLink: json.inviteLink, emailSent: json.emailSent } as InviteResult;
    },
    onSuccess: setInviteResult,
    onError: (error) => toast.error("Invitation impossible", { description: error.message }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => sendJson(`/api/members/${id}`, "DELETE"),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["members"] });
      toast.success("Membre retiré de l'équipe");
    },
    onError: (error) => toast.error("Suppression impossible", { description: error.message }),
  });

  async function confirmRole(member: Member, role: MemberRole) {
    if (role === member.role) return;
    const ok = await showConfirm({
      title: `Passer ${member.firstName} en ${ROLE_INFO[role].label.toLowerCase()} ?`,
      description: ROLE_INFO[role].description,
      confirmLabel: "Changer le rôle",
    });
    if (ok) changeRole.mutate({ id: member.id, role });
  }

  async function confirmRemove(member: Member) {
    const ok = await showConfirm({
      title: `Retirer ${member.firstName} ${member.lastName} ?`,
      description: "Son compte sera supprimé et il ne pourra plus se connecter. Les sessions qu'il a créées restent dans le calendrier.",
      variant: "destructive",
      confirmLabel: "Retirer",
    });
    if (ok) remove.mutate(member.id);
  }

  const members = data?.members ?? [];

  return (
    <FadeIn>
      <Card className="gap-0 p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <p className="text-[15px] font-semibold text-foreground">
              Équipe {members.length > 0 && <span className="text-muted-foreground tabular">· {members.length}</span>}
            </p>
            <p className="text-[13px] text-muted-foreground">Un moniteur n&apos;a accès qu&apos;au calendrier des cours.</p>
          </div>
          <Button onClick={() => setInviteOpen(true)}>
            <UserPlus /> Inviter un membre
          </Button>
        </div>

        {isError ? (
          <EmptyState compact icon={UsersRound} title="Chargement impossible" description="Rechargez la page dans un instant." />
        ) : isLoading ? (
          <div className="space-y-3 p-5">
            <Skeleton className="h-14 rounded-xl" />
            <Skeleton className="h-14 rounded-xl" />
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {members.map((member) => {
              const me = member.id === data?.currentUserId;
              return (
                <li key={member.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <Avatar firstName={member.firstName} lastName={member.lastName} src={member.profilePhotoUrl} />
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-foreground">
                        <span className="truncate">
                          {member.firstName} {member.lastName}
                        </span>
                        {me && <Badge variant="info">Vous</Badge>}
                        {member.pendingActivation && (
                          <Badge variant="warning" dot>
                            Invitation envoyée
                          </Badge>
                        )}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {member.email}
                        {member.role === "SKIPPER" && member.sessionsCreated > 0
                          ? ` · ${member.sessionsCreated} session${member.sessionsCreated > 1 ? "s" : ""} créée${member.sessionsCreated > 1 ? "s" : ""}`
                          : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 pl-[52px] sm:pl-0">
                    <Select
                      size="sm"
                      aria-label={`Rôle de ${member.firstName} ${member.lastName}`}
                      value={member.role}
                      disabled={me || changeRole.isPending}
                      onValueChange={(role) => {
                        if (role !== member.role) void confirmRole(member, role);
                      }}
                      options={(Object.keys(ROLE_INFO) as MemberRole[]).map((role) => ({
                        value: role,
                        label: ROLE_INFO[role].label,
                        description: ROLE_INFO[role].description,
                        icon: ROLE_INFO[role].icon,
                      }))}
                      className="w-auto font-medium"
                      popupClassName="w-72"
                    />
                    {member.pendingActivation && (
                      <Button
                        size="sm"
                        variant="outline"
                        loading={reinvite.isPending && reinvite.variables?.id === member.id}
                        onClick={() => reinvite.mutate(member)}
                      >
                        <Link2 /> Lien d&apos;invitation
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`Retirer ${member.firstName} ${member.lastName}`}
                      className="text-muted-foreground hover:text-danger"
                      disabled={me || remove.isPending}
                      onClick={() => void confirmRemove(member)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
      <InviteDialog open={inviteOpen} onOpenChange={setInviteOpen} onInvited={setInviteResult} />
      <InviteLinkDialog result={inviteResult} onClose={() => setInviteResult(null)} />
    </FadeIn>
  );
}

function InviteDialog({
  open,
  onOpenChange,
  onInvited,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvited: (result: InviteResult) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        {open && <InviteForm onDone={() => onOpenChange(false)} onInvited={onInvited} />}
      </DialogContent>
    </Dialog>
  );
}

function InviteForm({ onDone, onInvited }: { onDone: () => void; onInvited: (result: InviteResult) => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", role: "SKIPPER" as MemberRole });
  const [submitted, setSubmitted] = useState(false);
  const errors = {
    firstName: form.firstName.trim() ? undefined : "Indiquez le prénom",
    lastName: form.lastName.trim() ? undefined : "Indiquez le nom",
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) ? undefined : "Email invalide",
  };
  const valid = !Object.values(errors).some(Boolean);
  const show = (key: keyof typeof errors) => (submitted ? errors[key] : undefined);

  const invite = useMutation({
    mutationFn: () => sendJson("/api/members", "POST", form),
    onSuccess: (json) => {
      void queryClient.invalidateQueries({ queryKey: ["members"] });
      onDone();
      // Le lien est affiché pour pouvoir le transmettre, même si l'email n'est pas parti.
      onInvited({ name: form.firstName, email: form.email.trim(), inviteLink: json.inviteLink, emailSent: json.emailSent });
    },
    onError: (error) => toast.error("Invitation impossible", { description: error.message }),
  });

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
        if (valid) invite.mutate();
      }}
    >
      <DialogHeader>
        <DialogTitle>Inviter un membre</DialogTitle>
        <DialogDescription>Il recevra un email pour activer son compte et choisir son mot de passe.</DialogDescription>
      </DialogHeader>
      <div className="space-y-4 px-6 pt-5 pb-2">
        <div role="radiogroup" aria-label="Rôle" className="grid gap-2 sm:grid-cols-2">
          {(Object.keys(ROLE_INFO) as MemberRole[]).map((role) => {
            const info = ROLE_INFO[role];
            const active = form.role === role;
            return (
              <button
                key={role}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setForm({ ...form, role })}
                className={cn(
                  "rounded-xl border p-3.5 text-left transition-all duration-200",
                  active ? "border-primary bg-primary-soft/60 shadow-[0_0_0_3px_var(--color-primary-soft)]" : "border-border hover:border-primary/30",
                )}
              >
                <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <info.icon className={cn("size-4", active ? "text-primary" : "text-muted-foreground")} />
                  {info.label}
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{info.description}</span>
              </button>
            );
          })}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Prénom" htmlFor="m-first" error={show("firstName")}>
            <Input id="m-first" value={form.firstName} maxLength={80} autoComplete="off" onChange={(e) => setForm({ ...form, firstName: e.target.value })} aria-invalid={Boolean(show("firstName"))} />
          </Field>
          <Field label="Nom" htmlFor="m-last" error={show("lastName")}>
            <Input id="m-last" value={form.lastName} maxLength={80} autoComplete="off" onChange={(e) => setForm({ ...form, lastName: e.target.value })} aria-invalid={Boolean(show("lastName"))} />
          </Field>
        </div>
        <Field label="Email" htmlFor="m-email" error={show("email")}>
          <Input id="m-email" type="email" inputMode="email" value={form.email} maxLength={200} autoComplete="off" onChange={(e) => setForm({ ...form, email: e.target.value })} aria-invalid={Boolean(show("email"))} />
        </Field>
      </div>
      <DialogFooter className="mt-3 border-t border-border pt-4">
        <Button type="button" variant="ghost" onClick={onDone}>
          Annuler
        </Button>
        <Button type="submit" loading={invite.isPending}>
          {!invite.isPending && <MailCheck />} Envoyer l&apos;invitation
        </Button>
      </DialogFooter>
    </form>
  );
}

/* ----------------------------------------------------------------------------
 * Élèves
 * ------------------------------------------------------------------------- */

function CandidatesTab() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { showConfirm } = useAppDialog();
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CandidateRow | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["applications"],
    queryFn: async () => (await sendJson("/api/applications", "GET")).applications as CandidateRow[],
  });

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = [...(data ?? [])].sort((a, b) => a.candidate.lastName.localeCompare(b.candidate.lastName, "fr"));
    if (!q) return list;
    return list.filter((r) => `${r.candidate.firstName} ${r.candidate.lastName} ${r.candidate.email}`.toLowerCase().includes(q));
  }, [data, query]);

  const remove = useMutation({
    mutationFn: (id: string) => sendJson(`/api/applications/${id}`, "DELETE"),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["applications"] });
      toast.success("Élève supprimé", { description: "S'il avait payé, son dossier est archivé pour la comptabilité." });
    },
    onError: (error) => toast.error("Suppression impossible", { description: error.message }),
  });

  async function confirmRemove(row: CandidateRow) {
    const ok = await showConfirm({
      title: `Supprimer ${row.candidate.firstName} ${row.candidate.lastName} ?`,
      description: "Son compte, ses documents, ses messages et ses inscriptions aux cours seront effacés. Cette action est définitive.",
      variant: "destructive",
      confirmLabel: "Supprimer",
    });
    if (ok) remove.mutate(row.id);
  }

  return (
    <FadeIn>
      <Card className="gap-0 p-0">
        <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <InputWithIcon
            icon={Search}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un élève…"
            aria-label="Rechercher un élève"
            className="sm:w-72"
          />
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <UserPlus /> Nouvel élève
          </Button>
        </div>

        {isError ? (
          <EmptyState compact icon={UsersRound} title="Chargement impossible" description="Rechargez la page dans un instant." />
        ) : isLoading ? (
          <div className="space-y-3 p-5">
            <Skeleton className="h-14 rounded-xl" />
            <Skeleton className="h-14 rounded-xl" />
            <Skeleton className="h-14 rounded-xl" />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState compact icon={UsersRound} title={query ? "Aucun élève trouvé" : "Aucun élève pour l'instant"} description={query ? "Vérifiez l'orthographe du nom ou de l'email." : "Créez un élève ou laissez-le s'inscrire depuis la page d'inscription."} />
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((row) => (
              <li key={row.id} className="flex items-center gap-3 px-5 py-3.5">
                <Link href={`/admin/applications/${row.id}`} className="group flex min-w-0 flex-1 items-center gap-3">
                  <Avatar firstName={row.candidate.firstName} lastName={row.candidate.lastName} src={row.candidate.profilePhotoUrl} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground group-hover:text-primary">
                      {row.candidate.firstName} {row.candidate.lastName}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">{row.candidate.email}</span>
                  </span>
                  <ApplicationStatusBadge status={row.status} className="hidden md:inline-flex" />
                </Link>
                <div className="flex shrink-0 items-center">
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Modifier ${row.candidate.firstName} ${row.candidate.lastName}`}
                    onClick={() => {
                      setEditing(row);
                      setFormOpen(true);
                    }}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Supprimer ${row.candidate.firstName} ${row.candidate.lastName}`}
                    className="text-muted-foreground hover:text-danger"
                    disabled={remove.isPending}
                    onClick={() => void confirmRemove(row)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                  <Link href={`/admin/applications/${row.id}`} aria-label="Ouvrir le dossier" className="hidden size-9 place-items-center text-muted-foreground hover:text-primary sm:grid">
                    <ChevronRight className="size-4" />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <CandidateFormDialog
        open={formOpen}
        onOpenChange={(value) => {
          setFormOpen(value);
          if (!value) setEditing(null);
        }}
        target={
          editing
            ? { id: editing.id, permitType: editing.permitType, partnerRate: editing.partnerRate, paid: editing.payments.some((p) => p.status === "COMPLETED"), candidate: editing.candidate }
            : null
        }
        onSaved={(applicationId) => {
          void queryClient.invalidateQueries({ queryKey: ["applications"] });
          if (editing) setEditing(null);
          else {
            signalNavigation(`/admin/applications/${applicationId}`);
            router.push(`/admin/applications/${applicationId}`);
          }
        }}
      />
    </FadeIn>
  );
}

export default function MembersPage() {
  return (
    <Suspense>
      <MembersContent />
    </Suspense>
  );
}
