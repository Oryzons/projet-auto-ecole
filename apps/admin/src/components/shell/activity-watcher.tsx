"use client";

import { signOut } from "next-auth/react";
import { useEffect } from "react";

import { ACTIVITY_PING_MS, INACTIVITY_LIMIT_MS, LAST_ACTIVE_KEY } from "@/lib/activity";

const read = () => {
  try {
    return Number(localStorage.getItem(LAST_ACTIVE_KEY)) || 0;
  } catch {
    return 0;
  }
};

/**
 * Suit l'activité (souris, clavier, toucher) : elle repousse la déconnexion automatique côté serveur,
 * et au-delà de 8 h sans activité dans aucun onglet, la session est fermée.
 */
export function ActivityWatcher() {
  useEffect(() => {
    let lastPing = 0;
    let lastWrite = 0;

    const expire = async () => {
      await signOut({ redirect: false }).catch(() => {});
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/login?inactive=1");
    };
    const check = () => {
      const last = read();
      if (last && Date.now() - last > INACTIVITY_LIMIT_MS) void expire();
    };
    const active = () => {
      const now = Date.now();
      if (now - lastWrite > 15_000) {
        lastWrite = now;
        try {
          localStorage.setItem(LAST_ACTIVE_KEY, String(now));
        } catch {}
      }
      if (now - lastPing > ACTIVITY_PING_MS) {
        lastPing = now;
        void fetch("/api/me/activity", { method: "POST", keepalive: true }).catch(() => {});
      }
    };

    // ordinateur sorti de veille après une longue absence : on vérifie avant de compter cette visite
    check();
    if (!read()) active();
    const events = ["pointerdown", "keydown", "wheel", "touchstart", "mousemove"] as const;
    events.forEach((e) => window.addEventListener(e, active, { passive: true }));
    const onVisible = () => document.visibilityState === "visible" && check();
    document.addEventListener("visibilitychange", onVisible);
    const timer = window.setInterval(check, 60_000);
    return () => {
      events.forEach((e) => window.removeEventListener(e, active));
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(timer);
    };
  }, []);
  return null;
}
