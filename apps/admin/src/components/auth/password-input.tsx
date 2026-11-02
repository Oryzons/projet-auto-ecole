"use client";

import { Eye, EyeOff, Lock } from "lucide-react";
import { useState } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function PasswordInput({ className, ...props }: React.ComponentProps<"input">) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="group/input relative">
      <Lock className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within/input:text-primary" />
      <Input type={visible ? "text" : "password"} className={cn("pr-11 pl-10", className)} {...props} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 grid w-11 place-items-center text-muted-foreground transition-colors hover:text-primary"
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

/** Règles affichées sous le champ : 10 caractères, une lettre, un chiffre. */
export function passwordChecks(value: string) {
  return [
    { label: "10 caractères minimum", ok: value.length >= 10 },
    { label: "Une lettre", ok: /\p{L}/u.test(value) },
    { label: "Un chiffre", ok: /\d/.test(value) },
  ];
}

export function isPasswordValid(value: string) {
  return value.length <= 72 && passwordChecks(value).every((c) => c.ok);
}

export function PasswordStrength({ value }: { value: string }) {
  const checks = passwordChecks(value);
  const score = checks.filter((c) => c.ok).length;
  return (
    <div className="mt-2.5 space-y-2">
      <div className="flex gap-1.5" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors duration-300",
              i < score ? (score === 3 ? "bg-success" : "bg-primary") : "bg-border",
            )}
          />
        ))}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1">
        {checks.map((check) => (
          <li
            key={check.label}
            className={cn(
              "flex items-center gap-1.5 text-xs transition-colors duration-200",
              check.ok ? "text-success" : "text-muted-foreground",
            )}
          >
            <span className={cn("size-1.5 rounded-full transition-colors", check.ok ? "bg-success" : "bg-border")} />
            {check.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
