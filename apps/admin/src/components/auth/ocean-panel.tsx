"use client";

import { motion, useReducedMotion } from "motion/react";
import { CheckCircle2, FileCheck2, MessagesSquare, ShieldCheck } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { EASE_OUT } from "@/components/motion/tokens";

/** Marquage au sol : tirets répétés sur deux fois la largeur, qui défilent comme une route. */
const ROAD = Array.from({ length: 12 }, (_, i) => `M${i * 60} 60 h34 v6 h-34 Z`).join(" ");

function Road() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 overflow-hidden" aria-hidden>
      {[
        { className: "animate-wave-slow text-white/[0.06]", bottom: 34 },
        { className: "animate-wave text-white/[0.09]", bottom: 14 },
        { className: "animate-wave-slow text-white/[0.12] [animation-direction:reverse]", bottom: -6 },
      ].map((layer, index) => (
        <svg
          key={index}
          className={`absolute left-0 h-28 w-[200%] ${layer.className}`}
          style={{ bottom: layer.bottom }}
          viewBox="0 0 720 120"
          preserveAspectRatio="none"
        >
          <path d={ROAD} fill="currentColor" />
        </svg>
      ))}
    </div>
  );
}

const FEATURES = [
  { icon: FileCheck2, text: "Dossiers ANTS des élèves validés pièce par pièce" },
  { icon: ShieldCheck, text: "Paiements, échéances et factures suivis au même endroit" },
  { icon: MessagesSquare, text: "Séances de code, appel et messages élèves en direct" },
];

/** Panneau de marque des écrans de connexion. */
export function OceanPanel() {
  const reduce = useReducedMotion();
  const rise = (delay: number) => ({
    initial: { opacity: 0, y: reduce ? 0 : 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, ease: EASE_OUT, delay },
  });

  return (
    <div className="ocean-gradient relative isolate flex h-full flex-col overflow-hidden px-10 py-10 text-white xl:px-14 xl:py-12">
      <div className="grid-fade absolute inset-0 -z-10" aria-hidden />
      <div className="absolute -top-32 -right-24 -z-10 size-[420px] rounded-full bg-white/10 blur-3xl" aria-hidden />
      <Road />

      <motion.div {...rise(0)}>
        <Logo tone="inverse" animated />
      </motion.div>

      <div className="my-auto max-w-md py-12">
        <motion.p {...rise(0.1)} className="text-[13px] font-semibold tracking-[0.1em] text-white/70 uppercase">
          Auto-école Virage
        </motion.p>
        <motion.h1 {...rise(0.18)} className="mt-3 text-[40px] leading-[1.08] font-semibold tracking-[-0.03em] xl:text-[46px]">
          Vos élèves, de l'inscription jusqu'au permis.
        </motion.h1>
        <motion.ul {...rise(0.28)} className="mt-8 space-y-3.5">
          {FEATURES.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3 text-[15px] text-white/90">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/12 ring-1 ring-white/20">
                <Icon className="size-4" />
              </span>
              {text}
            </li>
          ))}
        </motion.ul>
      </div>

      <motion.div {...rise(0.4)} className="relative z-10 w-full max-w-sm">
        <div className="animate-float rounded-2xl bg-white/95 p-4 text-foreground shadow-[0_30px_60px_-20px_rgb(3_22_60/0.55)] backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.08em] text-primary uppercase">Dossier de Léa Martin</p>
              <p className="mt-0.5 text-sm font-semibold">Permis B · boîte manuelle</p>
            </div>
            <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-success-soft px-2.5 text-xs font-medium text-success">
              <CheckCircle2 className="size-3.5" /> Documents validés
            </span>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-primary-soft">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: "15%" }}
              animate={{ width: "80%" }}
              transition={{ duration: 1.6, ease: EASE_OUT, delay: 0.8 }}
            />
          </div>
          <div className="mt-3 flex justify-between text-xs text-muted-foreground">
            <span>Documents</span>
            <span>Paiement</span>
            <span>Validation</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
