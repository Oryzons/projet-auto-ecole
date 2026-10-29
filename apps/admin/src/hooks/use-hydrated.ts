"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** `false` pendant le rendu serveur et l'hydratation, `true` ensuite. */
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
