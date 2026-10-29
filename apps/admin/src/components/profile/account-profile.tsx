"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { signIn, useSession } from "next-auth/react";
import { AnimatePresence, motion } from "motion/react";
import { Camera, Check, ChevronRight, Copy, KeyRound, Loader2, LogOut, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { isPasswordValid, PasswordInput, PasswordStrength } from "@/components/auth/password-input";
import { FadeIn } from "@/components/motion";
import { EASE_OUT } from "@/components/motion/tokens";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { TheoryCourseBadge } from "@/components/ui/theory-course-badge";
import type { TheoryCourseInfo } from "@/lib/application-types";
import { signOutWithTransition } from "@/components/shell/sign-out";
import { useUploadThing } from "@/lib/uploadthing-client";

type AccountProfileData = {
  id: string;
  email: string;
  role: "ADMIN" | "CANDIDATE" | "SKIPPER";
  firstName: string;
  lastName: string;
  phone: string;
  profilePhotoUrl: string | null;
  street: string;
  postalCode: string;
  city: string;
  dateOfBirth: string;
  oedippNumber: string;
  /** Élève pas encore noté présent à la séance de code : numéro masqué. */
  oedippLocked?: boolean;
  organizationName: string;
  theoryCourse?: TheoryCourseInfo;
};

/** Numéro NEPH en lecture seule : seule l'auto-école le renseigne ou le corrige. */
function OedippCard({ number, locked }: { number: string; locked?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-4 w-full rounded-2xl border border-border bg-subtle/60 px-4 py-3 text-left">
      <p className="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">Numéro NEPH</p>
      {number ? (
        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="font-mono text-xl font-semibold tracking-[0.12em] text-foreground tabular-nums">{number}</span>
          <button
            type="button"
            aria-label="Copier le numéro NEPH"
            onClick={() =>
              void navigator.clipboard.writeText(number).then(() => {
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1800);
              })
            }
            className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-card hover:text-primary"
          >
            {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
          </button>
        </div>
      ) : locked ? (
        <p className="mt-1 text-sm text-muted-foreground">Visible une fois votre présence validée à la séance de code.</p>
      ) : (
        <p className="mt-1 text-sm text-muted-foreground">Pas encore attribué : votre auto-école le renseignera.</p>
      )}
      <p className="mt-1.5 text-xs text-muted-foreground">Il vous servira pour vous inscrire à l&apos;examen du code.</p>
    </div>
  );
}

type ProfileForm = Omit<AccountProfileData, "id" | "email" | "role" | "profilePhotoUrl" | "organizationName" | "theoryCourse" | "oedippNumber" | "oedippLocked">;

function toForm(profile: AccountProfileData): ProfileForm {
  const { firstName, lastName, phone, street, postalCode, city, dateOfBirth } = profile;
  return { firstName, lastName, phone, street, postalCode, city, dateOfBirth };
}

function SectionTitle({ icon: Icon, title, description }: { icon: typeof Mail; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
        <Icon className="size-[18px]" />
      </span>
      <div>
        <h2 className="text-[15px] font-semibold text-foreground">{title}</h2>
        <p className="text-[13px] text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function PhotoCard({ profile }: { profile: AccountProfileData }) {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState(0);
  const { startUpload, isUploading } = useUploadThing("accountPhotoUploader", {
    onUploadProgress: setProgress,
    onClientUploadComplete: () => {
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Photo mise à jour");
    },
    onUploadError: (error) => {
      toast.error("Échec de l'envoi", { description: error.message });
    },
  });

  return (
    <Card className="items-center gap-0 px-6 py-7 text-center">
      <label className="group relative cursor-pointer">
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          disabled={isUploading}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void startUpload([file]);
            event.target.value = "";
          }}
        />
        <Avatar size="xl" firstName={profile.firstName} lastName={profile.lastName} src={profile.profilePhotoUrl} className="size-24 text-3xl ring-4 ring-primary-soft" />
        <span className="absolute right-0 bottom-0 grid size-8 place-items-center rounded-full bg-primary text-white ring-2 ring-card sm:inset-0 sm:size-auto sm:rounded-full sm:bg-ink/45 sm:opacity-0 sm:ring-0 sm:transition-opacity sm:duration-200 sm:group-hover:opacity-100">
          {isUploading ? <Loader2 className="size-4 animate-spin sm:size-6" /> : <Camera className="size-4 sm:size-6" />}
        </span>
        {isUploading && (
          <svg className="absolute -inset-1.5 -rotate-90" viewBox="0 0 100 100" aria-hidden>
            <circle cx="50" cy="50" r="48" fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" strokeDasharray={301.6} strokeDashoffset={301.6 * (1 - progress / 100)} className="transition-[stroke-dashoffset] duration-300" />
          </svg>
        )}
      </label>
      <p className="mt-4 text-lg font-semibold tracking-[-0.01em] text-foreground">
        {profile.firstName} {profile.lastName}
      </p>
      <p className="text-sm text-muted-foreground">
        {profile.role === "ADMIN" ? "Administrateur" : profile.role === "SKIPPER" ? "Moniteur" : "Élève"}
      </p>
      <TheoryCourseBadge course={profile.theoryCourse} className="mt-3" />
      {profile.role === "CANDIDATE" && <OedippCard number={profile.oedippNumber} locked={profile.oedippLocked} />}
      {profile.organizationName && (
        <span className="mt-3 rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary-strong">
          {profile.organizationName}
        </span>
      )}
      <p className="mt-5 text-xs text-muted-foreground">Appuyez sur la photo pour la changer.</p>
    </Card>
  );
}

function PasswordCard({ email }: { email: string }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!isPasswordValid(next)) {
      setError("Le nouveau mot de passe doit contenir au moins 10 caractères, dont une lettre et un chiffre.");
      return;
    }
    setLoading(true);
    setError("");
    const res = await fetch("/api/profile/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: current, newPassword: next }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(res.status === 429 ? "Trop de tentatives. Réessayez dans quelques minutes." : data.error ?? "Le mot de passe n'a pas pu être modifié.");
      setLoading(false);
      return;
    }
    // Le changement invalide les sessions existantes : on se reconnecte avec le nouveau mot de passe.
    await signIn("credentials", { email, password: next, redirect: false });
    setLoading(false);
    setCurrent("");
    setNext("");
    setOpen(false);
    toast.success("Mot de passe modifié", { description: "Vos autres appareils ont été déconnectés." });
  }

  return (
    <Card className="gap-0 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionTitle icon={KeyRound} title="Mot de passe" description="Changez-le régulièrement pour sécuriser votre compte." />
        {!open && (
          <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
            Modifier
          </Button>
        )}
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.form
            onSubmit={submit}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: EASE_OUT }}
            className="overflow-hidden"
          >
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Mot de passe actuel" htmlFor="current-password">
                <PasswordInput id="current-password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
              </Field>
              <Field label="Nouveau mot de passe" htmlFor="new-password">
                <PasswordInput id="new-password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} required />
                {next && <PasswordStrength value={next} />}
              </Field>
            </div>
            {error && <p className="mt-3 text-sm text-danger">{error}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => { setOpen(false); setError(""); }}>
                Annuler
              </Button>
              <Button type="submit" loading={loading} disabled={!current || !next}>
                Mettre à jour
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </Card>
  );
}

export function AccountProfile() {
  const queryClient = useQueryClient();
  const { data: session, update } = useSession();
  const candidate = session?.user?.role === "CANDIDATE";
  const [form, setForm] = useState<ProfileForm | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await fetch("/api/profile");
      if (!res.ok) throw new Error("Impossible de charger le profil");
      return res.json() as Promise<{ profile: AccountProfileData }>;
    },
  });
  const profile = data?.profile;

  useEffect(() => {
    // Le formulaire est initialisé une fois le profil chargé (puis après chaque enregistrement).
    if (profile) setForm(toForm(profile)); // eslint-disable-line react-hooks/set-state-in-effect
  }, [profile]);

  const save = useMutation({
    mutationFn: async (payload: ProfileForm) => {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error ?? "Impossible d'enregistrer le profil");
      return body?.profile as AccountProfileData | undefined;
    },
    onSuccess: async (next) => {
      if (next) queryClient.setQueryData(["profile"], { profile: next });
      else await queryClient.invalidateQueries({ queryKey: ["profile"] });
      await update();
      toast.success("Profil enregistré");
    },
    onError: (error) => toast.error("Enregistrement impossible", { description: error.message }),
  });

  const dirty = profile && form ? JSON.stringify(toForm(profile)) !== JSON.stringify(form) : false;
  const set = (key: keyof ProfileForm) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setForm((current) => (current ? { ...current, [key]: event.target.value } : current));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        className={candidate ? "max-lg:hidden" : undefined}
        eyebrow="Compte"
        title="Mon profil"
        description="Vos informations personnelles et la sécurité de votre compte."
      />

      {isError && (
        <Card className="items-center p-10 text-sm text-danger">Impossible de charger le profil.</Card>
      )}

      {isLoading || !profile || !form ? (
        !isError && (
          <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
            <Skeleton className="h-72 rounded-2xl" />
            <Skeleton className="h-96 rounded-2xl" />
          </div>
        )
      ) : (
        <div className="grid items-start gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
          <FadeIn className="lg:sticky lg:top-24">
            <PhotoCard profile={profile} />
          </FadeIn>

          <FadeIn delay={0.06} className="space-y-5">
            <Card className="gap-0 p-5 sm:p-6">
              <SectionTitle icon={Mail} title="Informations personnelles" description="Utilisées par votre auto-école pour votre dossier." />
              <form
                id="profile-form"
                className="mt-6 grid gap-4 sm:grid-cols-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  save.mutate(form);
                }}
              >
                <Field label="Prénom" htmlFor="profile-first-name">
                  <Input id="profile-first-name" value={form.firstName} onChange={set("firstName")} autoComplete="given-name" required />
                </Field>
                <Field label="Nom" htmlFor="profile-last-name">
                  <Input id="profile-last-name" value={form.lastName} onChange={set("lastName")} autoComplete="family-name" required />
                </Field>
                <Field label="Email" htmlFor="profile-email" hint="Identifiant de connexion, non modifiable." className="sm:col-span-2">
                  <Input id="profile-email" value={profile.email} readOnly disabled />
                </Field>
                <Field label="Téléphone" htmlFor="profile-phone" className="sm:col-span-2">
                  <Input id="profile-phone" value={form.phone} onChange={set("phone")} autoComplete="tel" placeholder="06 12 34 56 78" />
                </Field>
                {profile.role === "CANDIDATE" && (
                  <>
                    <Field label="Adresse" htmlFor="profile-street" className="sm:col-span-2">
                      <Input id="profile-street" value={form.street} onChange={set("street")} autoComplete="street-address" />
                    </Field>
                    <Field label="Code postal" htmlFor="profile-postal-code">
                      <Input id="profile-postal-code" value={form.postalCode} onChange={set("postalCode")} inputMode="numeric" autoComplete="postal-code" />
                    </Field>
                    <Field label="Ville" htmlFor="profile-city">
                      <Input id="profile-city" value={form.city} onChange={set("city")} autoComplete="address-level2" />
                    </Field>
                    <Field label="Date de naissance" htmlFor="profile-birth">
                      <DatePicker id="profile-birth" variant="birth" clearable value={form.dateOfBirth} onChange={(dateOfBirth) => setForm((current) => (current ? { ...current, dateOfBirth } : current))} />
                    </Field>
                  </>
                )}
              </form>
              <div className="mt-6 flex items-center justify-end gap-3 border-t border-border pt-5">
                <AnimatePresence>
                  {dirty && (
                    <motion.span initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="text-xs text-muted-foreground">
                      Modifications non enregistrées
                    </motion.span>
                  )}
                </AnimatePresence>
                <Button type="submit" form="profile-form" loading={save.isPending} disabled={!dirty}>
                  Enregistrer
                </Button>
              </div>
            </Card>

            <PasswordCard email={profile.email} />

            <Link
              href={profile.role === "CANDIDATE" ? "/profile/privacy" : "/admin/privacy"}
              className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-5 shadow-xs transition-[border-color,box-shadow] hover:border-primary/30 hover:shadow-sm"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                <ShieldCheck className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-foreground">Données et mentions légales</span>
                <span className="mt-0.5 block text-[13px] text-muted-foreground">
                  Ce que nous conservons, vos droits, l&apos;export de vos données.
                </span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>

            {profile.role === "CANDIDATE" && (
              <Button
                type="button"
                variant="outline"
                className="h-12 w-full text-danger lg:hidden"
                onClick={() => void signOutWithTransition()}
              >
                <LogOut /> Se déconnecter
              </Button>
            )}
          </FadeIn>
        </div>
      )}
    </div>
  );
}
