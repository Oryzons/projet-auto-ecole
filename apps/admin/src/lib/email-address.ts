/** Normalise une adresse email (casse et espaces) avant tout stockage ou recherche. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
