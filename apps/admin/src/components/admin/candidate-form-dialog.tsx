"use client";

import { useQuery } from "@tanstack/react-query";
import { AnimatePresence } from "motion/react";
import { BadgePercent, Mail, Phone, User } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { FormAlert } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, Input, InputWithIcon } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { cleanOedipp, emptyCandidateForm, isValidBirthDate, isValidOedipp, OEDIPP_ERROR, OEDIPP_LENGTH, type CandidateFormData } from "@/lib/candidate-schema";
import { PERMIT_TYPES, quotePermitPrice, type OrgSettings } from "@/lib/constants";
import { cn, formatCurrency } from "@/lib/utils";

export type CandidateFormTarget = {
  id: string;
  permitType: string;
  partnerRate: boolean;
  paid: boolean;
  candidate: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    street?: string | null;
    postalCode?: string | null;
    city?: string | null;
    dateOfBirth?: string | null;
    oedippNumber?: string | null;
  };
};

function toForm(target: CandidateFormTarget): CandidateFormData {
  const c = target.candidate;
  return {
    firstName: c.firstName,
    lastName: c.lastName,
    email: c.email,
    phone: c.phone ?? "",
    street: c.street ?? "",
    postalCode: c.postalCode ?? "",
    city: c.city ?? "",
    dateOfBirth: c.dateOfBirth ? c.dateOfBirth.slice(0, 10) : "",
    oedippNumber: c.oedippNumber ?? "",
    permitType: PERMIT_TYPES.some((permit) => permit.value === target.permitType) ? (target.permitType as CandidateFormData["permitType"]) : "permis-b",
    partnerRate: target.partnerRate,
  };
}

function validate(form: CandidateFormData): Partial<Record<keyof CandidateFormData, string>> {
  const errors: Partial<Record<keyof CandidateFormData, string>> = {};
  if (!form.firstName.trim()) errors.firstName = "Requis";
  if (!form.lastName.trim()) errors.lastName = "Requis";
  if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) errors.email = "Email invalide";
  if (!form.street.trim()) errors.street = "Requise";
  if (!/^\d{5}$/.test(form.postalCode)) errors.postalCode = "5 chiffres";
  if (!form.city.trim()) errors.city = "Requise";
  if (!isValidBirthDate(form.dateOfBirth)) errors.dateOfBirth = "Date invalide";
  if (!isValidOedipp(form.oedippNumber.trim())) errors.oedippNumber = OEDIPP_ERROR;
  return errors;
}

function CandidateForm({
  target,
  onCancel,
  onSaved,
}: {
  target: CandidateFormTarget | null;
  onCancel: () => void;
  onSaved: (applicationId: string, invite?: { inviteLink?: string; emailSent?: boolean }) => void;
}) {
  const editing = Boolean(target);
  const [form, setForm] = useState<CandidateFormData>(() => (target ? toForm(target) : emptyCandidateForm));
  const [errors, setErrors] = useState<Partial<Record<keyof CandidateFormData, string>>>({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: settings } = useQuery<{ settings?: OrgSettings }>({
    queryKey: ["settings"],
    queryFn: () => fetch("/api/settings").then((res) => (res.ok ? res.json() : {})),
    staleTime: 60_000,
  });
  const offered = settings?.settings?.permitTypes?.length
    ? PERMIT_TYPES.filter((permit) => settings.settings!.permitTypes.includes(permit.value) || permit.value === form.permitType)
    : PERMIT_TYPES;

  useEffect(() => {
    if (editing || !settings?.settings?.permitTypes?.length) return;
    if (settings.settings.permitTypes.includes(form.permitType)) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- aligne le permis sur ceux proposés une fois les réglages chargés
    setForm((current) => ({ ...current, permitType: settings.settings!.permitTypes[0] as CandidateFormData["permitType"] }));
  }, [editing, form.permitType, settings]);

  const set = (key: keyof CandidateFormData) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const found = validate(form);
    setErrors(found);
    const invalid = Object.keys(found);
    if (invalid.length > 0) {
      // Le champ fautif peut être hors de vue dans la fenêtre : on y amène l'utilisateur.
      setError(invalid.length > 1 ? "Certains champs sont à corriger." : "Un champ est à corriger.");
      const formEl = event.currentTarget as HTMLFormElement;
      requestAnimationFrame(() => {
        const field = formEl.querySelector<HTMLElement>("[aria-invalid='true']");
        field?.scrollIntoView({ behavior: "smooth", block: "center" });
        field?.focus({ preventScroll: true });
      });
      return;
    }
    setSaving(true);
    setError("");
    const res = await fetch(editing ? `/api/applications/${target!.id}` : "/api/candidates", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(json.error ?? "L'enregistrement n'a pas abouti.");
      return;
    }
    onSaved(editing ? target!.id : json.application.id, editing ? undefined : { inviteLink: json.inviteLink, emailSent: json.emailSent });
  }

  const priceLocked = target?.paid ?? false;

  return (
    <form onSubmit={submit} noValidate>
      <DialogHeader>
        <DialogTitle>{editing ? "Modifier l'élève" : "Nouvel élève"}</DialogTitle>
        <DialogDescription>
          {editing
            ? "Mettez à jour les informations de l'élève."
            : "L'élève reçoit un email pour activer son compte et choisir son mot de passe."}
        </DialogDescription>
      </DialogHeader>

      <div className="scroll-area max-h-[min(62vh,560px)] space-y-6 overflow-y-auto px-6 pt-5 pb-2">
        <AnimatePresence initial={false}>{error && <FormAlert key="error">{error}</FormAlert>}</AnimatePresence>

        <section className="space-y-4">
          <p className="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">Identité</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Prénom" htmlFor="c-first" error={errors.firstName}>
              <InputWithIcon id="c-first" icon={User} value={form.firstName} onChange={set("firstName")} aria-invalid={!!errors.firstName} autoFocus />
            </Field>
            <Field label="Nom" htmlFor="c-last" error={errors.lastName}>
              <Input id="c-last" value={form.lastName} onChange={set("lastName")} aria-invalid={!!errors.lastName} />
            </Field>
            <Field label="Date de naissance" htmlFor="c-birth" error={errors.dateOfBirth}>
              <DatePicker
                id="c-birth"
                variant="birth"
                clearable
                value={form.dateOfBirth}
                onChange={(dateOfBirth) => {
                  setForm((current) => ({ ...current, dateOfBirth }));
                  setErrors((current) => ({ ...current, dateOfBirth: undefined }));
                }}
                invalid={!!errors.dateOfBirth}
              />
            </Field>
            <Field label="Numéro NEPH" htmlFor="c-oedipp" hint="Facultatif, 12 chiffres" error={errors.oedippNumber}>
              <Input
                id="c-oedipp"
                value={form.oedippNumber}
                onChange={(event) => {
                  setForm((current) => ({ ...current, oedippNumber: cleanOedipp(event.target.value) }));
                  setErrors((current) => ({ ...current, oedippNumber: undefined }));
                }}
                inputMode="numeric"
                maxLength={OEDIPP_LENGTH}
                placeholder="12345678"
                aria-invalid={!!errors.oedippNumber}
                className="font-mono tracking-wider"
              />
            </Field>
          </div>
        </section>

        <section className="space-y-4">
          <p className="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">Contact</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email" htmlFor="c-email" error={errors.email}>
              <InputWithIcon id="c-email" icon={Mail} type="email" value={form.email} onChange={set("email")} aria-invalid={!!errors.email} />
            </Field>
            <Field label="Téléphone" htmlFor="c-phone" hint="Facultatif">
              <InputWithIcon id="c-phone" icon={Phone} type="tel" value={form.phone} onChange={set("phone")} />
            </Field>
            <Field label="Adresse" htmlFor="c-street" error={errors.street} className="sm:col-span-2">
              <Input id="c-street" value={form.street} onChange={set("street")} aria-invalid={!!errors.street} />
            </Field>
            <Field label="Code postal" htmlFor="c-zip" error={errors.postalCode}>
              <Input id="c-zip" inputMode="numeric" maxLength={5} value={form.postalCode} onChange={set("postalCode")} aria-invalid={!!errors.postalCode} />
            </Field>
            <Field label="Ville" htmlFor="c-city" error={errors.city}>
              <Input id="c-city" value={form.city} onChange={set("city")} aria-invalid={!!errors.city} />
            </Field>
          </div>
        </section>

        <section className="space-y-3">
          <p className="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">Permis</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {offered.map((permit) => {
              const active = form.permitType === permit.value;
              const price = settings?.settings ? quotePermitPrice(settings.settings, permit.value, form.partnerRate) : null;
              return (
                <button
                  key={permit.value}
                  type="button"
                  disabled={priceLocked}
                  onClick={() => setForm((current) => ({ ...current, permitType: permit.value }))}
                  className={cn(
                    "rounded-xl border px-4 py-3 text-left transition-[border-color,background-color,box-shadow] duration-200 disabled:cursor-not-allowed disabled:opacity-60",
                    active ? "border-primary bg-primary-soft/60 ring-4 ring-ring/10" : "border-border hover:border-primary/40",
                  )}
                >
                  <span className="block text-sm font-semibold text-foreground">
                    {permit.label.replace(/^Permis\s+/i, "").replace(/^\p{L}/u, (letter) => letter.toUpperCase())}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground tabular">{price !== null ? formatCurrency(price) : "…"}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-3 pb-2">
          <p className="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">Tarif</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {[false, true].map((partner) => {
              const active = form.partnerRate === partner;
              const price = settings?.settings ? quotePermitPrice(settings.settings, form.permitType, partner) : null;
              return (
                <button
                  key={String(partner)}
                  type="button"
                  disabled={priceLocked}
                  onClick={() => setForm((current) => ({ ...current, partnerRate: partner }))}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-[border-color,background-color,box-shadow] duration-200 disabled:cursor-not-allowed disabled:opacity-60",
                    active ? "border-primary bg-primary-soft/60 ring-4 ring-ring/10" : "border-border hover:border-primary/40",
                  )}
                >
                  <span className={cn("grid size-5 place-items-center rounded-full border-2 transition-colors", active ? "border-primary" : "border-input")}>
                    {active && <span className="size-2.5 rounded-full bg-primary" />}
                  </span>
                  <span className="flex-1">
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                      {partner && <BadgePercent className="size-4 text-primary" />}
                      {partner ? "Partenaire" : "Standard"}
                    </span>
                    <span className="text-xs text-muted-foreground">{price !== null ? formatCurrency(price) : "…"}</span>
                  </span>
                </button>
              );
            })}
          </div>
          {priceLocked && <p className="text-xs text-muted-foreground">Le dossier est payé : le tarif ne peut plus changer.</p>}
        </section>
      </div>

      <DialogFooter className="mt-2 border-t border-border pt-4">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" loading={saving}>
          {editing ? "Enregistrer" : "Créer et inviter"}
        </Button>
      </DialogFooter>
    </form>
  );
}

/** Création ou modification d'un élève. `target` absent : création. */
/** Le toast survit au changement de page : l'admin peut copier le lien d'activation. */
function notifyInvite(invite?: { inviteLink?: string; emailSent?: boolean }) {
  const link = invite?.inviteLink;
  const action = link
    ? {
        label: "Copier le lien",
        onClick: () => {
          void navigator.clipboard.writeText(link).then(
            () => toast.success("Lien copié", { description: "Transmettez-le à l'élève (SMS, WhatsApp…)." }),
            () => toast.error("Copie impossible"),
          );
        },
      }
    : undefined;
  if (invite?.emailSent) {
    toast.success("Élève créé", { description: "Un email d'activation lui a été envoyé.", action });
  } else {
    toast.warning("Élève créé, email non envoyé", {
      description: "Copiez le lien d'activation et transmettez-le à l'élève.",
      action,
      duration: 20_000,
    });
  }
}

export function CandidateFormDialog({
  open,
  target,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  target?: CandidateFormTarget | null;
  onOpenChange: (open: boolean) => void;
  onSaved: (applicationId: string) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        {open && (
          <CandidateForm
            key={target?.id ?? "new"}
            target={target ?? null}
            onCancel={() => onOpenChange(false)}
            onSaved={(applicationId, invite) => {
              // La fenêtre se ferme et confirme l'enregistrement, quelle que soit la page appelante.
              onOpenChange(false);
              if (target) toast.success("Modifications enregistrées", { description: "Les informations de l'élève sont à jour." });
              else notifyInvite(invite);
              onSaved(applicationId);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
