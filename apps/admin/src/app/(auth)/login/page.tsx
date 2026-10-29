"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { getSession, signIn } from "next-auth/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, Mail } from "lucide-react";

import { AuthCard, FormAlert } from "@/components/auth/auth-card";
import { useAuthExit } from "@/components/auth/auth-scene";
import { PasswordInput } from "@/components/auth/password-input";
import { EASE_OUT } from "@/components/motion/tokens";
import { Button } from "@/components/ui/button";
import { Field, InputWithIcon } from "@/components/ui/input";
import { adminNav, homeForRole } from "@/lib/navigation";
import { cn } from "@/lib/utils";

/** Chemin interne sûr pour le retour après connexion (jamais une autre origine). */
function safeNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return null;
  return value;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

/** Deux étapes, comme sur les grands services : d'abord l'email, ensuite le mot de passe. */
function LoginForm() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const leave = useAuthExit();
  const reduce = useReducedMotion();
  const [step, setStep] = useState<"email" | "password">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

  function submitEmail(event: React.FormEvent) {
    event.preventDefault();
    if (!EMAIL.test(email.trim())) {
      setError("Saisissez une adresse email valide, par exemple vous@exemple.fr.");
      return;
    }
    setEmail(email.trim());
    setError("");
    setStep("password");
  }

  async function submitPassword(event: React.FormEvent) {
    event.preventDefault();
    setStatus("loading");
    setError("");

    const result = await signIn("credentials", { email, password, redirect: false });

    if (result?.error) {
      setError(
        result.code === "rate_limited"
          ? "Trop de tentatives. Patientez quelques minutes avant de réessayer."
          : "Mot de passe incorrect pour cette adresse.",
      );
      setStatus("idle");
      return;
    }

    setStatus("success");
    const session = await getSession();
    const target = next ?? homeForRole(session?.user?.role);
    router.prefetch(target);
    // la caméra plonge sur le plan pendant que la vue d'ensemble se prépare
    await leave({ zoom: target === adminNav.home });
    router.replace(target);
    router.refresh();
  }

  function changeEmail() {
    setStep("email");
    setPassword("");
    setError("");
    setStatus("idle");
  }

  const busy = status !== "idle";
  const slide = reduce ? 0 : 24;

  return (
    <>
      <StepDots step={step === "email" ? 0 : 1} />
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={step}
          initial={{ opacity: 0, x: step === "email" ? -slide : slide }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: step === "email" ? -slide : slide }}
          transition={{ duration: 0.22, ease: EASE_OUT }}
        >
          {step === "email" ? (
            <AuthCard
              title="Bon retour"
              description="Saisissez l'email de votre compte pour continuer."
              footer={<>Accès réservé à l&apos;équipe de l&apos;auto-école.</>}
            >
              <form onSubmit={submitEmail} className="space-y-4" noValidate>
                <AnimatePresence initial={false}>{error && <FormAlert key="error">{error}</FormAlert>}</AnimatePresence>
                <Field label="Email" htmlFor="email">
                  <InputWithIcon
                    id="email"
                    name="username"
                    icon={Mail}
                    type="email"
                    autoComplete="username"
                    inputMode="email"
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vous@exemple.fr"
                    required
                  />
                </Field>
                <Button type="submit" size="lg" className="mt-2 w-full" disabled={!email}>
                  Continuer
                  <ArrowRight className="transition-transform duration-200 group-hover/button:translate-x-0.5" />
                </Button>
              </form>
            </AuthCard>
          ) : (
            <AuthCard
              title="Votre mot de passe"
              description={
                <span className="mt-1 flex items-center gap-2">
                  <span className="inline-flex min-w-0 items-center gap-1.5 rounded-full border border-border bg-secondary/70 py-1 pr-3 pl-1 text-[13.5px] font-medium text-foreground">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-[11px] font-semibold text-white uppercase">
                      {email.charAt(0)}
                    </span>
                    <span className="truncate">{email}</span>
                  </span>
                  <button
                    type="button"
                    onClick={changeEmail}
                    disabled={busy}
                    className="shrink-0 text-[13px] font-medium text-primary hover:text-primary-strong disabled:opacity-50"
                  >
                    Modifier
                  </button>
                </span>
              }
              footer={
                <Link href="/forgot-password" className="font-medium text-primary hover:text-primary-strong">
                  Mot de passe oublié ?
                </Link>
              }
            >
              <form onSubmit={submitPassword} className="space-y-4" noValidate>
                {/* pour les gestionnaires de mots de passe : l'identifiant reste dans le formulaire */}
                <input type="email" name="username" autoComplete="username" value={email} readOnly hidden />
                <AnimatePresence initial={false}>{error && <FormAlert key="error">{error}</FormAlert>}</AnimatePresence>
                <Field label="Mot de passe" htmlFor="password">
                  <PasswordInput
                    id="password"
                    autoComplete="current-password"
                    autoFocus
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••"
                    required
                    disabled={busy}
                  />
                </Field>
                <Button type="submit" size="lg" className="mt-2 w-full" loading={status === "loading"} disabled={busy || !password}>
                  {status === "success" ? "Connexion réussie" : status === "loading" ? "Connexion…" : "Se connecter"}
                  {status === "idle" && <ArrowRight className="transition-transform duration-200 group-hover/button:translate-x-0.5" />}
                </Button>
              </form>
            </AuthCard>
          )}
        </motion.div>
      </AnimatePresence>
    </>
  );
}

function StepDots({ step }: { step: 0 | 1 }) {
  return (
    <div className="mb-5 flex items-center gap-2 text-[12px] font-medium text-muted-foreground" aria-label={`Étape ${step + 1} sur 2`}>
      {[0, 1].map((i) => (
        <span key={i} className={cn("h-1.5 rounded-full transition-all duration-300", i === step ? "w-6 bg-primary" : i < step ? "w-3 bg-primary/40" : "w-3 bg-border")} />
      ))}
      <span className="ml-1">Étape {step + 1} sur 2</span>
    </div>
  );
}
