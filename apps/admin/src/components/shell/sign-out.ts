"use client";

import { signOut } from "next-auth/react";

/** Déconnexion avec un fondu de sortie, puis retour à l'écran de connexion. */
export async function signOutWithTransition() {
  document.documentElement.classList.add("is-leaving");
  try {
    await Promise.all([
      signOut({ redirect: false }),
      new Promise((resolve) => setTimeout(resolve, 320)),
    ]);
  } finally {
    // Rechargement complet volontaire : vide les caches client de la session.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/login");
  }
}
