"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellRing, CalendarPlus, ClipboardCheck, Clock3, MapPin, Pencil, QrCode, Trash2, UserPlus, UsersRound, X } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";

import { Avatar } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input, Textarea } from "@/components/ui/input";
import { DatePicker, timeOptions } from "@/components/ui/date-picker";
import { Select } from "@/components/ui/select";
import { useAppDialog } from "@/hooks/use-app-dialog";
import { cn } from "@/lib/utils";

import { CapacityMeter, dayKey, formatDuration, formatLongDay, formatTimeRange, isPast, type SessionBase } from "./calendar-shared";

export type StaffSession = SessionBase & {
  createdBy: { firstName: string; lastName: string } | null;
  attendanceOpenedAt?: string | null;
  attendanceClosedAt?: string | null;
  registrations: {
    id: string;
    reminder: boolean;
    createdAt: string;
    attendedAt?: string | null;
    candidate: { id: string; firstName: string; lastName: string; email: string; phone: string | null };
  }[];
};

const DURATIONS = [60, 90, 120, 180, 240, 300, 360, 480];

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

function toTimeInput(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

/* ----------------------------------------------------------------------------
 * Création / modification
 * ------------------------------------------------------------------------- */

export function SessionFormDialog({
  open,
  onOpenChange,
  session,
  defaultDay,
  defaultTime,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session?: StaffSession | null;
  defaultDay?: string | null;
  defaultTime?: string | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100svh-2rem)] max-w-xl overflow-y-auto">
        {open && <SessionForm key={session?.id ?? `${defaultDay}-${defaultTime}`} session={session} defaultDay={defaultDay} defaultTime={defaultTime} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function SessionForm({ session, defaultDay, defaultTime, onDone }: { session?: StaffSession | null; defaultDay?: string | null; defaultTime?: string | null; onDone: () => void }) {
  const queryClient = useQueryClient();
  const editing = Boolean(session);
  const start = session ? new Date(session.startsAt) : null;
  const [now] = useState(() => Date.now());
  const tomorrow = dayKey(new Date(now + 24 * 60 * 60 * 1000));

  const [form, setForm] = useState({
    title: session?.title ?? "Séance de code",
    date: start ? dayKey(start) : defaultDay && defaultDay >= dayKey(new Date()) ? defaultDay : tomorrow,
    time: start ? toTimeInput(start) : (defaultTime ?? "09:00"),
    durationMinutes: session?.durationMinutes ?? 240,
    location: session?.location ?? "",
    capacity: String(session?.capacity ?? 12),
    notes: session?.notes ?? "",
  });
  const [submitted, setSubmitted] = useState(false);

  const startsAt = new Date(`${form.date}T${form.time || "00:00"}`);
  const capacity = Number(form.capacity);
  const minCapacity = session?.registeredCount ?? 0;
  const errors = {
    title: !form.title.trim() ? "Indiquez un intitulé" : undefined,
    date: Number.isNaN(startsAt.getTime()) ? "Date invalide" : !editing && startsAt.getTime() < now ? "Choisissez une date à venir" : undefined,
    location: !form.location.trim() ? "Indiquez le lieu" : undefined,
    capacity:
      !Number.isInteger(capacity) || capacity < 1
        ? "Au moins 1 place"
        : capacity < minCapacity
          ? `Déjà ${minCapacity} inscrits`
          : undefined,
  };
  const valid = !Object.values(errors).some(Boolean);

  const save = useMutation({
    mutationFn: () =>
      sendJson(editing ? `/api/sessions/${session!.id}` : "/api/sessions", editing ? "PATCH" : "POST", {
        title: form.title,
        location: form.location,
        startsAt: startsAt.toISOString(),
        durationMinutes: form.durationMinutes,
        capacity,
        notes: form.notes || null,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["sessions"] });
      toast.success(editing ? "Session modifiée" : "Session créée", {
        description: editing
          ? session!.registeredCount > 0
            ? "Les inscrits sont prévenus des changements de date ou de lieu."
            : undefined
          : "Les élèves sont prévenus qu'une nouvelle date est ouverte.",
      });
      onDone();
    },
    onError: (error) => toast.error("Enregistrement impossible", { description: error.message }),
  });

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (valid) save.mutate();
  }

  const show = (key: keyof typeof errors) => (submitted ? errors[key] : undefined);

  return (
    <form onSubmit={submit} noValidate>
      <DialogHeader>
        <DialogTitle>{editing ? "Modifier la session" : "Nouvelle session de cours"}</DialogTitle>
        <DialogDescription>
          {editing
            ? "Les élèves inscrits recevront un email si la date, l'heure ou le lieu changent."
            : "Les élèves recevront une alerte et un email pour s'inscrire."}
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 px-6 pt-5 pb-2 sm:grid-cols-2">
        <Field label="Intitulé" htmlFor="s-title" error={show("title")} className="sm:col-span-2">
          <Input id="s-title" value={form.title} maxLength={120} onChange={(e) => setForm({ ...form, title: e.target.value })} aria-invalid={Boolean(show("title"))} />
        </Field>
        <Field label="Date" htmlFor="s-date" error={show("date")}>
          <DatePicker id="s-date" value={form.date} min={editing ? undefined : dayKey(new Date(now))} onChange={(date) => setForm({ ...form, date })} invalid={Boolean(show("date"))} />
        </Field>
        <Field label="Heure de début" htmlFor="s-time">
          <Select id="s-time" icon={Clock3} value={form.time} onValueChange={(time) => setForm({ ...form, time })} options={timeOptions(form.time)} />
        </Field>
        <Field label="Durée" htmlFor="s-duration">
          <Select
            id="s-duration"
            value={form.durationMinutes}
            onValueChange={(durationMinutes) => setForm({ ...form, durationMinutes })}
            options={[...new Set([...DURATIONS, form.durationMinutes])].sort((a, b) => a - b).map((m) => ({ value: m, label: formatDuration(m) }))}
          />
        </Field>
        <Field label="Places maximum" htmlFor="s-capacity" error={show("capacity")} hint={minCapacity ? `${minCapacity} déjà inscrits` : undefined}>
          <Input id="s-capacity" type="number" inputMode="numeric" min={Math.max(1, minCapacity)} max={500} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} aria-invalid={Boolean(show("capacity"))} />
        </Field>
        <Field label="Lieu" htmlFor="s-location" error={show("location")} className="sm:col-span-2">
          <Input id="s-location" value={form.location} maxLength={200} placeholder="Salle de code, 14 avenue de la République, Lyon" onChange={(e) => setForm({ ...form, location: e.target.value })} aria-invalid={Boolean(show("location"))} />
        </Field>
        <Field label="Informations pour les élèves" htmlFor="s-notes" hint="Facultatif : matériel à apporter, accès, parking…" className="sm:col-span-2">
          <Textarea id="s-notes" rows={3} maxLength={1000} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </Field>
      </div>
      <DialogFooter className="mt-3 border-t border-border pt-4">
        <Button type="button" variant="ghost" onClick={onDone}>
          Annuler
        </Button>
        <Button type="submit" loading={save.isPending}>
          {!save.isPending && !editing && <CalendarPlus />}
          {editing ? "Enregistrer" : "Créer la session"}
        </Button>
      </DialogFooter>
    </form>
  );
}

/* ----------------------------------------------------------------------------
 * Détail : inscrits, ajout et retrait d'élèves
 * ------------------------------------------------------------------------- */

export function SessionDetailDialog({
  session,
  onOpenChange,
  onEdit,
}: {
  session: StaffSession | null;
  onOpenChange: (open: boolean) => void;
  onEdit: (session: StaffSession) => void;
}) {
  return (
    <Dialog open={Boolean(session)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100svh-2rem)] max-w-xl overflow-y-auto">
        {session && <SessionDetail session={session} onClose={() => onOpenChange(false)} onEdit={onEdit} />}
      </DialogContent>
    </Dialog>
  );
}

/** Accès à l'appel par QR code : le jour de la séance, ou relevé une fois l'appel fait. */
function AttendanceBanner({ session }: { session: StaffSession }) {
  const [now] = useState(() => Date.now());
  const start = new Date(session.startsAt).getTime();
  const end = start + session.durationMinutes * 60_000;
  const openable = now >= start - 2 * 3600_000 && now <= end + 12 * 3600_000;
  const present = session.registrations.filter((r) => r.attendedAt).length;
  const href = `/admin/calendar/${session.id}/appel`;

  if (session.attendanceClosedAt) {
    return (
      <Link href={href} className="flex items-center gap-3 rounded-xl border border-success/20 bg-success-soft/60 px-4 py-3 transition-colors hover:bg-success-soft">
        <ClipboardCheck className="size-5 shrink-0 text-success" />
        <span className="min-w-0 flex-1 text-sm">
          <span className="font-semibold text-foreground">Appel fait</span>
          <span className="text-muted-foreground"> · {present} présent{present > 1 ? "s" : ""} sur {session.registrations.length}</span>
        </span>
        <span className="text-[13px] font-medium text-success">Relevé</span>
      </Link>
    );
  }
  if (session.attendanceOpenedAt) {
    return (
      <Link href={href} className={cn(buttonVariants({ className: "w-full" }))}>
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-70" />
          <span className="relative inline-flex size-2 rounded-full bg-white" />
        </span>
        Appel en cours · {present}/{session.registrations.length} présents
      </Link>
    );
  }
  if (!openable) return null;
  return (
    <Link href={href} className={cn(buttonVariants({ className: "w-full" }))}>
      <QrCode /> Faire l&apos;appel par QR code
    </Link>
  );
}

function SessionDetail({ session, onClose, onEdit }: { session: StaffSession; onClose: () => void; onEdit: (session: StaffSession) => void }) {
  const queryClient = useQueryClient();
  const { showConfirm } = useAppDialog();
  // Un moniteur crée, modifie et ajoute des élèves, mais ne retire ni ne supprime.
  const { data: auth } = useSession();
  const isAdmin = auth?.user?.role === "ADMIN";
  const [adding, setAdding] = useState(false);
  const [candidateId, setCandidateId] = useState("");
  const past = isPast(session);
  const start = new Date(session.startsAt);
  const full = session.registeredCount >= session.capacity;

  const candidates = useQuery({
    queryKey: ["sessions", "candidates"],
    queryFn: async () => (await sendJson("/api/sessions/candidates", "GET")).candidates as { id: string; firstName: string; lastName: string; email: string }[],
    enabled: adding,
  });
  const registeredIds = new Set(session.registrations.map((r) => r.candidate.id));
  const available = (candidates.data ?? []).filter((c) => !registeredIds.has(c.id));

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ["sessions"] });

  const remove = useMutation({
    mutationFn: (registrationId: string) => sendJson(`/api/sessions/${session.id}/registrations/${registrationId}`, "DELETE"),
    onSuccess: () => {
      invalidate();
      toast.success("Élève retiré de la session");
    },
    onError: (error) => toast.error("Erreur", { description: error.message }),
  });

  const add = useMutation({
    mutationFn: () => sendJson(`/api/sessions/${session.id}/registrations`, "POST", { candidateId }),
    onSuccess: () => {
      invalidate();
      setCandidateId("");
      setAdding(false);
      toast.success("Élève inscrit", { description: "Il reçoit une confirmation par email." });
    },
    onError: (error) => toast.error("Inscription impossible", { description: error.message }),
  });

  const destroy = useMutation({
    mutationFn: () => sendJson(`/api/sessions/${session.id}`, "DELETE"),
    onSuccess: () => {
      invalidate();
      toast.success("Session supprimée", {
        description: session.registeredCount && !past ? "Les inscrits sont prévenus de l'annulation." : undefined,
      });
      onClose();
    },
    onError: (error) => toast.error("Suppression impossible", { description: error.message }),
  });

  async function confirmDelete() {
    const ok = await showConfirm({
      title: "Supprimer cette session ?",
      description:
        session.registeredCount > 0 && !past
          ? `${session.registeredCount} élève${session.registeredCount > 1 ? "s sont inscrits" : " est inscrit"} : ${session.registeredCount > 1 ? "ils recevront" : "il recevra"} un email d'annulation.`
          : "Cette action est définitive.",
      variant: "destructive",
      confirmLabel: "Supprimer",
    });
    if (ok) destroy.mutate();
  }

  async function confirmRemove(registration: StaffSession["registrations"][number]) {
    const ok = await showConfirm({
      title: `Retirer ${registration.candidate.firstName} ${registration.candidate.lastName} ?`,
      description: "Sa place sera libérée pour un autre élève.",
      variant: "destructive",
      confirmLabel: "Retirer",
    });
    if (ok) remove.mutate(registration.id);
  }

  return (
    <>
      <DialogHeader className="pr-12">
        <DialogTitle>{session.title}</DialogTitle>
        <DialogDescription>{formatLongDay(start)}</DialogDescription>
      </DialogHeader>
      <div className="space-y-5 px-6 pt-4 pb-6">
        <dl className="grid gap-2.5 text-sm sm:grid-cols-2">
          <div className="flex items-center gap-2.5 text-foreground">
            <Clock3 className="size-4 shrink-0 text-primary" />
            <span>
              {formatTimeRange(session)} <span className="text-muted-foreground">· {formatDuration(session.durationMinutes)}</span>
            </span>
          </div>
          <div className="flex min-w-0 items-start gap-2.5 text-foreground sm:col-span-2">
            <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
            <span className="break-words">{session.location}</span>
          </div>
        </dl>
        {session.notes && <p className="rounded-xl bg-subtle px-4 py-3 text-[13px] leading-relaxed whitespace-pre-line text-muted-foreground">{session.notes}</p>}
        <CapacityMeter registered={session.registeredCount} capacity={session.capacity} />

        <AttendanceBanner session={session} />

        <div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-foreground">Inscrits</p>
            {!past && !full && !adding && (
              <Button size="sm" variant="outline" onClick={() => setAdding(true)}>
                <UserPlus /> Inscrire un élève
              </Button>
            )}
          </div>

          {adding && (
            <div className="mt-3 flex flex-col gap-2 rounded-xl border border-border bg-subtle/60 p-3 sm:flex-row">
              <Select
                size="sm"
                aria-label="Élève à inscrire"
                value={candidateId || null}
                onValueChange={setCandidateId}
                disabled={candidates.isLoading || available.length === 0}
                placeholder={candidates.isLoading ? "Chargement…" : available.length ? "Choisir un élève" : "Aucun élève disponible"}
                options={available.map((c) => ({ value: c.id, label: `${c.lastName} ${c.firstName}` }))}
                className="flex-1"
              />
              <div className="flex gap-2">
                <Button size="sm" className="flex-1" disabled={!candidateId} loading={add.isPending} onClick={() => add.mutate()}>
                  Inscrire
                </Button>
                <Button size="sm" variant="ghost" aria-label="Annuler" onClick={() => setAdding(false)}>
                  <X />
                </Button>
              </div>
            </div>
          )}

          {session.registrations.length === 0 ? (
            <EmptyState compact icon={UsersRound} title="Aucun inscrit pour l'instant" description="Les élèves s'inscrivent depuis leur espace." />
          ) : (
            <ul className="mt-3 divide-y divide-border rounded-xl border border-border">
              {session.registrations.map((r) => (
                <li key={r.id} className="flex items-center gap-3 px-3.5 py-2.5">
                  <Avatar size="sm" firstName={r.candidate.firstName} lastName={r.candidate.lastName} />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 truncate text-sm font-medium text-foreground">
                      <span className="truncate">
                        {r.candidate.firstName} {r.candidate.lastName}
                      </span>
                      {(r.attendedAt || session.attendanceClosedAt) && (
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                            r.attendedAt ? "bg-success-soft text-success" : "bg-danger-soft text-danger",
                          )}
                        >
                          {r.attendedAt ? "Présent" : "Absent"}
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {r.candidate.phone ? `${r.candidate.phone} · ` : ""}
                      {r.candidate.email}
                    </p>
                  </div>
                  {r.reminder && (
                    <span title="Rappel par email 2 jours avant" className="text-primary">
                      <BellRing className="size-4" aria-label="Rappel activé" />
                    </span>
                  )}
                  {isAdmin && (
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`Retirer ${r.candidate.firstName} ${r.candidate.lastName}`}
                      className="text-muted-foreground hover:text-danger"
                      onClick={() => void confirmRemove(r)}
                      disabled={remove.isPending}
                    >
                      <X className="size-4" />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <DialogFooter className={cn("border-t border-border pt-4", isAdmin && "sm:justify-between")}>
        {isAdmin && (
          <Button variant="ghost" className="text-danger hover:bg-danger/10 hover:text-danger" onClick={() => void confirmDelete()} loading={destroy.isPending}>
            {!destroy.isPending && <Trash2 />} Supprimer
          </Button>
        )}
        <Button variant="outline" onClick={() => onEdit(session)}>
          <Pencil /> Modifier
        </Button>
      </DialogFooter>
    </>
  );
}
