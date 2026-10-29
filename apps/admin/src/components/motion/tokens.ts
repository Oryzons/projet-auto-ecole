/** Courbes et durées communes à toutes les animations de l'application. */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;
export const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const;

export const DURATION = {
  fast: 0.18,
  base: 0.32,
  slow: 0.52,
} as const;

export const SPRING = {
  type: "spring",
  stiffness: 420,
  damping: 34,
  mass: 0.8,
} as const;

export const SPRING_SOFT = {
  type: "spring",
  stiffness: 220,
  damping: 28,
  mass: 0.9,
} as const;
