"use client";

import { signOut } from "next-auth/react";

import { OUTRO_COOKIE } from "@/lib/intro";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Déconnexion animée, puis retour à l'écran de connexion.
 * Depuis le plan : les éléments autour s'en vont et le plan reste seul ; la page de connexion
 * repart de cette image et recule. Ailleurs : un simple fondu.
 */
export async function signOutWithTransition() {
  const plan = document.querySelector("[data-plan-root]");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (plan && !reduce) {
    document.cookie = `${OUTRO_COOKIE}=1; path=/; max-age=20; samesite=lax`;
    window.dispatchEvent(new Event("virage:outro"));
    document.documentElement.dataset.outro = "";
  } else {
    document.documentElement.classList.add("is-leaving");
  }
  try {
    await Promise.all([signOut({ redirect: false }), wait(plan && !reduce ? 750 : 320)]);
  } finally {
    // Rechargement complet volontaire : vide les caches client de la session.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/login");
  }
}
