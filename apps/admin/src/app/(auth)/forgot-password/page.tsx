"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, Mail, MailCheck } from "lucide-react";

import { AuthCard, FormAlert } from "@/components/auth/auth-card";
import { EASE_OUT } from "@/components/motion/tokens";
import { Button } from "@/components/ui/button";
import { Field, InputWithIcon } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/password/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    if (res.status === 429) {
      setError("Trop de demandes. Réessayez dans quelques minutes.");
      return;
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "La demande n'a pas abouti.");
      return;
    }
    setSent(true);
  }

  const back = (
    <Link href="/login" className="inline-flex items-center gap-1.5 font-medium text-primary hover:text-primary-strong">
      <ArrowLeft className="size-4" />
      Retour à la connexion
    </Link>
  );

  if (sent) {
    return (
      <AuthCard
        title="Vérifiez vos emails"
        description={
          <>
            Si un compte existe pour <strong className="font-medium text-foreground">{email}</strong>, vous allez recevoir un lien pour choisir un nouveau mot de passe. Il est valable 1 heure.
          </>
        }
        footer={back}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
          className="grid size-16 place-items-center rounded-2xl bg-primary-soft text-primary"
        >
          <MailCheck className="size-7" />
        </motion.div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Mot de passe oublié"
      description="Indiquez votre email : nous vous envoyons un lien pour en choisir un nouveau."
      footer={back}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <AnimatePresence initial={false}>{error && <FormAlert key="error">{error}</FormAlert>}</AnimatePresence>
        <Field label="Email" htmlFor="email">
          <InputWithIcon id="email" icon={Mail} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@exemple.fr" required />
        </Field>
        <Button type="submit" size="lg" className="mt-2 w-full" loading={loading} disabled={!email}>
          Envoyer le lien
        </Button>
      </form>
    </AuthCard>
  );
}
