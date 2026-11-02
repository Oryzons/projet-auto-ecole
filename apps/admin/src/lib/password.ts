import bcrypt from "bcryptjs";
import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(10, "Le mot de passe doit contenir au moins 10 caractères")
  .max(72, "Le mot de passe est trop long (72 caractères maximum)")
  .refine((value) => /\p{L}/u.test(value) && /\d/.test(value), {
    message: "Le mot de passe doit contenir au moins une lettre et un chiffre",
  });

export function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

/** Empreinte courte du hash, stockée dans le JWT pour invalider les sessions après un changement de mot de passe. */
export function passwordVersion(hash: string) {
  return hash.slice(-12);
}
