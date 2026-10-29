"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { getSession, signIn } from "next-auth/react";
import { AnimatePresence } from "motion/react";
import { ArrowRight, Mail } from "lucide-react";

import { AuthCard, FormAlert } from "@/components/auth/auth-card";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Field, InputWithIcon } from "@/components/ui/input";
import { homeForRole } from "@/lib/navigation";

/** Chemin interne sûr pour le retour après connexion (jamais une autre origine). */
function safeNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return null;
  return value;
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("loading");
    setError("");

    const result = await signIn("credentials", { email, password, redirect: false });

    if (result?.error) {
      setError(
        result.code === "rate_limited"
          ? "Trop de tentatives. Patientez quelques minutes avant de réessayer."
          : "Email ou mot de passe incorrect.",
      );
      setStatus("idle");
      return;
    }

    setStatus("success");
    const session = await getSession();
    router.replace(next ?? homeForRole(session?.user?.role));
    router.refresh();
  }

  const busy = status !== "idle";

  return (
    <AuthCard
      title="Bon retour"
      description="Connectez-vous à l'espace de gestion de votre auto-école."
      footer={<>Accès réservé à l&apos;équipe de l&apos;auto-école.</>}
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <AnimatePresence initial={false}>{error && <FormAlert key="error">{error}</FormAlert>}</AnimatePresence>
        <Field label="Email" htmlFor="email">
          <InputWithIcon
            id="email"
            icon={Mail}
            type="email"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@exemple.fr"
            required
            disabled={busy}
          />
        </Field>
        <Field
          label={
            <span className="flex items-center justify-between">
              Mot de passe
              <Link href="/forgot-password" className="text-[13px] font-medium text-primary hover:text-primary-strong">
                Mot de passe oublié ?
              </Link>
            </span>
          }
          htmlFor="password"
        >
          <PasswordInput
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••"
            required
            disabled={busy}
          />
        </Field>
        <Button
          type="submit"
          size="lg"
          className="mt-2 w-full"
          loading={status === "loading"}
          disabled={busy || !email || !password}
        >
          {status === "success" ? "Connexion réussie" : status === "loading" ? "Connexion…" : "Se connecter"}
          {status === "idle" && <ArrowRight className="transition-transform duration-200 group-hover/button:translate-x-0.5" />}
        </Button>
      </form>
    </AuthCard>
  );
}
