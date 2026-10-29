"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { AnimatePresence } from "motion/react";
import { ArrowLeft, Link2Off } from "lucide-react";

import { AuthCard, FormAlert } from "@/components/auth/auth-card";
import { isPasswordValid, PasswordInput, PasswordStrength } from "@/components/auth/password-input";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

type TokenInfo = { valid: boolean; purpose?: "ACTIVATION" | "RESET"; email?: string; firstName?: string };

/** Choix du mot de passe depuis un lien d'activation ou de réinitialisation. */
export function SetPasswordForm({ mode }: { mode: "activate" | "reset" }) {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const [info, setInfo] = useState<TokenInfo | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = token
      ? fetch(`/api/password/reset?token=${encodeURIComponent(token)}`)
          .then((res) => res.json())
          .catch(() => ({ valid: false }))
      : Promise.resolve({ valid: false });
    load.then((data: TokenInfo) => {
      if (!cancelled) setInfo(data);
    });
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!isPasswordValid(password)) {
      setError("Le mot de passe doit contenir au moins 10 caractères, dont une lettre et un chiffre.");
      return;
    }
    if (password !== confirm) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    setError("");
    const res = await fetch("/api/password/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Le mot de passe n'a pas pu être enregistré.");
      setLoading(false);
      return;
    }
    const result = await signIn("credentials", { email: data.email, password, redirect: false });
    router.replace(result?.error ? "/login" : "/");
    router.refresh();
  }

  if (!info) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-2/3" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="mt-6 h-11 w-full" />
        <Skeleton className="h-11 w-full" />
      </div>
    );
  }

  if (!info.valid) {
    return (
      <AuthCard
        title="Lien expiré"
        description="Ce lien n'est plus valable : il a déjà servi ou sa durée de validité est dépassée."
        footer={
          <Link href="/login" className="inline-flex items-center gap-1.5 font-medium text-primary hover:text-primary-strong">
            <ArrowLeft className="size-4" />
            Retour à la connexion
          </Link>
        }
      >
        <div className="space-y-4">
          <span className="grid size-14 place-items-center rounded-2xl bg-danger-soft text-danger">
            <Link2Off className="size-6" />
          </span>
          <Link href="/forgot-password" className={buttonVariants({ variant: "outline", className: "w-full" })}>
            Recevoir un nouveau lien
          </Link>
        </div>
      </AuthCard>
    );
  }

  const activation = mode === "activate" || info.purpose === "ACTIVATION";

  return (
    <AuthCard
      title={activation ? `Bienvenue${info.firstName ? ` ${info.firstName}` : ""}` : "Nouveau mot de passe"}
      description={
        activation
          ? "Choisissez votre mot de passe pour activer votre espace et suivre votre dossier."
          : "Choisissez un nouveau mot de passe pour votre compte."
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <AnimatePresence initial={false}>{error && <FormAlert key="error">{error}</FormAlert>}</AnimatePresence>
        <div className="rounded-xl border border-border bg-subtle px-3.5 py-2.5 text-sm">
          <span className="text-muted-foreground">Compte : </span>
          <span className="font-medium text-foreground">{info.email}</span>
        </div>
        <Field label="Mot de passe" htmlFor="password">
          <PasswordInput id="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required autoFocus />
          <PasswordStrength value={password} />
        </Field>
        <Field
          label="Confirmation"
          htmlFor="confirm"
          error={confirm && confirm !== password ? "Les mots de passe ne correspondent pas." : undefined}
        >
          <PasswordInput id="confirm" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
        </Field>
        <Button type="submit" size="lg" className="mt-2 w-full" loading={loading}>
          {activation ? "Activer mon compte" : "Enregistrer le mot de passe"}
        </Button>
      </form>
    </AuthCard>
  );
}
